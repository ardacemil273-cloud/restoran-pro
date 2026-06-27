import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('API Gelen:', body)

    const { id, ad, slug, aciklama, logo_url, tema_renk } = body

    if (!id ||!ad ||!slug) {
      return NextResponse.json({
        error: 'ID, ad ve slug zorunlu',
        gelen: { id, ad, slug }
      }, { status: 400 })
    }

    const { error } = await supabaseAdmin
     .from('restoranlar')
     .update({
        ad,
        slug,
        aciklama: aciklama || null,
        logo_url: logo_url || null,
        tema_renk: tema_renk || '#f59e0b'
      })
     .eq('id', id)

    if (error) {
      console.log('Supabase Error:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.log('Catch Error:', err)
    return NextResponse.json({ error: 'Sunucu hatası', detay: err.message }, { status: 500 })
  }
}
