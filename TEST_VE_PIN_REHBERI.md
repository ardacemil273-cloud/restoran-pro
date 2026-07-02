# 🧪 Test Paneli ve PIN Kodu Sistemi Rehberi

## 📋 İçindekiler
1. [Webhook Test Etme](#webhook-test-etme)
2. [PIN Kodu Sistemi](#pin-kodu-sistemi)
3. [Garson vs Yönetici Paneli](#garson-vs-yönetici-paneli)
4. [Sorun Giderme](#sorun-giderme)

---

## 🧪 Webhook Test Etme

### Test Paneline Nasıl Gidilir?
1. Uygulamada **Ayarlar** → **Test Paneli** (veya doğrudan `/test-panel`)
2. Webhook Simulator bölümünü göreceksin

### Test Webhook'ları Gönderme

#### 1️⃣ Yeni Sipariş Test Et
```
1. "📦 Yeni Sipariş" butonuna tıkla
2. Yeşil başarı mesajı görürsen, webhook gönderildi ✅
3. Siparişler sayfasına git → "Yemeksepeti Siparişleri" sekmesi
4. Test siparişini görebilirsin
```

**Gönderilen Veri:**
```json
{
  "event": "order.created",
  "chain_id": "test-chain-xxx",
  "vendor_id": "test-vendor-xxx",
  "data": {
    "order_id": "test-order-123",
    "order_number": "TEST-001",
    "status": "PENDING",
    "total_amount": 150.00,
    "currency": "TRY",
    "customer": {
      "name": "Test Müşteri",
      "phone": "+905551234567",
      "email": "test@example.com"
    },
    "items": [
      {
        "name": "Test Köfte",
        "quantity": 2,
        "unit_price": 75,
        "total": 150
      }
    ]
  }
}
```

#### 2️⃣ Sipariş Güncelleme Test Et
```
1. "🔄 Sipariş Güncelle" butonuna tıkla
2. Sipariş durumu "PREPARING" olarak güncellenir
```

#### 3️⃣ Sipariş İptal Test Et
```
1. "❌ Sipariş İptal" butonuna tıkla
2. Sipariş durumu "CANCELLED" olarak işaretlenir
```

### Webhook Loglarını Kontrol Et
1. **Ayarlar** → **Webhook Logları**
2. Tüm webhook'ları ve hataları görebilirsin
3. Başarılı/başarısız işlemleri kontrol et

### cURL ile Test Etme (Gelişmiş)
```bash
# Yeni sipariş test et
curl -X POST https://YOUR_DOMAIN/api/test/webhook-simulator \
  -H "Content-Type: application/json" \
  -d '{
    "action": "order_created",
    "chain_id": "test-chain-123",
    "vendor_id": "test-vendor-123"
  }'

# Sipariş güncelleme test et
curl -X POST https://YOUR_DOMAIN/api/test/webhook-simulator \
  -H "Content-Type: application/json" \
  -d '{
    "action": "order_updated",
    "chain_id": "test-chain-123",
    "vendor_id": "test-vendor-123"
  }'
```

---

## 🔐 PIN Kodu Sistemi

### PIN Nedir?
- **4 haneli sayısal kod** (0000-9999)
- Garsonlar ve çalışanlar bunu kullanarak giriş yapar
- Her giriş loglanır ve izlenir
- 30 dakika sonra oturum otomatik kapanır

### PIN Oluşturma (Yönetici)

#### 1️⃣ Garson Ekle
1. **Ayarlar** → **Garson Yönetimi** → **Yeni Garson Ekle**
2. Garson bilgilerini doldur:
   - **Ad**: Garsonun adı
   - **Telefon**: İletişim numarası
   - **Rol**: Garson / Mutfak / Kurye
   - **PIN Kodu**: 4 haneli kod (örn: 1234)
3. **Kaydet** butonuna tıkla

#### 2️⃣ PIN Kodunu Değiştir
1. **Ayarlar** → **Garson Yönetimi**
2. Garsonun satırında **Düzenle** butonuna tıkla
3. PIN kodunu değiştir
4. **Kaydet** butonuna tıkla

### PIN ile Giriş Yapma (Garson)

#### 1️⃣ Uygulamayı Aç
1. Uygulamaya gir
2. PIN giriş modalı otomatik açılır

#### 2️⃣ PIN Kodunu Gir
1. Numara tuşlarını tıklayarak PIN'i gir (örn: 1-2-3-4)
2. Ekranda ● sembolü görürsen, doğru giriş yapıyorsun
3. **Giriş Yap** butonuna tıkla

#### 3️⃣ Başarılı Giriş
```
✅ Hoş geldin, Ahmet!
```

### PIN Oturumu
- **Süre**: 30 dakika
- **Otomatik Kapanma**: 30 dakika inaktivite sonrası
- **Manuel Kapanma**: Ayarlar → Oturumu Kapat

### PIN Hataları

| Hata | Çözüm |
|------|-------|
| "PIN kodu yanlış" | PIN'i kontrol et, doğru mu? |
| "Oturum süresi doldu" | Yeniden PIN gir |
| "PIN kodu 4 haneli olmalı" | Tam 4 haneli gir |

---

## 👥 Garson vs Yönetici Paneli

### Yönetici Paneli (Restoran Sahibi)
**Erişim**: Tüm özellikler

| Özellik | Erişim |
|---------|--------|
| Dashboard | ✅ Tam |
| Siparişler | ✅ Tam |
| Menü Yönetimi | ✅ Tam |
| Yemeksepeti Entegrasyonu | ✅ Tam |
| Webhook Ayarları | ✅ Tam |
| Garson Yönetimi | ✅ Tam |
| Raporlar | ✅ Tam |
| Ayarlar | ✅ Tam |

### Garson Paneli (Çalışan)
**Erişim**: Sınırlı (PIN ile)

| Özellik | Erişim |
|---------|--------|
| Siparişleri Görüntüle | ✅ Evet |
| Sipariş Durumunu Güncelle | ✅ Evet |
| Masa Haritası | ✅ Evet |
| Mutfak Ekranı | ✅ Evet |
| Kasa | ✅ Evet |
| Menü Yönetimi | ❌ Hayır |
| Yemeksepeti Ayarları | ❌ Hayır |
| Raporlar | ❌ Hayır |
| Ayarlar | ❌ Hayır |

### Rol Atama
```
Yönetici (Admin)
  ├─ Tüm ayarları kontrol eder
  ├─ Garsonları yönetir
  └─ Raporları görüntüler

Garson
  ├─ Siparişleri alır
  ├─ Durumları günceller
  └─ PIN ile giriş yapar

Mutfak
  ├─ Siparişleri hazırlar
  └─ Durumları günceller

Kurye
  ├─ Teslimat siparişlerini alır
  └─ Durumları günceller
```

---

## 📊 PIN Logları

### PIN Giriş Loglarını Kontrol Et
1. **Ayarlar** → **Güvenlik** → **PIN Giriş Logları**
2. Tüm PIN giriş denemelerini görebilirsin:
   - ✅ Başarılı girişler
   - ❌ Başarısız girişler
   - 🕐 Giriş saati
   - 👤 Hangi garson

### Örnek Log
```
2026-07-02 14:30:00 | Ahmet | PIN: 1234 | ✅ Başarılı
2026-07-02 14:29:45 | Fatih | PIN: 5678 | ❌ Yanlış
2026-07-02 14:29:30 | Ayşe  | PIN: 1234 | ✅ Başarılı
```

---

## 🔧 Sorun Giderme

### Webhook Test Başarısız
```
❌ Hata: "Restoran bulunamadı"
→ Chain ID ve Vendor ID'yi kontrol et
→ Yemeksepeti bağlantısını kontrol et
```

### PIN Giriş Başarısız
```
❌ Hata: "PIN kodu yanlış"
→ PIN'i kontrol et
→ Caps Lock açık mı?
→ Garson aktif mi?
```

### Webhook Logları Boş
```
❌ Webhook logları görünmüyor
→ Webhook gönderildi mi?
→ Restoran ID doğru mu?
→ Supabase bağlantısı aktif mi?
```

### Oturum Kapanmıyor
```
❌ Oturum 30 dakikadan sonra kapanmıyor
→ Sayfayı yenile
→ Tarayıcı cache'ini temizle
→ Yeniden PIN gir
```

---

## 📚 API Endpoint'leri

### PIN Doğrulama
```
POST /api/auth/pin
Content-Type: application/json

{
  "action": "verify",
  "restoran_id": "uuid",
  "pin_kodu": "1234"
}

Yanıt:
{
  "success": true,
  "session_token": "xxx",
  "garson": {
    "id": "uuid",
    "ad": "Ahmet",
    "rol": "garson"
  }
}
```

### Oturum Kontrol
```
GET /api/auth/pin?restoran_id=uuid
Headers:
  x-session-token: xxx

Yanıt:
{
  "success": true,
  "session": {
    "garson": {...},
    "kalan_sure_dakika": 25
  }
}
```

### Webhook Simulator
```
POST /api/test/webhook-simulator
Content-Type: application/json

{
  "action": "order_created",
  "chain_id": "test-chain-123",
  "vendor_id": "test-vendor-123"
}
```

---

## ✨ En İyi Uygulamalar

1. **PIN Güvenliği**
   - ✅ PIN'i kimseyle paylaşma
   - ✅ Düzenli olarak PIN'i değiştir
   - ✅ Zayıf PIN'ler kullanma (1111, 1234 vb.)

2. **Test Etme**
   - ✅ Canlıya geçmeden test panelinde test et
   - ✅ Tüm webhook türlerini test et
   - ✅ Webhook loglarını kontrol et

3. **Garson Yönetimi**
   - ✅ Her garson için farklı PIN kodu
   - ✅ Garson ayrıldığında PIN'i deaktif et
   - ✅ Düzenli olarak garson listesini kontrol et

---

## 🎯 Hızlı Başlangıç

### 5 Dakikada Kurulum
1. **Garson Ekle**: Ayarlar → Garson Yönetimi → Yeni Garson
2. **PIN Belirle**: 4 haneli kod gir
3. **Test Et**: Test Paneli → "Yeni Sipariş" butonuna tıkla
4. **Kontrol Et**: Siparişler sayfasında test siparişini gör
5. **Canlıya Al**: Yemeksepeti webhook URL'sini ayarla

---

**Sorular?** Detaylı rehberler için:
- `YEMEKSEPETI_KURULUM_REHBERI.md` - Yemeksepeti entegrasyonu
- `UYGULAMA_OZELLIKLERI.md` - Genel özellikler
- `CALLER_ID_SETUP.md` - Arayan numara tanıma

---

**Son Güncelleme**: 2 Temmuz 2026
