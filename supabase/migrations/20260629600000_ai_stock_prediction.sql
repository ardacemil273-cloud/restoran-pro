-- 🤖 AI Stok Tahmin Sistemi
-- Geçmiş satış verilerini analiz edip gelecek talebini tahmin eder

-- 1. Stok tablosunu genişlet
ALTER TABLE stok ADD COLUMN IF NOT EXISTS gunluk_satislar INTEGER DEFAULT 0;
ALTER TABLE stok ADD COLUMN IF NOT EXISTS ortalama_gunluk_satis DECIMAL(10,2) DEFAULT 0;
ALTER TABLE stok ADD COLUMN IF NOT EXISTS tahmini_gunluk_satis DECIMAL(10,2) DEFAULT 0;
ALTER TABLE stok ADD COLUMN IF NOT EXISTS son_30gun_satis INTEGER DEFAULT 0;
ALTER TABLE stok ADD COLUMN IF NOT EXISTS trend_yuzde DECIMAL(5,2) DEFAULT 0; -- Artış/azalış yüzdesi
ALTER TABLE stok ADD COLUMN IF NOT EXISTS kritik_seviye INTEGER DEFAULT 0;
ALTER TABLE stok ADD COLUMN IF NOT EXISTS optimal_siparis_miktari INTEGER DEFAULT 0;
ALTER TABLE stok ADD COLUMN IF NOT EXISTS son_tahmin_tarihi DATE DEFAULT CURRENT_DATE;

-- 2. Stok tahmin günlüğü
CREATE TABLE IF NOT EXISTS stok_tahmin_gunluk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  urun_id UUID NOT NULL REFERENCES urunler(id) ON DELETE CASCADE,
  tarih DATE NOT NULL DEFAULT CURRENT_DATE,
  gercek_satis INTEGER DEFAULT 0,
  tahmini_satis INTEGER DEFAULT 0,
  hata_yuzde DECIMAL(5,2) DEFAULT 0,
  stok_seviyesi INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(restoran_id, urun_id, tarih)
);

-- 3. Stok uyarıları
CREATE TABLE IF NOT EXISTS stok_uyarilari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  urun_id UUID NOT NULL REFERENCES urunler(id) ON DELETE CASCADE,
  tip TEXT NOT NULL, -- 'kritik', 'dusuk', 'fazla'
  mesaj TEXT NOT NULL,
  okundu BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- 4. Tedarikçi siparişleri
CREATE TABLE IF NOT EXISTS tedarikci_siparisler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  urun_id UUID NOT NULL REFERENCES urunler(id) ON DELETE CASCADE,
  tedarikci_id UUID REFERENCES tedarikci(id),
  miktar INTEGER NOT NULL,
  birim_fiyat DECIMAL(10,2) NOT NULL,
  toplam_fiyat DECIMAL(10,2) NOT NULL,
  durum TEXT DEFAULT 'bekleniyor', -- 'bekleniyor', 'gonderildi', 'teslim_alindi'
  siparis_tarihi TIMESTAMP DEFAULT now(),
  beklenen_teslimat_tarihi DATE,
  gercek_teslimat_tarihi DATE,
  notlar TEXT
);

-- 5. Tedarikçi tablosu
CREATE TABLE IF NOT EXISTS tedarikci (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  ad TEXT NOT NULL,
  telefon TEXT,
  email TEXT,
  adres TEXT,
  ortalama_teslimat_suresi INTEGER DEFAULT 1, -- gün cinsinden
  created_at TIMESTAMP DEFAULT now()
);

