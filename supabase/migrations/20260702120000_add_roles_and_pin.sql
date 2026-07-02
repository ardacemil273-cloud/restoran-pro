-- Kullanıcı Rolleri ve PIN Kodu Sistemi

-- 1. Enum: Kullanıcı Rolleri
CREATE TYPE user_role AS ENUM ('admin', 'garson', 'mutfak', 'kurye');

-- 2. Garsonlar Tablosu
CREATE TABLE IF NOT EXISTS garsonlar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Bilgiler
  ad VARCHAR(255) NOT NULL,
  telefon VARCHAR(20),
  email VARCHAR(255),
  
  -- Rol
  rol user_role DEFAULT 'garson',
  
  -- PIN Kodu (4 haneli)
  pin_kodu VARCHAR(4),
  pin_aktif BOOLEAN DEFAULT true,
  
  -- Durum
  aktif BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Yönetici Ayarları
CREATE TABLE IF NOT EXISTS yonetici_ayarlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL UNIQUE REFERENCES restoranlar(id) ON DELETE CASCADE,
  
  -- PIN Ayarları
  pin_zorunlu BOOLEAN DEFAULT true,
  pin_uzunlugu INTEGER DEFAULT 4,
  pin_oturum_suresi_dakika INTEGER DEFAULT 30,
  
  -- Güvenlik
  max_yanlis_giris INTEGER DEFAULT 3,
  
  -- Bildirimler
  bildirim_etkin BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. PIN Giriş Logları
CREATE TABLE IF NOT EXISTS pin_giris_loglari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  garson_id UUID REFERENCES garsonlar(id) ON DELETE SET NULL,
  
  -- Giriş Bilgileri
  pin_giris VARCHAR(4),
  basarili BOOLEAN,
  hata_mesaji TEXT,
  
  -- IP ve Device
  ip_adresi VARCHAR(45),
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. Oturum Yönetimi (PIN ile giriş sonrası)
CREATE TABLE IF NOT EXISTS pin_oturumlar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  garson_id UUID REFERENCES garsonlar(id) ON DELETE SET NULL,
  
  -- Oturum Bilgileri
  token VARCHAR(255) UNIQUE,
  acilis_tarihi TIMESTAMP WITH TIME ZONE DEFAULT now(),
  kapanma_tarihi TIMESTAMP WITH TIME ZONE,
  
  -- Durum
  aktif BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. İndeksler
CREATE INDEX idx_garsonlar_restoran_id ON garsonlar(restoran_id);
CREATE INDEX idx_garsonlar_user_id ON garsonlar(user_id);
CREATE INDEX idx_garsonlar_pin_kodu ON garsonlar(pin_kodu);
CREATE INDEX idx_pin_giris_loglari_restoran_id ON pin_giris_loglari(restoran_id);
CREATE INDEX idx_pin_giris_loglari_garson_id ON pin_giris_loglari(garson_id);
CREATE INDEX idx_pin_oturumlar_restoran_id ON pin_oturumlar(restoran_id);
CREATE INDEX idx_pin_oturumlar_token ON pin_oturumlar(token);

-- 7. RLS (Row Level Security) Politikaları
ALTER TABLE garsonlar ENABLE ROW LEVEL SECURITY;
ALTER TABLE yonetici_ayarlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_giris_loglari ENABLE ROW LEVEL SECURITY;
ALTER TABLE pin_oturumlar ENABLE ROW LEVEL SECURITY;

-- Garsonlar: Kullanıcı sadece kendi restoranının garsonlarını görebilir
CREATE POLICY "Kullanıcı kendi restoranının garsonlarını görebilir"
  ON garsonlar FOR SELECT
  USING (
    restoran_id IN (
      SELECT id FROM restoranlar WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Kullanıcı kendi restoranına garson ekleyebilir"
  ON garsonlar FOR INSERT
  WITH CHECK (
    restoran_id IN (
      SELECT id FROM restoranlar WHERE user_id = auth.uid()
    )
  );

-- Yönetici Ayarları: Sadece restoran sahibi görebilir
CREATE POLICY "Kullanıcı kendi restoranının ayarlarını görebilir"
  ON yonetici_ayarlari FOR SELECT
  USING (
    restoran_id IN (
      SELECT id FROM restoranlar WHERE user_id = auth.uid()
    )
  );

-- PIN Giriş Logları: Sadece restoran sahibi görebilir
CREATE POLICY "Kullanıcı kendi restoranının PIN loglarını görebilir"
  ON pin_giris_loglari FOR SELECT
  USING (
    restoran_id IN (
      SELECT id FROM restoranlar WHERE user_id = auth.uid()
    )
  );

-- PIN Oturumları: Sadece restoran sahibi görebilir
CREATE POLICY "Kullanıcı kendi restoranının PIN oturumlarını görebilir"
  ON pin_oturumlar FOR SELECT
  USING (
    restoran_id IN (
      SELECT id FROM restoranlar WHERE user_id = auth.uid()
    )
  );
