# 🍽️ Restoran Pro - Dünya Markası Restoran Yönetim Sistemi

> **Restoran Pro**, modern restoranlar için tasarlanmış, AI-destekli, tam özellikli bir yönetim sistemidir. Masalar, siparişler, garsonlar, müşteriler, stok, finanslar ve daha fazlasını tek platformda yönetin.

## ✨ Özellikler

### 🎯 Temel Özellikler
- **📊 Dashboard**: Gerçek zamanlı ciro, sipariş ve müşteri istatistikleri
- **🪑 Masa Yönetimi**: Masa durumu takibi, sürükle-bırak masa haritası
- **🛒 Sipariş Yönetimi**: Hızlı sipariş alma, durumu takibi, kasa işlemleri
- **👥 Müşteri CRM**: Müşteri profili, sadakat puanları, otomatik indirimler
- **👨‍🍳 Garson Yönetimi**: Garson performans analizi, leaderboard, bonus hesaplama

### 🤖 AI & Akıllı Özellikler
- **🧠 AI Stok Tahmin**: Geçmiş satış verilerini analiz edip gelecek talebini tahmin eder
- **📈 Trend Analizi**: Ürün satış trendlerini otomatik hesaplar
- **⚠️ Akıllı Uyarılar**: Kritik stok, düşük stok, fazla stok uyarıları
- **🎯 Optimal Sipariş**: Tedarikçiye kaç miktar sipariş etmesi gerektiğini önerir

### 🍳 Mutfak & Müşteri
- **🔥 Akıllı Mutfak Ekranı (KDS)**: Büyük butonlu, sesli uyarılı, gerçek zamanlı sipariş takibi
- **📱 QR Menü Sipariş**: Müşteriler masadaki QR'ı okutup direkt sipariş verebilir
- **🎯 Onboarding Turu**: Yeni kullanıcılar için 7 adımlı interaktif rehber

### 💰 Finansal Yönetim
- **📊 Finansal Dashboard**: Günlük/aylık ciro, gider, kar analizi
- **💵 Vergi Hesaplama**: Otomatik %18 KDV hesaplaması
- **📈 Kar Marjı**: Gerçek zamanlı kar marjı takibi
- **📉 Gider Kategorileri**: Giderleri kategorize edip pie chart ile görselleştir

### 🎨 Premium UX
- **🌙 Dark Mode**: Gözlere hoş, profesyonel tasarım
- **⌨️ Keyboard Shortcuts**: Cmd+K arama, Cmd+/ kısayollar
- **✨ Smooth Animasyonlar**: Framer Motion ile modern geçişler
- **📱 Mobile-First**: Telefonda da desktop kadar güzel

## 🚀 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya pnpm
- Supabase hesabı (PostgreSQL + Real-time)

### Adım 1: Repoyu Klonla
```bash
git clone https://github.com/ardacemil273-cloud/restoran-pro.git
cd restoran-pro
```

### Adım 2: Bağımlılıkları Yükle
```bash
npm install
# veya
pnpm install
```

### Adım 3: Ortam Değişkenlerini Ayarla
```bash
cp .env.example .env.local
```

`.env.local` dosyasını düzenle ve Supabase bilgilerini ekle:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PAYTR_MERCHANT_ID=your-merchant-id
PAYTR_MERCHANT_KEY=your-merchant-key
PAYTR_MERCHANT_SALT=your-merchant-salt
OPENAI_API_KEY=your-openai-key
```

### Adım 4: Veritabanı Migrasyonlarını Uygula
1. Supabase Dashboard'a git
2. SQL Editor'a git
3. `supabase/migrations/` klasöründeki tüm `.sql` dosyalarını sırasıyla çalıştır

### Adım 5: Uygulamayı Başlat
```bash
npm run dev
```

Tarayıcını aç ve `http://localhost:3000` adresine git.

## 📁 Proje Yapısı

