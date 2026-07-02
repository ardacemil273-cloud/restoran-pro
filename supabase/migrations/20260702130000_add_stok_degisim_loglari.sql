-- Stok değişim logları tablosu
CREATE TABLE IF NOT EXISTS stok_degisim_loglari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  siparis_id UUID REFERENCES siparisler(id) ON DELETE SET NULL,
  islem_tipi VARCHAR(50) NOT NULL, -- 'siparis_tamamlandi', 'manuel_guncelleme', 'restock', vb.
  degisimler JSONB, -- [{urun_id, adet, yeniStok, basarili}, ...]
  notlar TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- İndeksler
CREATE INDEX idx_stok_degisim_restoran ON stok_degisim_loglari(restoran_id);
CREATE INDEX idx_stok_degisim_siparis ON stok_degisim_loglari(siparis_id);
CREATE INDEX idx_stok_degisim_tarih ON stok_degisim_loglari(created_at);

-- RLS Politikaları
ALTER TABLE stok_degisim_loglari ENABLE ROW LEVEL SECURITY;

-- Yönetici ve garsonlar kendi restoranlarının loglarını görebilir
CREATE POLICY "Restoranlar kendi stok loglarını görebilir"
  ON stok_degisim_loglari
  FOR SELECT
  USING (
    restoran_id IN (
      SELECT id FROM restoranlar WHERE user_id = auth.uid()
    )
  );

-- Yönetici logları oluşturabilir
CREATE POLICY "Restoranlar stok logları oluşturabilir"
  ON stok_degisim_loglari
  FOR INSERT
  WITH CHECK (
    restoran_id IN (
      SELECT id FROM restoranlar WHERE user_id = auth.uid()
    )
  );

-- Trigger: Ürün stok değiştiğinde otomatik log oluştur
CREATE OR REPLACE FUNCTION log_stok_degisimi()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stok IS DISTINCT FROM OLD.stok THEN
    INSERT INTO stok_degisim_loglari (
      restoran_id,
      islem_tipi,
      degisimler,
      notlar
    ) VALUES (
      NEW.restoran_id,
      'manuel_guncelleme',
      jsonb_build_array(
        jsonb_build_object(
          'urun_id', NEW.id,
          'urun_adi', NEW.ad,
          'eski_stok', OLD.stok,
          'yeni_stok', NEW.stok,
          'degisim', NEW.stok - OLD.stok
        )
      ),
      'Ürün stoku manuel olarak güncellendi'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı urunler tablosuna bağla
DROP TRIGGER IF EXISTS trigger_log_stok_degisimi ON urunler;
CREATE TRIGGER trigger_log_stok_degisimi
  AFTER UPDATE ON urunler
  FOR EACH ROW
  EXECUTE FUNCTION log_stok_degisimi();

-- Kritik stok uyarısı view'ı
CREATE OR REPLACE VIEW kritik_stok_urunler AS
SELECT 
  u.id,
  u.restoran_id,
  u.ad,
  u.stok,
  u.kritik_stok,
  (u.kritik_stok - u.stok) as eksik_adet,
  r.ad as restoran_adi
FROM urunler u
JOIN restoranlar r ON u.restoran_id = r.id
WHERE u.stok IS NOT NULL 
  AND u.kritik_stok IS NOT NULL
  AND u.stok <= u.kritik_stok
ORDER BY u.stok ASC;

-- Günlük stok raporu view'ı
CREATE OR REPLACE VIEW gunluk_stok_raporu AS
SELECT 
  DATE(sdl.created_at) as tarih,
  sdl.restoran_id,
  r.ad as restoran_adi,
  COUNT(*) as toplam_degisim,
  COUNT(CASE WHEN sdl.islem_tipi = 'siparis_tamamlandi' THEN 1 END) as siparis_tamamlandi_sayisi,
  COUNT(CASE WHEN sdl.islem_tipi = 'manuel_guncelleme' THEN 1 END) as manuel_guncelleme_sayisi
FROM stok_degisim_loglari sdl
JOIN restoranlar r ON sdl.restoran_id = r.id
GROUP BY DATE(sdl.created_at), sdl.restoran_id, r.ad
ORDER BY tarih DESC;
