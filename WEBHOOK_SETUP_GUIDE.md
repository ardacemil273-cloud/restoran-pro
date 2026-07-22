# 🚀 Yemeksepeti Webhook Kurulum ve Test Rehberi

## 📱 Uygulamaya Erişim

Uygulamaya buradan erişebilirsin:
**🔗 https://3000-id2yrnmush2yfzcu1nce7-9d4b8ebd.sg1.manus.computer**

Yemeksepeti Siparişleri sayfasına gitmek için:
**🔗 https://3000-id2yrnmush2yfzcu1nce7-9d4b8ebd.sg1.manus.computer/yemeksepeti-siparisler**

---

## 🔑 Webhook URL'si

Yemeksepeti panelinde kullanacağın webhook URL'si:

```
https://3000-id2yrnmush2yfzcu1nce7-9d4b8ebd.sg1.manus.computer/api/yemeksepeti/webhook
```

> **Not:** Uygulamaya gidip "Webhook Konfigürasyonu" kartında "Göster" butonuna tıklayarak URL'yi kopyalayabilirsin.

---

## 📋 Adım Adım Webhook Bağlantısı

### 1️⃣ Yemeksepeti İşletme Paneline Giriş Yap

1. https://www.yemeksepeti.com adresine git
2. İşletme paneline giriş yap
3. Ayarlar → Entegrasyonlar → Webhook bölümüne git

### 2️⃣ Webhook URL'sini Ekle

1. Webhook URL'sini kopyala (yukarıdaki URL'yi kullan)
2. Yemeksepeti panelinde "Webhook URL" alanına yapıştır
3. "Kaydet" butonuna tıkla

### 3️⃣ Webhook Secret'ı Kaydet

1. Yemeksepeti webhook secret'ını kopyala
2. Bunu not et (opsiyonel olarak güvenlik için kullanılır)

---

## 🧪 Test Adımları

### Seçenek 1: Uygulamadaki Test JSON'ı Kullan

1. Yemeksepeti Siparişleri sayfasına git
2. "Webhook Konfigürasyonu" kartını aç
3. Test JSON'ı kopyala
4. Terminal'de aşağıdaki komutu çalıştır:

```bash
curl -X POST https://3000-id2yrnmush2yfzcu1nce7-9d4b8ebd.sg1.manus.computer/api/yemeksepeti/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "YS-123456",
    "customer_name": "Test Müşteri",
    "customer_phone": "+905551234567",
    "items": [
      {"name": "Döner", "quantity": 2, "price": 50}
    ],
    "total_price": 100,
    "delivery_address": "Test Adresi",
    "notes": "Test notu"
  }'
```

### Seçenek 2: Postman ile Test

1. Postman'ı aç
2. Yeni bir POST request oluştur
3. URL'yi gir: `https://3000-id2yrnmush2yfzcu1nce7-9d4b8ebd.sg1.manus.computer/api/yemeksepeti/webhook`
4. Headers'a ekle:
   - Key: `Content-Type`
   - Value: `application/json`
5. Body'ye (raw, JSON) aşağıdakini yapıştır:

```json
{
  "order_id": "YS-123456",
  "customer_name": "Test Müşteri",
  "customer_phone": "+905551234567",
  "items": [
    {"name": "Döner", "quantity": 2, "price": 50}
  ],
  "total_price": 100,
  "delivery_address": "Test Adresi",
  "notes": "Test notu"
}
```

6. "Send" butonuna tıkla
7. Başarılı yanıt almalısın:

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

### Seçenek 3: JavaScript ile Test

```javascript
const webhookUrl = 'https://3000-id2yrnmush2yfzcu1nce7-9d4b8ebd.sg1.manus.computer/api/yemeksepeti/webhook';

const testOrder = {
  order_id: 'YS-' + Date.now(),
  customer_name: 'Test Müşteri',
  customer_phone: '+905551234567',
  items: [
    { name: 'Döner', quantity: 2, price: 50 }
  ],
  total_price: 100,
  delivery_address: 'Test Adresi',
  notes: 'Test notu'
};

fetch(webhookUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(testOrder)
})
.then(res => res.json())
.then(data => console.log('Başarılı:', data))
.catch(err => console.error('Hata:', err));
```

---

## ✅ Test Sonucu Kontrol

### Başarılı Test İçin:

1. Webhook URL'sinde HTTP 200 yanıtı almalısın
2. Yemeksepeti Siparişleri sayfasını yenile (F5)
3. Test siparişi "Yeni" durumunda görünmelidir
4. Sipariş detaylarında:
   - Müşteri adı: "Test Müşteri"
   - Telefon: "+905551234567"
   - Tutar: "100 ₺"
   - Ürünler: "Döner x2"

