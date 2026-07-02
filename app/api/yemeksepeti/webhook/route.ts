import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    
    const {
      order_id,
      customer_name,
      customer_phone,
      items,
      total_price,
      delivery_address,
      notes,
      restoran_id,
      webhook_secret
    } = body

    // Basit secret kontrolü (Opsiyonel)
    // if (webhook_secret !== process.env.YEMEKSEPETI_WEBHOOK_SECRET) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Duplicate kontrolü
    const { data: existingOrder } = await supabase
      .from('yemeksepeti_siparisler')
      .select('id')
      .eq('yemeksepeti_order_id', order_id)
      .single()

    if (existingOrder) {
      return NextResponse.json({ success: true, message: 'Order already exists' }, { status: 200 })
    }

    const { data, error } = await supabase
      .from('yemeksepeti_siparisler')
      .insert([
        {
          yemeksepeti_order_id: order_id,
          musteri_ad: customer_name,
          musteri_telefon: customer_phone,
          urunler: items,
          toplam_tutar: total_price,
          teslimat_adresi: delivery_address,
          notlar: notes,
          durum: 'yeni',
          restoran_id: restoran_id,
          created_at: new Date().toISOString(),
          durum_guncelleme_tarihi: new Date().toISOString()
        }
      ])
      .select()

    if (error) throw error

    // Bildirim gönderimi (Opsiyonel)
    // await fetch(`${req.nextUrl.origin}/api/notifications/send`, {
    //   method: 'POST',
    //   body: JSON.stringify({
    //     title: 'Yeni Yemeksepeti Siparişi!',
    //     body: `${customer_name} - ${total_price} TL`,
    //     data: { order_id: data[0].id }
    //   })
    // })

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (err) {
    console.error('Yemeksepeti webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const durum = searchParams.get('durum')

    let query = supabase
      .from('yemeksepeti_siparisler')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (durum) {
      query = query.eq('durum', durum)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({ data, count }, { status: 200 })
  } catch (err) {
    console.error('Yemeksepeti GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
