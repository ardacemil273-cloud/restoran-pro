-- 🏆 Garson Performans Sistemi
-- Garson bazlı sipariş takibi, performans metrikleri ve bonus hesaplaması

-- 1. Garsonlar tablosunu genişlet
ALTER TABLE garsonlar ADD COLUMN IF NOT EXISTS toplam_siparis INTEGER DEFAULT 0;
ALTER TABLE garsonlar ADD COLUMN IF NOT EXISTS toplam_ciro DECIMAL(10,2) DEFAULT 0;
ALTER TABLE garsonlar ADD COLUMN IF NOT EXISTS ortalama_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE garsonlar ADD COLUMN IF NOT EXISTS ortalama_sure INTEGER DEFAULT 0; -- dakika cinsinden
ALTER TABLE garsonlar ADD COLUMN IF NOT EXISTS son_gunluk_siparis INTEGER DEFAULT 0;
ALTER TABLE garsonlar ADD COLUMN IF NOT EXISTS son_gunluk_ciro DECIMAL(10,2) DEFAULT 0;

-- 2. Garson performans günlüğü
CREATE TABLE IF NOT EXISTS garson_performans_gunluk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  garson_id UUID NOT NULL REFERENCES garsonlar(id) ON DELETE CASCADE,
  tarih DATE NOT NULL DEFAULT CURRENT_DATE,
  siparis_sayisi INTEGER DEFAULT 0,
  toplam_ciro DECIMAL(10,2) DEFAULT 0,
  ortalama_sure INTEGER DEFAULT 0, -- dakika
  musteri_memnuniyeti DECIMAL(3,2) DEFAULT 0,
  bonus DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(restoran_id, garson_id, tarih)
);

-- 3. Sipariş değerlendirmesi
CREATE TABLE IF NOT EXISTS siparis_degerlendirmesi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  siparis_id UUID NOT NULL REFERENCES siparisler(id) ON DELETE CASCADE,
  garson_id UUID REFERENCES garsonlar(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  yorum TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 4. Trigger: Sipariş tamamlandığında garson istatistiklerini güncelle
CREATE OR REPLACE FUNCTION update_garson_stats()
RETURNS TRIGGER AS $$
DECLARE
  sure_dakika INTEGER;
BEGIN
  IF NEW.durum = 'tamamlandi' AND OLD.durum != 'tamamlandi' THEN
    sure_dakika := EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 60;
    
    -- Garson istatistiklerini güncelle
    UPDATE garsonlar
    SET 
      toplam_siparis = toplam_siparis + 1,
      toplam_ciro = toplam_ciro + NEW.toplam_tutar,
      ortalama_sure = ROUND((ortalama_sure * (toplam_siparis - 1) + sure_dakika) / toplam_siparis),
      son_gunluk_siparis = CASE 
        WHEN DATE(NOW()) = DATE(updated_at) THEN son_gunluk_siparis + 1 
        ELSE 1 
      END,
      son_gunluk_ciro = CASE 
        WHEN DATE(NOW()) = DATE(updated_at) THEN son_gunluk_ciro + NEW.toplam_tutar 
        ELSE NEW.toplam_tutar 
      END,
      updated_at = NOW()
    WHERE id = NEW.garson_id;

    -- Günlük performans kaydı oluştur/güncelle
    INSERT INTO garson_performans_gunluk (restoran_id, garson_id, tarih, siparis_sayisi, toplam_ciro, ortalama_sure)
    VALUES (NEW.restoran_id, NEW.garson_id, CURRENT_DATE, 1, NEW.toplam_tutar, sure_dakika)
    ON CONFLICT (restoran_id, garson_id, tarih) DO UPDATE SET
      siparis_sayisi = garson_performans_gunluk.siparis_sayisi + 1,
      toplam_ciro = garson_performans_gunluk.toplam_ciro + NEW.toplam_tutar,
      ortalama_sure = ROUND((garson_performans_gunluk.ortalama_sure * (garson_performans_gunluk.siparis_sayisi - 1) + sure_dakika) / garson_performans_gunluk.siparis_sayisi);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_garson_stats ON siparisler;
CREATE TRIGGER tr_update_garson_stats
  AFTER UPDATE ON siparisler
  FOR EACH ROW
  EXECUTE FUNCTION update_garson_stats();

-- 5. Trigger: Değerlendirme eklendiğinde rating güncelle
CREATE OR REPLACE FUNCTION update_garson_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE garsonlar
  SET ortalama_rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM siparis_degerlendirmesi
    WHERE garson_id = NEW.garson_id
  )
  WHERE id = NEW.garson_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_garson_rating ON siparis_degerlendirmesi;
CREATE TRIGGER tr_update_garson_rating
  AFTER INSERT ON siparis_degerlendirmesi
  FOR EACH ROW
  EXECUTE FUNCTION update_garson_rating();

-- 6. İndeksler
CREATE INDEX IF NOT EXISTS idx_garson_performans_gunluk_garson ON garson_performans_gunluk(garson_id);
CREATE INDEX IF NOT EXISTS idx_garson_performans_gunluk_tarih ON garson_performans_gunluk(tarih);
CREATE INDEX IF NOT EXISTS idx_siparis_degerlendirmesi_garson ON siparis_degerlendirmesi(garson_id);

-- 7. Row Level Security
ALTER TABLE garson_performans_gunluk ENABLE ROW LEVEL SECURITY;
ALTER TABLE siparis_degerlendirmesi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "garson_performans_gunluk_access" ON garson_performans_gunluk
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );

CREATE POLICY "siparis_degerlendirmesi_access" ON siparis_degerlendirmesi
  FOR SELECT USING (true);
