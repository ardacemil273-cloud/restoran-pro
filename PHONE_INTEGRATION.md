# 📞 Telefon Arama Entegrasyonu - Restoran Pro

## Genel Bakış

Restoran Pro'ya telefon arama entegrasyonu eklendi! Artık müşteriler sizi aradığında, sistem otomatik olarak:

- ✅ Arayan numarayı kaydeder
- ✅ Mevcut müşteri veritabanında arar
- ✅ Yeni müşteri oluşturur (gerekirse)
- ✅ Arama geçmişini tutar
- ✅ Aramalar sayfasında gösterir

---

## Teknik Altyapı

### API Endpoint

```
POST /api/phone-webhook
```

### Request Format

```json
{
  "from": "+905551234567",
  "to": "+905559876543",
  "timestamp": "2024-01-15T10:30:00Z",
  "duration": 120,
  "status": "completed",
  "restoran_id": "uuid-optional",
  "system": "twilio"
}
```

### Response

```json
{
  "success": true,
  "message": "Arama başarıyla kaydedildi",
  "data": {
    "restoran_id": "uuid",
    "musteri_id": "uuid-or-null",
    "arayan_numara": "5551234567",
    "durum": "completed"
  }
}
```

---

## Kurulum Adımları

### 1. Veritabanı Tablosu Oluşturma

Supabase SQL Editor'de çalıştırın:

```sql
CREATE TABLE arama_kayitlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  musteri_id BIGINT REFERENCES musteriler(id) ON DELETE SET NULL,
  arayan_numara VARCHAR(20) NOT NULL,
  alici_numara VARCHAR(20) NOT NULL,
  arama_tarihi TIMESTAMP NOT NULL DEFAULT NOW(),
  sure INTEGER DEFAULT 0,
  durum VARCHAR(50) DEFAULT 'completed',
  kaynak_sistem VARCHAR(50) DEFAULT 'webhook',
  created_at TIMESTAMP DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_arama_kayitlari_restoran ON arama_kayitlari(restoran_id);
CREATE INDEX idx_arama_kayitlari_musteri ON arama_kayitlari(musteri_id);
CREATE INDEX idx_arama_kayitlari_numara ON arama_kayitlari(arayan_numara);
CREATE INDEX idx_arama_kayitlari_tarih ON arama_kayitlari(arama_tarihi);
```

### 2. Twilio Entegrasyonu (Örnek)

**Twilio Webhook URL:**
```
https://your-domain.com/api/phone-webhook
```

**Twilio Studio Flow Setup:**

1. Twilio Console → Phone Numbers → Active Numbers
2. Incoming Calls → Webhook URL'i ayarla
3. HTTP POST seçin
4. URL: `https://your-domain.com/api/phone-webhook`

**Twilio Request Mapping:**

Twilio'dan gelen verileri dönüştürmek için webhook öncesi bir Function kullanın:

```javascript
exports.handler = async function(context, event, callback) {
  const client = context.getTwilioClient();
  
  const payload = {
    from: event.From,
    to: event.To,
    timestamp: new Date().toISOString(),
    duration: event.CallDuration || 0,
    status: event.CallStatus || 'completed',
    system: 'twilio'
  };

  // Restoran Pro webhook'a gönder
  const fetch = require('node-fetch');
  const response = await fetch('https://your-domain.com/api/phone-webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  callback(null, response.json());
};
```

### 3. Asterisk/FreePBX Entegrasyonu

**FreePBX Webhook Ayarı:**

1. Admin → Connectivity → Webhooks
2. Yeni webhook oluştur
3. URL: `https://your-domain.com/api/phone-webhook`
4. Method: POST
5. Trigger: Call Ended

**FreePBX Script Örneği:**

```bash
#!/bin/bash
# /usr/local/bin/call-webhook.sh

FROM=$1
TO=$2
DURATION=$3
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

curl -X POST https://your-domain.com/api/phone-webhook \
  -H "Content-Type: application/json" \
  -d "{
    \"from\": \"$FROM\",
    \"to\": \"$TO\",
    \"timestamp\": \"$TIMESTAMP\",
    \"duration\": $DURATION,
    \"status\": \"completed\",
    \"system\": \"freepbx\"
  }"
```

### 4. Özel VoIP Sistemi Entegrasyonu

Herhangi bir VoIP sisteminizden webhook gönderebilirsiniz:

```bash
curl -X POST https://your-domain.com/api/phone-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+905551234567",
    "to": "+905559876543",
    "timestamp": "2024-01-15T10:30:00Z",
    "duration": 120,
    "status": "completed",
    "system": "custom-voip"
  }'
```

---

## Webhook Test Etme

### Test Endpoint

```
GET /api/phone-webhook?test=true
```

**Response:**
```json
{
  "status": "Webhook aktif ve çalışıyor ✓",
  "endpoint": "/api/phone-webhook",
  "method": "POST",
  "description": "Telefon arama webhook sistemi"
}
```

### cURL ile Test

```bash
curl -X POST http://localhost:3000/api/phone-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "from": "+905551234567",
    "to": "+905559876543",
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
    "duration": 120,
    "status": "completed",
    "system": "test"
  }'
```

---

## Arayüz Entegrasyonu

### Aramalar Sayfası

Sistem otomatik olarak arama kaydını `Aramalar` sayfasında gösterir:

- 📱 Arayan numarası
- ⏱️ Arama saati
- ⏳ Arama süresi
- 👤 Müşteri bilgisi (varsa)
- 🔗 Doğrudan sipariş oluşturma

### Müşteri Profili

Her müşterinin arama geçmişi görülebilir:

- Tüm aramaları listesi
- Toplam arama sayısı
- Son arama tarihi
- Arama süresi istatistikleri

---

## Güvenlik

### API Güvenliği

1. **HTTPS Zorunlu** - Tüm webhook çağrıları HTTPS üzerinden olmalı
2. **Rate Limiting** - Çok fazla istek göndermeyin (max 100/dakika)
3. **Validation** - Tüm parametreler doğrulanır
4. **Error Handling** - Hatalı istekler 400/500 döner

### Veri Gizliliği

- Numaralar normalize edilir (sadece rakamlar)
- Kişisel veriler Supabase'de şifreli tutulur
- GDPR uyumlu veri saklama

---

## Sorun Giderme

### "Restoran bulunamadı" Hatası

**Çözüm:** Restoran ID'sini webhook'a ekleyin:

```json
{
  "from": "+905551234567",
  "to": "+905559876543",
  "restoran_id": "your-restoran-uuid",
  "system": "twilio"
}
```

### Müşteri Otomatik Oluşturulmadı

**Sebep:** Arama `completed` durumunda değil veya süresi 0

**Çözüm:** Webhook'ta `status: "completed"` ve `duration > 0` olduğundan emin olun

### Webhook Çağrısı Başarısız

**Debug:** Test endpoint'i kontrol edin:

```bash
curl https://your-domain.com/api/phone-webhook?test=true
```

---

## İleri Özellikler (Gelecek)

- 🤖 AI destekli müşteri tanıma
- 📊 Arama analitikleri
- 🔔 Canlı arama bildirimleri
- 📝 Otomatik arama notları
- 🎯 Arama yönlendirmesi

---

## Destek

Sorularınız için: support@restoranpro.com

Webhook testi: `GET /api/phone-webhook?test=true`
