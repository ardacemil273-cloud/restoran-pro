import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const { id, ad, slug, aciklama, logo_url, tema_renk } = await request.json()

    if (!id || !ad || !slug) {
      return NextResponse.json({ error: 'ID, ad ve slug zorunlu' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('restoranlar')
      .update({ ad, slug, aciklama, logo_url, tema_renk })
      .eq('id', id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
