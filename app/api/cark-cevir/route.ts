import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Ödül havuzu - restoran ayarlarına göre özelleştirilebilir
const ODUL_HAVUZU = [
  { tipi: 'indirim', deger: 10, aciklama: '%10 İndirim', agirlik: 30 },
  { tipi: 'indirim', deger: 15, aciklama: '%15 İndirim', agirlik: 20 },
  { tipi: 'indirim', deger: 20, aciklama: '%20 İndirim', agirlik: 10 },
  { tipi: 'indirim', deger: 25, aciklama: '%25 İndirim', agirlik: 5 },
  { tipi: 'puan', deger: 50, aciklama: '50 Puan Bonus', agirlik: 20 },
  { tipi: 'puan', deger: 100, aciklama: '100 Puan Bonus', agirlik: 10 },
  { tipi: 'ucretsiz_urun', deger: 1, aciklama: 'Ücretsiz Tatlı', agirlik: 3 },
  { tipi: 'bedava_icecek', deger: 1, aciklama: 'Bedava İçecek', agirlik: 2 },
]

function rastgeleOdulSec() {
  const toplamAgirlik = ODUL_HAVUZU.reduce((sum, o) => sum + o.agirlik, 0)
  let rastgele = Math.random() * toplamAgirlik
  for (const odul of ODUL_HAVUZU) {
    rastgele -= odul.agirlik
    if (rastgele <= 0) return odul
  }
  return ODUL_HAVUZU[0]
}

function kuponKoduUret(restoranSlug: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let kod = restoranSlug.slice(0, 3).toUpperCase() + '-'
  for (let i = 0; i < 6; i++) {
    kod += chars[Math.floor(Math.random() * chars.length)]
  }
  return kod
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { restoran_id, masa_id, musteri_telefon } = body

    if (!restoran_id) {
      return NextResponse.json({ error: 'restoran_id zorunlu' }, { status: 400 })
    }

    // Restoran ve feature flag kontrolü
    const { data: restoran } = await supabaseAdmin
      .from('restoranlar')
      .select('ozellik_ayarlari, slug')
      .eq('id', restoran_id)
      .single()

    if (!restoran) {
      return NextResponse.json({ error: 'Restoran bulunamadı' }, { status: 404 })
    }

    const carkAktif = restoran.ozellik_ayarlari?.cark_cevirme?.aktif
    if (!carkAktif) {
      return NextResponse.json({ error: 'Çark çevirme bu restoran için aktif değil' }, { status: 403 })
    }

    // Aynı masadan son 24 saatte çark çevrilmiş mi?
    if (masa_id) {
      const { data: mevcutKayit } = await supabaseAdmin
        .from('cark_cevir_kayitlari')
        .select('id, created_at')
        .eq('restoran_id', restoran_id)
        .eq('masa_id', masa_id)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1)
        .single()

      if (mevcutKayit) {
        return NextResponse.json({
          error: 'Bu masa bugün zaten çark çevirdi',
          sonraki_sure: '24 saat'
        }, { status: 429 })
      }
    }

    // Ödül seç
    const secilenOdul = rastgeleOdulSec()
    const kuponKodu = kuponKoduUret(restoran.slug || 'RST')

    // Kayıt oluştur
    const { data: kayit, error } = await supabaseAdmin
      .from('cark_cevir_kayitlari')
      .insert({
        restoran_id,
        masa_id: masa_id || null,
        musteri_telefon: musteri_telefon || null,
        odul_tipi: secilenOdul.tipi,
        odul_degeri: secilenOdul.deger,
        odul_aciklama: secilenOdul.aciklama,
        kupon_kodu: kuponKodu,
        gecerlilik_tarihi: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      odul: {
        tipi: secilenOdul.tipi,
        deger: secilenOdul.deger,
        aciklama: secilenOdul.aciklama,
        kupon_kodu: kuponKodu,
        gecerlilik: '24 saat',
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET: Kupon doğrulama
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const kupon_kodu = searchParams.get('kupon')
    const restoran_id = searchParams.get('restoran_id')

    if (!kupon_kodu || !restoran_id) {
      return NextResponse.json({ error: 'kupon ve restoran_id zorunlu' }, { status: 400 })
    }

    const { data: kayit } = await supabaseAdmin
      .from('cark_cevir_kayitlari')
      .select('*')
      .eq('kupon_kodu', kupon_kodu)
      .eq('restoran_id', restoran_id)
      .single()

    if (!kayit) {
      return NextResponse.json({ gecerli: false, hata: 'Kupon bulunamadı' })
    }

    if (kayit.kullanildi) {
      return NextResponse.json({ gecerli: false, hata: 'Kupon zaten kullanıldı' })
    }

    if (new Date(kayit.gecerlilik_tarihi) < new Date()) {
      return NextResponse.json({ gecerli: false, hata: 'Kupon süresi dolmuş' })
    }

    return NextResponse.json({
      gecerli: true,
      odul: {
        tipi: kayit.odul_tipi,
        deger: kayit.odul_degeri,
        aciklama: kayit.odul_aciklama,
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
