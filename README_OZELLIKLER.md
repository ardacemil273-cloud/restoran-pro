# 🍽️ Restoran Pro - Profesyonel Restoran Yönetim Sistemi

**Versiyon**: 1.0.0  
**Durum**: ✅ Production Ready  
**Son Güncelleme**: 02 Temmuz 2026

---

## 🎯 Uygulamanın Amacı

Restoran Pro, restoranların siparişlerini, masalarını, garsonlarını ve müşterilerini yönetmek için tasarlanmış **profesyonel, mobil-uyumlu, PWA destekli** bir yönetim sistemidir.

---

## ⭐ Temel Özellikler

### 1. **İkili Giriş Sistemi**
- **Yönetici Girişi**: E-posta + Şifre ile tam yetkili erişim
- **Personel Girişi**: 4 haneli PIN kodu ile hızlı giriş
- **Restoran Kodu**: Her restoranın benzersiz kodu
- **Oturum Yönetimi**: 30 dakika otomatik kapanma

### 2. **Garson Yönetimi**
- Garson ekle, düzenle, sil
- Her garson için ayrı PIN kodu
- PIN otomatik oluşturma
- PIN göster/gizle/kopyala
- Rol yönetimi (Garson, Mutfak, Kurye, Admin)
- Garson performans takibi

### 3. **Sipariş Yönetimi**
- Siparişleri gerçek zamanlı takip et
- Sipariş durumunu güncelle
- Masa bazlı siparişler
- Müşteri notları
- Sipariş geçmişi

### 4. **Masa Yönetimi**
- Masa haritası gösterimi
- Masa durumu (Boş, Meşgul, Rezerve)
- Masa kapasitesi
- Hızlı masa değiştirme

### 5. **Menü Yönetimi**
- Ürün ekleme/düzenleme/silme
- Kategori yönetimi
- Fiyat yönetimi
- Stok takibi
- Ürün görselleri

### 6. **Webhook Sistemi (Giden)**
- Siparişler otomatik harici sistemlere gönderilir
- Zapier, Make, POS sistemleri ile entegrasyon
- Webhook URL ve güvenlik anahtarı
- Test etme özelliği
- Webhook logları

### 7. **Yemeksepeti Entegrasyonu (Gelen)**
- Yemeksepeti'nden siparişleri otomatik al
- OAuth token yönetimi
- Webhook ile siparişleri karşıla
- Yemeksepeti ürün kataloğu senkronizasyonu
- Sipariş durumu geri bildirimi

### 8. **Arayan Numara Tanıma (Caller ID)**
- Santral sistemlerinden arama kaydı al
- Müşteri otomatik tanıması
- Canlı bildirim sistemi
- Ses bildirimi
- Arama reddetme, SMS gönderme, yanıtlama

### 9. **PWA (Progressive Web App)**
- Telefonlara gerçek uygulama olarak yükle
- Offline mod desteği
- Push bildirimleri
- Hızlı açılış (caching)
- Service Worker
- Android ve iOS desteği

### 10. **Dashboard**
- Canlı istatistikler (Satışlar, Siparişler, Masalar)
- Saatlik satış grafiği
- Sipariş durumu grafiği
- Hızlı erişim butonları
- Son siparişler listesi
- Kritik stok uyarıları

### 11. **Alt Navigasyon Barı**
- 5 ana sayfa hızlı erişim
- Mobil uyumlu tasarım
- Aktif sayfa göstergesi
- Bildirim badge'leri

### 12. **Güvenlik**
- Supabase Auth (E-posta/Şifre)
- PIN kodu şifrelemesi
- Row Level Security (RLS)
- Giriş logları
- Oturum yönetimi
- HTTPS şifreli bağlantı

---

## 📱 Kullanıcı Rolleri

| Rol | Erişim | Özellikler |
|-----|--------|-----------|
| **Yönetici** | Tam | Tüm ayarlar, Garson yönetimi, Raporlar, Webhook, Yemeksepeti |
| **Garson** | Sınırlı | Siparişler, Masalar, Menü, Müşteri notları |
| **Mutfak** | Sınırlı | Siparişler, Hazırlık durumu, Masalar |
| **Kurye** | Sınırlı | Teslimat siparişleri, Rota |

