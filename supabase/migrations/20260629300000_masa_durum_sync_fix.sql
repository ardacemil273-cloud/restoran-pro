-- 🔧 Masa Doluluk Senkronizasyonu Fix
-- Bu migration, masa.durum alanını siparisler tablosuyla senkronize eder.
-- Aktif siparişi olmayan ama 'dolu' görünen masaları 'bos' yapar.

-- 1. Mevcut tutarsız masaları düzelt
UPDATE masalar
SET durum = 'bos'
WHERE durum = 'dolu'
  AND id NOT IN (
    SELECT DISTINCT masa_id
    FROM siparisler
    WHERE masa_id IS NOT NULL
      AND durum IN ('hazirlaniyor', 'hazir')
  );

-- 2. masalar tablosuna sira kolonu yoksa ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'masalar' AND column_name = 'sira'
  ) THEN
    ALTER TABLE masalar ADD COLUMN sira INTEGER DEFAULT 0;
    -- Mevcut masalara sıra numarası ver
    WITH numbered AS (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY restoran_id ORDER BY ad) - 1 as row_num
      FROM masalar
    )
    UPDATE masalar SET sira = numbered.row_num
    FROM numbered WHERE masalar.id = numbered.id;
  END IF;
END $$;

-- 3. masalar tablosuna kapasite kolonu yoksa ekle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'masalar' AND column_name = 'kapasite'
  ) THEN
    ALTER TABLE masalar ADD COLUMN kapasite INTEGER DEFAULT 4;
  END IF;
END $$;

-- 4. Masa durum otomatik senkronizasyon için trigger oluştur
CREATE OR REPLACE FUNCTION sync_masa_durum()
RETURNS TRIGGER AS $$
BEGIN
  -- Sipariş tamamlandı veya iptal edildi ise masayı kontrol et
  IF (NEW.durum IN ('tamamlandi', 'iptal', 'odendi')) AND NEW.masa_id IS NOT NULL THEN
    -- Bu masada hala aktif sipariş var mı?
    IF NOT EXISTS (
      SELECT 1 FROM siparisler
      WHERE masa_id = NEW.masa_id
        AND durum IN ('hazirlaniyor', 'hazir')
        AND id != NEW.id
    ) THEN
      -- Aktif sipariş yoksa masayı boşa al
      UPDATE masalar SET durum = 'bos' WHERE id = NEW.masa_id;
    END IF;
  END IF;

  -- Sipariş oluşturuldu veya aktif hale geldi ise masayı dolu yap
  IF (NEW.durum IN ('hazirlaniyor', 'hazir')) AND NEW.masa_id IS NOT NULL THEN
    UPDATE masalar SET durum = 'dolu' WHERE id = NEW.masa_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger'ı ekle (varsa önce sil)
DROP TRIGGER IF EXISTS tr_sync_masa_durum ON siparisler;
CREATE TRIGGER tr_sync_masa_durum
  AFTER INSERT OR UPDATE OF durum ON siparisler
  FOR EACH ROW
  EXECUTE FUNCTION sync_masa_durum();

-- 5. Sonuç raporu
SELECT
  COUNT(*) FILTER (WHERE durum = 'bos') as bos_masa,
  COUNT(*) FILTER (WHERE durum = 'dolu') as dolu_masa,
  COUNT(*) as toplam_masa
FROM masalar;
