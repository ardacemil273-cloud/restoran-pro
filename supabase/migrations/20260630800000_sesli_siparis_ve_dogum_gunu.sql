-- Sesli siparişler tablosu
CREATE TABLE IF NOT EXISTS sesli_siparisler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  masa_id BIGINT REFERENCES masalar(id),
  garson_id UUID REFERENCES auth.users(id),
  audio_url TEXT,
  transcribed_text TEXT,
  tip TEXT DEFAULT 'musteri' CHECK (tip IN ('musteri', 'garson')),
  durum TEXT DEFAULT 'beklemede' CHECK (durum IN ('beklemede', 'isleniyor', 'tamamlandi', 'iptal')),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Müşteri tablosuna doğum günü ve sadakat alanları ekle
ALTER TABLE musteriler
  ADD COLUMN IF NOT EXISTS dogum_tarihi DATE,
  ADD COLUMN IF NOT EXISTS sadakat_kartı_aktif BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS son_doğum_günü_indirim_tarihi TIMESTAMP;

-- Index'ler
CREATE INDEX IF NOT EXISTS idx_sesli_siparis_restoran ON sesli_siparisler(restoran_id);
CREATE INDEX IF NOT EXISTS idx_sesli_siparis_masa ON sesli_siparisler(masa_id);
CREATE INDEX IF NOT EXISTS idx_sesli_siparis_garson ON sesli_siparisler(garson_id);
CREATE INDEX IF NOT EXISTS idx_sesli_siparis_durum ON sesli_siparisler(durum);
CREATE INDEX IF NOT EXISTS idx_musteriler_dogum_tarihi ON musteriler(dogum_tarihi);
CREATE INDEX IF NOT EXISTS idx_musteriler_sadakat_aktif ON musteriler(sadakat_kartı_aktif);

-- Doğum günü indirim uyarı fonksiyonu (trigger)
CREATE OR REPLACE FUNCTION check_dogum_gunu_indirim()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dogum_tarihi IS NOT NULL THEN
    -- Doğum günü bugün mi?
    IF to_char(NEW.dogum_tarihi, 'MM-DD') = to_char(NOW(), 'MM-DD') THEN
      -- Son indirim 1 yıldan eski mi?
      IF NEW.son_doğum_günü_indirim_tarihi IS NULL 
         OR (NOW() - NEW.son_doğum_günü_indirim_tarihi) > INTERVAL '365 days' THEN
        NEW.son_doğum_günü_indirim_tarihi = NOW();
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_dogum_gunu_indirim
BEFORE UPDATE ON musteriler
FOR EACH ROW
EXECUTE FUNCTION check_dogum_gunu_indirim();
