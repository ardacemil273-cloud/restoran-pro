# 📞 Telefon Entegrasyonu Kurulum Rehberi

Restoran Pro, VoIP/telefon sistemlerinizden gelen aramaları otomatik olarak kaydedebilir. Bu sayede müşteri numarasını sisteme girmeden, aramanız geldiğinde müşteri bilgileri otomatik ekrana gelir.

---

## 🔧 Nasıl Çalışır?

1. **Müşteri sizi arar** → VoIP sisteminiz (Twilio, Asterisk, FreePBX vb.) webhook gönderir
2. **Sistem otomatik kaydeder** → `arama_kayitlari` tablosuna düşer
3. **Müşteri tanınır** → Kayıtlı müşteri ise profili gösterilir, değilse otomatik oluşturulur
4. **Aramalar sayfasında görünür** → "Otomatik Kayıtlar" sekmesinde listelenir

---

## 🗄️ Veritabanı Kurulumu

Supabase SQL editöründe aşağıdaki migration'ı çalıştırın (veya `supabase/migrations/20260629200000_create_arama_kayitlari_table.sql` dosyasını uygulayın):

```sql
CREATE TABLE IF NOT EXISTS arama_kayitlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  musteri_id BIGINT REFERENCES musteriler(id) ON DELETE SET NULL,
  arayan_numara VARCHAR(20) NOT NULL,
  alici_numara VARCHAR(20),
  arama_tarihi TIMESTAMPTZ DEFAULT NOW(),
  sure INTEGER DEFAULT 0,
  durum VARCHAR(50) DEFAULT 'completed',
  kaynak_sistem VARCHAR(50) DEFAULT 'webhook',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_arama_kayitlari_restoran ON arama_kayitlari(restoran_id, arama_tarihi DESC);
CREATE INDEX IF NOT EXISTS idx_arama_kayitlari_numara ON arama_kayitlari(restoran_id, arayan_numara);

-- RLS
ALTER TABLE arama_kayitlari ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restoran sahibi görebilir" ON arama_kayitlari FOR SELECT
  USING (restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid()));

CREATE POLICY "Service role ekleyebilir" ON arama_kayitlari FOR INSERT WITH CHECK (true);
```

---

## ⚙️ Restoran Telefon Numarası Ayarı

Webhook'un hangi restorana ait olduğunu otomatik belirleyebilmesi için:

1. **Ayarlar** sayfasına gidin (`/ayarlar`)
2. **İletişim Bilgileri** bölümünde **Restoran Telefonu** alanını doldurun
3. Kaydedin

Bu numara, gelen webhook'taki `to` alanıyla eşleştirilir ve restoran otomatik tanınır.

> **Alternatif:** Webhook isteğine `restoran_id` alanı ekleyerek de restoran belirtebilirsiniz.

---

## 🔐 Güvenlik (WEBHOOK_SECRET)

Webhook endpoint'ini güvence altına almak için:

1. Vercel/sunucu ortam değişkenlerine `WEBHOOK_SECRET=güçlü-bir-şifre` ekleyin
2. Telefon sisteminizin webhook isteğine `Authorization: Bearer güçlü-bir-şifre` header'ı ekleyin

> `WEBHOOK_SECRET` tanımlı değilse, endpoint herkese açık çalışır (geliştirme için uygundur).

---

## 📡 API Endpoint

### Webhook Gönderme

```
POST /api/phone-webhook
Authorization: Bearer <WEBHOOK_SECRET>  (opsiyonel)
Content-Type: application/json
```

**Request Body:**
```json
{
  "from": "+905551234567",
  "to": "+905559876543",
  "timestamp": "2024-01-15T10:30:00Z",
  "duration": 120,
  "status": "completed",
  "restoran_id": "uuid-opsiyonel",
  "system": "twilio"
}
```

**Durum Değerleri:**
| Değer | Açıklama |
|-------|----------|
| `completed` | Tamamlanan arama |
| `missed` | Cevapsız arama |
| `failed` | Başarısız arama |

**Başarılı Yanıt (201):**
```json
{
  "success": true,
  "message": "Arama başarıyla kaydedildi",
  "data": {
    "restoran_id": "...",
    "musteri_id": 123,
    "arayan_numara": "5551234567",
    "durum": "completed"
  }
}
```

