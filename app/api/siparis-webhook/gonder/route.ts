/**
 * Sipariş Webhook Gönderici
 * POST /api/siparis-webhook/gonder
 *
 * Yeni sipariş oluştuğunda işletmenin belirlediği webhook URL'sine
 * sipariş bilgilerini gönderir.
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { siparis_id, restoran_id } = body

    if (!siparis_id || !restoran_id) {
      return NextResponse.json(
        { error: 'siparis_id ve restoran_id zorunlu' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Restoranın webhook ayarlarını al
    const { data: restoran, error: restoranError } = await supabase
      .from('restoranlar')
      .select('siparis_webhook_url, siparis_webhook_aktif, siparis_webhook_secret, ad')
      .eq('id', restoran_id)
      .single()

    if (restoranError || !restoran) {
      return NextResponse.json({ error: 'Restoran bulunamadı' }, { status: 404 })
    }

    if (!restoran.siparis_webhook_aktif || !restoran.siparis_webhook_url) {
      return NextResponse.json({
        success: false,
        message: 'Webhook aktif değil veya URL tanımlı değil'
      })
    }

    // Sipariş detaylarını al
    const { data: siparis, error: siparisError } = await supabase
      .from('siparisler')
      .select(`
        id,
        masa_id,
        masa_ad,
        durum,
        not,
        toplam_tutar,
        created_at,
        siparis_urunleri (
          id,
          adet,
          birim_fiyat,
          urunler ( ad, fiyat )
        )
      `)
      .eq('id', siparis_id)
      .single()

    if (siparisError || !siparis) {
      return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 })
    }

    // Webhook payload hazırla
    const payload = {
      event: 'yeni_siparis',
      timestamp: new Date().toISOString(),
      restoran: {
        id: restoran_id,
        ad: restoran.ad
      },
      siparis: {
        id: siparis.id,
        masa: siparis.masa_ad,
        durum: siparis.durum,
        not: siparis.not,
        toplam_tutar: siparis.toplam_tutar,
        olusturulma: siparis.created_at,
        urunler: siparis.siparis_urunleri?.map((u: any) => ({
          ad: u.urunler?.ad,
          adet: u.adet,
          birim_fiyat: u.birim_fiyat,
          toplam: u.adet * u.birim_fiyat
        })) || []
      }
    }

    // Webhook isteği gönder
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'RestoranPro-Webhook/1.0'
    }

    if (restoran.siparis_webhook_secret) {
      headers['X-Webhook-Secret'] = restoran.siparis_webhook_secret
      headers['Authorization'] = `Bearer ${restoran.siparis_webhook_secret}`
    }

    const webhookResponse = await fetch(restoran.siparis_webhook_url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000) // 10 saniye timeout
    })

    const responseStatus = webhookResponse.status
    const responseOk = webhookResponse.ok

    return NextResponse.json({
      success: responseOk,
      message: responseOk
        ? 'Webhook başarıyla gönderildi'
        : `Webhook hedef sunucu ${responseStatus} döndürdü`,
      webhook_url: restoran.siparis_webhook_url,
      http_status: responseStatus,
      payload_preview: {
        event: payload.event,
        siparis_id: payload.siparis.id,
        masa: payload.siparis.masa,
        toplam: payload.siparis.toplam_tutar
      }
    })
  } catch (error: any) {
    console.error('Sipariş webhook gönderme hatası:', error)

    if (error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: 'Webhook hedef sunucu 10 saniye içinde yanıt vermedi', details: 'timeout' },
        { status: 504 }
      )
    }

    return NextResponse.json(
      { error: 'Webhook gönderilemedi', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Webhook bağlantısını test et
 * POST /api/siparis-webhook/gonder?test=true
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'Sipariş Webhook Gönderici aktif ✓',
    endpoint: '/api/siparis-webhook/gonder',
    method: 'POST',
    description: 'Yeni sipariş oluştuğunda işletmenin webhook URL\'sine bildirim gönderir',
    body: {
      siparis_id: 'UUID - Sipariş ID',
      restoran_id: 'UUID - Restoran ID'
    },
    ornek_payload: {
      event: 'yeni_siparis',
      timestamp: new Date().toISOString(),
      restoran: { id: 'uuid', ad: 'Restoran Adı' },
      siparis: {
        id: 'uuid',
        masa: 'Masa 1',
        durum: 'hazirlaniyor',
        toplam_tutar: 150.00,
        urunler: [
          { ad: 'Köfte', adet: 2, birim_fiyat: 75, toplam: 150 }
        ]
      }
    }
  })
}
