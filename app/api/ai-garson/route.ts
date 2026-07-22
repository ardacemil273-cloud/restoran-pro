import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// OpenAI API kullan
const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_API_BASE = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { transcribed_text, restoran_id, sesli_siparis_id } = body

    if (!transcribed_text) {
      return NextResponse.json({ error: 'transcribed_text zorunlu' }, { status: 400 })
    }

    // LLM'e gönder - sesli siparişi analiz et
    const prompt = `
Bir restoran müşterisi sesle sipariş verdi. Aşağıdaki metni analiz ederek:
1. Sipariş edilen ürünleri listele
2. Özel istekleri (acılı, buzsuz, sosunsuz vb.) çıkar
3. Mutfak notlarını oluştur

Müşteri Siparişi: "${transcribed_text}"

Yanıt formatı JSON olmalı:
{
  "urunler": [
    { "ad": "ürün adı", "adet": 1, "notlar": "özel istekler" }
  ],
  "mutfak_notlari": "Mutfağa gidecek talimatlar",
  "ozel_istekler": ["acılı", "buzsuz" vb],
  "toplam_tahmini": "Tahmini toplam"
}
`

    const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Sen bir restoran AI garson asistanısın. Müşteri siparişlerini analiz ederek mutfak notları oluşturursun. Her zaman JSON formatında yanıt ver.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    })

    if (!response.ok) {
      const error = await response.text()
      return NextResponse.json({ error: `LLM Error: ${error}` }, { status: 400 })
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || '{}'

    // JSON'ı parse et
    let analiz: any = {}
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      analiz = jsonMatch ? JSON.parse(jsonMatch[0]) : {}
    } catch (e) {
      analiz = {
        urunler: [],
        mutfak_notlari: transcribed_text,
        ozel_istekler: [],
        toplam_tahmini: '?'
      }
    }

    // Veritabanına kaydet
    if (sesli_siparis_id && restoran_id) {
      await supabaseAdmin
        .from('sesli_siparisler')
        .update({
          durum: 'isleniyor',
          mutfak_notlari: analiz.mutfak_notlari,
          urunler_json: analiz.urunler,
          ozel_istekler: analiz.ozel_istekler
        })
        .eq('id', sesli_siparis_id)
        .eq('restoran_id', restoran_id)
    }

    return NextResponse.json({
      success: true,
      analiz,
      original_text: transcribed_text
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
