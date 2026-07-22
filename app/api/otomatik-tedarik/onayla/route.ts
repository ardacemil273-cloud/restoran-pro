import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { siparis_id, islem, red_nedeni, kullanici_id } = body

    if (!siparis_id || !islem) {
      return NextResponse.json({ error: 'siparis_id ve islem zorunlu' }, { status: 400 })
    }

    if (!['onayla', 'reddet'].includes(islem)) {
      return NextResponse.json({ error: 'islem "onayla" veya "reddet" olmalı' }, { status: 400 })
    }

    const updateData: any = {
      onay_durumu: islem === 'onayla' ? 'onaylandi' : 'reddedildi',
      onay_tarihi: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (kullanici_id) updateData.onaylayan_id = kullanici_id
    if (islem === 'reddet' && red_nedeni) updateData.red_nedeni = red_nedeni
    if (islem === 'onayla') updateData.durum = 'gonderildi'
    if (islem === 'reddet') updateData.durum = 'iptal'

    const { data, error } = await supabaseAdmin
      .from('otomatik_siparisler')
      .update(updateData)
      .eq('id', siparis_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    return NextResponse.json({
      success: true,
      siparis: data,
      mesaj: islem === 'onayla' ? 'Sipariş onaylandı ve tedarikçiye gönderildi' : 'Sipariş reddedildi'
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
