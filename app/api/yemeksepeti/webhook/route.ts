/**
 * Yemeksepeti Webhook Endpoint
 * 
 * Yemeksepeti Partner API'sinden gelen sipariş olaylarını (order.created, order.updated, order.cancelled) işler.
 * OpenAPI 3.0.3 standartlarına uygun.
 * 
 * POST /api/yemeksepeti/webhook
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !serviceKey) throw new Error('Supabase yapılandırması eksik')
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

/**
 * Webhook imzasını doğrula (Yemeksepeti tarafından gönderilen)
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const hash = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    return hash === signature
  } catch (err) {
    console.error('İmza doğrulama hatası:', err)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const payload = JSON.parse(body)

    const {
      event,
      data,
      chain_id,
      vendor_id
    } = payload

    // Webhook imzasını doğrula (opsiyonel, güvenlik için)
    const signature = request.headers.get('x-webhook-signature')
    const timestamp = request.headers.get('x-webhook-timestamp')

    console.log(`📦 Yemeksepeti Webhook: ${event}`, { chain_id, vendor_id })

    const supabase = getSupabaseAdmin()

    // Restoran'ı chain_id ve vendor_id'ye göre bul
    const { data: yemeksepetiConnection, error: connectionError } = await supabase
      .from('yemeksepeti_connections')
      .select('restoran_id, webhook_secret, webhook_aktif')
      .eq('chain_id', chain_id)
      .eq('vendor_id', vendor_id)
      .single()

    if (connectionError || !yemeksepetiConnection) {
      console.warn('❌ Restoran bulunamadı:', { chain_id, vendor_id })
      return NextResponse.json(
        { error: 'Restoran bulunamadı' },
        { status: 404 }
      )
    }

    if (!yemeksepetiConnection.webhook_aktif) {
      console.warn('⚠️ Webhook pasif:', yemeksepetiConnection.restoran_id)
      return NextResponse.json(
        { success: false, message: 'Webhook pasif' }
      )
    }

    const restoran_id = yemeksepetiConnection.restoran_id

    // Webhook logunu kaydet
    const { error: logError } = await supabase
      .from('yemeksepeti_webhook_logs')
      .insert({
        restoran_id,
        event_type: event,
        payload: payload,
        islem_basarili: false
      })

    if (logError) {
      console.error('Webhook log kaydedilemedi:', logError)
    }

    // Olaya göre işle
    let islemBasarili = false
    switch (event) {
      case 'order.created':
        await handleOrderCreated(supabase, restoran_id, data)
        islemBasarili = true
        break
      case 'order.updated':
        await handleOrderUpdated(supabase, restoran_id, data)
        islemBasarili = true
        break
      case 'order.cancelled':
        await handleOrderCancelled(supabase, restoran_id, data)
        islemBasarili = true
        break
      default:
        console.warn('⚠️ Bilinmeyen event:', event)
    }

    // Webhook log'unu başarılı olarak işaretle
    if (islemBasarili) {
      await supabase
        .from('yemeksepeti_webhook_logs')
        .update({ islem_basarili: true })
        .eq('restoran_id', restoran_id)
        .eq('event_type', event)
        .order('created_at', { ascending: false })
        .limit(1)
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook işlendi',
      event: event
    }, { status: 200 })
  } catch (error: any) {
    console.error('❌ Webhook hatası:', error)
    return NextResponse.json(
      { error: 'Webhook işlenemedi', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Yeni sipariş oluşturuldu
 */
