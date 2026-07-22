# 🍽️ Yemeksepeti Entegrasyonu - İşletme Kurulum Rehberi

## 📋 Genel Bakış

Bu rehber, işletmenizin Yemeksepeti siparişlerini doğrudan Restoran Pro uygulamasına nasıl bağlayacağını adım adım anlatır.

Kurulum tamamlandıktan sonra:
- ✅ Yemeksepeti'deki siparişler otomatik olarak uygulamaya gelir
- ✅ Siparişleri uygulamadan yönetebilirsiniz
- ✅ Durum güncellemeleri otomatik olarak Yemeksepeti'ye geri gönderilir

---

## 🔑 Adım 1: Yemeksepeti Partner Portal'da API Anahtarlarını Oluştur

### 1.1 Yemeksepeti Partner Portal'a Gir
1. **https://partner.yemeksepeti.com** adresine git
2. Hesabınla giriş yap (admin hesabı olmalı)
3. **Ayarlar** → **Entegrasyonlar** → **API Anahtarları** bölümüne git

### 1.2 Yeni API Anahtarı Oluştur
1. **"Yeni API Anahtarı Oluştur"** butonuna tıkla
2. **Uygulama Adı**: "Restoran Pro"
3. **Açıklama**: "Sipariş yönetimi ve entegrasyonu"
4. **Scope'lar**: Aşağıdakileri seç:
   - ✅ `orders:read` - Siparişleri oku
   - ✅ `orders:write` - Siparişleri güncelle
   - ✅ `catalog:read` - Katalog oku
   - ✅ `catalog:write` - Katalog güncelle
5. **Oluştur** butonuna tıkla

### 1.3 Anahtarları Kopyala
Oluşturulan sayfada şu bilgileri kopyala ve güvenli bir yerde sakla:
- **Client ID** (örn: `abc123xyz789`)
- **Client Secret** (örn: `secret_abc123xyz789`)

⚠️ **ÖNEMLİ**: Client Secret'ı kimseyle paylaşma! Başkasına gösterme!

---

## 🔗 Adım 2: Restoran Pro'da Yemeksepeti Bağlantısını Kur

### 2.1 Uygulamaya Gir
1. Restoran Pro uygulamasını aç
2. **Ayarlar** → **Entegrasyonlar** → **Yemeksepeti** bölümüne git

### 2.2 Bağlantı Bilgilerini Gir
1. **Client ID** alanına kopyaladığın Client ID'yi yapıştır
2. **Client Secret** alanına kopyaladığın Client Secret'ı yapıştır
3. **Bağlan** butonuna tıkla

### 2.3 Yemeksepeti'den İzin Ver
1. Yemeksepeti'nin izin sayfasına yönlendirileceksin
2. **"Restoran Pro'ya İzin Ver"** butonuna tıkla
3. Başarılı mesajı görürsen, geri dön

### 2.4 Webhook URL'sini Kopyala
Bağlantı kurulduktan sonra, Restoran Pro'da şu URL'yi göreceksin:
```
https://YOUR_DOMAIN/api/yemeksepeti/webhook
```

Bu URL'yi kopyala (bir sonraki adımda kullanacağız).

---

## 🔔 Adım 3: Yemeksepeti'de Webhook'u Ayarla

### 3.1 Yemeksepeti Partner Portal'a Dön
1. https://partner.yemeksepeti.com adresine git
2. **Ayarlar** → **Webhooks** bölümüne git

### 3.2 Yeni Webhook Oluştur
1. **"Yeni Webhook Ekle"** butonuna tıkla
2. **Webhook URL**: Adım 2.4'te kopyaladığın URL'yi yapıştır
3. **Olaylar**: Aşağıdakileri seç:
   - ✅ `order.created` - Yeni sipariş
   - ✅ `order.updated` - Sipariş güncellendi
   - ✅ `order.cancelled` - Sipariş iptal edildi
