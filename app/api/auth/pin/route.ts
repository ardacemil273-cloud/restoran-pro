/**
 * PIN Kodu Doğrulama ve Oturum Yönetimi
 * 
 * POST /api/auth/pin/verify - PIN doğrula
 * POST /api/auth/pin/logout - Oturumu kapat
 * GET /api/auth/pin/session - Oturum bilgisi
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
 * POST /api/auth/pin/verify
 * PIN kodu doğrula ve oturum oluştur
 */
export async function POST(request: NextRequest) {
  try {
    const { action, restoran_id, pin_kodu } = await request.json()

    if (!action) {
      return NextResponse.json(
        { error: 'action parametresi zorunlu' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    switch (action) {
      case 'verify':
        return await verifyPin(supabase, restoran_id, pin_kodu, request)

      case 'logout':
        return await logoutPin(supabase, restoran_id, request)

      default:
        return NextResponse.json(
          { error: 'Bilinmeyen action' },
          { status: 400 }
        )
    }
  } catch (error: any) {
    console.error('PIN hatası:', error)
    return NextResponse.json(
      { error: 'PIN işlemi başarısız', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * PIN doğrula
 */
async function verifyPin(supabase: any, restoran_id: string, pin_kodu: string, request: NextRequest) {
  try {
    // PIN kodu doğrula
    if (!pin_kodu || pin_kodu.length !== 4 || !/^\d{4}$/.test(pin_kodu)) {
      return NextResponse.json(
        { error: 'PIN kodu 4 haneli sayı olmalı' },
        { status: 400 }
      )
    }

    // Garson'u bul
    const { data: garson, error: garsonError } = await supabase
      .from('garsonlar')
      .select('*')
      .eq('restoran_id', restoran_id)
      .eq('pin_kodu', pin_kodu)
      .eq('pin_aktif', true)
      .eq('aktif', true)
      .single()

    if (garsonError || !garson) {
      // Başarısız giriş logla
      await supabase
        .from('pin_giris_loglari')
        .insert({
          restoran_id,
          pin_giris: pin_kodu,
          basarili: false,
          hata_mesaji: 'PIN kodu yanlış',
          ip_adresi: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        })

      return NextResponse.json(
        { error: 'PIN kodu yanlış' },
        { status: 401 }
      )
    }

    // Başarılı giriş logla
    await supabase
      .from('pin_giris_loglari')
      .insert({
        restoran_id,
        garson_id: garson.id,
        pin_giris: pin_kodu,
        basarili: true,
        ip_adresi: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      })

    // Oturum token'ı oluştur
    const sessionToken = crypto.randomBytes(32).toString('hex')

    // Oturum kaydet
    const { data: session, error: sessionError } = await supabase
      .from('pin_oturumlar')
      .insert({
        restoran_id,
        garson_id: garson.id,
        token: sessionToken,
        aktif: true
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Oturum oluşturma hatası:', sessionError)
      throw sessionError
    }

    return NextResponse.json({
      success: true,
      message: 'PIN doğrulandı',
      garson: {
        id: garson.id,
        ad: garson.ad,
        rol: garson.rol
      },
      session_token: sessionToken,
      session_expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 dakika
    }, { status: 200 })
  } catch (error: any) {
    console.error('PIN doğrulama hatası:', error)
    return NextResponse.json(
      { error: 'PIN doğrulanamadı', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * Oturumu kapat
 */
async function logoutPin(supabase: any, restoran_id: string, request: NextRequest) {
  try {
    const sessionToken = request.headers.get('x-session-token')

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Session token gerekli' },
        { status: 400 }
      )
    }

    // Oturumu kapat
    const { error: updateError } = await supabase
      .from('pin_oturumlar')
      .update({
        aktif: false,
        kapanma_tarihi: new Date().toISOString()
      })
      .eq('token', sessionToken)
      .eq('restoran_id', restoran_id)

    if (updateError) {
      console.error('Oturum kapatma hatası:', updateError)
      throw updateError
    }

    return NextResponse.json({
      success: true,
      message: 'Oturum kapatıldı'
    }, { status: 200 })
  } catch (error: any) {
    console.error('Logout hatası:', error)
    return NextResponse.json(
      { error: 'Logout başarısız', details: error.message },
      { status: 500 }
    )
  }
}

/**
 * GET /api/auth/pin/session
 * Oturum bilgisini kontrol et
 */
export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.headers.get('x-session-token')
    const restoran_id = request.nextUrl.searchParams.get('restoran_id')

    if (!sessionToken || !restoran_id) {
      return NextResponse.json(
        { error: 'Session token ve restoran_id gerekli' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Oturumu kontrol et
    const { data: session, error: sessionError } = await supabase
      .from('pin_oturumlar')
      .select('*, garsonlar(*)')
      .eq('token', sessionToken)
      .eq('restoran_id', restoran_id)
      .eq('aktif', true)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Oturum geçersiz' },
        { status: 401 }
      )
    }

    // Oturum süresini kontrol et (30 dakika)
    const sessionAge = Date.now() - new Date(session.acilis_tarihi).getTime()
    const sessionTimeout = 30 * 60 * 1000 // 30 dakika

    if (sessionAge > sessionTimeout) {
      // Oturumu kapat
      await supabase
        .from('pin_oturumlar')
        .update({ aktif: false })
        .eq('token', sessionToken)

      return NextResponse.json(
        { error: 'Oturum süresi doldu' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      session: {
        token: sessionToken,
        garson: session.garsonlar,
        acilis_tarihi: session.acilis_tarihi,
        kalan_sure_dakika: Math.floor((sessionTimeout - sessionAge) / 60000)
      }
    }, { status: 200 })
  } catch (error: any) {
    console.error('Oturum kontrol hatası:', error)
    return NextResponse.json(
      { error: 'Oturum kontrol başarısız', details: error.message },
      { status: 500 }
    )
  }
}