-- 6. Trigger: Sipariş ürünü satıldığında stok güncellemesi
CREATE OR REPLACE FUNCTION update_stock_on_order()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE stok
  SET 
    miktar = miktar - NEW.adet,
    gunluk_satislar = CASE 
      WHEN DATE(NOW()) = DATE(updated_at) THEN gunluk_satislar + NEW.adet
      ELSE NEW.adet
    END,
    son_30gun_satis = son_30gun_satis + NEW.adet,
    updated_at = NOW()
  WHERE urun_id = NEW.urun_id;

  -- Stok uyarısı kontrol et
  PERFORM check_stock_alerts(NEW.urun_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_stock_on_order ON siparis_urunleri;
CREATE TRIGGER tr_update_stock_on_order
  AFTER INSERT ON siparis_urunleri
  FOR EACH ROW
  EXECUTE FUNCTION update_stock_on_order();

-- 7. Stok uyarısı kontrol fonksiyonu
CREATE OR REPLACE FUNCTION check_stock_alerts(p_urun_id UUID)
RETURNS void AS $$
DECLARE
  v_stok RECORD;
  v_restoran_id UUID;
BEGIN
  SELECT s.*, u.restoran_id INTO v_stok
  FROM stok s
  JOIN urunler u ON s.urun_id = u.id
  WHERE s.urun_id = p_urun_id;

  IF v_stok IS NULL THEN RETURN; END IF;

  v_restoran_id := v_stok.restoran_id;

  -- Kritik seviye uyarısı
  IF v_stok.miktar <= v_stok.kritik_seviye THEN
    INSERT INTO stok_uyarilari (restoran_id, urun_id, tip, mesaj)
    VALUES (v_restoran_id, p_urun_id, 'kritik', 
      'KRİTİK: ' || v_stok.ad || ' stok kritik seviyeye düştü! Mevcut: ' || v_stok.miktar)
    ON CONFLICT DO NOTHING;
  -- Düşük seviye uyarısı
  ELSIF v_stok.miktar <= (v_stok.kritik_seviye * 2) THEN
    INSERT INTO stok_uyarilari (restoran_id, urun_id, tip, mesaj)
    VALUES (v_restoran_id, p_urun_id, 'dusuk',
      'DÜŞÜK: ' || v_stok.ad || ' stok azalıyor. Mevcut: ' || v_stok.miktar)
    ON CONFLICT DO NOTHING;
  -- Fazla stok uyarısı
  ELSIF v_stok.miktar > (v_stok.optimal_siparis_miktari * 2) THEN
    INSERT INTO stok_uyarilari (restoran_id, urun_id, tip, mesaj)
    VALUES (v_restoran_id, p_urun_id, 'fazla',
      'FAZLA: ' || v_stok.ad || ' fazla stok var. Mevcut: ' || v_stok.miktar)
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 8. Günlük tahmin hesaplama fonksiyonu
CREATE OR REPLACE FUNCTION calculate_daily_prediction()
RETURNS void AS $$
DECLARE
  v_urun RECORD;
  v_ortalama DECIMAL;
  v_trend DECIMAL;
  v_tahmin DECIMAL;
BEGIN
  FOR v_urun IN
    SELECT id, restoran_id FROM urunler
  LOOP
    -- Son 30 günün ortalaması
    SELECT AVG(gercek_satis)::DECIMAL INTO v_ortalama
    FROM stok_tahmin_gunluk
    WHERE urun_id = v_urun.id
    AND tarih >= CURRENT_DATE - INTERVAL '30 days';

    -- Trend hesaplama (son 7 gün vs 7 gün öncesi)
    SELECT (
      (SELECT COALESCE(SUM(gercek_satis), 0) FROM stok_tahmin_gunluk WHERE urun_id = v_urun.id AND tarih >= CURRENT_DATE - INTERVAL '7 days') -
      (SELECT COALESCE(SUM(gercek_satis), 0) FROM stok_tahmin_gunluk WHERE urun_id = v_urun.id AND tarih >= CURRENT_DATE - INTERVAL '14 days' AND tarih < CURRENT_DATE - INTERVAL '7 days')
    )::DECIMAL / NULLIF((SELECT COALESCE(SUM(gercek_satis), 1) FROM stok_tahmin_gunluk WHERE urun_id = v_urun.id AND tarih >= CURRENT_DATE - INTERVAL '14 days' AND tarih < CURRENT_DATE - INTERVAL '7 days'), 0) * 100
    INTO v_trend;

    -- Tahmin = Ortalama + (Trend * Ortalama)
    v_tahmin := COALESCE(v_ortalama, 0) * (1 + COALESCE(v_trend, 0) / 100);

    -- Güncelle
    UPDATE stok
    SET 
      ortalama_gunluk_satis = v_ortalama,
      tahmini_gunluk_satis = v_tahmin,
      trend_yuzde = v_trend,
      son_tahmin_tarihi = CURRENT_DATE
    WHERE urun_id = v_urun.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 9. İndeksler
CREATE INDEX IF NOT EXISTS idx_stok_tahmin_gunluk_urun ON stok_tahmin_gunluk(urun_id);
CREATE INDEX IF NOT EXISTS idx_stok_tahmin_gunluk_tarih ON stok_tahmin_gunluk(tarih);
CREATE INDEX IF NOT EXISTS idx_stok_uyarilari_restoran ON stok_uyarilari(restoran_id);
CREATE INDEX IF NOT EXISTS idx_tedarikci_siparisler_urun ON tedarikci_siparisler(urun_id);

-- 10. Row Level Security
ALTER TABLE stok_tahmin_gunluk ENABLE ROW LEVEL SECURITY;
ALTER TABLE stok_uyarilari ENABLE ROW LEVEL SECURITY;
ALTER TABLE tedarikci_siparisler ENABLE ROW LEVEL SECURITY;
ALTER TABLE tedarikci ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stok_tahmin_gunluk_access" ON stok_tahmin_gunluk
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );

CREATE POLICY "stok_uyarilari_access" ON stok_uyarilari
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );

CREATE POLICY "tedarikci_siparisler_access" ON tedarikci_siparisler
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );

CREATE POLICY "tedarikci_access" ON tedarikci
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );
