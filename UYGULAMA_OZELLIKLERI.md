# 🍽️ Restoran Pro - Uygulama Özellikleri

## 📱 Mobil Uygulama Deneyimi

### ✅ Alt Navigasyon Barı
- **Mobil cihazlarda** ekranın altında kalıcı navigasyon
- **5 ana sayfa** hızlı erişim: Ana Sayfa, Siparişler, Menü, Aramalar, Ayarlar
- **Animasyonlu geçişler** ve aktif sayfa göstergesi
- **Responsive tasarım**: Tablet ve masaüstünde gizli, mobilde görünür

### ✅ Sayfa Header Komponenti
- **Her sayfada** üst kısımda yapışkan header
- **Geri butonu** ile önceki sayfaya dönüş
- **Sayfa başlığı ve açıklama**
- **İkon ve sağ taraf aksiyonları**

### ✅ Gelen Arama Bildirimi
- **Gerçek zamanlı** arama bildirimi (Supabase Realtime)
- **Arayan numarası** büyük yazı ile gösterilir
- **Müşteri adı** (varsa kayıtlı müşteri)
- **3 buton**: Reddet, SMS Gönder, Yanıtla
- **Ses bildirimi** (tarayıcı izni varsa)

---

## 📞 Arayan Numara Tanıma (Caller ID)

### ✅ Webhook Endpoint
```
POST /api/caller-id
```

### ✅ Desteklenen Sistemler
- ✅ Asterisk PBX
- ✅ 3CX
- ✅ Avaya
- ✅ Cisco
- ✅ Grandstream
- ✅ Yealink
- ✅ Twilio
- ✅ Zapier
- ✅ Make (Integromat)
- ✅ Kendi yazılımınız (HTTP POST)

### ✅ Özellikler
- Otomatik müşteri tanıması
- Müşteri yoksa otomatik oluşturma
- Numarası normalize etme
- Arama kaydı oluşturma
- Canlı bildirim

### ✅ Kurulum Rehberi
Detaylı kurulum rehberi: `CALLER_ID_SETUP.md`

---

## 🪝 Sipariş Webhook Sistemi

### ✅ Webhook Endpoint
```
POST /api/siparis-webhook/gonder
```

### ✅ Ayarlar Endpoint
```
GET  /api/siparis-webhook/ayarlar?restoran_id=...
POST /api/siparis-webhook/ayarlar
```

### ✅ Özellikler
- Her yeni sipariş oluştuğunda webhook çağrısı
- İşletmenin kendi URL'sine POST isteği
- Güvenlik anahtarı desteği (Authorization header)
- JSON payload ile sipariş bilgileri
- Test butonu ile webhook test etme

### ✅ Gönderilen Veri
```json
{
  "event": "yeni_siparis",
  "timestamp": "2026-07-02T10:30:00Z",
  "restoran": {
    "id": "uuid",
    "ad": "Restoran Adı"
  },
  "siparis": {
    "id": "uuid",
    "masa": "Masa 1",
    "durum": "hazirlaniyor",
    "toplam_tutar": 150.00,
    "urunler": [
      {
        "ad": "Köfte",
        "adet": 2,
        "birim_fiyat": 75,
        "toplam": 150
      }
    ]
  }
}
```

---

## 🎨 UI/UX İyileştirmeleri

### ✅ Tasarım Özellikleri
- **Dark Mode**: Koyu tema tüm sayfalarda
- **Gradient Butonlar**: Renkli ve çekici butonlar
- **Animasyonlar**: Framer Motion ile smooth geçişler
- **Responsive**: Mobil, tablet, masaüstü uyumlu
- **Accessibility**: Keyboard navigasyonu ve screen reader desteği

