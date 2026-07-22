# Yemeksepeti Entegrasyonu - Kapsamlı Rehber

## 📋 Genel Bakış

Bu rehber, Restoran Pro uygulamasında Yemeksepeti entegrasyonunun kurulumu, yapılandırması ve test edilmesi için adım adım talimatlar içerir.

## 🔧 Sistem Mimarisi

```
Yemeksepeti Platform
        ↓
   Webhook Event
        ↓
/api/yemeksepeti/webhook (POST)
        ↓
Supabase Database
        ↓
yemeksepeti_siparisler Table
        ↓
Realtime Notifications
```

## 📦 Veritabanı Şeması

### yemeksepeti_siparisler Tablosu

| Sütun | Tür | Açıklama |
|-------|-----|---------|
| id | UUID | Birincil anahtar |
| yemeksepeti_order_id | TEXT | Yemeksepeti siparişi ID'si |
| musteri_ad | TEXT | Müşteri adı |
| musteri_telefon | TEXT | Müşteri telefon numarası |
| urunler | JSONB | Sipariş ürünleri (JSON formatı) |
| toplam_tutar | NUMERIC | Toplam sipariş tutarı |
| teslimat_adresi | TEXT | Teslimat adresi |
| notlar | TEXT | Müşteri notları |
| durum | TEXT | Sipariş durumu (yeni, hazırlanıyor, hazır, teslim edildi, iptal) |
| restoran_id | UUID | Restoranın ID'si |
| durum_guncelleme_tarihi | TIMESTAMP | Son durum güncelleme zamanı |
| webhook_secret | TEXT | Webhook doğrulama secret'ı |
| created_at | TIMESTAMP | Oluşturulma zamanı |

### İndeksler

```sql
CREATE INDEX idx_yemeksepeti_order_id ON public.yemeksepeti_siparisler(yemeksepeti_order_id);
```

## 🔐 Row Level Security (RLS) Politikaları

### INSERT Policy (Webhook)
```sql
CREATE POLICY "Allow webhook insert" ON public.yemeksepeti_siparisler 
FOR INSERT WITH CHECK (true);
```

### SELECT Policy (Kimlik Doğrulanmış Kullanıcılar)
```sql
CREATE POLICY "Allow authenticated select" ON public.yemeksepeti_siparisler 
FOR SELECT TO authenticated USING (true);
```

## 🌐 API Endpoints

### 1. Webhook Endpoint (POST)

**URL:** `/api/yemeksepeti/webhook`

**İstek Gövdesi:**
```json
{
  "order_id": "YS-123456",
  "customer_name": "Ahmet Yılmaz",
  "customer_phone": "+905551234567",
  "items": [
    {
      "name": "Döner",
      "quantity": 2,
      "price": 50
    }
  ],
  "total_price": 100,
  "delivery_address": "Ankara, Çankaya, Atatürk Cad. No:123",
  "notes": "Acı sosuz lütfen",
  "restoran_id": "550e8400-e29b-41d4-a716-446655440000",
  "webhook_secret": "your_webhook_secret_here"
}
```

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "yemeksepeti_order_id": "YS-123456",
    "durum": "yeni",
    "created_at": "2026-07-02T10:30:00Z"
  }
}
```

**Hata Yanıtları:**
- 400: Gerekli parametreler eksik
- 401: Webhook secret doğrulaması başarısız
- 500: İşlem başarısız

### 2. Siparişleri Getirme (GET)

**URL:** `/api/yemeksepeti/webhook?limit=50&offset=0&durum=yeni`

**Parametreler:**
- `limit` (opsiyonel): Kaç sipariş getirileceği (varsayılan: 50)
- `offset` (opsiyonel): Başlangıç pozisyonu (varsayılan: 0)
- `durum` (opsiyonel): Sipariş durumu filtresi

**Başarılı Yanıt (200):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "yemeksepeti_order_id": "YS-123456",
      "musteri_ad": "Ahmet Yılmaz",
      "durum": "yeni",
      "toplam_tutar": 100,
      "created_at": "2026-07-02T10:30:00Z"
    }
  ],
  "count": 1
}
```

## 🔔 Bildirim Sistemi

### Bildirim API Endpoint (POST)

**URL:** `/api/notifications/send`

**İstek Gövdesi:**
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Yeni Yemeksepeti Siparişi!",
  "body": "Ahmet Yılmaz - 100 TL",
  "data": {
    "order_id": "550e8400-e29b-41d4-a716-446655440001",
    "type": "yemeksepeti_order"
  }
}
```

**Başarılı Yanıt (200):**
```json
{
  "success": true,
  "message": "Notification sent and saved",
  "subscription_count": 5
}
```

## 🚀 Kurulum Adımları

### 1. Supabase Konfigürasyonu

1. Supabase Dashboard'a gidin
2. SQL Editor'u açın
3. Aşağıdaki SQL komutlarını çalıştırın:

```sql
-- RLS'yi etkinleştir
ALTER TABLE public.yemeksepeti_siparisler ENABLE ROW LEVEL SECURITY;

