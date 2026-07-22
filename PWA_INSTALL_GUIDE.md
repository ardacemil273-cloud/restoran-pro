# 📱 PWA Kurulum Rehberi - Yemek Sepeti Entegrasyonu

Bu rehber, Restoran Pro PWA uygulamasını telefonunuza veya bilgisayarınıza nasıl kuracağınızı açıklar.

---

## ✅ Neden PWA Kurmalısın?

- ⚡ **Hızlı Erişim**: Ana ekrandan bir tıkla açılır
- 📵 **Offline Çalışma**: İnternet olmasa bile temel özellikler çalışır
- 🔔 **Bildirimler**: Yemeksepeti siparişleri için push bildirimleri
- 📱 **Mobil Uygulama Gibi**: Tarayıcı arayüzü olmadan çalışır
- 💾 **Otomatik Güncelleme**: Her açılışta en son sürümü yükler

---

## 🔧 Teknik Gereksinimler

✅ **Manifest.json**: Uygulamanın bilgilerini içerir
✅ **Service Worker**: Offline desteği ve bildirimler
✅ **HTTPS**: Güvenlik için zorunlu (Vercel otomatik sağlar)
✅ **Icons**: 192x192 ve 512x512 PNG dosyaları

**Mevcut Durum**: Tüm gereksinimler hazır ✅

---

## 📱 Android / Chrome Kurulumu

### Adım 1: Restoran Pro'yu Aç
1. Chrome tarayıcısında https://restoran-pro.vercel.app adresine git
2. Giriş yap

### Adım 2: Kurulum Prompt'unu Bekle
- Ekranın alt tarafında **"Restoran Pro ŞİMDİ YÜKLE"** butonu görünecek
- Eğer görünmezse, tarayıcı kurulum koşullarını sağlamıyor demektir

### Adım 3: Yükle
1. **ŞİMDİ YÜKLE** butonuna tıkla
2. Kurulum onayını ver
3. Uygulama ana ekrana eklenir

### Adım 4: Kontrol Et
- Ana ekranda "Restoran Pro" uygulaması görünmelidir
- Tıklayarak açabilirsin

---

## 🍎 iOS (iPhone/iPad) Kurulumu

### Adım 1: Safari'de Aç
1. Safari tarayıcısını aç
2. https://restoran-pro.vercel.app adresine git
3. Giriş yap

### Adım 2: Paylaş Menüsünü Aç
1. Ekranın alt tarafındaki **Paylaş** butonuna tıkla (↗️)
2. Veya sağ üstteki menü butonundan "Paylaş" seç

### Adım 3: Ana Ekrana Ekle
1. Paylaş menüsünde **"Ana Ekrana Ekle"** seçeneğini bul
2. Tıkla
3. Uygulamanın adını ve ikonunu kontrol et
4. **Ekle** butonuna tıkla

### Adım 4: Kontrol Et
- Ana ekranda "Restoran Pro" uygulaması görünmelidir
- Tıklayarak açabilirsin
- Tarayıcı arayüzü olmadan açılacak

---

## 🖥️ Desktop (Windows/Mac) Kurulumu

### Chrome/Edge ile

1. https://restoran-pro.vercel.app adresine git
2. Giriş yap
3. Adres çubuğunun sağında **Yükle** ikonu görünecek
4. Tıkla ve kurulumu onayla
5. Başlat menüsünde veya masaüstünde "Restoran Pro" uygulaması görünecek

### Firefox ile

Firefox PWA desteği sınırlıdır. Chrome veya Edge kullanmanız önerilir.

---

## 🔍 Sorun Giderme

### Problem: "Yükle" Butonu Görünmüyor

**Sebepleri:**
- Uygulama zaten yüklü
- Tarayıcı PWA desteklemiyor
- Manifest.json yüklenmedi
- Service Worker kayıtlı değil

**Çözüm:**
1. **DevTools Açın**: F12 tuşuna bas
2. **Application Tab**: "Application" sekmesine git
3. **Manifest**: Manifest.json'ın yüklü olduğunu kontrol et
4. **Service Workers**: Service Worker'ın "activated and running" durumunda olduğunu kontrol et
5. **Cache Storage**: Cache'in dolu olduğunu kontrol et

### Problem: Bildirim Gelmiyor

**Çözüm:**
1. **Tarayıcı İzinleri**:
   - Chrome → Ayarlar → Gizlilik → Bildirimler
   - Restoran Pro için "İzin Ver" seçili mi?

