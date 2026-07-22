-- 🏢 Çoklu Şube (Multi-Branch) Yönetim Sistemi
-- Tek panelden 100+ restoranı yönet, bölge bazlı raporlar

-- 1. Şube Tablosu (Restoranlar Tablosunun Genişletilmesi)
CREATE TABLE IF NOT EXISTS subeler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sahibi_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ad TEXT NOT NULL,
  sehir TEXT NOT NULL,
  bolge TEXT, -- 'kuzey', 'guney', 'dogu', 'bati', 'merkez'
  adres TEXT,
  telefon TEXT,
  email TEXT,
  koordinat_lat DECIMAL(10,8),
  koordinat_lng DECIMAL(11,8),
  
  -- İşletme Bilgileri
  vergi_numarasi TEXT UNIQUE,
  ticaret_sicili TEXT,
  banka_hesap_iban TEXT,
  
  -- Kapasite
  masa_sayisi INTEGER DEFAULT 10,
  garson_sayisi INTEGER DEFAULT 5,
  
  -- Durum
  aktif BOOLEAN DEFAULT true,
  acilis_tarihi DATE,
  kapanma_tarihi DATE,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. Şube Performans Özeti
CREATE TABLE IF NOT EXISTS sube_performans_ozeti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sube_id UUID NOT NULL REFERENCES subeler(id) ON DELETE CASCADE,
  tarih DATE DEFAULT CURRENT_DATE,
  
  -- Finansal
  gunluk_ciro DECIMAL(10,2) DEFAULT 0,
  gunluk_gider DECIMAL(10,2) DEFAULT 0,
  gunluk_kar DECIMAL(10,2) DEFAULT 0,
  kar_marji DECIMAL(5,2) DEFAULT 0,
  
  -- Operasyon
  siparis_sayisi INTEGER DEFAULT 0,
  musteri_sayisi INTEGER DEFAULT 0,
  ortalama_siparis_degeri DECIMAL(10,2) DEFAULT 0,
  
  -- Kalite
  musteri_memnuniyeti DECIMAL(3,2) DEFAULT 0,
  siparis_iptal_orani DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(sube_id, tarih)
);

-- 3. Şubeler Arası Karşılaştırma
CREATE TABLE IF NOT EXISTS sube_karsilastirmasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sahibi_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sube1_id UUID NOT NULL REFERENCES subeler(id) ON DELETE CASCADE,
  sube2_id UUID NOT NULL REFERENCES subeler(id) ON DELETE CASCADE,
  
  -- Karşılaştırma Metrikleri
  ciro_farki DECIMAL(10,2),
  kar_farki DECIMAL(10,2),
  musteri_sayisi_farki INTEGER,
  performans_puani DECIMAL(5,2),
  
  -- Analiz
  sube1_daha_iyi BOOLEAN,
  neden TEXT,
  
  created_at TIMESTAMP DEFAULT now()
);

-- 4. Bölge Yönetimi
CREATE TABLE IF NOT EXISTS bolge_yonetimi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sahibi_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bolge_adi TEXT NOT NULL,
  bolge_kodu TEXT UNIQUE,
  
  -- Hedefler
  aylık_ciro_hedefi DECIMAL(10,2),
  aylık_siparis_hedefi INTEGER,
  
  -- Performans
  toplam_sube_sayisi INTEGER DEFAULT 0,
  toplam_ciro DECIMAL(10,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT now()
);

-- 5. Şube Kullanıcı Yetkileri
CREATE TABLE IF NOT EXISTS sube_kullanici_yetkileri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sube_id UUID NOT NULL REFERENCES subeler(id) ON DELETE CASCADE,
  kullanici_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rol TEXT DEFAULT 'manager', -- 'owner', 'manager', 'garson', 'muhasebe'
  
  -- İzinler
  siparisler_guncelle BOOLEAN DEFAULT true,
  raporlar_guncelle BOOLEAN DEFAULT false,
  finansal_guncelle BOOLEAN DEFAULT false,
  personel_guncelle BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(sube_id, kullanici_id)
);

-- 6. Şube Bazlı Veri Migrasyonu
CREATE OR REPLACE FUNCTION migrate_to_multi_branch()
RETURNS void AS $$
DECLARE
  v_sube_id UUID;
  v_sahibi_id UUID;
BEGIN
  -- Mevcut restoranları şubelere dönüştür
  FOR v_sahibi_id, v_sube_id IN
    SELECT sahibi_id, id FROM restoranlar
  LOOP
    INSERT INTO subeler (sahibi_id, ad, sehir, adres, telefon, email, aktif)
    SELECT 
      r.sahibi_id,
      r.ad,
      r.sehir,
      r.adres,
      r.telefon,
      r.email,
      true
    FROM restoranlar r
    WHERE r.id = v_sube_id
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 7. İndeksler
CREATE INDEX IF NOT EXISTS idx_subeler_sahibi ON subeler(sahibi_id);
CREATE INDEX IF NOT EXISTS idx_subeler_bolge ON subeler(bolge);
CREATE INDEX IF NOT EXISTS idx_sube_performans_sube ON sube_performans_ozeti(sube_id);
CREATE INDEX IF NOT EXISTS idx_sube_performans_tarih ON sube_performans_ozeti(tarih);
CREATE INDEX IF NOT EXISTS idx_sube_kullanici_yetkileri_sube ON sube_kullanici_yetkileri(sube_id);
CREATE INDEX IF NOT EXISTS idx_bolge_yonetimi_sahibi ON bolge_yonetimi(sahibi_id);

-- 8. Row Level Security
ALTER TABLE subeler ENABLE ROW LEVEL SECURITY;
ALTER TABLE sube_performans_ozeti ENABLE ROW LEVEL SECURITY;
ALTER TABLE sube_kullanici_yetkileri ENABLE ROW LEVEL SECURITY;
ALTER TABLE bolge_yonetimi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subeler_access" ON subeler
  FOR SELECT USING (
    sahibi_id = auth.uid() OR
    id IN (SELECT sube_id FROM sube_kullanici_yetkileri WHERE kullanici_id = auth.uid())
  );

CREATE POLICY "sube_performans_access" ON sube_performans_ozeti
  FOR SELECT USING (
    sube_id IN (
      SELECT id FROM subeler WHERE sahibi_id = auth.uid()
    )
  );