```
restoran-pro/
├── app/
│   ├── dashboard/           # Ana dashboard
│   ├── masalar/             # Masa yönetimi
│   ├── masa-harita/         # İnteraktif masa haritası
│   ├── siparisler/          # Sipariş yönetimi
│   ├── mutfak-ekrani/       # Akıllı mutfak ekranı
│   ├── qr/[masaId]/         # QR menü sipariş
│   ├── kasa/                # Kasa işlemleri
│   ├── musteriler/          # Müşteri CRM
│   ├── garson-performans/   # Garson analizi
│   ├── stok-tahmin/         # AI stok tahmin
│   ├── finansal-dashboard/  # Finansal analiz
│   ├── rapor/               # Detaylı raporlar
│   ├── layout.tsx           # Ana layout
│   └── globals.css          # Global stiller
├── components/
│   ├── ui/                  # shadcn/ui bileşenleri
│   ├── OnboardingTour.tsx   # Onboarding rehberi
│   ├── PremiumUX.tsx        # Keyboard shortcuts
│   └── ...
├── lib/
│   ├── supabase.ts          # Supabase client
│   └── ...
├── supabase/
│   └── migrations/          # Veritabanı migrasyonları
├── public/
│   ├── manifest.json        # PWA manifest
│   └── ...
└── package.json
```

## 🎯 Sayfa Rehberi

| Sayfa | URL | Açıklama |
|-------|-----|----------|
| Dashboard | `/dashboard` | Ana kontrol paneli |
| Masalar | `/masalar` | Masa yönetimi |
| Masa Haritası | `/masa-harita` | İnteraktif masa düzeni |
| Siparişler | `/siparisler` | Sipariş yönetimi |
| Mutfak Ekranı | `/mutfak-ekrani` | Mutfak için KDS |
| QR Sipariş | `/qr/[masaId]` | Müşteri sipariş sayfası |
| Kasa | `/kasa` | Ödeme işlemleri |
| Müşteriler | `/musteriler` | CRM ve sadakat |
| Garson Performans | `/garson-performans` | Garson analizi |
| AI Stok Tahmin | `/stok-tahmin` | Akıllı stok yönetimi |
| Finansal Dashboard | `/finansal-dashboard` | Finansal analiz |
| Raporlar | `/rapor` | Detaylı raporlar |

## ⚙️ Teknoloji Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Animasyonlar**: Framer Motion
- **Grafikler**: Recharts
- **Veritabanı**: Supabase (PostgreSQL)
- **Real-time**: Supabase Real-time Subscriptions
- **Ödeme**: PayTR
- **AI**: OpenAI API

## 🔐 Güvenlik

- ✅ Row Level Security (RLS) tüm tablolarda
- ✅ TypeScript strict mode
- ✅ Environment variables ile hassas bilgileri koru
- ✅ Supabase Auth ile kullanıcı yönetimi
- ✅ HTTPS zorunlu production'da

## 📱 Responsive Tasarım

- ✅ Mobile-first approach
- ✅ Tablet desteği
- ✅ Desktop optimizasyonu
- ✅ Touch-friendly butonlar
- ✅ Adaptive layouts

## 🎨 Tasarım Özellikleri

- ✅ Dark Mode (Premium)
- ✅ Smooth page transitions
- ✅ Loading skeleton states
- ✅ Empty states
- ✅ Toast notifications
- ✅ Micro-animations
- ✅ Accessibility (a11y)

## 🚀 Deployment

### Vercel'e Deploy
```bash
npm install -g vercel
vercel
```

### Docker ile Deploy
```bash
docker build -t restoran-pro .
docker run -p 3000:3000 restoran-pro
```

## 📊 Veritabanı Migrasyonları

