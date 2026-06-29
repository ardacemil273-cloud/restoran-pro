# 🍽️ Restoran Pro

**Profesyonel Restoran Yönetim Sistemi** — Next.js 16 + Supabase + Tailwind CSS

---

## 🚀 Kurulum

```bash
# 1. Bağımlılıkları yükle
npm install

# 2. Ortam değişkenlerini ayarla
cp .env.example .env.local
# .env.local dosyasına Supabase URL ve ANON KEY'ini gir

# 3. Supabase migration'larını çalıştır
# Supabase dashboard > SQL Editor > supabase/migrations/ klasöründeki .sql dosyalarını sırayla çalıştır

# 4. Geliştirme sunucusunu başlat
npm run dev
```

Uygulama `http://localhost:3000` adresinde açılır.

---

## 📋 Özellikler

| Özellik | Açıklama |
|---|---|
| 🪑 Masa Yönetimi | Sürükle-bırak sıralama, QR kod, kapasite, realtime |
| 🛒 Sipariş Yönetimi | Gerçek zamanlı takip, durum güncellemeleri, ses bildirimi |
| 💰 Kasa | Hızlı satış, masa kapatma, ciro takibi |
| 📊 Raporlar | Haftalık/aylık ciro, en çok satan, saatlik yoğunluk |
| 🤖 AI Analiz | Yapay zeka destekli satış önerileri |
| 📱 PWA | Telefona kurulabilir, offline çalışır |
| 👨‍🍳 Garson Paneli | Garson girişi, sipariş alma, mutfak ekranı |
| 📦 Stok Takibi | Kritik stok uyarıları |
| 👥 Müşteri CRM | Müşteri kaydı ve geçmiş |
| 📅 Rezervasyon | Masa rezervasyon sistemi |

---

## 🔧 Teknik Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS 4, shadcn/ui
- **Animasyonlar:** Framer Motion
- **Database:** Supabase (PostgreSQL + Realtime)
- **Charts:** Recharts
- **Drag & Drop:** @dnd-kit

## 🌍 Ortam Değişkenleri (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🐛 Bug Fixes (v2.0)

### ✅ Kritik: Masa Doluluk Senkronizasyonu
**Sorun:** Sipariş tamamlandığında masa "dolu" görünmeye devam ediyordu.

**Çözüm:**
1. DB trigger ile otomatik masa senkronizasyonu
2. `getMasalar()` fonksiyonunda tutarsız masaları otomatik düzeltme
3. `durumGuncelle()` ve `siparisSil()` fonksiyonlarına senkronizasyon eklendi
4. Aktif sipariş kontrolü `hazirlaniyor` + `hazir` durumlarını kapsıyor

**Migration:** `supabase/migrations/20260629300000_masa_durum_sync_fix.sql`

---

## 🎨 UI/UX

- **Skeleton Loaders** — Her sayfada yükleme iskeletleri
- **Framer Motion** — Sayfa geçişleri ve micro-animasyonlar
- **Realtime** — Supabase realtime ile anlık güncelleme
- **Toast** — Sonner ile zengin bildirimler
- **Responsive** — Mobil-first tasarım
- **Drag & Drop** — Masa sıralaması

---

*Restoran Pro — En iyi restoran yönetim sistemi* 🚀
