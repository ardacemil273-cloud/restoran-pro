-- 🤖 AI Müşteri Analitikleri - RFM Analizi ve Segmentasyon
-- Müşterileri otomatik olarak sınıflandır ve tahmin yap

-- 1. RFM Analizi Tablosu
CREATE TABLE IF NOT EXISTS rfm_analizi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  musteri_id UUID NOT NULL REFERENCES musteriler(id) ON DELETE CASCADE,
  
  -- RFM Metrikleri
  recency_gun INTEGER, -- Son sipariş kaç gün önce
  frequency_siparis INTEGER, -- Toplam sipariş sayısı
  monetary_tutar DECIMAL(10,2), -- Toplam harcama
  
  -- RFM Puanları (1-5)
  recency_puan INTEGER,
  frequency_puan INTEGER,
  monetary_puan INTEGER,
  
  -- Genel RFM Puanı
  rfm_puani DECIMAL(5,2),
  
  -- Segment
  segment TEXT, -- 'champion', 'loyal', 'at_risk', 'new', 'lost'
  
  -- Tahminler
  tahmin_ciro DECIMAL(10,2),
  churn_riski DECIMAL(5,2), -- Ayrılma riski %
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(restoran_id, musteri_id)
);

-- 2. Müşteri Segmentasyonu
CREATE TABLE IF NOT EXISTS musteri_segmentleri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  segment_adi TEXT NOT NULL,
  segment_kodu TEXT,
  
  -- Segment Kriterleri
  min_recency_gun INTEGER,
  max_recency_gun INTEGER,
  min_frequency INTEGER,
  max_frequency INTEGER,
  min_monetary DECIMAL(10,2),
  max_monetary DECIMAL(10,2),
  
  -- Segment Özellikleri
  musteri_sayisi INTEGER DEFAULT 0,
  toplam_ciro DECIMAL(10,2) DEFAULT 0,
  ortalama_ciro DECIMAL(10,2) DEFAULT 0,
  
  -- Kampanya
  kampanya_adi TEXT,
  kampanya_indirim DECIMAL(5,2),
  
  created_at TIMESTAMP DEFAULT now()
);

-- 3. Müşteri Tahminleri
CREATE TABLE IF NOT EXISTS musteri_tahminleri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  musteri_id UUID NOT NULL REFERENCES musteriler(id) ON DELETE CASCADE,
  
  -- Tahminler
  sonraki_ay_ciro_tahmini DECIMAL(10,2),
  sonraki_ay_siparis_tahmini INTEGER,
  sonraki_ay_gelme_olasiligi DECIMAL(5,2),
  
  -- Trend
  ciro_trend TEXT, -- 'artis', 'azalis', 'sabit'
  siparis_trend TEXT,
  
  -- Öneriler
  onerilen_indirim DECIMAL(5,2),
  onerilen_urun TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(restoran_id, musteri_id)
);

-- 4. Müşteri Davranış Analizi
CREATE TABLE IF NOT EXISTS musteri_davranisi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  musteri_id UUID NOT NULL REFERENCES musteriler(id) ON DELETE CASCADE,
  
  -- Davranış Metrikleri
  en_cok_siparis_gunu TEXT, -- 'pazartesi', 'sali', vb
  en_cok_siparis_saati INTEGER, -- 12-14 arası
  en_cok_siparis_urun TEXT,
  ortalama_siparis_degeri DECIMAL(10,2),
  
  -- Tercihler
  tercih_kategorisi TEXT,
  tercih_fiyat_aralik TEXT, -- 'ucuz', 'orta', 'pahali'
  
  -- Memnuniyet
  ortalama_rating DECIMAL(3,2),
  iptal_orani DECIMAL(5,2),
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(restoran_id, musteri_id)
);

-- 5. RFM Puanı Hesaplama Fonksiyonu
CREATE OR REPLACE FUNCTION hesapla_rfm_puani(
  p_recency_gun INTEGER,
  p_frequency INTEGER,
  p_monetary DECIMAL
)
RETURNS INTEGER AS $$
DECLARE
  v_recency_puan INTEGER;
  v_frequency_puan INTEGER;
  v_monetary_puan INTEGER;
