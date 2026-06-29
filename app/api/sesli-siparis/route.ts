import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Sesli sipariş kaydı oluştur
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { restoran_id, masa_id, garson_id, audio_url, transcribed_text, tip, durum } = body

    if (!restoran_id || !audio_url) {
      return NextResponse.json({ error: 'restoran_id ve audio_url zorunlu' }, { status: 400 })
    }

    // Sesli sipariş kaydı oluştur
    const { data: kayit, error } = await supabaseAdmin
      .from('sesli_siparisler')
      .insert({
        restoran_id,
        masa_id: masa_id || null,
        garson_id: garson_id || null,
        audio_url,
        transcribed_text: transcribed_text || '',
        tip: tip || 'musteri', // 'musteri' veya 'garson'
        durum: durum || 'beklemede', // 'beklemede', 'isleniyor', 'tamamlandi', 'iptal'
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      kayit_id: kayit.id,
      transcribed_text: kayit.transcribed_text
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Sesli siparişleri listele
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const restoran_id = searchParams.get('restoran_id')
    const masa_id = searchParams.get('masa_id')
    const garson_id = searchParams.get('garson_id')
    const durum = searchParams.get('durum')

    if (!restoran_id) {
      return NextResponse.json({ error: 'restoran_id zorunlu' }, { status: 400 })
    }

    let query = supabaseAdmin
      .from('sesli_siparisler')
      .select('*')
      .eq('restoran_id', restoran_id)

    if (masa_id) query = query.eq('masa_id', masa_id)
    if (garson_id) query = query.eq('garson_id', garson_id)
    if (durum) query = query.eq('durum', durum)

    const { data, error } = await query.order('created_at', { ascending: false }).limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ siparisler: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