### Test Endpoint

```
GET /api/phone-webhook?test=true
```

---

## 📱 Twilio Kurulumu

1. [Twilio Console](https://console.twilio.com) → Phone Numbers → Numaranızı seçin
2. **Voice & Fax** → **A Call Comes In** → **Webhook**
3. URL: `https://your-domain.vercel.app/api/phone-webhook`
4. Method: `HTTP POST`

**Twilio Webhook Format:**
Twilio form-encoded gönderir. Bir dönüştürücü middleware gerekebilir:

```javascript
// Twilio için örnek dönüştürücü
const body = {
  from: req.body.From,
  to: req.body.To,
  status: req.body.CallStatus === 'completed' ? 'completed' : 'missed',
  duration: parseInt(req.body.CallDuration || '0'),
  system: 'twilio'
}
```

---

## 📞 Asterisk / FreePBX Kurulumu

`/etc/asterisk/extensions.conf` dosyasına ekleyin:

```ini
[macro-webhook-notify]
exten => s,1,System(curl -s -X POST https://your-domain.vercel.app/api/phone-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${WEBHOOK_SECRET}" \
  -d '{"from":"${ARG1}","to":"${ARG2}","status":"completed","duration":${ARG3},"system":"asterisk"}')
```

**FreePBX Script Örneği:**

```bash
#!/bin/bash
# /usr/local/bin/call-webhook.sh

FROM=$1
TO=$2
DURATION=$3
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

curl -X POST https://your-domain.vercel.app/api/phone-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -d "{
    \"from\": \"$FROM\",
    \"to\": \"$TO\",
    \"timestamp\": \"$TIMESTAMP\",
    \"duration\": $DURATION,
    \"status\": \"completed\",
    \"system\": \"freepbx\"
  }"
```

---

## 🔍 Test Etme

```bash
# Endpoint durumu kontrolü
curl https://your-domain.vercel.app/api/phone-webhook?test=true

# Test arama kaydı gönderme
curl -X POST https://your-domain.vercel.app/api/phone-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -d '{
    "from": "+905551234567",
    "to": "+905559876543",
    "timestamp": "2024-01-15T10:30:00Z",
    "duration": 120,
    "status": "completed",
    "system": "test"
  }'
```

---

## 🖥️ Arayüz Kullanımı

### Manuel Arama Sekmesi
- Telefon numarasını girin → Müşteri otomatik aranır
- Kayıtlı müşteri bulunursa profil gösterilir
- Kayıtlı değilse "Müşteri Kaydet" veya "Yine de Sipariş Al" seçenekleri çıkar

### Otomatik Kayıtlar Sekmesi
- Webhook üzerinden gelen tüm aramalar listelenir
- Her kayıtta: arayan numara, müşteri adı (varsa), arama süresi, durum
- "Sipariş Al" butonu ile direkt paket sipariş sayfasına geçiş

---

## 🔧 Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| "Restoran bulunamadı" hatası | Ayarlar'dan restoran telefon numarasını kaydedin veya webhook'a `restoran_id` ekleyin |
| "Yetkisiz erişim" hatası | `WEBHOOK_SECRET` env değişkenini kontrol edin |
| Kayıtlar görünmüyor | `arama_kayitlari` tablosunun oluşturulduğunu kontrol edin |
| Müşteri tanınmıyor | Telefon numarasının normalize edilmiş formatta (son 10 hane) eşleştiğini kontrol edin |
| Müşteri otomatik oluşturulmadı | Webhook'ta `status: "completed"` ve `duration > 0` olduğundan emin olun |

---

## 🔒 Güvenlik Özeti

- ✅ HTTPS zorunlu (Vercel otomatik sağlar)
- ✅ `WEBHOOK_SECRET` ile isteğe bağlı kimlik doğrulama
- ✅ Tüm parametreler doğrulanır
- ✅ Telefon numaraları normalize edilir (sadece son 10 hane)
- ✅ RLS ile veri izolasyonu (her restoran sadece kendi verilerini görür)
- ✅ Service role key ile güvenli yazma
