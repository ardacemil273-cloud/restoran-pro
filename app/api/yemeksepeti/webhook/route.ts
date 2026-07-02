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
      notes
    } = body

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
          created_at: new Date().toISOString()
        }
      ])
      .select()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (err) {
    console.error('Yemeksepeti webhook error:', err)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('yemeksepeti_siparisler')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ data }, { status: 200 })
  } catch (err) {
    console.error('Yemeksepeti GET error:', err)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}
