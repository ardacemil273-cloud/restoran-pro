-- Arama kayıtları tablosu oluşturuluyor
-- Telefon webhook sistemi için gerekli

CREATE TABLE IF NOT EXISTS arama_kayitlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  musteri_id BIGINT REFERENCES musteriler(id) ON DELETE SET NULL,
  arayan_numara VARCHAR(20) NOT NULL,
  alici_numara VARCHAR(20),
  arama_tarihi TIMESTAMPTZ DEFAULT NOW(),
  sure INTEGER DEFAULT 0,
  durum VARCHAR(50) DEFAULT 'completed',
  kaynak_sistem VARCHAR(50) DEFAULT 'webhook',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performans için index'ler
CREATE INDEX IF NOT EXISTS idx_arama_kayitlari_restoran ON arama_kayitlari(restoran_id, arama_tarihi DESC);
CREATE INDEX IF NOT EXISTS idx_arama_kayitlari_numara ON arama_kayitlari(restoran_id, arayan_numara);
CREATE INDEX IF NOT EXISTS idx_arama_kayitlari_musteri ON arama_kayitlari(musteri_id);

-- RLS (Row Level Security) etkinleştir
ALTER TABLE arama_kayitlari ENABLE ROW LEVEL SECURITY;

-- Restoran sahibi kendi arama kayıtlarını görebilir
CREATE POLICY "Restoran sahibi arama kayıtlarını görebilir"
  ON arama_kayitlari
  FOR SELECT
  USING (
    restoran_id IN (
      SELECT id FROM restoranlar WHERE sahibi_id = auth.uid()
    )
  );

-- Restoran sahibi arama kaydı ekleyebilir
CREATE POLICY "Restoran sahibi arama kaydı ekleyebilir"
  ON arama_kayitlari
  FOR INSERT
  WITH CHECK (
    restoran_id IN (
      SELECT id FROM restoranlar WHERE sahibi_id = auth.uid()
    )
  );

-- Service role (webhook) arama kaydı ekleyebilir
CREATE POLICY "Service role arama kaydı ekleyebilir"
  ON arama_kayitlari
  FOR INSERT
  WITH CHECK (true);

-- Restoran sahibi arama kaydı silebilir
CREATE POLICY "Restoran sahibi arama kaydı silebilir"
  ON arama_kayitlari
  FOR DELETE
  USING (
    restoran_id IN (
      SELECT id FROM restoranlar WHERE sahibi_id = auth.uid()
    )
  );
