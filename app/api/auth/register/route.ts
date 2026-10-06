import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function slugOlustur(ad: string) {
  const slug = ad
    .toLocaleLowerCase('tr-TR')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${slug || 'restoran'}-${crypto.randomUUID().slice(0, 8)}`
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const password = typeof body.password === 'string' ? body.password : ''
    const restoranAd = typeof body.restoranAd === 'string' ? body.restoranAd.trim() : ''
    const patronSifre = typeof body.patronSifre === 'string' && body.patronSifre.trim()
      ? body.patronSifre.trim()
      : '1234'

    if (!email || !password || !restoranAd) {
      return NextResponse.json({ error: 'E-posta, şifre ve restoran adı zorunludur.' }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalıdır.' }, { status: 400 })
    }
    if (patronSifre.length < 4) {
      return NextResponse.json({ error: 'Patron şifresi en az 4 karakter olmalıdır.' }, { status: 400 })
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceRoleKey) {
      console.error('Auth kayıt yapılandırması eksik: NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY')
      return NextResponse.json({ error: 'Kayıt servisi şu anda yapılandırılmamış. Lütfen yöneticinize bildirin.' }, { status: 503 })
    }

    const admin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { restoran_ad: restoranAd },
    })

    if (authError || !authData.user) {
      const message = authError?.message || 'Kullanıcı oluşturulamadı.'
      const isDuplicate = /already|registered|exists|unique/i.test(message)
      return NextResponse.json(
        { error: isDuplicate ? 'Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.' : message },
        { status: isDuplicate ? 409 : 400 },
      )
    }

    const kod = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('')
    const { error: restoranError } = await admin.from('restoranlar').insert({
      ad: restoranAd,
      user_id: authData.user.id,
      sahibi_id: authData.user.id,
      patron_sifre: patronSifre,
      restoran_kodu: kod,
      slug: slugOlustur(restoranAd),
    })

    if (restoranError) {
      await admin.auth.admin.deleteUser(authData.user.id)
      console.error('Restoran oluşturma hatası:', restoranError)
      return NextResponse.json({ error: `Restoran oluşturulamadı: ${restoranError.message}` }, { status: 400 })
    }

    return NextResponse.json({ userId: authData.user.id, restoranKodu: kod }, { status: 201 })
  } catch (error) {
    console.error('Kayıt API hatası:', error)
    return NextResponse.json({ error: 'Kayıt sırasında beklenmeyen bir hata oluştu.' }, { status: 500 })
  }
}