### ✅ Renk Şeması
- **Primary**: Sarı (#f59e0b)
- **Secondary**: Mor (#a855f7)
- **Success**: Yeşil (#22c55e)
- **Warning**: Turuncu (#f97316)
- **Error**: Kırmızı (#ef4444)
- **Info**: Mavi (#3b82f6)

---

## 📊 Dashboard

### ✅ İstatistikler
- Bugün siparişler
- Bugün gelir
- Aktif masalar
- Bekleme siparişleri
- Yeni müşteriler
- Gelen aramalar
- Ortalama sipariş süresi
- Sistem durumu

### ✅ Hızlı Erişim
- 16 farklı sayfaya hızlı erişim
- Renkli ikonlar
- Hover efektleri

### ✅ Son Siparişler
- Son 5 siparişi gösterir
- Durum renkleri
- Saat ve fiyat bilgisi

---

## 🔒 Güvenlik

### ✅ Webhook Güvenliği
- HTTPS zorunlu
- Authorization header desteği
- Webhook secret şifreleme
- Rate limiting (opsiyonel)

### ✅ Veri Güvenliği
- Supabase Row Level Security (RLS)
- User authentication
- Restoran izolasyonu
- Şifreli bağlantılar

---

## 🚀 Performans

### ✅ Optimizasyonlar
- Lazy loading
- Image optimization
- Code splitting
- Caching stratejileri
- Real-time updates (Supabase Realtime)

### ✅ Sayfa Yükleme
- İlk yükleme: < 2 saniye
- Sayfa geçişleri: < 500ms
- API yanıtları: < 1 saniye

---

## 📱 Mobil Uyumluluğu

### ✅ Özellikler
- PWA (Progressive Web App) desteği
- Offline mod (kısıtlı)
- Home screen ekleme
- Splash screen
- App icon
- Safe area insets (notch desteği)

### ✅ Cihaz Desteği
- iOS 12+
- Android 8+
- Tablet desteği
- Landscape/Portrait

---

## 🔧 Teknik Stack

### Frontend
- **Framework**: Next.js 14
- **UI Library**: React 18
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: Sonner

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime
- **File Storage**: Supabase Storage
- **API**: Next.js API Routes

### Deployment
- **Hosting**: Vercel
- **Database**: Supabase Cloud
- **CDN**: Vercel Edge Network

---

## 📚 API Endpoints

### Sipariş Webhook
- `POST /api/siparis-webhook/gonder` - Sipariş gönder
- `GET /api/siparis-webhook/ayarlar` - Ayarları getir
- `POST /api/siparis-webhook/ayarlar` - Ayarları kaydet

### Arayan Numara
- `POST /api/caller-id` - Arama kaydı oluştur
- `GET /api/caller-id?test=true` - Test endpoint

### Telefon Webhook
- `POST /api/phone-webhook` - Arama kaydı oluştur
- `GET /api/phone-webhook?test=true` - Test endpoint

---

## 🎯 Kullanım Senaryoları

### 1. Sipariş Yönetimi
1. Siparişler sayfasına git
2. Yeni siparişi gör
3. Durumunu güncelle
4. Webhook otomatik gönderilir

### 2. Arayan Numara Tanıma
1. Santral'dan arama gelir
2. Webhook çağrılır
3. Bildirim ekranda çıkar
4. Numarayı tıkla → Müşteri kaydını aç

### 3. Webhook Entegrasyonu
1. Ayarlar → Webhook
2. URL gir (Zapier, Make, POS vb.)
3. Test Et butonuyla test et
4. Aktif yap
5. Her siparişte webhook çağrılır

---

## 🐛 Sorun Giderme

| Sorun | Çözüm |
|-------|-------|
| Bildirim çıkmıyor | Tarayıcı izinlerini kontrol et |
| Webhook çağrılmıyor | URL'yi kontrol et, test et |
| Arama kaydı oluşturulmuyor | Restoran telefon numarasını kaydet |
| Müşteri otomatik oluşturulmuyor | Numarası normalize edilip kontrol et |
| Mobil menü açılmıyor | Sayfa yenile, cache temizle |

---

## 📞 İletişim

**Sorular veya sorunlar için:**
- Email: support@restoranpro.com
- GitHub Issues: https://github.com/ardacemil273-cloud/restoran-pro/issues

---

## 📄 Lisans

MIT License - Özgürce kullanabilirsiniz

---

**Son Güncelleme**: 2 Temmuz 2026
**Versiyon**: 2.0.0