-- INSERT politikası
CREATE POLICY "Allow webhook insert" ON public.yemeksepeti_siparisler 
FOR INSERT WITH CHECK (true);

-- SELECT politikası
CREATE POLICY "Allow authenticated select" ON public.yemeksepeti_siparisler 
FOR SELECT TO authenticated USING (true);

-- İndeks oluştur
CREATE INDEX idx_yemeksepeti_order_id ON public.yemeksepeti_siparisler(yemeksepeti_order_id);
```

### 2. Webhook URL Konfigürasyonu

1. Yemeksepeti İşletme Paneli'ne gidin
2. Ayarlar → Entegrasyonlar → Webhook
3. Webhook URL'sini ayarlayın:
   ```
   https://your-domain.com/api/yemeksepeti/webhook
   ```
4. Webhook secret'ı kaydedin

### 3. Environment Variables

`.env.local` dosyasına ekleyin:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
YEMEKSEPETI_WEBHOOK_SECRET=your_webhook_secret
```

## 🧪 Test Etme

### 1. Webhook Test

```bash
curl -X POST http://localhost:3000/api/yemeksepeti/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "TEST-001",
    "customer_name": "Test Müşteri",
    "customer_phone": "+905551234567",
    "items": [{"name": "Test Ürün", "quantity": 1, "price": 50}],
    "total_price": 50,
    "delivery_address": "Test Adresi",
    "notes": "Test notu"
  }'
```

### 2. Siparişleri Getirme

```bash
curl http://localhost:3000/api/yemeksepeti/webhook?limit=10&offset=0
```

### 3. Bildirim Gönderme

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Test Bildirim",
    "body": "Bu bir test bildirimidir"
  }'
```

## 🛡️ Güvenlik Önlemleri

### 1. Webhook Secret Doğrulaması

```typescript
if (webhook_secret !== process.env.YEMEKSEPETI_WEBHOOK_SECRET) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### 2. Duplicate Kontrol

```typescript
const { data: existingOrder } = await supabase
  .from('yemeksepeti_siparisler')
  .select('id')
  .eq('yemeksepeti_order_id', order_id)
  .single()

if (existingOrder) {
  return NextResponse.json({ success: true, message: 'Order already exists' }, { status: 200 })
}
```

### 3. Rate Limiting

Webhook endpoint'ine rate limiting eklemek için:

```typescript
// Middleware'de rate limiting
import rateLimit from 'express-rate-limit'

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100 // 15 dakikada maksimum 100 istek
})

app.post('/api/yemeksepeti/webhook', limiter, handler)
```

## 📊 Sipariş Durumları

| Durum | Açıklama |
|-------|---------|
| yeni | Yeni sipariş alındı |
| hazırlanıyor | Sipariş hazırlanıyor |
| hazır | Sipariş hazır |
| teslim_edildi | Sipariş teslim edildi |
| iptal | Sipariş iptal edildi |

## 🔄 Realtime Güncellemeler

Supabase Realtime kullanarak canlı güncellemeler:

```typescript
const channel = supabase
  .channel('yemeksepeti_siparisler')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'yemeksepeti_siparisler' },
    (payload) => {
      console.log('Yeni sipariş:', payload.new)
    }
  )
  .subscribe()
```

## 🐛 Sorun Giderme

### Problem: Webhook alınmıyor

**Çözüm:**
1. Webhook URL'sinin doğru olduğunu kontrol edin
2. Firewall/proxy ayarlarını kontrol edin
3. Server loglarını kontrol edin

### Problem: Duplicate siparişler

**Çözüm:**
1. Duplicate kontrol mekanizması etkinleştirildi
2. `yemeksepeti_order_id` üzerinde unique index ekleyin:
   ```sql
   CREATE UNIQUE INDEX idx_yemeksepeti_order_id_unique 
   ON public.yemeksepeti_siparisler(yemeksepeti_order_id);
   ```

### Problem: RLS Hataları

**Çözüm:**
1. RLS politikalarının doğru ayarlandığını kontrol edin
2. Supabase Dashboard'da RLS durumunu kontrol edin
3. Politikaları yeniden oluşturmayı deneyin

## 📞 Destek

Sorunlarla karşılaşırsanız:
1. Logları kontrol edin
2. Webhook test endpoint'ini kullanın
3. Supabase Dashboard'da veritabanı durumunu kontrol edin

## 🔗 Faydalı Linkler

- [Yemeksepeti API Dokumentasyonu](https://www.yemeksepeti.com/api)
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
