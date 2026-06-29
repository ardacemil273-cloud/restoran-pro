-- 🚀 Feature Flags Sistemi
-- Restoran sahibi her özelliği tek tıkla açıp kapatabilir
-- restoranlar tablosuna ozellik_ayarlari JSONB kolonu ekle
ALTER TABLE restoranlar
  ADD COLUMN IF NOT EXISTS ozellik_ayarlari JSONB DEFAULT '{
    "otomatik_tedarik": {
      "aktif": true,
      "mod": "taslak",
      "aciklama": "Stok azalınca otomatik sipariş taslağı oluştur"
    },
    "cark_cevirme": {
      "aktif": false,
      "aciklama": "Müşteriler QR menüde çark çevirip ödül kazanabilir"
    },
    "sadakat_sistemi": {
      "aktif": true,
      "aciklama": "Puan biriktirme ve seviye sistemi"
    },
    "qr_kupon": {
      "aktif": false,
      "aciklama": "QR menüde özel kupon göster"
    },
    "ai_analiz": {
      "aktif": true,
      "aciklama": "Yapay zeka destekli satış analizi"
    },
    "whatsapp_siparis": {
      "aktif": false,
      "aciklama": "WhatsApp üzerinden sipariş alma"
    },
    "rezervasyon": {
      "aktif": true,
      "aciklama": "Online masa rezervasyonu"
    },
    "stok_tahmin": {
      "aktif": true,
      "aciklama": "AI ile stok tüketim tahmini"
    },
    "garson_performans": {
      "aktif": true,
      "aciklama": "Garson performans takibi ve puanlama"
    },
    "dinamik_fiyat": {
      "aktif": false,
      "aciklama": "Yoğun saatlerde otomatik fiyat ayarı"
    }
  }'::jsonb;

-- Otomatik tedarik siparişlerine onay modu ekle
ALTER TABLE otomatik_siparisler
  ADD COLUMN IF NOT EXISTS onay_durumu TEXT DEFAULT 'bekliyor' CHECK (onay_durumu IN ('bekliyor', 'onaylandi', 'reddedildi')),
  ADD COLUMN IF NOT EXISTS onaylayan_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS onay_tarihi TIMESTAMP,
  ADD COLUMN IF NOT EXISTS red_nedeni TEXT;

-- Çark çevirme kayıtları tablosu (müşteri bazlı)
CREATE TABLE IF NOT EXISTS cark_cevir_kayitlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  masa_id UUID REFERENCES masalar(id),
  musteri_telefon TEXT,
  odul_tipi TEXT NOT NULL, -- 'indirim', 'puan', 'ucretsiz_urun', 'bedava_icecek'
  odul_degeri DECIMAL(10,2),
  odul_aciklama TEXT,
  kupon_kodu TEXT UNIQUE,
  kullanildi BOOLEAN DEFAULT false,
  kullanim_tarihi TIMESTAMP,
  gecerlilik_tarihi TIMESTAMP DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMP DEFAULT now()
);

-- QR kupon tablosu
CREATE TABLE IF NOT EXISTS qr_kuponlar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  baslik TEXT NOT NULL,
  aciklama TEXT,
  indirim_tipi TEXT DEFAULT 'yuzde' CHECK (indirim_tipi IN ('yuzde', 'sabit')),
  indirim_degeri DECIMAL(10,2) NOT NULL,
  minimum_siparis DECIMAL(10,2) DEFAULT 0,
  kupon_kodu TEXT UNIQUE NOT NULL,
  aktif BOOLEAN DEFAULT true,
  kullanim_limiti INTEGER DEFAULT 100,
  kullanim_sayisi INTEGER DEFAULT 0,
  baslangic_tarihi TIMESTAMP DEFAULT now(),
  bitis_tarihi TIMESTAMP DEFAULT (now() + INTERVAL '30 days'),
  created_at TIMESTAMP DEFAULT now()
);

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_cark_cevir_restoran ON cark_cevir_kayitlari(restoran_id);
CREATE INDEX IF NOT EXISTS idx_cark_cevir_kupon ON cark_cevir_kayitlari(kupon_kodu);
CREATE INDEX IF NOT EXISTS idx_qr_kupon_restoran ON qr_kuponlar(restoran_id);
CREATE INDEX IF NOT EXISTS idx_qr_kupon_kod ON qr_kuponlar(kupon_kodu);
CREATE INDEX IF NOT EXISTS idx_otomatik_siparis_onay ON otomatik_siparisler(onay_durumu);
