# 🍽️ Yemeksepeti Entegrasyonu - Test Rehberi

Bu rehber, Yemeksepeti entegrasyonunu adım adım test etmek için yazılmıştır.

## 📋 Genel Akış

```
Yemeksepeti Siparişi → Webhook → Supabase → Sistem Bildirimleri → Mutfak Ekranı
```

---

## ✅ Adım 1: API Anahtarını Ayarla

### 1.1 Yemeksepeti Partner Portal'a Gir
- https://partner.yemeksepeti.com adresine git
- Hesabına giriş yap

### 1.2 API Ayarlarını Bul
1. **Ayarlar** menüsüne tıkla
2. **API & Webhook** bölümünü aç
3. **API Anahtarı** kısmında senin API Key'ini kopyala

### 1.3 Restoran Pro'ya API Anahtarını Ekle
1. Restoran Pro'da **Yemeksepeti** menüsüne tıkla
2. **API Anahtarı** alanına yapıştır
3. **Kaydet** butonuna tıkla
4. ✅ "Yemeksepeti entegrasyonu aktif" mesajını görmelisin

---

## 🔗 Adım 2: Webhook URL'sini Ayarla

### 2.1 Webhook URL'sini Kopyala
1. Yemeksepeti ayarları sayfasında **Webhook URL** alanını bul
2. **Kopyala** butonuna tıkla (otomatik olarak panoya kopyalanır)

### 2.2 Yemeksepeti Partner Portal'da Webhook Ayarla
1. Yemeksepeti Partner Portal'a git
2. **Ayarlar → API & Webhook** bölümüne tıkla
3. **Webhook URL** alanına yapıştır
4. **Event'leri Seç** - Aşağıdaki seçenekleri işaretle:
   - ✅ `order.created` (Sipariş oluşturuldu)
   - ✅ `order.accepted` (Sipariş kabul edildi)
   - ✅ `order.completed` (Sipariş tamamlandı)
   - ✅ `order.cancelled` (Sipariş iptal edildi) - Opsiyonel
5. **Kaydet** butonuna tıkla

### 2.3 Test Gönder
Yemeksepeti Partner Portal'da "Test Webhook" butonuna tıkla. Restoran Pro'da test siparişini görebilirsin.

---

## 🧪 Adım 3: Manuel Test Siparişi Gönder

### 3.1 Curl ile Test (Terminal/Command Line)

```bash
curl -X POST https://restoran-pro.vercel.app/api/yemeksepeti/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "TEST-001",
    "customer_name": "Test Kullanıcı",
    "customer_phone": "05551112233",
    "items": [
      {
        "name": "Adana Kebap",
        "quantity": 2,
        "price": 250
      },
      {
        "name": "Ayran",
        "quantity": 2,
        "price": 40
      }
    ],
    "total_price": 580,
    "delivery_address": "Test Mahallesi, Deneme Sokak, No: 1, İstanbul",
    "notes": "Lütfen acı bol olsun"
  }'
```

### 3.2 Postman ile Test

