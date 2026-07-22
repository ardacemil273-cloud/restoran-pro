import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Mevcut özellik ayarlarını getir
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const restoranId = searchParams.get('restoran_id')

    if (!restoranId) {
      return NextResponse.json({ error: 'restoran_id zorunlu' }, { status: 400 })
    }

    const { data, error } = await supabaseAdmin
      .from('restoranlar')
      .select('ozellik_ayarlari')
      .eq('id', restoranId)
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ ozellik_ayarlari: data?.ozellik_ayarlari || {} })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// POST: Özellik ayarlarını güncelle
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { restoran_id, ozellik_ayarlari } = body

    if (!restoran_id || !ozellik_ayarlari) {
      return NextResponse.json({ error: 'restoran_id ve ozellik_ayarlari zorunlu' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('restoranlar')
      .update({ ozellik_ayarlari })
      .eq('id', restoran_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
