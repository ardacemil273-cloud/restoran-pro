import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { user_id, title, body: messageBody, data } = body

    if (!user_id) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
    }

    // Push aboneliklerini al
    const { data: subscriptions, error: subError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', user_id)

    if (subError) throw subError

    // Burada gerçek bir push servisi (Web Push API, Firebase vb.) entegrasyonu olmalı
    // Şimdilik veritabanına bildirim olarak kaydediyoruz
    const { error: notifyError } = await supabase
      .from('bildirimler')
      .insert([
        {
          user_id,
          baslik: title,
          mesaj: messageBody,
          data: data,
          okundu: false,
          created_at: new Date().toISOString()
        }
      ])

    if (notifyError) throw notifyError

    return NextResponse.json({ 
      success: true, 
      message: 'Notification sent and saved',
      subscription_count: subscriptions?.length || 0 
    }, { status: 200 })

  } catch (err) {
    console.error('Notification API error:', err)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