Tüm migrasyonlar `supabase/migrations/` klasöründe:
- `20260629300000_masa_durum_sync_fix.sql` - Masa senkronizasyonu
- `20260629400000_customer_loyalty_system.sql` - Müşteri sadakat
- `20260629500000_garson_performance.sql` - Garson performans
- `20260629600000_ai_stock_prediction.sql` - AI stok tahmin

## 🐛 Sorun Giderme

### Build Hatası
```bash
npm run build
```

### TypeScript Hatası
```bash
npx tsc --noEmit
```

### Veritabanı Bağlantısı
- `.env.local` dosyasını kontrol et
- Supabase URL ve key'leri doğru mu?
- Network bağlantısını kontrol et

## 📞 Destek

Sorularınız için:
- GitHub Issues: https://github.com/ardacemil273-cloud/restoran-pro/issues
- Email: ardacemil273@gmail.com

## 📄 Lisans

MIT License - Detaylar için LICENSE dosyasına bak

## 🎉 Katkıda Bulun

1. Repoyu fork et
2. Feature branch oluştur (`git checkout -b feature/AmazingFeature`)
3. Değişiklikleri commit et (`git commit -m 'Add some AmazingFeature'`)
4. Branch'e push et (`git push origin feature/AmazingFeature`)
5. Pull Request aç

---

**Restoran Pro** - Restoranınızı 2026'ya taşı! 🚀


## 📱 PWA (Progressive Web App) Kurulumu

### Otomatik Kurulum
Uygulama otomatik olarak PWA olarak çalışır. Siteye girdiğinizde alt taraftan "Uygulamayı Yükle" bildirimi gelecektir.

### Manuel Kurulum

**Android (Chrome/Edge):**
1. Siteyi ziyaret edin
2. Menüden "Uygulamayı Yükle" seçin
3. Onaylayın

**iOS (Safari):**
1. Siteyi Safari'de açın
2. Paylaş butonuna tıklayın
3. "Ana Ekrana Ekle" seçin
4. Adı onaylayın

**PC (Chrome/Edge):**
1. Siteyi açın
2. Menüden "Uygulamayı Yükle" seçin
3. Onaylayın

### PWA Özellikleri
- ✅ Offline çalışma (Service Worker)
- ✅ Push notifications
- ✅ Home screen shortcut
- ✅ Standalone mode
- ✅ Fast loading
- ✅ App-like experience

## 🔧 Gelişmiş Kurulum

### ESLint ve Prettier Konfigürasyonu
```bash
npm run lint
npm run format
```

### TypeScript Kontrolü
```bash
npx tsc --noEmit
```

### Build Optimizasyonu
```bash
npm run build
npm run start
```

## 🌐 Mobil Uyumluluk Kontrol Listesi

- ✅ Responsive design (mobile-first)
- ✅ Touch-friendly buttons (min 44x44px)
- ✅ Safe area support (notch devices)
- ✅ Viewport optimization
- ✅ Font size optimization
- ✅ Image optimization
- ✅ Performance optimization
- ✅ Accessibility (a11y)

## 🎯 Sonraki Adımlar

1. **Supabase Konfigürasyonu**: Tüm migration'ları çalıştırın
2. **Ortam Değişkenleri**: `.env.local` dosyasını tamamlayın
3. **Kullanıcı Oluşturma**: İlk restoran ve kullanıcı hesabını oluşturun
4. **Ürün Ekleme**: Menü ürünlerini ekleyin
5. **Masa Ayarı**: Masaları ve düzenini ayarlayın
6. **Garson Ekleme**: Garson hesapları oluşturun

## 🚀 Vercel Deploy Kontrol Listesi

- [ ] `.env.local` değişkenlerini Vercel'e ekleyin
- [ ] Build settings doğru mu?
- [ ] Supabase bağlantısı çalışıyor mu?
- [ ] PWA manifest doğru mu?
- [ ] Service Worker kayıtlı mı?
- [ ] HTTPS aktif mi?

---

**Restoran Pro** - Restoranınızı dijitalleştirin! 🍽️✨