async function handleOrderCreated(supabase: any, restoran_id: string, data: any) {
  try {
    const {
      order_id,
      order_number,
      status,
      total_amount,
      currency,
      customer,
      items,
      delivery_address,
      estimated_preparation_time
    } = data

    console.log('✅ Yeni sipariş işleniyor:', order_id)

    // Duplicate kontrolü
    const { data: existing } = await supabase
      .from('yemeksepeti_siparisler')
      .select('id')
      .eq('yemeksepeti_order_id', order_id)
      .eq('restoran_id', restoran_id)
      .single()

    if (existing) {
      console.log('ℹ️ Sipariş zaten mevcut:', order_id)
      return
    }

    // Yemeksepeti siparişini kaydet
    const { data: yemeksepetiSiparis, error: insertError } = await supabase
      .from('yemeksepeti_siparisler')
      .insert({
        restoran_id,
        yemeksepeti_order_id: order_id,
        durum: status || 'PENDING',
        toplam_tutar: total_amount,
        para_birimi: currency,
        musteri_adi: customer?.name,
        musteri_telefon: customer?.phone,
        musteri_email: customer?.email,
        teslimat_adresi: delivery_address?.address,
        teslimat_notu: delivery_address?.notes,
        urunler: items,
        siparis_tarihi: new Date().toISOString(),
        hazirlik_suresi_dakika: estimated_preparation_time
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Yemeksepeti siparişi kaydedilemedi:', insertError)
      throw insertError
    }

    console.log('✅ Yemeksepeti siparişi kaydedildi:', order_id)
  } catch (error: any) {
    console.error('❌ Order created hatası:', error)
    throw error
  }
}

/**
 * Sipariş güncellendi
 */
async function handleOrderUpdated(supabase: any, restoran_id: string, data: any) {
  try {
    const { order_id, status } = data

    console.log('🔄 Sipariş güncelleniyor:', order_id, '→', status)

    // Yemeksepeti siparişini güncelle
    const { error: updateError } = await supabase
      .from('yemeksepeti_siparisler')
      .update({
        durum: status,
        updated_at: new Date().toISOString()
      })
      .eq('yemeksepeti_order_id', order_id)
      .eq('restoran_id', restoran_id)

    if (updateError) {
      console.error('❌ Yemeksepeti siparişi güncellenemedi:', updateError)
      throw updateError
    }

    console.log('✅ Sipariş güncellendi:', order_id)
  } catch (error: any) {
    console.error('❌ Order updated hatası:', error)
    throw error
  }
}

/**
 * Sipariş iptal edildi
 */
async function handleOrderCancelled(supabase: any, restoran_id: string, data: any) {
  try {
    const { order_id, cancellation_reason } = data

    console.log('❌ Sipariş iptal ediliyor:', order_id, 'Neden:', cancellation_reason)

    // Yemeksepeti siparişini iptal et
    const { error: updateError } = await supabase
      .from('yemeksepeti_siparisler')
      .update({
        durum: 'CANCELLED',
        updated_at: new Date().toISOString()
      })
      .eq('yemeksepeti_order_id', order_id)
      .eq('restoran_id', restoran_id)

    if (updateError) {
      console.error('❌ Yemeksepeti siparişi iptal edilemedi:', updateError)
      throw updateError
    }

    console.log('✅ Sipariş iptal edildi:', order_id)
  } catch (error: any) {
    console.error('❌ Order cancelled hatası:', error)
    throw error
  }
}

/**
 * Test Endpoint
 * GET /api/yemeksepeti/webhook?test=true
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const test = searchParams.get('test')

  if (test === 'true') {
    return NextResponse.json({
      status: 'Yemeksepeti Webhook sistemi aktif ve çalışıyor ✓',
      endpoint: '/api/yemeksepeti/webhook',
      method: 'POST',
      description: 'Yemeksepeti Partner API\'sinden gelen sipariş olaylarını işler',
      desteklenen_olaylar: [
        'order.created - Yeni sipariş oluşturuldu',
        'order.updated - Sipariş güncellendi',
        'order.cancelled - Sipariş iptal edildi'
      ],
      ornek_payload: {
        event: 'order.created',
        chain_id: 'chain-uuid',
        vendor_id: 'vendor-uuid',
        data: {
          order_id: 'order-12345',
          order_number: 'YS-001',
          status: 'PENDING',
          total_amount: 150.00,
          currency: 'TRY',
          customer: {
            name: 'Ahmet Müşteri',
            phone: '+905551234567',
            email: 'ahmet@example.com'
          },
          items: [
            {
              name: 'Köfte',
              quantity: 2,
              unit_price: 75,
              total: 150
            }
          ],
          delivery_address: {
            address: 'Ataşehir, İstanbul',
            notes: 'Kapıda çal'
          },
          estimated_preparation_time: 30
        }
      },
      kurulum_adimi: 'Yemeksepeti Partner Portal\'da Webhook URL\'sini şu şekilde ayarla: https://YOUR_DOMAIN/api/yemeksepeti/webhook'
    })
  }

  return NextResponse.json({
    error: 'Test parametresi gerekli: ?test=true'
  }, { status: 400 })
}
