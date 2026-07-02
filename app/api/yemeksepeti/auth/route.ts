/**
 * Yemeksepeti OAuth Token Yönetimi
 * 
 * Bu endpoint Yemeksepeti API'sine erişmek için gerekli OAuth token'ını yönetir.
 * Token otomatik olarak yenilenebilir.
 */

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

const YEMEKSEPETI_API_URL = 'https://yemeksepeti.partner.deliveryhero.io'

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !serviceKey) throw new Error('Supabase yapılandırması eksik')
  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

/**
 * POST /api/yemeksepeti/auth/token
 * Yemeksepeti OAuth token'ı oluştur veya yenile
 */
export async function POST(request: NextRequest) {
  try {
    const { restoran_id, client_id, client_secret, refresh = false } = await request.json()

    if (!restoran_id || !client_id || !client_secret) {
      return NextResponse.json(
        { error: 'restoran_id, client_id ve client_secret zorunlu' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Token'ı Yemeksepeti'den al
    const tokenResponse = await axios.post(
      `${YEMEKSEPETI_API_URL}/v2/oauth/token`,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: client_id,
        client_secret: client_secret
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )

    const { access_token, expires_in } = tokenResponse.data

    if (!access_token) {
      return NextResponse.json(
        { error: 'Token alınamadı', details: tokenResponse.data },
        { status: 400 }
      )
    }

    // Token'ı veritabanına kaydet
    const tokenExpiresAt = new Date(Date.now() + expires_in * 1000)

    const { error: updateError } = await supabase
      .from('yemeksepeti_connections')
      .update({
        access_token: access_token,
        token_expires_at: tokenExpiresAt.toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('restoran_id', restoran_id)

    if (updateError) {
      console.error('Token kaydetme hatası:', updateError)
      return NextResponse.json(
        { error: 'Token kaydedilemedi', details: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      access_token: access_token,
      expires_in: expires_in,
      token_expires_at: tokenExpiresAt.toISOString()
    })
  } catch (error: any) {
    console.error('OAuth token hatası:', error)
    return NextResponse.json(
      {
        error: 'Token alınamadı',
        details: error.response?.data || error.message
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/yemeksepeti/auth/validate
 * Token'ı doğrula ve geçerliliğini kontrol et
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const restoran_id = searchParams.get('restoran_id')

    if (!restoran_id) {
      return NextResponse.json(
        { error: 'restoran_id zorunlu' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()

    // Bağlantı bilgisini al
    const { data: connection, error } = await supabase
      .from('yemeksepeti_connections')
      .select('*')
      .eq('restoran_id', restoran_id)
      .single()

    if (error || !connection) {
      return NextResponse.json(
        { error: 'Yemeksepeti bağlantısı bulunamadı' },
        { status: 404 }
      )
    }

    // Token geçerliliğini kontrol et
    const now = new Date()
    const tokenExpiresAt = new Date(connection.token_expires_at)
    const isTokenValid = tokenExpiresAt > now
    const minutesUntilExpiry = Math.floor((tokenExpiresAt.getTime() - now.getTime()) / 60000)

    return NextResponse.json({
      success: true,
      is_connected: connection.baglanti_aktif,
      token_valid: isTokenValid,
      minutes_until_expiry: minutesUntilExpiry,
      chain_id: connection.chain_id,
      vendor_id: connection.vendor_id,
      webhook_active: connection.webhook_aktif,
      last_sync: connection.son_senkronizasyon
    })
  } catch (error: any) {
    console.error('Token doğrulama hatası:', error)
    return NextResponse.json(
      { error: 'Token doğrulanamadı', details: error.message },
      { status: 500 }
    )
  }
}
