// app/api/paytr/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // .env.local'e ekle
)

export async function POST(req: NextRequest) {
  const { paketTuru, restoranId, kullaniciEmail } = await req.json()

  const MERCHANT_ID = process.env.PAYTR_MERCHANT_ID!
  const MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY!
  const MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT!

  const PAKET_FIYATLARI: Record<string, number> = {
    big: 19900,  // 199.00 TL → kuruş cinsinden
    pro: 39900   // 399.00 TL
  }

  const tutar = PAKET_FIYATLARI[paketTuru]
  if (!tutar) return NextResponse.json({ error: 'Geçersiz paket' }, { status: 400 })

  const siparisNo = `${restoranId}-${paketTuru}-${Date.now()}`
  const userIp = req.headers.get('x-forwarded-for') || '127.0.0.1'

  const sepetUrunler = JSON.stringify([[`${paketTuru.toUpperCase()} Paket`, tutar, 1]])

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // PayTR token oluştur
  const tokenStr = [
    MERCHANT_ID,
    userIp,
    siparisNo,
    kullaniciEmail,
    tutar,
    sepetUrunler,
    'TR',
    '1', // test modu: 1 = test, 0 = canlı
    '1',
    `${baseUrl}/api/paytr/callback`,
    MERCHANT_SALT
  ].join('')

  const token = crypto
    .createHmac('sha256', MERCHANT_KEY)
    .update(tokenStr)
    .digest('base64')

  // PayTR'ye istek at
  const params = new URLSearchParams({
    merchant_id: MERCHANT_ID,
    user_ip: userIp,
    merchant_oid: siparisNo,
    email: kullaniciEmail,
    payment_amount: String(tutar),
    paytr_token: token,
    user_basket: Buffer.from(sepetUrunler).toString('base64'),
    debug_on: '1',
    no_installment: '0',
    max_installment: '0',
    currency: 'TL',
    test_mode: '1', // CANLI'ya geçince 0 yap
    lang: 'tr',
    merchant_ok_url: `${baseUrl}/ayarlar/paket?sonuc=basarili&paket=${paketTuru}&restoran=${restoranId}`,
    merchant_fail_url: `${baseUrl}/ayarlar/paket?sonuc=hata`,
  })

  const paytrRes = await fetch('https://www.paytr.com/odeme/api/get-token', {
    method: 'POST',
    body: params,
  })

  const paytrData = await paytrRes.json()

  if (paytrData.status !== 'success') {
    return NextResponse.json({ error: paytrData.reason }, { status: 400 })
  }

  return NextResponse.json({ iframeToken: paytrData.token })
}