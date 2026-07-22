-- Gider takibi tablosu
CREATE TABLE IF NOT EXISTS giderler (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  kategori TEXT NOT NULL DEFAULT 'diger',
  aciklama TEXT NOT NULL,
  tutar NUMERIC(10,2) NOT NULL,
  tarih DATE NOT NULL DEFAULT CURRENT_DATE,
  tekrar TEXT DEFAULT 'tek_seferlik',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_giderler_restoran ON giderler(restoran_id, tarih DESC);

ALTER TABLE giderler ENABLE ROW LEVEL SECURITY;

CREATE POLICY giderler_sahip_policy ON giderler
  FOR ALL
  USING (restoran_id IN (
    SELECT id FROM restoranlar WHERE sahibi_id = auth.uid()
  ));
