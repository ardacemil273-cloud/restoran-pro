import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          }
        }
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: restoran } = await supabase
      .from('restoranlar')
      .select('id, ad')
      .eq('sahibi_id', user.id)
      .single()

    if (!restoran) return NextResponse.json({ error: 'Restoran bulunamadı' }, { status: 404 })

    // Son 30 günlük veri çek
    const otuzGunOnce = new Date()
    otuzGunOnce.setDate(otuzGunOnce.getDate() - 30)

    // Saatlik yoğunluk
    const { data: siparisler } = await supabase
      .from('siparisler')
      .select('created_at, toplam_tutar, masa_ad')
      .eq('restoran_id', restoran.id)
      .in('durum', ['tamamlandi', 'odendi'])
      .gte('created_at', otuzGunOnce.toISOString())

    // En çok satan ürünler
    const { data: urunSatislari } = await supabase
      .from('siparis_urunleri')
      .select(`
        adet,
        birim_fiyat,
        urunler (ad, fiyat),
        siparisler!inner (restoran_id, durum, created_at)
      `)
      .eq('siparisler.restoran_id', restoran.id)
      .in('siparisler.durum', ['tamamlandi', 'odendi'])
      .gte('siparisler.created_at', otuzGunOnce.toISOString())

    if (!siparisler || !urunSatislari) {
      return NextResponse.json({ error: 'Veri çekilemedi' }, { status: 500 })
    }

    // Saatlik dağılım hesapla
    const saatMap: Record<number, { siparis: number; ciro: number }> = {}
    siparisler.forEach(s => {
      const saat = new Date(s.created_at).getHours()
      if (!saatMap[saat]) saatMap[saat] = { siparis: 0, ciro: 0 }
      saatMap[saat].siparis++
      saatMap[saat].ciro += Number(s.toplam_tutar)
    })

    // Günlük dağılım
    const gunMap: Record<string, { siparis: number; ciro: number }> = {}
    siparisler.forEach(s => {
      const gun = new Date(s.created_at).toLocaleDateString('tr-TR', { weekday: 'long' })
      if (!gunMap[gun]) gunMap[gun] = { siparis: 0, ciro: 0 }
      gunMap[gun].siparis++
      gunMap[gun].ciro += Number(s.toplam_tutar)
    })

    // Ürün analizi
    const urunMap: Record<string, { adet: number; ciro: number; karKatkisi: number }> = {}
    ;(urunSatislari as any[]).forEach(item => {
      const ad = item.urunler?.ad || 'Bilinmiyor'
      if (!urunMap[ad]) urunMap[ad] = { adet: 0, ciro: 0, karKatkisi: 0 }
      urunMap[ad].adet += item.adet
      urunMap[ad].ciro += item.adet * item.birim_fiyat
      // Basit kar katkısı: ciro / toplam ciro * 100
    })

    const toplamCiro = siparisler.reduce((sum, s) => sum + Number(s.toplam_tutar), 0)
    Object.keys(urunMap).forEach(ad => {
      urunMap[ad].karKatkisi = toplamCiro > 0 ? (urunMap[ad].ciro / toplamCiro) * 100 : 0
    })

    const enCokSatan = Object.entries(urunMap)
      .sort((a, b) => b[1].adet - a[1].adet)
      .slice(0, 10)
      .map(([ad, data]) => ({ ad, ...data }))

    const enCokKazandiran = Object.entries(urunMap)
      .sort((a, b) => b[1].ciro - a[1].ciro)
      .slice(0, 5)
      .map(([ad, data]) => ({ ad, ...data }))

    // En yoğun saat
    const enYogunSaat = Object.entries(saatMap)
      .sort((a, b) => b[1].siparis - a[1].siparis)[0]

    // AI analizi için veri hazırla
    const analizVerisi = {
      restoran_adi: restoran.ad,
      donem: 'Son 30 gün',
      toplam_siparis: siparisler.length,
      toplam_ciro: toplamCiro,
      ortalama_siparis_tutari: siparisler.length > 0 ? toplamCiro / siparisler.length : 0,
      en_yogun_saat: enYogunSaat ? `${enYogunSaat[0]}:00 (${enYogunSaat[1].siparis} sipariş)` : 'Veri yok',
      saatlik_dagilim: Object.entries(saatMap).map(([saat, data]) => ({
        saat: `${saat}:00`,
        siparis: data.siparis,
        ciro: data.ciro
      })).sort((a, b) => parseInt(a.saat) - parseInt(b.saat)),
      gunluk_dagilim: Object.entries(gunMap).map(([gun, data]) => ({
        gun,
        siparis: data.siparis,
        ciro: data.ciro
      })),
      en_cok_satan: enCokSatan,
      en_cok_kazandiran: enCokKazandiran
    }

    // OpenAI API çağrısı
    const openaiKey = process.env.OPENAI_API_KEY
    const openaiBase = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'

    if (!openaiKey) {
      return NextResponse.json({
        analiz: null,
        veri: analizVerisi,
        hata: 'AI analizi için API anahtarı gerekli'
      })
    }

    const prompt = `Sen bir restoran yönetim danışmanısın. Aşağıdaki satış verilerini analiz et ve Türkçe olarak pratik, uygulanabilir öneriler sun.

Restoran: ${analizVerisi.restoran_adi}
Dönem: ${analizVerisi.donem}
Toplam Sipariş: ${analizVerisi.toplam_siparis}
Toplam Ciro: ${analizVerisi.toplam_ciro.toFixed(2)}₺
Ortalama Sipariş Tutarı: ${analizVerisi.ortalama_siparis_tutari.toFixed(2)}₺
En Yoğun Saat: ${analizVerisi.en_yogun_saat}

En Çok Satan Ürünler (Top 5):
${analizVerisi.en_cok_satan.slice(0, 5).map(u => `- ${u.ad}: ${u.adet} adet, ${u.ciro.toFixed(2)}₺`).join('\n')}

En Çok Kazandıran Ürünler (Top 5):
${analizVerisi.en_cok_kazandiran.map(u => `- ${u.ad}: ${u.ciro.toFixed(2)}₺ (%${u.karKatkisi.toFixed(1)} katkı)`).join('\n')}

Saatlik Yoğunluk (Sipariş sayısına göre):
${analizVerisi.saatlik_dagilim.filter(s => s.siparis > 0).map(s => `${s.saat}: ${s.siparis} sipariş`).join(', ')}

Lütfen şu başlıklar altında analiz yap:
1. **Genel Değerlendirme** (2-3 cümle)
2. **Yoğunluk Analizi** - Hangi saatler kritik, nasıl hazırlanmalı
3. **Ürün Stratejisi** - Hangi ürünler öne çıkarılmalı, hangilerinin fiyatı artırılabilir
4. **Gelir Artırma Önerileri** - 3 somut öneri
5. **Dikkat Edilmesi Gerekenler** - Riskler veya fırsatlar

Yanıtı kısa, net ve uygulanabilir tut. Markdown formatı kullan.`

    const aiResponse = await fetch(`${openaiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Sen deneyimli bir restoran yönetim danışmanısın. Verilen satış verilerini analiz edip pratik öneriler sunuyorsun.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      return NextResponse.json({
        analiz: null,
        veri: analizVerisi,
        hata: `AI yanıt hatası: ${errText.slice(0, 200)}`
      })
    }

    const aiData = await aiResponse.json()
    const analizMetni = aiData.choices?.[0]?.message?.content || 'Analiz alınamadı'

    return NextResponse.json({
      analiz: analizMetni,
      veri: analizVerisi
    })

  } catch (error: any) {
    console.error('AI Analiz hatası:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
