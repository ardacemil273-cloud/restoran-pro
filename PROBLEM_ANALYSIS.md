# Restoran-Pro Siparişler Sayfası Sorun Analizi

## Sorunlar

### 1. F5 (Sayfa Yenileme) Sorunu
**Neden:** `middleware.ts` dosyasındaki auth kontrolü ile `layout.tsx` dosyasındaki istemci tarafı auth kontrolünün senkronize olmaması.

**Detay:**
- Middleware, sunucu tarafında session kontrolü yapıyor
- Layout.tsx, istemci tarafında auth kontrolü yapıyor
- F5 basıldığında bu iki kontrol arasında mismatch oluşuyor
- Kullanıcı login olmamış görünüyor ama session var

**Çözüm:**
- Middleware'de daha esnek bir auth mekanizması kullanmak
- Session refresh mekanizması eklemek
- Client-side hydration sorunlarını çözmek

### 2. PWA Yükleme Butonu Takılması
**Neden:** Service Worker'ın (`sw.js`) agresif önbellekleme stratejisi ve eksik kayıt (registration) mekanizması.

**Detay:**
- `sw.js` tüm GET isteklerini cache'liyor
- Cache invalidation mekanizması eksik
- Service Worker registration hatası var
- `PwaInstall.tsx` component'inde timeout mekanizması var ama fallback sorunlu

**Çözüm:**
- Service Worker'a versioning eklemek
- Cache invalidation mekanizması eklemek
- Service Worker registration error handling'i iyileştirmek
- PwaInstall component'inde error handling eklemek

## Yapılacaklar

1. middleware.ts'de session refresh mekanizması ekle
2. layout.tsx'de hydration sorunlarını çöz
3. sw.js'de cache versioning ve invalidation ekle
4. PwaInstall.tsx'de error handling iyileştir
5. app/siparisler/page.tsx'de session check mekanizması ekle
