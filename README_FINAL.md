# 🍽️ Restoran Pro - Piyasanın En İyi Restoran Yönetim Sistemi

> **Restoran Pro v4.0** — Masaları sürükle-bırak ile düzenle, müşterileri tanı, garsonları sırala, ciro hedeflerini takip et, rakip fiyatları casusluk yap! 🚀

---

## 🎯 Neden Restoran Pro?

Restoran Pro, basit bir sipariş yönetim sisteminden çok daha fazlası. **Piyasanın en iyisi** olması için tasarlandı:

| Özellik | Restoran Pro | Rakipler |
|---------|-------------|---------|
| **Masa Haritası** | ✅ İnteraktif, sürükle-bırak | ❌ Statik liste |
| **AI Sesli Sipariş** | ✅ Transkripsiyon, anlama % | ❌ Yok |
| **Dinamik Fiyatlandırma** | ✅ Zaman, yoğunluk, hava | ❌ Sabit fiyat |
| **Tek Panel** | ✅ Yemek Sepeti, Getir, Trendyol | ❌ Tek platform |
| **Müşteri Sadakat** | ✅ Puan, seviye, çark çevir | ❌ Basit indirim |
| **Patron Merkezi** | ✅ Ciro hedef, rakip casusu | ❌ Yok |
| **Kurye Takibi** | ✅ Canlı harita, müşteri linki | ❌ Yok |
| **Mutfak Ekranı** | ✅ Sesli uyarı, büyük butonlar | ❌ Basit liste |

---

## 🚀 Kurulum (5 Dakika)

```bash
# 1. Repoyu klonla
git clone https://github.com/ardacemil273-cloud/restoran-pro.git
cd restoran-pro

# 2. Bağımlılıkları yükle
npm install

# 3. Ortam değişkenlerini ayarla
cp .env.example .env.local
# .env.local'e Supabase URL ve ANON KEY'ini gir

# 4. Migration'ları Supabase'e uygula
# supabase/migrations/ klasöründeki tüm SQL dosyalarını SQL Editor'da çalıştır

# 5. Uygulamayı başlat
npm run dev

# 6. Tarayıcıda aç
# http://localhost:3000
```

---

## 📋 Özellikler (20+)

### 🗺️ **İşletme Yönetimi**
- **Masa Haritası**: Masaları sürükle-bırak ile konumlandır, grid modu
- **Masalar**: Masa durumu, müşteri sayısı, sipariş özeti
- **Siparişler**: Gerçek zamanlı sipariş takibi, durum güncellemesi
- **Mutfak Ekranı (KDS)**: Büyük butonlar, sesli uyarı, renkli siparişler
- **WhatsApp Siparişler**: Müşteriler WP'dan sipariş verebilir
- **AI Sesli Sipariş**: "Bir iskender" diyince sepete düşer
- **Tek Panel**: Yemek Sepeti, Getir, Trendyol siparişleri bir ekranda
- **Kasa**: Ödeme işlemi, para üstü, kasa kapatma

### 💎 **Müşteri Yönetimi**
- **Müşteri CRM**: Müşteri profili, iletişim bilgisi, toplam harcama
- **Sadakat Programı**: Puan sistemi (Her 10₺ = 1 puan), seviye (Bronz-Platin)
- **Çark Çevir**: Müşteriler çark çevirip ödül kazanabilir
- **Doğum Günü Kuponu**: Otomatik %10 indirim kuponu
- **Tekrar Sipariş**: Müşteri önceki siparişini bir tıkla tekrar verebilir

### 🚗 **Teslimat Yönetimi**
- **Kurye Takibi**: Canlı konum, mesafe, tahmini süre
- **Müşteri Linki**: Müşteri masada QR'ı okutunca canlı takip linki alır
- **Kurye Performans**: Rating, sipariş sayısı, ciro

### 🤖 **AI & Otomasyon**
- **AI Stok Tahmin**: Geçmiş satış verilerini analiz edip gelecek talebini tahmin et
- **Dinamik Fiyatlandırma**: Zaman, yoğunluk, hava, gün bazlı otomatik fiyat
- **Otomatik Fiş**: Platform siparişi gelince yazıcıya otomatik fiş gönder

### 📊 **Analiz & Raporlar**
- **Dashboard**: Günlük ciro, sipariş sayısı, müşteri sayısı
- **Raporlar**: Günlük, haftalık, aylık ciro raporları
- **Garson Performans**: Garson sıralaması, ciro, sipariş hızı, müşteri memnuniyeti
- **Finansal Dashboard**: Gider takibi, kar marjı, vergi hesaplaması
- **Patron Merkezi**: Ciro hedef barı, rakip fiyat casusu, başarı rozetleri

### 🎨 **UX/UI**
- **Dark/Light Mode**: Göz yorulmayan tasarım
- **Animasyonlar**: Framer Motion ile smooth geçişler
- **Responsive**: Mobil, tablet, desktop'ta mükemmel
- **Onboarding**: Yeni kullanıcılar için 7 adımlı rehber
- **Keyboard Shortcuts**: Cmd+K arama, Cmd+/ kısayollar
- **Loading Skeleton**: Her sayfa yüklenirken iskelet gösteriyor
- **Toast Mesajları**: Başarı, hata, uyarı bildirimleri

---

## 🏗️ Mimari

