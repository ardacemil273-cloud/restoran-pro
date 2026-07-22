-- Doğum günü indirimleri tablosu
CREATE TABLE IF NOT EXISTS dogum_gunu_indirimler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  musteri_id UUID NOT NULL REFERENCES musteriler(id) ON DELETE CASCADE,
  indirim_orani DECIMAL(5,2) DEFAULT 20,
  kullanildi BOOLEAN DEFAULT false,
  kullanim_tarihi TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  gecerlilik_tarihi TIMESTAMP DEFAULT (now() + INTERVAL '24 hours')
);

-- Bildirimler tablosu (SMS, WhatsApp, Email vb.)
CREATE TABLE IF NOT EXISTS bildirimler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID REFERENCES restoranlar(id) ON DELETE CASCADE,
  musteri_id UUID REFERENCES musteriler(id) ON DELETE CASCADE,
  musteri_adi TEXT,
  telefon TEXT,
  email TEXT,
  mesaj TEXT NOT NULL,
  tip TEXT DEFAULT 'dogum_gunu' CHECK (tip IN ('dogum_gunu', 'siparis_hazir', 'promosyon', 'genel')),
  gonderildi BOOLEAN DEFAULT false,
  gonderim_tarihi TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Sesli siparişlere AI analiz alanları ekle
ALTER TABLE sesli_siparisler
  ADD COLUMN IF NOT EXISTS mutfak_notlari TEXT,
  ADD COLUMN IF NOT EXISTS urunler_json JSONB,
  ADD COLUMN IF NOT EXISTS ozel_istekler TEXT[];

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_dogum_gunu_indirim_restoran ON dogum_gunu_indirimler(restoran_id);
CREATE INDEX IF NOT EXISTS idx_dogum_gunu_indirim_musteri ON dogum_gunu_indirimler(musteri_id);
CREATE INDEX IF NOT EXISTS idx_bildirim_restoran ON bildirimler(restoran_id);
CREATE INDEX IF NOT EXISTS idx_bildirim_musteri ON bildirimler(musteri_id);
CREATE INDEX IF NOT EXISTS idx_bildirim_tip ON bildirimler(tip);
CREATE INDEX IF NOT EXISTS idx_bildirim_gonderildi ON bildirimler(gonderildi);
