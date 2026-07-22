-- 📱 WhatsApp Sipariş Entegrasyonu + Canlı Kurye Takip Sistemi
-- Müşteriler WhatsApp'tan sipariş verebilir, kurye takibi gerçek zamanlı

-- 1. WhatsApp Entegrasyonu
CREATE TABLE IF NOT EXISTS whatsapp_siparisler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  musteri_telefon TEXT NOT NULL,
  musteri_adi TEXT,
  mesaj TEXT NOT NULL,
  siparis_id UUID REFERENCES siparisler(id),
  durum TEXT DEFAULT 'bekleniyor', -- 'bekleniyor', 'isleniyor', 'tamamlandi', 'iptal'
  ozel_istekler TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. Kurye Yönetimi
CREATE TABLE IF NOT EXISTS kuryeler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  ad TEXT NOT NULL,
  telefon TEXT NOT NULL,
  plaka TEXT,
  durum TEXT DEFAULT 'bos', -- 'bos', 'teslimde', 'dolu'
  konum_lat DECIMAL(10,8),
  konum_lng DECIMAL(11,8),
  teslim_edilen_siparis_sayisi INTEGER DEFAULT 0,
  ortalama_teslimat_suresi INTEGER DEFAULT 0, -- dakika
  rating DECIMAL(3,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 3. Kurye Takip Geçmişi
CREATE TABLE IF NOT EXISTS kurye_takip (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siparis_id UUID NOT NULL REFERENCES siparisler(id) ON DELETE CASCADE,
  kurye_id UUID NOT NULL REFERENCES kuryeler(id) ON DELETE CASCADE,
  konum_lat DECIMAL(10,8),
  konum_lng DECIMAL(11,8),
  durum TEXT, -- 'teslim_alindi', 'yolda', 'teslim_edildi'
  mesafe_km DECIMAL(5,2),
  tahmini_sure_dakika INTEGER,
  created_at TIMESTAMP DEFAULT now()
);

-- 4. Canlı Kurye Takip Linki
CREATE TABLE IF NOT EXISTS kurye_takip_linki (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siparis_id UUID NOT NULL REFERENCES siparisler(id) ON DELETE CASCADE,
  kurye_id UUID REFERENCES kuryeler(id),
  token TEXT UNIQUE NOT NULL,
  musteri_telefon TEXT,
  olusturulma_tarihi TIMESTAMP DEFAULT now(),
  son_erisme_tarihi TIMESTAMP,
  aktif BOOLEAN DEFAULT true
);

-- 5. Kurye Performans
CREATE TABLE IF NOT EXISTS kurye_performans_gunluk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  kurye_id UUID NOT NULL REFERENCES kuryeler(id) ON DELETE CASCADE,
  tarih DATE NOT NULL DEFAULT CURRENT_DATE,
  teslim_sayisi INTEGER DEFAULT 0,
  toplam_kilometre DECIMAL(10,2) DEFAULT 0,
  ortalama_teslimat_suresi INTEGER DEFAULT 0,
  musteri_memnuniyeti DECIMAL(3,2) DEFAULT 0,
  kazanc DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(restoran_id, kurye_id, tarih)
);

-- 6. Trigger: Kurye konum güncellendiğinde tahmini süre hesapla
CREATE OR REPLACE FUNCTION update_kurye_tahmini_sure()
RETURNS TRIGGER AS $$
BEGIN
  -- Tahmini süre = mesafe_km / 30 * 60 (30km/saat ortalama hız)
  NEW.tahmini_sure_dakika := ROUND((NEW.mesafe_km / 30.0) * 60);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_kurye_tahmini_sure ON kurye_takip;
CREATE TRIGGER tr_update_kurye_tahmini_sure
  BEFORE INSERT ON kurye_takip
  FOR EACH ROW
  EXECUTE FUNCTION update_kurye_tahmini_sure();

-- 7. Trigger: Kurye teslim ettiğinde performans güncelle
CREATE OR REPLACE FUNCTION update_kurye_performans()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.durum = 'teslim_edildi' AND OLD.durum != 'teslim_edildi' THEN
    UPDATE kuryeler
    SET 
      teslim_edilen_siparis_sayisi = teslim_edilen_siparis_sayisi + 1,
      updated_at = NOW()
    WHERE id = NEW.kurye_id;

    INSERT INTO kurye_performans_gunluk (restoran_id, kurye_id, tarih, teslim_sayisi)
    SELECT NEW.restoran_id, NEW.kurye_id, CURRENT_DATE, 1
    FROM siparisler
    WHERE id = NEW.siparis_id
    ON CONFLICT (restoran_id, kurye_id, tarih) DO UPDATE SET
      teslim_sayisi = kurye_performans_gunluk.teslim_sayisi + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_kurye_performans ON siparisler;
CREATE TRIGGER tr_update_kurye_performans
  AFTER UPDATE ON siparisler
  FOR EACH ROW
  EXECUTE FUNCTION update_kurye_performans();

-- 8. İndeksler
CREATE INDEX IF NOT EXISTS idx_whatsapp_siparisler_restoran ON whatsapp_siparisler(restoran_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_siparisler_telefon ON whatsapp_siparisler(musteri_telefon);
CREATE INDEX IF NOT EXISTS idx_kuryeler_restoran ON kuryeler(restoran_id);
CREATE INDEX IF NOT EXISTS idx_kurye_takip_siparis ON kurye_takip(siparis_id);
CREATE INDEX IF NOT EXISTS idx_kurye_takip_linki_token ON kurye_takip_linki(token);
CREATE INDEX IF NOT EXISTS idx_kurye_performans_gunluk_kurye ON kurye_performans_gunluk(kurye_id);

-- 9. Row Level Security
ALTER TABLE whatsapp_siparisler ENABLE ROW LEVEL SECURITY;
ALTER TABLE kuryeler ENABLE ROW LEVEL SECURITY;
ALTER TABLE kurye_takip ENABLE ROW LEVEL SECURITY;
ALTER TABLE kurye_takip_linki ENABLE ROW LEVEL SECURITY;
ALTER TABLE kurye_performans_gunluk ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_siparisler_access" ON whatsapp_siparisler
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );

CREATE POLICY "kuryeler_access" ON kuryeler
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );

CREATE POLICY "kurye_takip_access" ON kurye_takip
  FOR SELECT USING (true);

CREATE POLICY "kurye_takip_linki_access" ON kurye_takip_linki
  FOR SELECT USING (true);

CREATE POLICY "kurye_performans_gunluk_access" ON kurye_performans_gunluk
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );
