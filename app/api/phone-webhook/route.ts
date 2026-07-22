import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Telefon Arama Webhook Endpoint
 * 
 * Bu endpoint, VoIP/Telefon sisteminden gelen aramaları yakalar ve
 * Restoran Pro sistemine otomatik olarak kaydeder.
 * 
 * Desteklenen Sistemler:
 * - Twilio
 * - Asterisk
 * - FreePBX
 * - Özel VoIP Sistemleri
 * 
 * Kullanım:
 * POST /api/phone-webhook
 * 
 * Request Body:
 * {
 *   "from": "+905551234567",      // Arayan numara
 *   "to": "+905559876543",        // Alınan numara (restoran numarası)
 *   "timestamp": "2024-01-15T10:30:00Z",
 *   "duration": 120,              // Saniye cinsinden
 *   "status": "completed",        // completed, missed, failed
 *   "restoran_id": "uuid",        // Restoran ID (isteğe bağlı)
 *   "system": "twilio"            // Hangi sistem gönderdi
 * }
 */

// Webhook için service role client kullanıyoruz
// Çünkü webhook dışarıdan geliyor, kullanıcı auth'u yok
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase URL veya key eksik')
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export async function POST(request: NextRequest) {
  try {
    // Basit güvenlik: Authorization header veya secret key kontrolü
    const authHeader = request.headers.get('Authorization')
    const webhookSecret = process.env.WEBHOOK_SECRET

    // Eğer WEBHOOK_SECRET tanımlıysa, doğrulama yap
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      return NextResponse.json(
        { error: 'Yetkisiz erişim' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { from, to, timestamp, duration, status, restoran_id, system } = body

    // Validasyon
    if (!from || !to) {
      return NextResponse.json(
        { error: 'from ve to parametreleri zorunlu' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Numaraları normalize et (sadece rakamlar, son 10 hane)
    const normalizePhone = (phone: string) => phone.replace(/\D/g, '').slice(-10)
    const fromNormalized = normalizePhone(from)
    const toNormalized = normalizePhone(to)

    // Eğer restoran_id verilmemişse, to numarasından bul
    let finalRestoranId = restoran_id

    if (!finalRestoranId) {
      const { data: restoranData } = await supabase
        .from('restoranlar')
        .select('id')
        .or(`telefon.ilike.%${toNormalized}%,telefon.ilike.%${to}%`)
        .limit(1)
        .maybeSingle()

      if (restoranData) {
        finalRestoranId = restoranData.id
      }
    }

    if (!finalRestoranId) {
      return NextResponse.json(
        { error: 'Restoran bulunamadı. Lütfen restoran_id gönderin veya restoranınızın telefon numarasını ayarlardan kaydedin.' },
        { status: 404 }
      )
    }

    // Müşteri bul
    const { data: existingCustomer } = await supabase
      .from('musteriler')
      .select('id')
      .eq('restoran_id', finalRestoranId)
      .or(`telefon.eq.${fromNormalized},telefon.ilike.%${fromNormalized}%`)
      .limit(1)
      .maybeSingle()

    let customerId = existingCustomer?.id

    // Tamamlanan aramalar için müşteri otomatik oluştur
    if (!customerId && status === 'completed' && duration && duration > 0) {
      const { data: newCustomer } = await supabase
        .from('musteriler')
        .insert({
          restoran_id: finalRestoranId,
          telefon: fromNormalized,
          ad: `Müşteri ${fromNormalized}`,
          notlar: `Otomatik eklendi — ${system || 'telefon'} sistemi üzerinden`
        })
        .select('id')
        .single()

      customerId = newCustomer?.id
    }

    // Arama kaydını oluştur
    const { error: insertError } = await supabase
      .from('arama_kayitlari')
      .insert({
        restoran_id: finalRestoranId,
        musteri_id: customerId || null,
        arayan_numara: fromNormalized,
        alici_numara: toNormalized,
        arama_tarihi: timestamp || new Date().toISOString(),
        sure: duration || 0,
        durum: status || 'completed',
        kaynak_sistem: system || 'webhook'
      })

    if (insertError) {
      console.error('Arama kaydı oluşturma hatası:', insertError)
      return NextResponse.json(
        { error: 'Arama kaydı oluşturulamadı', details: insertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Arama başarıyla kaydedildi',
      data: {
        restoran_id: finalRestoranId,
        musteri_id: customerId,
        arayan_numara: fromNormalized,
        durum: status
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Phone webhook hatası:', error)
    return NextResponse.json(
      { error: 'İç sunucu hatası', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Test Endpoint
 * GET /api/phone-webhook?test=true
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const test = searchParams.get('test')

  if (test === 'true') {
    return NextResponse.json({
      status: 'Webhook aktif ve çalışıyor ✓',
      endpoint: '/api/phone-webhook',
      method: 'POST',
      description: 'Telefon arama webhook sistemi',
      guvenlik: 'WEBHOOK_SECRET env değişkeni ile güvence altına alın',
      example: {
        from: '+905551234567',
        to: '+905559876543',
        timestamp: new Date().toISOString(),
        duration: 120,
        status: 'completed',
        system: 'twilio'
      }
    })
  }

  return NextResponse.json({
    error: 'Test parametresi gerekli: ?test=true'
  }, { status: 400 })
}