2. **İşletim Sistemi İzinleri**:
   - Windows: Ayarlar → Bildirimler → "Restoran Pro"
   - Mac: Sistem Tercihleri → Bildirimler → "Chrome"

3. **Service Worker Kontrol**:
   - DevTools → Application → Service Workers
   - "activated and running" yazıyor mu?

### Problem: Uygulama Açılmıyor

**Çözüm:**
1. Uygulamayı sil
2. https://restoran-pro.vercel.app adresine git
3. Tekrar yükle

### Problem: Offline Çalışmıyor

**Çözüm:**
1. Uygulamayı en az bir kez online olarak aç
2. Sayfaların cache'lendiğini kontrol et (DevTools → Application → Cache Storage)
3. Offline modda sayfaları yenile

---

## 🧪 Kurulumun Başarılı Olduğunu Kontrol Et

✅ **Kontrol Listesi:**

- [ ] Uygulama ana ekranda görünüyor
- [ ] Tıklayarak açılabiliyor
- [ ] Tarayıcı arayüzü görünmüyor (tam ekran)
- [ ] Geri/İleri butonları çalışıyor
- [ ] Bildirim izni vermiş
- [ ] Yemeksepeti siparişi geldiğinde bildirim alıyor
- [ ] Offline modda temel sayfalar açılıyor

Tüm bunları gördüğünde kurulum başarılı! 🎉

---

## 📊 PWA Durumu Kontrol Etme

### Chrome DevTools ile

1. **F12** tuşuna bas
2. **Application** sekmesine git
3. Kontrol et:
   - **Manifest**: ✅ Yüklü ve geçerli
   - **Service Worker**: ✅ Activated and running
   - **Cache Storage**: ✅ Dosyalar cache'lenmiş

### Lighthouse Raporu ile

1. DevTools açık
2. **Lighthouse** sekmesine git
3. **Generate report** butonuna tıkla
4. PWA puanını kontrol et (90+ ideal)

---

## 🚀 Yemeksepeti Siparişleri için Bildirim Ayarı

### Tarayıcı Bildirimleri Etkinleştir

1. Restoran Pro'yu aç
2. Ayarlar → Bildirimler
3. "Yemeksepeti siparişleri için bildirim al" seçeneğini aç

### Mobil Cihazda

1. Uygulamayı aç
2. Ayarlar → Bildirimler
3. "Yemeksepeti siparişleri" etkinleştirildi mi kontrol et
4. Ses ve titreşim ayarlarını kontrol et

---

## 💡 İpuçları

- **Hızlı Erişim**: Uygulama ana ekranda olduğu için 3 saniyede açılır
- **Veri Tasarrufu**: Offline cache sayesinde veri kullanımı azalır
- **Bildirim Sesi**: `/public/notification.mp3` dosyası siparişlerde çalınır
- **Otomatik Güncelleme**: Service Worker arka planda güncelleme kontrol eder

---

## 🔗 Faydalı Linkler

- [PWA Nedir?](https://web.dev/progressive-web-apps/)
- [Service Worker Hakkında](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Manifest.json Hakkında](https://developer.mozilla.org/en-US/docs/Web/Manifest)

---

## ❓ Sıkça Sorulan Sorular

**S: PWA ve mobil uygulama arasındaki fark nedir?**
C: PWA tarayıcı tabanlı, daha hafif ve güncelleme kolay. Mobil uygulama ise App Store'dan indirilir.

**S: Offline modda tüm özellikler çalışır mı?**
C: Hayır, sadece daha önce açılan sayfalar cache'lenmiş olarak açılır. API çağrıları offline modda çalışmaz.

**S: Bildirim almak için ne yapmam gerek?**
C: Tarayıcıya bildirim izni vermelisin. Prompt'u gördüğünde "İzin Ver" seç.

**S: Uygulama ne kadar yer kaplar?**
C: Yaklaşık 5-10 MB. Mobil uygulamalardan çok daha küçük.

**S: Uygulama otomatik güncellenir mi?**
C: Evet, her açılışta Service Worker arka planda yeni sürümü kontrol eder.

---

## 📞 Destek

Sorun yaşıyorsan:
1. Browser console'da (F12) hata mesajlarını kontrol et
2. DevTools → Application → Service Workers kontrol et
3. Cache Storage'ı temizle ve tekrar dene
4. Uygulamayı sil ve yeniden yükle

Başarılar! 🚀
