/**
 * Webhook Test Simulator
 * 
 * Yemeksepeti webhook'unu test etmek için sahte siparişler gönderir.
 * 
 * POST /api/test/webhook-simulator
 */

import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'

export async function POST(request: NextRequest) {
  try {
    const { action, restoran_id, chain_id, vendor_id } = await request.json()

    if (!action) {
      return NextResponse.json(
        { error: 'action parametresi zorunlu' },
        { status: 400 }
      )
    }

    // Test webhook'unu gönder
    const webhookUrl = `${request.nextUrl.origin}/api/yemeksepeti/webhook`

    let payload: any = {
      chain_id: chain_id || 'test-chain-' + Date.now(),
      vendor_id: vendor_id || 'test-vendor-' + Date.now()
    }

    switch (action) {
      case 'order_created':
        payload.event = 'order.created'
        payload.data = {
          order_id: `test-order-${Date.now()}`,
          order_number: `TEST-${Math.floor(Math.random() * 10000)}`,
          status: 'PENDING',
          total_amount: 150.00,
          currency: 'TRY',
          customer: {
            name: 'Test Müşteri',
            phone: '+905551234567',
            email: 'test@example.com'
          },
          items: [
            {
              name: 'Test Köfte',
              quantity: 2,
              unit_price: 75,
              total: 150
            }
          ],
          delivery_address: {
            address: 'Test Adresi, İstanbul',
            notes: 'Test notu'
          },
          estimated_preparation_time: 30
        }
        break

      case 'order_updated':
        payload.event = 'order.updated'
        payload.data = {
          order_id: `test-order-${Date.now() - 60000}`,
          status: 'PREPARING'
        }
        break

      case 'order_cancelled':
        payload.event = 'order.cancelled'
        payload.data = {
          order_id: `test-order-${Date.now() - 120000}`,
          cancellation_reason: 'Customer requested'
        }
        break

      default:
        return NextResponse.json(
          { error: 'Bilinmeyen action. Seçenekler: order_created, order_updated, order_cancelled' },
          { status: 400 }
        )
    }

    // Webhook'u gönder
    const response = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    })

    return NextResponse.json({
      success: true,
      message: `${action} webhook'u gönderildi`,
      payload: payload,
      response: response.data
    }, { status: 200 })
  } catch (error: any) {
    console.error('Webhook simulator hatası:', error)
    return NextResponse.json(
      {
        error: 'Webhook gönderme hatası',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/test/webhook-simulator
 * Test seçeneklerini göster
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'Webhook Test Simulator aktif ✓',
    endpoint: '/api/test/webhook-simulator',
    method: 'POST',
    description: 'Yemeksepeti webhook\'unu test etmek için sahte siparişler gönder',
    test_actions: [
      'order_created - Yeni sipariş oluştur',
      'order_updated - Siparişi güncelle',
      'order_cancelled - Siparişi iptal et'
    ],
    ornek_istek: {
      action: 'order_created',
      chain_id: 'test-chain-123',
      vendor_id: 'test-vendor-123'
    },
    kullanim: 'POST /api/test/webhook-simulator ile yukarıdaki JSON\'ı gönder'
  })
}
