// app/api/paytr/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const formData = await req.formData()

  const merchant_oid = formData.get('merchant_oid') as string
  const status = formData.get('status') as string
  const total_amount = formData.get('total_amount') as string
  const hash = formData.get('hash') as string

  const MERCHANT_KEY = process.env.PAYTR_MERCHANT_KEY!
  const MERCHANT_SALT = process.env.PAYTR_MERCHANT_SALT!

  // Hash doğrula - güvenlik kontrolü
  const hashStr = merchant_oid + MERCHANT_SALT + status + total_amount
  const beklenenHash = crypto
    .createHmac('sha256', MERCHANT_KEY)
    .update(hashStr)
    .digest('base64')

  if (hash !== beklenenHash) {
    console.error('PayTR hash doğrulaması başarısız')
    return new NextResponse('PAYTR_HATA', { status: 400 })
  }

  if (status === 'success') {
    // merchant_oid formatı: restoranId-paketTuru-timestamp
    const parts = merchant_oid.split('-')
    const restoranId = parts[0]
    const paketTuru = parts[1]

    // 1 yıllık abonelik bitiş tarihi
    const bitisTarihi = new Date()
    bitisTarihi.setFullYear(bitisTarihi.getFullYear() + 1)

    const { error } = await supabaseAdmin
      .from('restoranlar')
      .update({
        paket_turu: paketTuru,
        paket_bitis_tarihi: bitisTarihi.toISOString(),
        son_odeme_tarihi: new Date().toISOString(),
        son_odeme_tutari: parseInt(total_amount) / 100
      })
      .eq('id', restoranId)

    if (error) {
      console.error('Paket güncelleme hatası:', error)
      return new NextResponse('PAYTR_HATA', { status: 500 })
    }

    console.log(`Paket güncellendi: ${restoranId} → ${paketTuru}`)
  }

  // PayTR OK bekleniyor, aksi halde tekrar dener
  return new NextResponse('OK')
}