1. **Postman** uygulamasını aç (https://www.postman.com/downloads/)
2. **+ New** → **HTTP Request** seç
3. Aşağıdaki ayarları yap:
   - **Method**: POST
   - **URL**: `https://restoran-pro.vercel.app/api/yemeksepeti/webhook`
   - **Headers**: `Content-Type: application/json`
   - **Body** (raw, JSON):
   ```json
   {
     "order_id": "TEST-001",
     "customer_name": "Test Kullanıcı",
     "customer_phone": "05551112233",
     "items": [
       {
         "name": "Adana Kebap",
         "quantity": 2,
         "price": 250
       }
     ],
     "total_price": 250,
     "delivery_address": "Test Mahallesi",
     "notes": "Test siparişi"
   }
   ```
4. **Send** butonuna tıkla
5. Yanıt olarak `{"success": true}` görmelisin

### 3.3 JavaScript ile Test (Browser Console)

```javascript
fetch('/api/yemeksepeti/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    order_id: 'TEST-' + Date.now(),
    customer_name: 'Test Kullanıcı',
    customer_phone: '05551112233',
    items: [{ name: 'Adana Kebap', quantity: 1, price: 250 }],
    total_price: 250,
    delivery_address: 'Test Mahallesi',
    notes: 'Test siparişi'
  })
})
.then(r => r.json())
.then(d => console.log('✅ Başarılı:', d))
.catch(e => console.error('❌ Hata:', e))
```

---

## 📱 Adım 4: Siparişleri Takip Et

### 4.1 Yemeksepeti Siparişleri Sayfasında Kontrol Et
1. Restoran Pro'da **Yemeksepeti** menüsüne tıkla
2. Gönderdiğin test siparişini görebilirsin
3. Sipariş kartında:
   - Müşteri adı
   - Telefon numarası
   - Teslimat adresi
   - Ürünler listesi
   - Sipariş durumu

### 4.2 Mutfak Ekranında Kontrol Et
1. **Mutfak Ekranı** sayfasına git
2. Yemeksepeti siparişleri orada da görünmelidir
3. Sesli uyarı çalmalı (eğer etkinse)

### 4.3 Bildirim Kontrolü
- **Browser Bildirimi**: Eğer PWA yüklüyse, tarayıcı bildirimi almalısın
- **Mobil Bildirim**: Telefonun PWA uygulamasında bildirim almalısın

---

## 🔍 Adım 5: Sorun Giderme

### Problem: Webhook Yanıt Vermiyor
**Çözüm:**
1. Webhook URL'sinin doğru olduğunu kontrol et
2. Vercel deployment'ının başarılı olduğunu kontrol et
3. Browser console'da hata var mı diye kontrol et (F12)
4. Supabase logs'unu kontrol et

### Problem: Siparişler Görünmüyor
**Çözüm:**
1. API anahtarının doğru olduğunu kontrol et
2. Yemeksepeti webhook event'lerinin seçili olduğunu kontrol et
3. Supabase connection'ının aktif olduğunu kontrol et
4. Veritabanında `yemeksepeti_siparisler` tablosunun var olduğunu kontrol et

### Problem: Bildirim Gelmiyor
**Çözüm:**
1. PWA uygulamasının yüklü olduğunu kontrol et
2. Tarayıcı bildirim izinlerini kontrol et (Settings → Notifications)
3. Service Worker'ın kayıtlı olduğunu kontrol et (DevTools → Application → Service Workers)

---

## 📊 Test Senaryoları

### Senaryo 1: Basit Sipariş
```json
{
  "order_id": "SCENARIO-1",
  "customer_name": "Ahmet Yılmaz",
  "customer_phone": "05551234567",
  "items": [
    { "name": "Döner", "quantity": 1, "price": 150 }
  ],
  "total_price": 150,
  "delivery_address": "Beşiktaş, İstanbul",
  "notes": ""
}
```

### Senaryo 2: Çoklu Ürün
```json
{
  "order_id": "SCENARIO-2",
  "customer_name": "Fatma Kaya",
  "customer_phone": "05559876543",
  "items": [
    { "name": "Adana Kebap", "quantity": 2, "price": 250 },
    { "name": "Ayran", "quantity": 2, "price": 40 },
    { "name": "Salata", "quantity": 1, "price": 50 }
  ],
  "total_price": 630,
  "delivery_address": "Kadıköy, İstanbul",
  "notes": "Acı bol, soğan az"
}
```

### Senaryo 3: Özel İstekler
```json
{
  "order_id": "SCENARIO-3",
  "customer_name": "Mehmet Demir",
  "customer_phone": "05552223333",
  "items": [
    { "name": "Pide", "quantity": 1, "price": 80 }
  ],
  "total_price": 80,
  "delivery_address": "Taksim, İstanbul",
  "notes": "Kapıyı çalmayın, mesaj atın. Allerjim var: yer fıstığı"
}
```

---

## 🚀 Canlı Ortamda Kullanım

### Gerçek Yemeksepeti Siparişlerini Almak İçin:

1. **API Anahtarını Yemeksepeti'nden Al**
   - Yemeksepeti Partner Portal → Ayarlar → API Anahtarı

2. **Webhook URL'sini Yemeksepeti'ye Kaydet**
   - Yemeksepeti Partner Portal → Webhook Ayarları
   - URL: `https://restoran-pro.vercel.app/api/yemeksepeti/webhook`

3. **Event'leri Seç**
   - order.created
   - order.accepted
   - order.completed

4. **Test Et**
   - Yemeksepeti'de test siparişi gönder
   - Restoran Pro'da görünüp görünmediğini kontrol et

---

## 📞 Destek

Sorun yaşıyorsan:
1. Browser console'da (F12) hata mesajlarını kontrol et
2. Supabase dashboard'da logs'u kontrol et
3. Webhook endpoint'inin çalışıp çalışmadığını kontrol et

---

## ✨ Başarı Göstergeleri

✅ Yemeksepeti siparişleri otomatik olarak sisteme düşüyor
✅ Siparişler "Yemeksepeti Siparişleri" sayfasında görünüyor
✅ Siparişler Mutfak Ekranında görünüyor
✅ Sesli uyarı çalıyor
✅ Push bildirimleri geliyor
✅ Sipariş durumu güncelleniyor

Tüm bunları gördüğünde, entegrasyon başarıyla tamamlanmıştır! 🎉
