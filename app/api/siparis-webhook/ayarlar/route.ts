/**
 * Sipariş Webhook Ayarları
 * GET  /api/siparis-webhook/ayarlar?restoran_id=...  → Ayarları getir
 * POST /api/siparis-webhook/ayarlar                  → Ayarları kaydet
 */
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !serviceKey) throw new Error('Supabase yapılandırması eksik')
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const restoran_id = searchParams.get('restoran_id')

    if (!restoran_id) {
      return NextResponse.json({ error: 'restoran_id zorunlu' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('restoranlar')
      .select('siparis_webhook_url, siparis_webhook_aktif, siparis_webhook_secret')
      .eq('id', restoran_id)
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: {
        siparis_webhook_url: data?.siparis_webhook_url || '',
        siparis_webhook_aktif: data?.siparis_webhook_aktif || false,
        siparis_webhook_secret: data?.siparis_webhook_secret || ''
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { restoran_id, siparis_webhook_url, siparis_webhook_aktif, siparis_webhook_secret } = body

    if (!restoran_id) {
      return NextResponse.json({ error: 'restoran_id zorunlu' }, { status: 400 })
    }

    // URL formatını doğrula
    if (siparis_webhook_url) {
      try {
        new URL(siparis_webhook_url)
      } catch {
        return NextResponse.json(
          { error: 'Geçersiz webhook URL formatı. https:// ile başlamalı.' },
          { status: 400 }
        )
      }
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('restoranlar')
      .update({
        siparis_webhook_url: siparis_webhook_url || null,
        siparis_webhook_aktif: siparis_webhook_aktif ?? false,
        siparis_webhook_secret: siparis_webhook_secret || null
      })
      .eq('id', restoran_id)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Webhook ayarları kaydedildi'
    })
  } catch (error: any) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
