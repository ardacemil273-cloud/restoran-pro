-- 🤖 AI Sesli Sipariş + Dinamik Fiyatlandırma Sistemi
-- Müşteriler sesle sipariş verebilir, fiyatlar yoğunluğa göre otomatik değişir

-- 1. AI Sesli Sipariş Geçmişi
CREATE TABLE IF NOT EXISTS ai_sesli_siparisler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  musteri_telefon TEXT NOT NULL,
  musteri_adi TEXT,
  ses_dosyasi_url TEXT,
  transkripsiyon TEXT NOT NULL,
  anlas_yuzde DECIMAL(3,2) DEFAULT 0, -- AI'nin anlama başarısı %
  siparis_id UUID REFERENCES siparisler(id),
  durum TEXT DEFAULT 'bekleniyor', -- 'bekleniyor', 'isleniyor', 'tamamlandi', 'iptal'
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. Dinamik Fiyatlandırma Kuralları
CREATE TABLE IF NOT EXISTS dinamik_fiyatlandirma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  urun_id UUID NOT NULL REFERENCES urunler(id) ON DELETE CASCADE,
  taban_fiyat DECIMAL(10,2) NOT NULL,
  
  -- Zaman bazlı fiyatlandırma
  sabah_fiyat DECIMAL(10,2), -- 06:00-11:00
  ogle_fiyat DECIMAL(10,2), -- 11:00-15:00
  aksam_fiyat DECIMAL(10,2), -- 15:00-21:00
  gece_fiyat DECIMAL(10,2), -- 21:00-06:00
  
  -- Yoğunluk bazlı fiyatlandırma
  dusuk_yogunluk_indirim DECIMAL(3,2) DEFAULT 0, -- % indirim
  yuksek_yogunluk_artis DECIMAL(3,2) DEFAULT 0, -- % artış
  
  -- Hava durumu bazlı
  yagmur_artis DECIMAL(3,2) DEFAULT 0, -- Yağmurda %
  kar_artis DECIMAL(3,2) DEFAULT 0, -- Karda %
  
  -- Gün bazlı
  hafta_sonu_artis DECIMAL(3,2) DEFAULT 0, -- Cumartesi-Pazar %
  
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(restoran_id, urun_id)
);

-- 3. Gerçek Zamanlı Fiyat Geçmişi
CREATE TABLE IF NOT EXISTS fiyat_gecmisi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  urun_id UUID NOT NULL REFERENCES urunler(id) ON DELETE CASCADE,
  eski_fiyat DECIMAL(10,2),
  yeni_fiyat DECIMAL(10,2),
  degisim_nedeni TEXT, -- 'yogunluk', 'hava', 'gun', 'zaman'
  degisim_yuzde DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT now()
);

-- 4. Yoğunluk Takibi (Saatlik)
CREATE TABLE IF NOT EXISTS yogunluk_saatlik (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  saat DATE NOT NULL DEFAULT CURRENT_DATE,
  saat_dilimi INTEGER NOT NULL, -- 0-23
  siparis_sayisi INTEGER DEFAULT 0,
  ortalama_siparis_degeri DECIMAL(10,2) DEFAULT 0,
  yogunluk_seviyesi TEXT DEFAULT 'dusuk', -- 'dusuk', 'normal', 'yuksek', 'tepe'
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(restoran_id, saat, saat_dilimi)
);

-- 5. Hava Durumu Entegrasyonu
CREATE TABLE IF NOT EXISTS hava_durumu_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  sehir TEXT,
  durum TEXT, -- 'acik', 'bulutlu', 'yagmurlu', 'karli'
  sicaklik DECIMAL(5,2),
  ruzgar_hizi DECIMAL(5,2),
  guncelleme_tarihi TIMESTAMP DEFAULT now()
);

-- 6. Fonksiyon: Dinamik Fiyat Hesapla
CREATE OR REPLACE FUNCTION hesapla_dinamik_fiyat(
  p_urun_id UUID,
  p_restoran_id UUID
)
RETURNS DECIMAL AS $$
DECLARE
  v_fiyat DECIMAL(10,2);
  v_taban_fiyat DECIMAL(10,2);
  v_yogunluk_seviyesi TEXT;
  v_hava_durumu TEXT;
  v_saat_dilimi INTEGER;
  v_gun_adi TEXT;
  v_artis_yuzde DECIMAL(5,2) := 0;
