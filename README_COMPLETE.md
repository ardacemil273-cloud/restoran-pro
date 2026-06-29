# 🍽️ Restoran Pro - Cyber Blue Edition v2.0

Restoran yönetimi için **AI-destekli, mobil-first, production-ready** web uygulaması.

---

## 🎯 Özellikler

### 🤖 AI Garson Asistanı
- Sesli siparişleri otomatik analiz eder
- Mutfak notlarını çıkarır ("acılı olsun", "buzsuz olsun" vb)
- Ürünleri tanır ve sipariş taslağı oluşturur
- OpenAI GPT-4o-mini entegrasyonu

### 🎤 Sesli Sipariş Sistemi
- **Garson Paneli**: Masa başında sesle sipariş alma
- **QR Menü**: Müşteri menüsünde sesli sipariş
- Speech-to-Text: Ses kayıtları otomatik metne dönüştürülür
- Supabase Storage: Ses dosyaları güvenli saklanır

### 🎂 Doğum Günü & Sadakat Sistemi
- Müşteri onboarding modalı (QR menüde)
- Doğum günü otomatik takibi
- %20 indirim tanımlaması
- Bildirim sistemi (SMS/WhatsApp ready)
- Puan sistemi ve seviye atlama

### 📱 Mobil App Deneyimi
- **Bottom Navigation**: Mobilde şık alt menü
- **Responsive Layout**: Tüm ekran boyutlarında uyum
- **PWA Support**: Ana ekrana ekleme
- **Smart Install Banner**: Uygulamayı yükle uyarısı

### 🎨 Cyber Blue Tasarım
- Koyu gece mavisi (#0a0e27) + Neon Cyan (#00d9ff)
- Neon pulse efektli logo
- Glassmorphism ve neon gölgeler
- Dark/Light mode support
- 6 hazır tema seçeneği

### ⚙️ Feature Flags (Kontrol Paneli)
- 12+ özellik bağımsız olarak açılıp kapatılabilir
- Kategorilere göre gruplandırma
- Ayarlar sayfasında merkezi yönetim

### 🔧 Scroll Preservation
- Menü açılırken sayfanın en üste atılması engellendi
- Smooth accordion ve sidebar bileşenleri
- Akıcı UX deneyimi

---

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya pnpm
- Supabase hesabı
- OpenAI API Key

### Adımlar

```bash
# 1. Repo'yu klonla
git clone https://github.com/ardacemil273-cloud/restoran-pro.git
cd restoran-pro

# 2. Bağımlılıkları yükle
npm install

# 3. Ortam değişkenlerini ayarla
cp .env.example .env.local
# .env.local dosyasını düzenle ve API key'leri ekle

# 4. Geliştirme sunucusunu başlat
npm run dev

# 5. Tarayıcıda aç
# http://localhost:3000
```

---

## 📋 Ortam Değişkenleri

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI (AI Garson için)
OPENAI_API_KEY=sk-your-api-key

# Uygulama
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🏗️ Proje Yapısı

```
restoran-pro/
├── app/
│   ├── api/                    # API routes
│   │   ├── ai-garson/         # AI analiz
│   │   ├── sesli-siparis/     # Sesli sipariş
│   │   ├── dogum-gunu-bildiri/# Doğum günü bildirimleri
│   │   └── ozellik-ayarlari/  # Feature flags
│   ├── ayarlar/               # Ayarlar sayfası
│   ├── garson-panel/          # Garson sesli sipariş
│   ├── menu/[slug]/           # QR menü (müşteri)
│   └── dashboard/             # Ana panel
├── components/
│   ├── SesliSiparis.tsx       # Sesli sipariş modalı
│   ├── MusteriSadakatKarti.tsx# Sadakat kartı
│   ├── SmartInstallBanner.tsx # PWA uyarısı
│   ├── MobileBottomNav.tsx    # Mobil menü
│   ├── SmoothAccordion.tsx    # Akıcı akordeon
│   └── ResponsiveSidebar.tsx  # Responsive sidebar
├── hooks/
│   ├── useFeatureFlags.ts     # Feature flags hook
│   └── useScrollPreservation.ts# Scroll koruma
├── lib/
│   ├── supabase.ts            # Supabase client
│   └── scrollUtils.ts         # Scroll yardımcıları
├── supabase/
│   └── migrations/            # Database migrations
├── public/                    # Static assets
└── styles/                    # Global styles
```

---

## 📚 Rehberler

- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Vercel deployment
- **[YENILIKLER.md](./YENILIKLER.md)** - Tüm yeni özellikler
- **[SCROLL_FIX_GUIDE.md](./SCROLL_FIX_GUIDE.md)** - Scroll resetleme çözümü

---

## 🔌 API Endpoints

### Sesli Sipariş
- `POST /api/sesli-siparis` - Sesli sipariş kaydı
- `GET /api/sesli-siparis?restoran_id=X` - Siparişleri listele

### AI Garson
- `POST /api/ai-garson` - Siparişi analiz et

### Doğum Günü
- `POST /api/dogum-gunu-bildiri` - Bildirim gönder
- `GET /api/dogum-gunu-bildiri?musteri_id=X&restoran_id=Y` - İndirim kontrol

### Özellikler
- `POST /api/ozellik-ayarlari` - Feature flag'leri kaydet
- `GET /api/ozellik-ayarlari?restoran_id=X` - Ayarları getir

---

## 🗄️ Veritabanı

### Yeni Tablolar
- `sesli_siparisler` - Sesli sipariş kayıtları
- `dogum_gunu_indirimler` - Doğum günü indirimleri
- `bildirimler` - SMS/WhatsApp/Email bildirimler
- `cark_cevir_kayitlari` - Çark çevirme kayıtları
- `qr_kuponlar` - QR kupon tanımları

### Güncellenmiş Tablolar
- `restoranlar` - `ozellik_ayarlari` JSONB kolonu
- `musteriler` - `dogum_tarihi`, `sadakat_kartı_aktif` kolonları
- `sesli_siparisler` - `mutfak_notlari`, `urunler_json` kolonları

---

## 🧪 Testing

```bash
# Build test
npm run build

# Linting
npm run lint

# Type checking
npm run type-check
```

---

## 📊 Performance

- **Lighthouse Score**: 90+
- **Page Load**: < 2s
- **API Response**: < 500ms
- **Mobile Optimized**: 100%

---

## 🔐 Güvenlik

- ✅ Supabase Row Level Security (RLS)
- ✅ API key encryption
- ✅ CORS protection
- ✅ SQL injection prevention
- ✅ XSS protection

---

## 🚀 Deployment

### Vercel (Önerilen)
```bash
vercel deploy --prod
```

Detaylı rehber: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

---

## 🤝 Katkıda Bulunma

Hata buldu veya öneriniz var mı? GitHub Issues'a bildir!

---

## 📄 Lisans

MIT License - Özgürce kullanabilirsin!

---

## 📞 Destek

- 📧 Email: support@restoran-pro.com
- 💬 Discord: [Community](https://discord.gg/restoran-pro)
- 📖 Docs: [Documentation](https://docs.restoran-pro.com)

---

**Restoran Pro ile işletmenizi dijitalleştir! 🚀**
