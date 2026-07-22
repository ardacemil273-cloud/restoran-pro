import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Doğum günü müşterileri bul ve bildirim gönder
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { restoran_id, test_mode } = body

    if (!restoran_id) {
      return NextResponse.json({ error: 'restoran_id zorunlu' }, { status: 400 })
    }

    // Bugün doğum günü olan müşterileri bul
    const today = new Date()
    const bugun = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const { data: musteriler, error } = await supabaseAdmin
      .from('musteriler')
      .select('id, ad, telefon, email, dogum_tarihi')
      .eq('restoran_id', restoran_id)
      .eq('sadakat_kartı_aktif', true)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Doğum günü olanları filtrele
    const dogumGunuMusteriler = musteriler?.filter(m => {
      if (!m.dogum_tarihi) return false
      const dogumGunu = m.dogum_tarihi.substring(5, 10) // YYYY-MM-DD'den MM-DD'yi al
      return dogumGunu === bugun || test_mode
    }) || []

    // Her müşteriye bildirim gönder
    const bildirimler = await Promise.all(
      dogumGunuMusteriler.map(async (musteri) => {
        // Doğum günü indirim kaydı oluştur
        const { data: indirim } = await supabaseAdmin
          .from('dogum_gunu_indirimler')
          .insert({
            restoran_id,
            musteri_id: musteri.id,
            indirim_orani: 20,
            kullanildi: false,
            created_at: new Date().toISOString(),
            gecerlilik_tarihi: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          })
          .select()
          .single()

        // Bildirim mesajı oluştur
        const mesaj = `🎂 Doğum Günün Kutlu Olsun ${musteri.ad}! Bugün sana %20 indirim tanımladık. Siparişini ver ve indirimden faydalanabilirsin! 🎉`

        // Simüle edilmiş bildirim (gerçek SMS/WhatsApp için Twilio vb. kullanılabilir)
        const bildiri = {
          musteri_id: musteri.id,
          musteri_adi: musteri.ad,
          telefon: musteri.telefon,
          email: musteri.email,
          mesaj,
          tip: 'dogum_gunu',
          gonderildi: false,
          created_at: new Date().toISOString()
        }

        // Bildirimleri veritabanına kaydet
        await supabaseAdmin
          .from('bildirimler')
          .insert(bildiri)

        return bildiri
      })
    )

    return NextResponse.json({
      success: true,
      dogum_gunu_musteri_sayisi: dogumGunuMusteriler.length,
      bildirimler
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET: Müşterinin doğum günü indirimini kontrol et
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const musteri_id = searchParams.get('musteri_id')
    const restoran_id = searchParams.get('restoran_id')

    if (!musteri_id || !restoran_id) {
      return NextResponse.json({ error: 'musteri_id ve restoran_id zorunlu' }, { status: 400 })
    }

    const { data: indirim } = await supabaseAdmin
      .from('dogum_gunu_indirimler')
      .select('*')
      .eq('musteri_id', musteri_id)
      .eq('restoran_id', restoran_id)
      .eq('kullanildi', false)
      .gte('gecerlilik_tarihi', new Date().toISOString())
      .single()

    if (!indirim) {
      return NextResponse.json({
        var_mi: false,
        mesaj: 'Doğum günü indirim bulunamadı'
      })
    }

    return NextResponse.json({
      var_mi: true,
      indirim_orani: indirim.indirim_orani,
      gecerlilik_tarihi: indirim.gecerlilik_tarihi
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
