-- 🎯 Müşteri Sadakat Sistemi
-- Müşteri profili, sadakat puanları ve indirim yönetimi

-- 1. Müşteri tablosunu genişlet (sadakat alanları ekle)
ALTER TABLE musteriler ADD COLUMN IF NOT EXISTS toplam_harcama DECIMAL(10,2) DEFAULT 0;
ALTER TABLE musteriler ADD COLUMN IF NOT EXISTS sadakat_puani INTEGER DEFAULT 0;
ALTER TABLE musteriler ADD COLUMN IF NOT EXISTS dogum_tarihi DATE;
ALTER TABLE musteriler ADD COLUMN IF NOT EXISTS son_ziyaret DATE;
ALTER TABLE musteriler ADD COLUMN IF NOT EXISTS ziyaret_sayisi INTEGER DEFAULT 0;
ALTER TABLE musteriler ADD COLUMN IF NOT EXISTS mudavim BOOLEAN DEFAULT false;
ALTER TABLE musteriler ADD COLUMN IF NOT EXISTS notlar TEXT;

-- 2. Sadakat işlemleri tablosu
CREATE TABLE IF NOT EXISTS sadakat_islemleri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  musteri_id UUID NOT NULL REFERENCES musteriler(id) ON DELETE CASCADE,
  tip VARCHAR(20) NOT NULL, -- 'kazanc' (puan kazandı), 'harcama' (puan harcadı), 'bonus'
  miktar INTEGER NOT NULL,
  aciklama TEXT,
  siparis_id UUID REFERENCES siparisler(id),
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT valid_tip CHECK (tip IN ('kazanc', 'harcama', 'bonus'))
);

-- 3. İndirim kuponları
CREATE TABLE IF NOT EXISTS indirim_kuponlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  musteri_id UUID REFERENCES musteriler(id),
  kod VARCHAR(20) UNIQUE NOT NULL,
  indirim_orani DECIMAL(3,2), -- 0.10 = %10
  indirim_tutari DECIMAL(10,2),
  min_tutar DECIMAL(10,2),
  max_tutar DECIMAL(10,2),
  kullanildi BOOLEAN DEFAULT false,
  kullanilma_tarihi TIMESTAMP,
  gecerli_baslangic DATE NOT NULL,
  gecerli_bitis DATE NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- 4. Trigger: Sipariş tamamlandığında puan ekle
CREATE OR REPLACE FUNCTION add_loyalty_points()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.durum = 'tamamlandi' AND OLD.durum != 'tamamlandi' THEN
    -- Puan hesapla: her 10₺ = 1 puan
    INSERT INTO sadakat_islemleri (restoran_id, musteri_id, tip, miktar, aciklama, siparis_id)
    VALUES (
      NEW.restoran_id,
      NEW.musteri_id,
      'kazanc',
      FLOOR(NEW.toplam_tutar / 10)::INTEGER,
      'Sipariş tamamlanması ile kazanılan puan',
      NEW.id
    );

    -- Müşteri istatistiklerini güncelle
    UPDATE musteriler
    SET 
      toplam_harcama = toplam_harcama + NEW.toplam_tutar,
      sadakat_puani = sadakat_puani + FLOOR(NEW.toplam_tutar / 10)::INTEGER,
      son_ziyaret = NOW(),
      ziyaret_sayisi = ziyaret_sayisi + 1,
      mudavim = CASE WHEN ziyaret_sayisi >= 10 THEN true ELSE mudavim END
    WHERE id = NEW.musteri_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_add_loyalty_points ON siparisler;
CREATE TRIGGER tr_add_loyalty_points
  AFTER UPDATE ON siparisler
  FOR EACH ROW
  EXECUTE FUNCTION add_loyalty_points();

-- 5. İndeksler
CREATE INDEX IF NOT EXISTS idx_sadakat_islemleri_musteri ON sadakat_islemleri(musteri_id);
CREATE INDEX IF NOT EXISTS idx_sadakat_islemleri_restoran ON sadakat_islemleri(restoran_id);
CREATE INDEX IF NOT EXISTS idx_indirim_kuponlari_musteri ON indirim_kuponlari(musteri_id);
CREATE INDEX IF NOT EXISTS idx_indirim_kuponlari_kod ON indirim_kuponlari(kod);
CREATE INDEX IF NOT EXISTS idx_musteriler_mudavim ON musteriler(mudavim);

-- 6. Row Level Security
ALTER TABLE sadakat_islemleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE indirim_kuponlari ENABLE ROW LEVEL SECURITY;

-- Müşteri sadakat işlemlerini sadece kendi restoranı görebilir
CREATE POLICY "sadakat_islemleri_restoran_access" ON sadakat_islemleri
  FOR SELECT USING (
    restoran_id IN (
      SELECT id FROM restoranlar WHERE sahibi_id = auth.uid()
    )
  );

-- Kuponları sadece kendi restoranı görebilir
CREATE POLICY "indirim_kuponlari_restoran_access" ON indirim_kuponlari
  FOR SELECT USING (
    restoran_id IN (
      SELECT id FROM restoranlar WHERE sahibi_id = auth.uid()
    )
  );