---

## 🔧 Teknik Mimarisi

### **Frontend**
- **Framework**: Next.js 14 (React 18)
- **Styling**: Tailwind CSS
- **Animasyonlar**: Framer Motion
- **Grafikler**: Recharts
- **UI Bileşenleri**: Lucide Icons
- **Durum Yönetimi**: React Hooks
- **Bildirimler**: Sonner Toast

### **Backend**
- **API Routes**: Next.js API Routes
- **Veritabanı**: Supabase (PostgreSQL)
- **Kimlik Doğrulama**: Supabase Auth
- **Gerçek Zamanlı**: Supabase Realtime
- **Dosya Depolama**: Supabase Storage

### **Harici Entegrasyonlar**
- **Yemeksepeti Partner API**: Sipariş alma
- **Santral Sistemleri**: Caller ID (Asterisk, 3CX, Avaya, vb.)
- **Webhook Alıcıları**: Zapier, Make, POS sistemleri
- **Push Bildirimleri**: Web Push API

### **PWA**
- **Service Worker**: Offline desteği ve caching
- **Manifest.json**: Uygulama metadata
- **Web App Icons**: Responsive ikonlar
- **Shortcuts**: Hızlı erişim

---

## 📊 Veritabanı Tabloları

| Tablo | Açıklama |
|-------|----------|
| `restoranlar` | Restoran bilgileri ve ayarları |
| `garsonlar` | Garson bilgileri ve PIN kodları |
| `siparisler` | Siparişler ve durumları |
| `masalar` | Masa bilgileri ve durumları |
| `urunler` | Menü ürünleri |
| `kategoriler` | Ürün kategorileri |
| `musteriler` | Müşteri bilgileri |
| `yemeksepeti_connections` | Yemeksepeti bağlantı bilgileri |
| `yemeksepeti_siparisler` | Yemeksepeti siparişleri |
| `pin_oturumlar` | Aktif PIN oturumları |
| `pin_giris_loglari` | PIN giriş denemeleri |
| `webhook_logs` | Webhook işlem logları |

---

## 🚀 Deployment

### **Vercel'de Deployment**
```bash
# 1. GitHub'a push et
git push origin main

# 2. Vercel otomatik deploy eder
# https://restoran-pro.vercel.app
```

### **Supabase Migrations**
```bash
# 1. Migrations'ları çalıştır
supabase db push

# 2. Veya manuel olarak SQL'i çalıştır
# supabase/migrations/ klasöründeki dosyaları sırayla çalıştır
```

### **Environment Variables**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

---

## 📖 Rehberler

### **Yönetici Rehberi**
1. **Giriş Yap**: E-posta + Şifre
2. **Garson Ekle**: Ayarlar → Garson Yönetimi
3. **Restoran Kodu Kopyala**: Ayarlar → Restoran Bilgileri
4. **Garsonlara Talimat Ver**: Restoran Kodu + PIN
5. **Siparişleri Takip Et**: Dashboard ve Siparişler

### **Personel Rehberi**
1. **Uygulamayı Aç**: Personel Girişi seç
2. **Restoran Kodu Gir**: Yöneticiden aldığı kod
3. **PIN Gir**: 4 haneli PIN
4. **Giriş Yap**: Personel paneline gir
5. **Siparişleri Yönet**: Siparişler sayfasında

### **PWA Kurulum Rehberi**
- **Android**: Chrome → 3 nokta → Uygulamayı Yükle
- **iOS**: Safari → Paylaş → Ana Ekrana Ekle
- Bkz: `/pwa-yonetimi` sayfası

---

## 🔌 API Endpoints

### **Giriş**
- `POST /api/auth/pin` - PIN doğrulama
- `POST /api/auth/logout` - Oturum kapat

### **Siparişler**
- `GET /api/siparisler` - Siparişleri listele
- `POST /api/siparisler` - Yeni sipariş oluştur
- `PUT /api/siparisler/[id]` - Siparişi güncelle