BEGIN
  -- Taban fiyatı al
  SELECT taban_fiyat INTO v_taban_fiyat
  FROM dinamik_fiyatlandirma
  WHERE urun_id = p_urun_id AND restoran_id = p_restoran_id AND aktif = true;

  IF v_taban_fiyat IS NULL THEN
    SELECT fiyat INTO v_taban_fiyat FROM urunler WHERE id = p_urun_id;
  END IF;

  v_fiyat := v_taban_fiyat;

  -- Saat dilimi fiyatlandırması
  v_saat_dilimi := EXTRACT(HOUR FROM NOW());
  IF v_saat_dilimi >= 6 AND v_saat_dilimi < 11 THEN
    SELECT COALESCE(sabah_fiyat, v_taban_fiyat) INTO v_fiyat FROM dinamik_fiyatlandirma WHERE urun_id = p_urun_id;
  ELSIF v_saat_dilimi >= 11 AND v_saat_dilimi < 15 THEN
    SELECT COALESCE(ogle_fiyat, v_taban_fiyat) INTO v_fiyat FROM dinamik_fiyatlandirma WHERE urun_id = p_urun_id;
  ELSIF v_saat_dilimi >= 15 AND v_saat_dilimi < 21 THEN
    SELECT COALESCE(aksam_fiyat, v_taban_fiyat) INTO v_fiyat FROM dinamik_fiyatlandirma WHERE urun_id = p_urun_id;
  ELSE
    SELECT COALESCE(gece_fiyat, v_taban_fiyat) INTO v_fiyat FROM dinamik_fiyatlandirma WHERE urun_id = p_urun_id;
  END IF;

  -- Yoğunluk bazlı fiyatlandırma
  SELECT yogunluk_seviyesi INTO v_yogunluk_seviyesi
  FROM yogunluk_saatlik
  WHERE restoran_id = p_restoran_id
  AND saat = CURRENT_DATE
  AND saat_dilimi = v_saat_dilimi;

  IF v_yogunluk_seviyesi = 'tepe' THEN
    SELECT yuksek_yogunluk_artis INTO v_artis_yuzde FROM dinamik_fiyatlandirma WHERE urun_id = p_urun_id;
    v_fiyat := v_fiyat * (1 + COALESCE(v_artis_yuzde, 0) / 100);
  ELSIF v_yogunluk_seviyesi = 'dusuk' THEN
    SELECT dusuk_yogunluk_indirim INTO v_artis_yuzde FROM dinamik_fiyatlandirma WHERE urun_id = p_urun_id;
    v_fiyat := v_fiyat * (1 - COALESCE(v_artis_yuzde, 0) / 100);
  END IF;

  -- Hava durumu bazlı fiyatlandırma
  SELECT durum INTO v_hava_durumu FROM hava_durumu_cache WHERE restoran_id = p_restoran_id ORDER BY guncelleme_tarihi DESC LIMIT 1;
  
  IF v_hava_durumu = 'yagmurlu' THEN
    SELECT yagmur_artis INTO v_artis_yuzde FROM dinamik_fiyatlandirma WHERE urun_id = p_urun_id;
    v_fiyat := v_fiyat * (1 + COALESCE(v_artis_yuzde, 0) / 100);
  ELSIF v_hava_durumu = 'karli' THEN
    SELECT kar_artis INTO v_artis_yuzde FROM dinamik_fiyatlandirma WHERE urun_id = p_urun_id;
    v_fiyat := v_fiyat * (1 + COALESCE(v_artis_yuzde, 0) / 100);
  END IF;

  -- Hafta sonu fiyatlandırması
  v_gun_adi := TO_CHAR(NOW(), 'Day');
  IF v_gun_adi IN ('Saturday', 'Sunday') THEN
    SELECT hafta_sonu_artis INTO v_artis_yuzde FROM dinamik_fiyatlandirma WHERE urun_id = p_urun_id;
    v_fiyat := v_fiyat * (1 + COALESCE(v_artis_yuzde, 0) / 100);
  END IF;

  RETURN ROUND(v_fiyat, 2);
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger: Yoğunluk güncellemesi
CREATE OR REPLACE FUNCTION update_yogunluk()
RETURNS TRIGGER AS $$
DECLARE
  v_siparis_sayisi INTEGER;
  v_yogunluk_seviyesi TEXT;
BEGIN
  IF NEW.durum = 'tamamlandi' THEN
    SELECT COUNT(*) INTO v_siparis_sayisi
    FROM siparisler
    WHERE restoran_id = NEW.restoran_id
    AND DATE(created_at) = CURRENT_DATE
    AND EXTRACT(HOUR FROM created_at) = EXTRACT(HOUR FROM NOW());

    -- Yoğunluk seviyesini belirle
    IF v_siparis_sayisi > 50 THEN
      v_yogunluk_seviyesi := 'tepe';
    ELSIF v_siparis_sayisi > 30 THEN
      v_yogunluk_seviyesi := 'yuksek';
    ELSIF v_siparis_sayisi > 10 THEN
      v_yogunluk_seviyesi := 'normal';
    ELSE
      v_yogunluk_seviyesi := 'dusuk';
    END IF;

    INSERT INTO yogunluk_saatlik (restoran_id, saat, saat_dilimi, siparis_sayisi, yogunluk_seviyesi)
    VALUES (NEW.restoran_id, CURRENT_DATE, EXTRACT(HOUR FROM NOW()), v_siparis_sayisi, v_yogunluk_seviyesi)
    ON CONFLICT (restoran_id, saat, saat_dilimi) DO UPDATE SET
      siparis_sayisi = v_siparis_sayisi,
      yogunluk_seviyesi = v_yogunluk_seviyesi;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_yogunluk ON siparisler;
CREATE TRIGGER tr_update_yogunluk
  AFTER UPDATE ON siparisler
  FOR EACH ROW
  EXECUTE FUNCTION update_yogunluk();

-- 8. İndeksler
CREATE INDEX IF NOT EXISTS idx_ai_sesli_siparisler_restoran ON ai_sesli_siparisler(restoran_id);
CREATE INDEX IF NOT EXISTS idx_dinamik_fiyatlandirma_urun ON dinamik_fiyatlandirma(urun_id);
CREATE INDEX IF NOT EXISTS idx_yogunluk_saatlik_restoran ON yogunluk_saatlik(restoran_id);
CREATE INDEX IF NOT EXISTS idx_hava_durumu_cache_restoran ON hava_durumu_cache(restoran_id);

-- 9. Row Level Security
ALTER TABLE ai_sesli_siparisler ENABLE ROW LEVEL SECURITY;
ALTER TABLE dinamik_fiyatlandirma ENABLE ROW LEVEL SECURITY;
ALTER TABLE yogunluk_saatlik ENABLE ROW LEVEL SECURITY;
ALTER TABLE hava_durumu_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ai_sesli_siparisler_access" ON ai_sesli_siparisler
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );

CREATE POLICY "dinamik_fiyatlandirma_access" ON dinamik_fiyatlandirma
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );
