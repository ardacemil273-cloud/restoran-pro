# 🚀 Restoran Pro - Cyber Blue Edition

## Yeni Özellikler (v2.0)

### 1. 🎨 Cyber Blue Tasarım
- **Tema**: Koyu gece mavisi (#0a0e27) + Neon Cyan (#00d9ff) + Neon Mor (#7c3aed)
- **Logo Animasyonu**: Yanıp sönen gradient efektli "Restoran Pro" yazısı
- **Glassmorphism**: Modern cam efekti ve neon gölgeler
- **Responsive**: Mobil, tablet ve desktop'ta mükemmel görünüm

### 2. 🎤 Sesli Sipariş Sistemi
- **Garson Paneli** (`/garson-panel`): Garsonlar sesle sipariş alabilir
- **QR Menü Sesli Sipariş**: Müşteriler menüde mikrofon butonuyla sipariş verebilir
- **Speech-to-Text**: Ses kayıtları otomatik metne dönüştürülür
- **Supabase Storage**: Ses dosyaları güvenli şekilde saklanır

### 3. 🤖 AI Garson Asistanı
- **LLM Entegrasyonu**: OpenAI GPT-4o-mini ile sesli siparişleri analiz eder
- **Mutfak Notları**: "Acılı olsun", "buzsuz olsun" gibi özel istekleri otomatik çıkarır
- **Ürün Tanıma**: Müşterinin söylediği ürünleri otomatik tanır ve sipariş taslağı oluşturur
- **Akıllı Parsing**: Karmaşık siparişleri bile doğru şekilde işler

### 4. 🎂 Doğum Günü & Sadakat Sistemi
- **Müşteri Onboarding**: QR menüde sadakat kartı oluşturma modalı
- **Doğum Günü Takibi**: Müşteri bilgilerinden doğum günü kaydedilir
- **Otomatik İndirim**: Doğum günü müşteriye %20 indirim tanımlanır
- **Puan Sistemi**: İlk kayıtta +50 hoşgeldin bonusu
- **Bildirim Sistemi**: Doğum günü müşterilere otomatik bildirim (SMS/WhatsApp simülasyonu)

### 5. 📱 Mobil App Deneyimi
- **Bottom Navigation**: Mobilde sayfanın altında şık navigasyon menüsü
- **Responsive Layout**: Her ekran boyutunda optimal görünüm
- **Touch Optimized**: Mobil dokunuş için büyük butonlar
- **PWA Support**: Ana ekrana uygulamayı ekleme desteği

### 6. 📲 Smart Install Banner
- **PWA Uyarısı**: Sayfanın altında "Uygulamayı Yükle" önerisi
- **Rahatsız Etmez**: 7 gün boyunca kapatılabilir
- **Akıllı Gösterim**: Sadece uygun durumlarda gösterilir

### 7. 🎨 Tema Özelleştirme
- **6 Hazır Tema**: Cyber Blue, Neon Pink, Sunset Orange, Mint Green, Deep Purple, Ocean Blue
- **Dinamik Renk Değişimi**: Temalar anında uygulanır
- **LocalStorage Bellek**: Seçilen tema kaydedilir
- **Tema Kodu Kopyala**: Geliştirici için CSS kodu kopyalama

### 8. ⚙️ Feature Flags (Kontrol Paneli)
- **12 Özellik**: Her biri bağımsız olarak açılıp kapatılabilir
- **Kategorilere Göre Gruplandırma**: Müşteri Deneyimi, Operasyon, Analitik, Entegrasyon, Gelir Optimizasyonu
- **Ayarlar Sayfasında**: Tüm özellikler merkezi kontrol panelinde yönetilir

---

## Kurulum & Başlangıç

### Gereksinimler
- Node.js 18+
- npm veya pnpm
- Supabase hesabı
- OpenAI API Key (AI Garson için)

### Kurulum Adımları

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. .env.local dosyasını oluştur
cp .env.example .env.local

# 3. Ortam değişkenlerini doldur
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key

# 4. Geliştirme sunucusunu başlat
npm run dev

# 5. http://localhost:3000 adresinde aç
```

---

## Kullanım Rehberi

### Garson Paneli
1. `/garson-panel` adresine git
2. "Sesle Sipariş Al" butonuna bas
3. Müşterinin siparişini dinle
4. Sistem otomatik olarak siparişi işler

### Müşteri QR Menüsü
1. QR kodu okut veya `/menu/[slug]` adresine git
2. Sadakat kartı oluştur (ilk ziyarette)
3. Menüden ürün seç veya sesle sipariş ver
4. Siparişi onayla

### Ayarlar Paneli
1. `/ayarlar` adresine git
2. "Özellikler" sekmesine tıkla
3. İstediğin özellikleri aç/kapat
4. Değişiklikler otomatik kaydedilir

### Tema Değiştir
1. Sayfanın sağ altında palet ikonuna tıkla
2. İstediğin temayı seç
3. Tema anında uygulanır

---

## API Endpoints

### Sesli Sipariş
- `POST /api/sesli-siparis` - Sesli sipariş kaydı oluştur
- `GET /api/sesli-siparis?restoran_id=X` - Sesli siparişleri listele

### AI Garson
- `POST /api/ai-garson` - Sesli siparişi analiz et

### Doğum Günü Bildirimleri
- `POST /api/dogum-gunu-bildiri` - Doğum günü müşterilere bildirim gönder
- `GET /api/dogum-gunu-bildiri?musteri_id=X&restoran_id=Y` - Doğum günü indirimini kontrol et

### Özellik Ayarları
- `POST /api/ozellik-ayarlari` - Feature flag'leri kaydet
- `GET /api/ozellik-ayarlari?restoran_id=X` - Feature flag'leri getir

---

## Veritabanı Tabloları

### Yeni Tablolar
- `sesli_siparisler` - Sesli sipariş kayıtları
- `dogum_gunu_indirimler` - Doğum günü indirimleri
- `bildirimler` - SMS/WhatsApp/Email bildirimler
- `cark_cevir_kayitlari` - Çark çevirme kayıtları
- `qr_kuponlar` - QR kupon tanımları

### Güncellenmiş Tablolar
- `restoranlar` - `ozellik_ayarlari` JSONB kolonu eklendi
- `musteriler` - `dogum_tarihi`, `sadakat_kartı_aktif`, `son_doğum_günü_indirim_tarihi` kolonları eklendi
- `sesli_siparisler` - `mutfak_notlari`, `urunler_json`, `ozel_istekler` kolonları eklendi

---

## Sıradaki Özellikler

- [ ] **Gerçek SMS/WhatsApp Entegrasyonu**: Twilio ile doğum günü bildirimlerini gerçek SMS/WhatsApp olarak gönder
- [ ] **AI Fotoğraf Tanıma**: Müşteri menüdeki ürünün fotoğrafını çekip siparişe ekleyebilsin
- [ ] **Garson Performans Takibi**: Garsonların hızını ve doğruluğunu takip et
- [ ] **Dinamik Fiyatlandırma**: Yoğun saatlerde otomatik fiyat ayarı
- [ ] **Müşteri Analitik**: Satış trendleri, popüler ürünler, müşteri davranışı analizi
- [ ] **Rezervasyon Sistemi**: Online masa rezervasyonu
- [ ] **Stok Tahmini**: AI ile stok tüketim tahmini

---

## Destek & Sorunlar

Herhangi bir sorun yaşarsan:
1. Konsolu aç (F12)
2. Hataları kontrol et
3. GitHub Issues'a bildir

---

## Lisans

MIT License - Özgürce kullanabilirsin! 🚀