4. **Kaydet** butonuna tıkla

### 3.3 Webhook'u Test Et
1. Webhook oluşturulduktan sonra **"Test Gönder"** butonuna tıkla
2. Restoran Pro'da **Ayarlar** → **Webhook Logları** bölümüne git
3. Test webhook'unu görebilirsen, başarılı demektir ✅

---

## ✅ Adım 4: Bağlantıyı Doğrula

### 4.1 Durum Kontrol Et
Restoran Pro'da:
1. **Ayarlar** → **Entegrasyonlar** → **Yemeksepeti**
2. **Bağlantı Durumu**: "✅ Aktif" görmeli
3. **Son Senkronizasyon**: Zamanı güncel olmalı

### 4.2 Test Siparişi Gönder
1. Yemeksepeti'de test siparişi oluştur
2. Restoran Pro'da **Siparişler** → **Yemeksepeti Siparişleri** sekmesine git
3. Test siparişini görebilirsen, entegrasyon başarılı ✅

---

## 🎯 Kullanım

### Yemeksepeti Siparişlerini Yönet
1. **Siparişler** sayfasına git
2. **Yemeksepeti Siparişleri** sekmesini seç
3. Siparişi görebilir ve durumunu güncelleyebilirsin:
   - **Hazırlanıyor** → Mutfakta hazırlanıyor
   - **Hazır** → Kurye alacak
   - **Tamamlandı** → Müşteriye teslim edildi
   - **İptal** → Sipariş iptal

### Sipariş Detaylarını Gör
- Müşteri adı ve telefonu
- Ürünler ve miktarları
- Teslimat adresi
- Toplam tutar

---

## 🔧 Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| "Bağlantı başarısız" hatası | Client ID ve Secret'ı kontrol et, doğru mu? |
| Webhook test başarısız | Webhook URL'sini kontrol et, doğru mu? |
| Siparişler gelmiyor | Yemeksepeti'de webhook aktif mi? |
| "Unauthorized" hatası | Client Secret'ı yenile ve tekrar dene |
| Durum güncellemeleri gönderilmiyor | Webhook aktif mi? Logs'ta hata var mı? |

### Webhook Loglarını Kontrol Et
1. **Ayarlar** → **Webhook Logları**
2. Son webhook'ları ve hataları görebilirsin
3. Hata varsa, mesajı oku ve çöz

---

## 📞 Destek

Herhangi bir sorun yaşarsan:
1. **Webhook Logları**'nı kontrol et
2. **Bağlantı Durumu**'nu doğrula
3. Yemeksepeti Partner Portal'da **API Anahtarları** durumunu kontrol et
4. Sorunu çözemediysen, destek ekibine ulaş

---

## 🔐 Güvenlik İpuçları

1. **Client Secret'ı Sakla**
   - Kimseyle paylaşma
   - Kodda hardcode etme
   - Sadece Restoran Pro'da sakla

2. **Webhook URL'sini Güvenli Tut**
   - HTTPS kullan
   - Firewall kuralları ekle (opsiyonel)

3. **Düzenli Kontrol**
   - Webhook loglarını düzenli kontrol et
   - Hata varsa hemen çöz
   - Bağlantı durumunu izle

---

## 📚 Yemeksepeti API Dökümanı

Daha fazla bilgi için:
- **Resmi Döküman**: https://developer.yemeksepeti.com
- **Partner Portal**: https://partner.yemeksepeti.com
- **Destek**: https://partner.yemeksepeti.com/support

---

## ✨ Sonraki Adımlar

Entegrasyon kurulduktan sonra:
1. ✅ Tüm Yemeksepeti siparişlerini uygulamada yönet
2. ✅ Sipariş durumlarını otomatik güncelle
3. ✅ Müşteri bilgilerini kaydet
4. ✅ Raporlar ve analizler oluştur

**Tebrikler! Yemeksepeti entegrasyonu başarıyla kuruldu! 🎉**