```
restoran-pro/
├── app/                          # Next.js 16 App Router
│   ├── dashboard/                # Ana dashboard
│   ├── masalar/                  # Masa yönetimi
│   ├── masa-harita/              # İnteraktif masa haritası
│   ├── siparisler/               # Sipariş yönetimi
│   ├── whatsapp-siparisler/      # WhatsApp entegrasyonu
│   ├── ai-sesli-siparis/         # AI sesli sipariş
│   ├── mutfak-ekrani/            # Mutfak ekranı (KDS)
│   ├── tek-panel/                # Tek panel (Yemek Sepeti, Getir, vb.)
│   ├── kurye-takip/              # Canlı kurye takibi
│   ├── musteriler/               # Müşteri yönetimi
│   ├── sadakat-oyun/             # Sadakat & oyunlaştırma
│   ├── kasa/                     # Kasa işlemleri
│   ├── rapor/                    # Raporlar
│   ├── garson-performans/        # Garson analizi
│   ├── stok-tahmin/              # AI stok tahmini
│   ├── finansal-dashboard/       # Finansal analiz
│   ├── patron-merkezi/           # Patron dashboard
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global stiller
├── components/                   # React bileşenleri
│   ├── OnboardingTour.tsx        # Onboarding rehberi
│   ├── PremiumUX.tsx             # Premium UX dokunuşları
│   ├── PageTransition.tsx        # Sayfa geçişleri
│   └── ui/                       # shadcn/ui bileşenleri
├── lib/                          # Yardımcı fonksiyonlar
│   └── supabase.ts               # Supabase client
├── supabase/
│   └── migrations/               # SQL migration'ları
│       ├── 20260629300000_masa_durum_sync_fix.sql
│       ├── 20260629400000_customer_loyalty_system.sql
│       ├── 20260629500000_garson_performance.sql
│       ├── 20260629600000_ai_stock_prediction.sql
│       ├── 20260629700000_whatsapp_delivery_tracking.sql
│       ├── 20260629800000_ai_voice_dynamic_pricing.sql
│       ├── 20260629900000_unified_panel_printer.sql
│       ├── 20260630000000_loyalty_gamification.sql
│       └── 20260630100000_patron_dashboard.sql
├── public/                       # Statik dosyalar
├── .env.example                  # Ortam değişkenleri şablonu
├── package.json                  # Bağımlılıklar
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind config
└── README.md                     # Bu dosya
```

---

## 🛠️ Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Frontend** | Next.js 16, React 19, TypeScript |
| **Styling** | Tailwind CSS, shadcn/ui |
| **Animasyon** | Framer Motion |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth |
| **Real-time** | Supabase Realtime |
| **Grafikler** | Recharts |
| **Drag-Drop** | @dnd-kit |
| **Toast** | Sonner |
| **Icons** | Lucide React |

---

## 🔐 Güvenlik

- **Row Level Security (RLS)**: Her kullanıcı sadece kendi verisini görebilir
- **TypeScript Strict Mode**: Tip güvenliği %100
- **Environment Variables**: Hassas bilgiler `.env.local`'de
- **Supabase Auth**: OAuth2 entegrasyonu
- **CORS**: Güvenli API çağrıları

---

## 📈 Performans

- **Static Generation**: 51 sayfa pre-render edildi
- **Image Optimization**: Next.js Image component
- **Code Splitting**: Otomatik chunk'lama
- **Caching**: Agresif cache stratejisi
- **Build Time**: ~9 saniye
- **Bundle Size**: ~200KB (gzipped)

---

## 🚀 Deployment

### Vercel'e Deploy Et (Önerilen)

```bash
# 1. Vercel CLI'yi yükle
npm install -g vercel

# 2. Deploy et
vercel

# 3. Supabase bağlantısını ayarla
# Vercel Dashboard > Settings > Environment Variables
```

### Docker ile Deploy Et

```bash
# Dockerfile oluştur ve deploy et
docker build -t restoran-pro .
docker run -p 3000:3000 restoran-pro
```

---

## 📞 Destek

Sorun mu yaşıyorsun?

1. **GitHub Issues**: https://github.com/ardacemil273-cloud/restoran-pro/issues
2. **Email**: ardacemil273@gmail.com
3. **WhatsApp**: +90 XXX XXX XX XX

---

## 📄 Lisans

MIT License - Özgürce kullan, değiştir, dağıt!

---

## 🎉 Teşekkürler

Restoran Pro'yu seçtiğin için teşekkür ederiz! 

**Restoran Pro ile restoranını 2026'ya taşı!** 🚀

---

## 📊 Commit Tarihi

```
4083a2a feat: Patron Merkezi - Ego Dashboard
5ca6a43 feat: Müşteri Sadakat & Oyunlaştırma Sistemi
1f357f3 feat: Tek Panel Entegrasyonu + Yazıcı Fiş Sistemi
6441bcf feat: AI Sesli Sipariş + Dinamik Fiyatlandırma Sistemi
3f2263d feat: WhatsApp Sipariş + Canlı Kurye Takip Sistemi
d0e14e8 docs: Kapsamlı README Güncellemesi
103b618 feat: Gelişmiş Finansal Dashboard
f959f8a feat: AI Stok Tahmin Sistemi
6c9cd44 feat: Akıllı Mutfak Ekranı (KDS) + QR Sipariş Sistemi
fc047dd feat: Ultra Premium UX Dokunuşları
8782aba feat: Garson Performans Analizi
5085385 feat: Müşteri CRM + Sadakat Sistemi
5d78ac4 feat: Interactive Masa Haritası + Onboarding Turu
```

---

**Restoran Pro - Piyasanın En İyi Restoran Yönetim Sistemi** ✨