BEGIN
  -- Recency Puanı (Son sipariş ne kadar yakın)
  v_recency_puan := CASE
    WHEN p_recency_gun <= 7 THEN 5
    WHEN p_recency_gun <= 14 THEN 4
    WHEN p_recency_gun <= 30 THEN 3
    WHEN p_recency_gun <= 60 THEN 2
    ELSE 1
  END;

  -- Frequency Puanı (Ne kadar sık sipariş)
  v_frequency_puan := CASE
    WHEN p_frequency >= 20 THEN 5
    WHEN p_frequency >= 15 THEN 4
    WHEN p_frequency >= 10 THEN 3
    WHEN p_frequency >= 5 THEN 2
    ELSE 1
  END;

  -- Monetary Puanı (Ne kadar çok harcıyor)
  v_monetary_puan := CASE
    WHEN p_monetary >= 5000 THEN 5
    WHEN p_monetary >= 3000 THEN 4
    WHEN p_monetary >= 1000 THEN 3
    WHEN p_monetary >= 500 THEN 2
    ELSE 1
  END;

  RETURN (v_recency_puan + v_frequency_puan + v_monetary_puan) / 3;
END;
$$ LANGUAGE plpgsql;

-- 6. Müşteri Segmenti Belirle
CREATE OR REPLACE FUNCTION belirle_musteri_segmenti(
  p_rfm_puani DECIMAL
)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN p_rfm_puani >= 4.5 THEN 'champion'
    WHEN p_rfm_puani >= 3.5 THEN 'loyal'
    WHEN p_rfm_puani >= 2.5 THEN 'at_risk'
    WHEN p_rfm_puani >= 1.5 THEN 'new'
    ELSE 'lost'
  END;
END;
$$ LANGUAGE plpgsql;

-- 7. RFM Analizi Güncelle (Trigger)
CREATE OR REPLACE FUNCTION guncelle_rfm_analizi()
RETURNS TRIGGER AS $$
DECLARE
  v_recency INTEGER;
  v_frequency INTEGER;
  v_monetary DECIMAL;
  v_rfm_puani DECIMAL;
  v_segment TEXT;
BEGIN
  IF NEW.durum = 'tamamlandi' THEN
    -- Müşteri RFM verilerini hesapla
    SELECT
      EXTRACT(DAY FROM NOW() - MAX(s.created_at))::INTEGER,
      COUNT(*),
      COALESCE(SUM(s.toplam_tutar), 0)
    INTO v_recency, v_frequency, v_monetary
    FROM siparisler s
    WHERE s.musteri_id = NEW.musteri_id
    AND s.restoran_id = NEW.restoran_id
    AND s.durum = 'tamamlandi';

    -- RFM Puanı Hesapla
    v_rfm_puani := hesapla_rfm_puani(v_recency, v_frequency, v_monetary);
    v_segment := belirle_musteri_segmenti(v_rfm_puani);

    -- RFM Tablosunu Güncelle
    INSERT INTO rfm_analizi (
      restoran_id, musteri_id, recency_gun, frequency_siparis, monetary_tutar,
      rfm_puani, segment
    )
    VALUES (
      NEW.restoran_id, NEW.musteri_id, v_recency, v_frequency, v_monetary,
      v_rfm_puani, v_segment
    )
    ON CONFLICT (restoran_id, musteri_id) DO UPDATE SET
      recency_gun = v_recency,
      frequency_siparis = v_frequency,
      monetary_tutar = v_monetary,
      rfm_puani = v_rfm_puani,
      segment = v_segment,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_guncelle_rfm_analizi ON siparisler;
CREATE TRIGGER tr_guncelle_rfm_analizi
  AFTER UPDATE ON siparisler
  FOR EACH ROW
  EXECUTE FUNCTION guncelle_rfm_analizi();

-- 8. İndeksler
CREATE INDEX IF NOT EXISTS idx_rfm_analizi_restoran ON rfm_analizi(restoran_id);
CREATE INDEX IF NOT EXISTS idx_rfm_analizi_segment ON rfm_analizi(segment);
CREATE INDEX IF NOT EXISTS idx_musteri_segmentleri_restoran ON musteri_segmentleri(restoran_id);
CREATE INDEX IF NOT EXISTS idx_musteri_tahminleri_restoran ON musteri_tahminleri(restoran_id);
CREATE INDEX IF NOT EXISTS idx_musteri_davranisi_restoran ON musteri_davranisi(restoran_id);

-- 9. Row Level Security
ALTER TABLE rfm_analizi ENABLE ROW LEVEL SECURITY;
ALTER TABLE musteri_segmentleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE musteri_tahminleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE musteri_davranisi ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rfm_analizi_access" ON rfm_analizi
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );

CREATE POLICY "musteri_segmentleri_access" ON musteri_segmentleri
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );
