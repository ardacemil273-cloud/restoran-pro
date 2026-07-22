import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Sipariş tamamlandığında stok otomatik düşürme
 * POST /api/siparis/stok-guncelle
 * 
 * Body:
 * {
 *   siparis_id: string,
 *   restoran_id: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { siparis_id, restoran_id } = await request.json()

    if (!siparis_id || !restoran_id) {
      return NextResponse.json(
        { error: 'siparis_id ve restoran_id gerekli' },
        { status: 400 }
      )
    }

    // Siparişi getir
    const { data: siparis, error: siparisError } = await supabase
      .from('siparisler')
      .select('*')
      .eq('id', siparis_id)
      .eq('restoran_id', restoran_id)
      .single()

    if (siparisError || !siparis) {
      return NextResponse.json(
        { error: 'Sipariş bulunamadı' },
        { status: 404 }
      )
    }

    // Siparişin ürünlerini getir
    const { data: siparisUrunleri, error: urunError } = await supabase
      .from('siparis_urunleri')
      .select('urun_id, adet')
      .eq('siparis_id', siparis_id)

    if (urunError || !siparisUrunleri) {
      return NextResponse.json(
        { error: 'Sipariş ürünleri bulunamadı' },
        { status: 404 }
      )
    }

    // Her ürün için stok düşür
    const stokGuncelleme = siparisUrunleri.map(async (su) => {
      const { data: urun } = await supabase
        .from('urunler')
        .select('stok')
        .eq('id', su.urun_id)
        .eq('restoran_id', restoran_id)
        .single()

      if (urun && urun.stok !== null) {
        const yeniStok = Math.max(0, urun.stok - su.adet)

        const { error: updateError } = await supabase
          .from('urunler')
          .update({ stok: yeniStok })
          .eq('id', su.urun_id)
          .eq('restoran_id', restoran_id)

        if (updateError) {
          console.error(`Ürün ${su.urun_id} stok güncellemesi başarısız:`, updateError)
        }

        return {
          urun_id: su.urun_id,
          adet: su.adet,
          yeniStok,
          basarili: !updateError
        }
      }
    })

    const sonuclar = await Promise.all(stokGuncelleme)

    // Stok güncellemesini logla
    const { error: logError } = await supabase
      .from('stok_degisim_loglari')
      .insert({
        restoran_id,
        siparis_id,
        islem_tipi: 'siparis_tamamlandi',
        degisimler: sonuclar,
        created_at: new Date().toISOString()
      })

    return NextResponse.json({
      success: true,
      message: 'Stok başarıyla güncellendi',
      guncellenenUrunler: sonuclar.filter(s => s?.basarili).length,
      toplamUrun: siparisUrunleri.length
    })
  } catch (error) {
    console.error('Stok güncelleme hatası:', error)
    return NextResponse.json(
      { error: 'Stok güncellemesi sırasında hata oluştu' },
      { status: 500 }
    )
  }
}

/**
 * Stok değişim loglarını getir
 * GET /api/siparis/stok-guncelle?restoran_id=...&limit=50
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restoran_id = searchParams.get('restoran_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!restoran_id) {
      return NextResponse.json(
        { error: 'restoran_id gerekli' },
        { status: 400 }
      )
    }

    const { data: loglar, error } = await supabase
      .from('stok_degisim_loglari')
      .select('*')
      .eq('restoran_id', restoran_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json(
        { error: 'Loglar getirilemedi' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      loglar,
      toplam: loglar?.length || 0
    })
  } catch (error) {
    console.error('Log getirme hatası:', error)
    return NextResponse.json(
      { error: 'Loglar getirilirken hata oluştu' },
      { status: 500 }
    )
  }
}
