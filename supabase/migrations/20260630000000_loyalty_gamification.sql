-- 🎮 Müşteri Sadakat & Oyunlaştırma Sistemi
-- Çark çevir, doğum günü kuponu, tekrar sipariş, puan sistemi

-- 1. Müşteri Sadakat Programı
CREATE TABLE IF NOT EXISTS musteri_sadakat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  musteri_id UUID REFERENCES musteriler(id) ON DELETE CASCADE,
  toplam_puan INTEGER DEFAULT 0,
  kullanilan_puan INTEGER DEFAULT 0,
  bakiye_puan INTEGER DEFAULT 0,
  seviye TEXT DEFAULT 'bronz', -- 'bronz', 'gumush', 'altin', 'platin'
  dogum_tarihi DATE,
  son_siparis_tarihi DATE,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. Puan Tarihi
CREATE TABLE IF NOT EXISTS puan_tarihi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  musteri_sadakat_id UUID NOT NULL REFERENCES musteri_sadakat(id) ON DELETE CASCADE,
  puan INTEGER,
  neden TEXT, -- 'siparis', 'referral', 'doğum_günü', 'indirim'
  siparis_id UUID REFERENCES siparisler(id),
  created_at TIMESTAMP DEFAULT now()
);

-- 3. Oyunlaştırma - Çark Çevir
CREATE TABLE IF NOT EXISTS cark_cevir_oyunu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  musteri_id UUID REFERENCES musteriler(id),
  odul_tipi TEXT, -- 'indirim', 'ucretsiz_urun', 'puan', 'kupon'
  odul_degeri INTEGER, -- % indirim veya puan sayısı
  odul_aciklama TEXT,
  kazandi BOOLEAN DEFAULT false,
  kazanma_tarihi TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- 4. Doğum Günü Kampanyası
CREATE TABLE IF NOT EXISTS dogum_gunu_kampanyasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  musteri_id UUID REFERENCES musteriler(id) ON DELETE CASCADE,
  dogum_tarihi DATE,
  kupon_kodu TEXT UNIQUE,
  indirim_yuzde INTEGER DEFAULT 10,
  gecerli_baslangic DATE,
  gecerli_bitis DATE,
  kullanildi BOOLEAN DEFAULT false,
  kullanim_tarihi TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- 5. Tekrar Sipariş Şablonları
CREATE TABLE IF NOT EXISTS tekrar_siparis_sablonlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  musteri_id UUID REFERENCES musteriler(id) ON DELETE CASCADE,
  siparis_id UUID NOT REFERENCES siparisler(id) ON DELETE CASCADE,
  sablon_adi TEXT,
  urunler JSONB, -- [{ urun_id, adet, fiyat }]
  toplam_tutar DECIMAL(10,2),
  son_siparis_tarihi TIMESTAMP,
  siparis_sayisi INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT now()
);

-- 6. Seviye Tanımları
CREATE TABLE IF NOT EXISTS sadakat_seviyeleri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  seviye_adi TEXT NOT NULL, -- 'bronz', 'gumush', 'altin', 'platin'
  min_toplam_harcama DECIMAL(10,2),
  indirim_yuzde DECIMAL(3,2),
  bonus_puan_carpani DECIMAL(3,2),
  ozel_ayricaliklar TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 7. Trigger: Sipariş tamamlanınca puan ekle
CREATE OR REPLACE FUNCTION ekle_siparis_puani()
RETURNS TRIGGER AS $$
DECLARE
  v_musteri_sadakat_id UUID;
  v_puan INTEGER;
