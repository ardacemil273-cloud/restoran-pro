import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { from, to, timestamp, duration, status, restoran_id, system } = body

    // Validasyon
    if (!from || !to) {
      return NextResponse.json(
        { error: 'from ve to parametreleri zorunlu' },
        { status: 400 }
      )
    }

    // Numaraları normalize et (sadece rakamlar)
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
        .single()

      if (restoranData) {
        finalRestoranId = restoranData.id
      }
    }

    if (!finalRestoranId) {
      return NextResponse.json(
        { error: 'Restoran bulunamadı. Lütfen restoran_id gönderin.' },
        { status: 404 }
      )
    }

    // Müşteri bul veya oluştur
    const { data: existingCustomer } = await supabase
      .from('musteriler')
      .select('id')
      .eq('restoran_id', finalRestoranId)
      .or(`telefon.eq.${fromNormalized},telefon.ilike.%${fromNormalized}%`)
      .limit(1)
      .single()

    let customerId = existingCustomer?.id

    if (!customerId && status === 'completed' && duration > 0) {
      // Yeni müşteri oluştur (sadece tamamlanan aramalar için)
      const { data: newCustomer } = await supabase
        .from('musteriler')
        .insert({
          restoran_id: finalRestoranId,
          telefon: fromNormalized,
          ad: `Müşteri ${fromNormalized}`,
          notlar: `Otomatik sistem tarafından ${system || 'telefon'} üzerinden eklendi`
        })
        .select('id')
        .single()

      customerId = newCustomer?.id
    }

    // Arama kaydını oluştur (arama_kayitlari tablosu)
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

    // Başarılı yanıt
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
 * Test Endpoint - Webhook'u test etmek için
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
