/**
 * Arayan Numara Tanıma (Caller ID) Sistemi
 * 
 * Bu endpoint santral/PBX sisteminden gelen aramaları işler.
 * Tuşlu telefon, VoIP, Asterisk, 3CX, Avaya gibi sistemlerle entegre olabilir.
 * 
 * POST /api/caller-id
 * 
 * Santral sisteminden gelen veri örneği:
 * {
 *   "event": "incoming_call",
 *   "caller_number": "+905551234567",
 *   "caller_name": "Müşteri Adı (opsiyonel)",
 *   "called_number": "+905559876543",
 *   "call_id": "unique-call-id",
 *   "timestamp": "2026-07-02T10:30:00Z",
 *   "restoran_id": "uuid (opsiyonel)"
 * }
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
    const {
      event,
      caller_number,
      caller_name,
      called_number,
      call_id,
      timestamp,
      restoran_id
    } = body

    // Validasyon
    if (!caller_number || !called_number) {
      return NextResponse.json(
        { error: 'caller_number ve called_number zorunlu' },
        { status: 400 }
      )
    }

    if (event !== 'incoming_call') {
      return NextResponse.json(
        { success: false, message: 'Sadece incoming_call olayları işlenir' }
      )
    }

    const supabase = getSupabaseAdmin()

    // Numaraları normalize et
    const normalizePhone = (phone: string) => phone.replace(/\D/g, '').slice(-10)
    const callerNormalized = normalizePhone(caller_number)
    const calledNormalized = normalizePhone(called_number)

    // Restoran ID'yi bul (eğer verilmemişse)
    let finalRestoranId = restoran_id
    if (!finalRestoranId) {
      const { data: restoranData } = await supabase
        .from('restoranlar')
        .select('id')
        .or(`telefon.ilike.%${calledNormalized}%,telefon.ilike.%${called_number}%`)
        .limit(1)
        .maybeSingle()
      if (restoranData) {
        finalRestoranId = restoranData.id
      }
    }

    if (!finalRestoranId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Restoran bulunamadı. Lütfen restoran_id gönderin veya restoranınızın telefon numarasını ayarlardan kaydedin.'
        },
        { status: 404 }
      )
    }

    // Müşteri bul veya oluştur
    const { data: existingCustomer } = await supabase
      .from('musteriler')
      .select('id, ad, telefon')
      .eq('restoran_id', finalRestoranId)
      .or(`telefon.eq.${callerNormalized},telefon.ilike.%${callerNormalized}%`)
      .limit(1)
      .maybeSingle()

    let customerId = existingCustomer?.id
    let customerData = existingCustomer

    // Müşteri yoksa otomatik oluştur
    if (!customerId) {
      const { data: newCustomer } = await supabase
        .from('musteriler')
        .insert({
          restoran_id: finalRestoranId,
          telefon: callerNormalized,
          ad: caller_name || `Müşteri ${callerNormalized}`,
          notlar: `Otomatik eklendi — Gelen arama (${new Date().toLocaleString('tr-TR')})`
        })
        .select('id, ad, telefon')
        .single()

      customerId = newCustomer?.id
      customerData = newCustomer
    }

    // Arama kaydını oluştur
    const { data: callRecord, error: insertError } = await supabase
      .from('arama_kayitlari')
      .insert({
        restoran_id: finalRestoranId,
        musteri_id: customerId || null,
        arayan_numara: callerNormalized,
        alici_numara: calledNormalized,
        arama_tarihi: timestamp || new Date().toISOString(),
        durum: 'ringing', // Gelen arama
        kaynak_sistem: 'caller_id',
        call_id: call_id || null
      })
      .select()
      .single()

    if (insertError) {
      console.error('Arama kaydı oluşturma hatası:', insertError)
      return NextResponse.json(
        { error: 'Arama kaydı oluşturulamadı', details: insertError.message },
        { status: 500 }
      )
    }

    // Not: Realtime dinleme server-side route'da yapılmaz, client-side'da yapılır

    return NextResponse.json({
      success: true,
      message: 'Gelen arama kaydedildi',
      data: {
        call_id: call_id,
        restoran_id: finalRestoranId,
        musteri_id: customerId,
        musteri_ad: customerData?.ad,
        musteri_telefon: customerData?.telefon,
        arayan_numara: callerNormalized,
        durum: 'ringing'
      }
    }, { status: 201 })
  } catch (error: any) {
    console.error('Caller ID hatası:', error)
    return NextResponse.json(
      { error: 'İç sunucu hatası', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Test Endpoint
 * GET /api/caller-id?test=true
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const test = searchParams.get('test')

  if (test === 'true') {
    return NextResponse.json({
      status: 'Caller ID sistemi aktif ve çalışıyor ✓',
      endpoint: '/api/caller-id',
      method: 'POST',
      description: 'Santral sisteminden gelen aramaları işler ve müşteri tanıması yapar',
      desteklenen_sistemler: [
        'Asterisk PBX',
        '3CX',
        'Avaya',
        'Cisco',
        'Grandstream',
        'Yealink',
        'Twilio',
        'Tuşlu Telefon Santralı (PABX)'
      ],
      ornek_payload: {
        event: 'incoming_call',
        caller_number: '+905551234567',
        caller_name: 'Ahmet Müşteri',
        called_number: '+905559876543',
        call_id: 'call-12345-67890',
        timestamp: new Date().toISOString(),
        restoran_id: 'uuid (opsiyonel)'
      },
      kurulum_rehberi: {
        asterisk: 'app.py dosyasında AGI script ile /api/caller-id endpoint\'ine POST isteği gönder',
        '3cx': '3CX Management Console → Settings → Webhooks → Incoming Call event\'ine /api/caller-id URL\'sini ekle',
        zapier: 'Zapier Webhook → POST /api/caller-id ile santral verilerini yönlendir',
        custom: 'Kendi PBX sisteminizden HTTP POST isteği gönderin'
      }
    })
  }

  return NextResponse.json({
    error: 'Test parametresi gerekli: ?test=true'
  }, { status: 400 })
}
