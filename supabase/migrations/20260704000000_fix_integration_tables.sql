-- Yemeksepeti connections tablosuna updated_at ekle (yoksa)
ALTER TABLE yemeksepeti_connections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- GetirYemek connections tablosuna updated_at ekle (yoksa)
ALTER TABLE getir_yemek_connections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Trendyol connections tablosuna updated_at ekle (yoksa)
ALTER TABLE trendyol_yemek_connections ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Yemeksepeti connections tablosuna unique constraint ekle (yoksa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'yemeksepeti_connections_restoran_id_key'
  ) THEN
    ALTER TABLE yemeksepeti_connections ADD CONSTRAINT yemeksepeti_connections_restoran_id_key UNIQUE (restoran_id);
  END IF;
END $$;

-- GetirYemek connections tablosuna unique constraint ekle (yoksa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'getir_yemek_connections_restoran_id_key'
  ) THEN
    ALTER TABLE getir_yemek_connections ADD CONSTRAINT getir_yemek_connections_restoran_id_key UNIQUE (restoran_id);
  END IF;
END $$;

-- Trendyol connections tablosuna unique constraint ekle (yoksa)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'trendyol_yemek_connections_restoran_id_key'
  ) THEN
    ALTER TABLE trendyol_yemek_connections ADD CONSTRAINT trendyol_yemek_connections_restoran_id_key UNIQUE (restoran_id);
  END IF;
END $$;