### **Webhook**
- `POST /api/siparis-webhook/gonder` - Sipariş gönder
- `GET /api/siparis-webhook/ayarlar` - Webhook ayarlarını al
- `POST /api/siparis-webhook/ayarlar` - Webhook ayarlarını kaydet

### **Yemeksepeti**
- `POST /api/yemeksepeti/auth` - OAuth token oluştur
- `POST /api/yemeksepeti/webhook` - Yemeksepeti webhook'unu al

### **Caller ID**
- `POST /api/caller-id` - Arama kaydı oluştur

### **Test**
- `POST /api/test/webhook-simulator` - Webhook test et

---

## 🎨 Tasarım Özellikleri

### **Renkler**
- **Primary**: #f59e0b (Turuncu)
- **Secondary**: #3b82f6 (Mavi)
- **Success**: #22c55e (Yeşil)
- **Danger**: #ef4444 (Kırmızı)
- **Warning**: #f59e0b (Sarı)

### **Tipografi**
- **Font**: System fonts (Responsive)
- **Başlıklar**: Bold/Black
- **Gövde**: Regular/Medium

### **Animasyonlar**
- **Sayfa Geçişleri**: Fade + Slide
- **Buton Etkileşimleri**: Scale + Hover
- **Modal Açılışı**: Scale + Fade
- **Listeleme**: Stagger

---

## 📱 Responsive Tasarım

| Cihaz | Breakpoint | Özellikleri |
|-------|-----------|-----------|
| **Mobil** | < 768px | Tek sütun, Alt nav, Touch optimized |
| **Tablet** | 768px - 1024px | İki sütun, Yan nav |
| **Desktop** | > 1024px | Üç sütun, Yan nav, Tam özellikler |

---

## ⚡ Performans

- **Sayfa Yükleme**: < 2 saniye
- **API Yanıt**: < 500ms
- **Lighthouse Score**: 90+
- **PWA Score**: 95+
- **Caching**: Service Worker
- **Compression**: Gzip

---

## 🔒 Güvenlik Özellikleri

- HTTPS şifreli bağlantı
- Supabase Auth (OAuth2)
- Row Level Security (RLS)
- PIN kodu şifrelemesi
- Giriş logları
- Oturum yönetimi
- CORS koruması
- Rate limiting

---

## 🐛 Bilinen Sınırlamalar

- Maksimum 10,000 siparişi/gün (Supabase free tier)
- Maksimum 100 MB dosya depolama
- 30 dakika PIN oturum süresi
- Offline mod sadece cached sayfalar

---

## 🚀 Sonraki Adımlar

### **Faz 2 - İleri Özellikler**
- AI destekli sipariş tahmini
- Müşteri sadakat programı
- Otomatik raporlama
- Çok dilli destek

### **Faz 3 - Entegrasyonlar**
- Diğer delivery platformları
- Muhasebe yazılımları
- POS sistemleri
- SMS/WhatsApp

### **Faz 4 - Mobil Uygulamalar**
- Native iOS uygulaması
- Native Android uygulaması
- Tablet versiyonu

---

## 📞 Destek ve İletişim

### **Rehberler**
- Personel Girişi: `/personel-giris-rehberi`
- PWA Kurulum: `/pwa-yonetimi`
- Yemeksepeti: `YEMEKSEPETI_KURULUM_REHBERI.md`
- Final Kontrol: `FINAL_SISTEM_KONTROL.md`

### **Teknik Destek**
- GitHub: `ardacemil273-cloud/restoran-pro`
- Issues: GitHub Issues sayfası
- Discussions: GitHub Discussions

---

## 📄 Lisans

Bu proje özel olarak geliştirilmiştir. Tüm hakları saklıdır.

---

## 🎉 Teşekkürler

Restoran Pro'yu kullandığınız için teşekkür ederiz!

**Başarılar dileriz!** 🚀

---

**Restoran Pro v1.0.0**  
*Profesyonel Restoran Yönetim Sistemi*  
*02 Temmuz 2026*