### Başarısız Test İçin:

| Hata | Çözüm |
|------|-------|
| 404 Not Found | Webhook URL'sini kontrol et, uygulamanın çalışıp çalışmadığını kontrol et |
| 500 Internal Server Error | Server loglarını kontrol et, JSON formatını doğrula |
| Sipariş görünmüyor | Sayfayı yenile, browser cache'ini temizle |
| CORS hatası | Tarayıcı konsolunda hata mesajını kontrol et |

---

## 🔄 Gerçek Yemeksepeti Siparişleri Almak

### Yemeksepeti Panelinde Webhook Yapılandırması:

1. **Webhook URL:** 
   ```
   https://3000-id2yrnmush2yfzcu1nce7-9d4b8ebd.sg1.manus.computer/api/yemeksepeti/webhook
   ```

2. **Webhook Events:** Aşağıdakileri seç:
   - ✅ Yeni Sipariş
   - ✅ Sipariş Durumu Değişikliği
   - ✅ Sipariş İptal

3. **Test Gönder:** Yemeksepeti panelinde "Test Gönder" butonuna tıkla

4. **Webhook Logları:** Yemeksepeti panelinde webhook loglarını kontrol et

---

## 📊 Webhook İstek Formatı

Yemeksepeti'nin gönderdiği JSON formatı:

```json
{
  "order_id": "YS-123456789",
  "customer_name": "Ahmet Yılmaz",
  "customer_phone": "+905551234567",
  "items": [
    {
      "name": "Döner",
      "quantity": 2,
      "price": 50
    },
    {
      "name": "Ayran",
      "quantity": 1,
      "price": 10
    }
  ],
  "total_price": 110,
  "delivery_address": "Ankara, Çankaya, Atatürk Cad. No:123",
  "notes": "Acı sosuz lütfen, ekstra turşu",
  "restoran_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

---

## 🔐 Güvenlik Kontrolleri

### Webhook Secret Doğrulaması (Opsiyonel)

Webhook'unda secret doğrulaması eklemek için:

```typescript
// app/api/yemeksepeti/webhook/route.ts

const webhookSecret = process.env.YEMEKSEPETI_WEBHOOK_SECRET;

if (webhook_secret !== webhookSecret) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

---

## 📱 Uygulamada Siparişleri Yönetme

### Sipariş Durumunu Değiştir:

1. Yemeksepeti Siparişleri sayfasında sipariş kartını bul
2. Aşağıdaki durumlardan birini seç:
   - **Yeni:** Yeni gelen sipariş
   - **Hazırlanıyor:** Sipariş hazırlanıyor
   - **Hazır:** Sipariş hazır
   - **Teslim Edildi:** Sipariş teslim edildi
   - **İptal:** Sipariş iptal edildi

### Siparişi Sil:

1. Sipariş kartının sağ tarafında çöp kutusu ikonuna tıkla
2. Onay ver

---

## 🔍 Sorun Giderme

### Problem: Webhook alınmıyor

**Çözüm:**
1. Webhook URL'sinin doğru olduğunu kontrol et
2. Uygulamanın çalışıp çalışmadığını kontrol et: `curl https://3000-id2yrnmush2yfzcu1nce7-9d4b8ebd.sg1.manus.computer`
3. Yemeksepeti panelinde webhook loglarını kontrol et
4. Firewall/proxy ayarlarını kontrol et

### Problem: 404 hatası alıyorum

**Çözüm:**
1. Webhook URL'sini kontrol et
2. Uygulamanın çalışıp çalışmadığını kontrol et
3. `/api/yemeksepeti/webhook` dosyasının var olduğunu kontrol et

### Problem: Duplicate siparişler alıyorum

**Çözüm:**
- Sistem otomatik olarak duplicate siparişleri engeller
- Aynı `order_id` ile gelen siparişler kaydedilmez

### Problem: Siparişler görünmüyor

**Çözüm:**
1. Sayfayı yenile (F5)
2. Browser cache'ini temizle (Ctrl+Shift+Delete)
3. Supabase'de `yemeksepeti_siparisler` tablosunu kontrol et

---

## 📞 Destek

Sorunlarla karşılaşırsan:

1. **Browser Console:** F12 → Console sekmesinde hata mesajlarını kontrol et
2. **Server Logs:** Terminal'de npm run dev çıktısını kontrol et
3. **Supabase:** Supabase Dashboard'da tablolara bak

---

## 🎯 Sonraki Adımlar

1. ✅ Webhook'u test et
2. ✅ Yemeksepeti panelinde webhook'u aktif et
3. ✅ Gerçek siparişler almaya başla
4. 🔄 Sipariş durumlarını güncelle
5. 📊 Raporları takip et

---

**Başarılar knk! 🚀**