BEGIN
  IF NEW.durum = 'tamamlandi' AND OLD.durum != 'tamamlandi' THEN
    -- Müşteri sadakat kaydını bul
    SELECT id INTO v_musteri_sadakat_id
    FROM musteri_sadakat
    WHERE musteri_id = NEW.musteri_id
    LIMIT 1;

    IF v_musteri_sadakat_id IS NULL THEN
      INSERT INTO musteri_sadakat (restoran_id, musteri_id, toplam_puan, bakiye_puan)
      VALUES (NEW.restoran_id, NEW.musteri_id, 0, 0)
      RETURNING id INTO v_musteri_sadakat_id;
    END IF;

    -- Her 10₺'ye 1 puan (10 TL = 1 puan)
    v_puan := FLOOR(NEW.toplam_tutar / 10);

    -- Puan ekle
    UPDATE musteri_sadakat
    SET 
      toplam_puan = toplam_puan + v_puan,
      bakiye_puan = bakiye_puan + v_puan,
      updated_at = NOW()
    WHERE id = v_musteri_sadakat_id;

    -- Puan geçmişine ekle
    INSERT INTO puan_tarihi (musteri_sadakat_id, puan, neden, siparis_id)
    VALUES (v_musteri_sadakat_id, v_puan, 'siparis', NEW.id);

    -- Seviye güncelle
    PERFORM guncelle_musteri_seviyesi(v_musteri_sadakat_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_ekle_siparis_puani ON siparisler;
CREATE TRIGGER tr_ekle_siparis_puani
  AFTER UPDATE ON siparisler
  FOR EACH ROW
  EXECUTE FUNCTION ekle_siparis_puani();

-- 8. Fonksiyon: Müşteri seviyesini güncelle
CREATE OR REPLACE FUNCTION guncelle_musteri_seviyesi(p_musteri_sadakat_id UUID)
RETURNS void AS $$
DECLARE
  v_toplam_puan INTEGER;
  v_yeni_seviye TEXT;
BEGIN
  SELECT toplam_puan INTO v_toplam_puan
  FROM musteri_sadakat
  WHERE id = p_musteri_sadakat_id;

  -- Seviye belirleme
  IF v_toplam_puan >= 1000 THEN
    v_yeni_seviye := 'platin';
  ELSIF v_toplam_puan >= 500 THEN
    v_yeni_seviye := 'altin';
  ELSIF v_toplam_puan >= 200 THEN
    v_yeni_seviye := 'gumush';
  ELSE
    v_yeni_seviye := 'bronz';
  END IF;

  UPDATE musteri_sadakat
  SET seviye = v_yeni_seviye
  WHERE id = p_musteri_sadakat_id;
END;
$$ LANGUAGE plpgsql;

-- 9. Trigger: Doğum günü yaklaşınca kupon oluştur
CREATE OR REPLACE FUNCTION olustur_dogum_gunu_kuponu()
RETURNS void AS $$
BEGIN
  INSERT INTO dogum_gunu_kampanyasi (restoran_id, musteri_id, dogum_tarihi, kupon_kodu, gecerli_baslangic, gecerli_bitis)
  SELECT 
    ms.restoran_id,
    ms.musteri_id,
    ms.dogum_tarihi,
    'DG' || TO_CHAR(NOW(), 'YYYYMMDD') || SUBSTR(md5(ms.musteri_id::TEXT), 1, 6),
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '7 days'
  FROM musteri_sadakat ms
  WHERE 
    ms.dogum_tarihi IS NOT NULL
    AND EXTRACT(MONTH FROM ms.dogum_tarihi) = EXTRACT(MONTH FROM NOW())
    AND EXTRACT(DAY FROM ms.dogum_tarihi) = EXTRACT(DAY FROM NOW())
    AND NOT EXISTS (
      SELECT 1 FROM dogum_gunu_kampanyasi
      WHERE musteri_id = ms.musteri_id
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- 10. İndeksler
CREATE INDEX IF NOT EXISTS idx_musteri_sadakat_musteri ON musteri_sadakat(musteri_id);
CREATE INDEX IF NOT EXISTS idx_puan_tarihi_musteri ON puan_tarihi(musteri_sadakat_id);
CREATE INDEX IF NOT EXISTS idx_cark_cevir_musteri ON cark_cevir_oyunu(musteri_id);
CREATE INDEX IF NOT EXISTS idx_dogum_gunu_musteri ON dogum_gunu_kampanyasi(musteri_id);
CREATE INDEX IF NOT EXISTS idx_tekrar_siparis_musteri ON tekrar_siparis_sablonlari(musteri_id);

-- 11. Row Level Security
ALTER TABLE musteri_sadakat ENABLE ROW LEVEL SECURITY;
ALTER TABLE puan_tarihi ENABLE ROW LEVEL SECURITY;
ALTER TABLE cark_cevir_oyunu ENABLE ROW LEVEL SECURITY;
ALTER TABLE dogum_gunu_kampanyasi ENABLE ROW LEVEL SECURITY;
ALTER TABLE tekrar_siparis_sablonlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE sadakat_seviyeleri ENABLE ROW LEVEL SECURITY;

CREATE POLICY "musteri_sadakat_access" ON musteri_sadakat
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );

CREATE POLICY "dogum_gunu_kampanyasi_access" ON dogum_gunu_kampanyasi
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );
