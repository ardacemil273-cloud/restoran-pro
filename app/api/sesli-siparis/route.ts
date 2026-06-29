import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { parseVoiceOrder } from '@/lib/voice-parser'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { restoran_id, masa_id, garson_id, audio_url, transcribed_text, tip, durum } = body
    
    if (!restoran_id || (!audio_url && !transcribed_text)) {
      return NextResponse.json({ error: 'restoran_id ve audio/text zorunlu' }, { status: 400 })
    }

    // Metni akıllı parser ile düzenle
    const smartText = parseVoiceOrder(transcribed_text || '')

    const { data: kayit, error } = await supabaseAdmin
      .from('sesli_siparisler')
      .insert({
        restoran_id,
        masa_id: masa_id || null,
        garson_id: garson_id || null,
        audio_url: audio_url || '',
        transcribed_text: smartText,
        raw_text: transcribed_text || '',
        tip: tip || 'musteri',
        durum: durum || 'beklemede',
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
      transcribed_text: kayit.transcribed_text,
      raw_text: kayit.raw_text
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const restoran_id = searchParams.get('restoran_id')
    
    if (!restoran_id) {
      return NextResponse.json({ error: 'restoran_id zorunlu' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('sesli_siparisler')
      .select('*')
      .eq('restoran_id', restoran_id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ siparisler: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
