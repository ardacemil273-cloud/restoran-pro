-- 👑 Patron Merkezi - Ego Dashboard
-- Ciro hedef barı, oto rapor, rakip fiyat casusu, başarı göstergeleri

-- 1. Ciro Hedefleri
CREATE TABLE IF NOT EXISTS ciro_hedefleri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  ay INTEGER NOT NULL, -- 1-12
  yil INTEGER NOT NULL,
  hedef_ciro DECIMAL(10,2) NOT NULL,
  tahmin_ciro DECIMAL(10,2) DEFAULT 0,
  gercek_ciro DECIMAL(10,2) DEFAULT 0,
  basari_yuzde DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(restoran_id, ay, yil)
);

-- 2. Rakip Fiyat Casusu
CREATE TABLE IF NOT EXISTS rakip_fiyat_casusu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  urun_adi TEXT NOT NULL,
  bizim_fiyat DECIMAL(10,2),
  rakip_fiyat DECIMAL(10,2),
  rakip_adi TEXT,
  fiyat_farki DECIMAL(10,2),
  fiyat_durumu TEXT, -- 'dusuk', 'esit', 'yuksek'
  kontrol_tarihi TIMESTAMP DEFAULT now()
);

-- 3. Otomatik Rapor Zamanlaması
CREATE TABLE IF NOT EXISTS oto_rapor_ayarlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  rapor_tipi TEXT, -- 'gunluk', 'haftalik', 'aylik'
  gonderim_saati TIME,
  gonderim_gunu INTEGER, -- 1-7 (Pazartesi-Pazar) veya 1-31 (Gün)
  email_adresi TEXT,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- 4. Rapor Geçmişi
CREATE TABLE IF NOT EXISTS rapor_gecmisi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  rapor_tipi TEXT,
  rapor_icerigi JSONB,
  gonderim_tarihi TIMESTAMP,
  okundu BOOLEAN DEFAULT false,
  okunma_tarihi TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- 5. Başarı Rozetleri (Gamification)
CREATE TABLE IF NOT EXISTS basari_rozetleri (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  rozet_adi TEXT NOT NULL,
  rozet_aciklama TEXT,
  rozet_emoji TEXT,
  koşul TEXT, -- 'ciro_1000', 'siparis_100', 'musteri_50'
  kazanildi BOOLEAN DEFAULT false,
  kazanma_tarihi TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- 6. Günlük Başarı Özeti
CREATE TABLE IF NOT EXISTS gunluk_basari_ozeti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  tarih DATE DEFAULT CURRENT_DATE,
  toplam_ciro DECIMAL(10,2) DEFAULT 0,
  siparis_sayisi INTEGER DEFAULT 0,
  ortalama_siparis_degeri DECIMAL(10,2) DEFAULT 0,
  musteri_sayisi INTEGER DEFAULT 0,
  en_cok_satilan_urun TEXT,
  en_cok_satilan_urun_adet INTEGER,
  gunun_yildizi_garson TEXT,
  gunun_yildizi_garson_ciro DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(restoran_id, tarih)
);

-- 7. Trigger: Günlük özet oluştur
CREATE OR REPLACE FUNCTION olustur_gunluk_ozeti()
RETURNS void AS $$
DECLARE
  v_restoran_id UUID;
  v_toplam_ciro DECIMAL(10,2);
  v_siparis_sayisi INTEGER;
  v_musteri_sayisi INTEGER;
  v_en_cok_satilan_urun TEXT;
  v_en_cok_satilan_adet INTEGER;
BEGIN
  FOR v_restoran_id IN SELECT DISTINCT restoran_id FROM siparisler WHERE DATE(created_at) = CURRENT_DATE
  LOOP
    -- Ciro ve sipariş sayısı
    SELECT COALESCE(SUM(toplam_tutar), 0), COUNT(*) 
    INTO v_toplam_ciro, v_siparis_sayisi
    FROM siparisler
    WHERE restoran_id = v_restoran_id AND DATE(created_at) = CURRENT_DATE;

    -- Müşteri sayısı
    SELECT COUNT(DISTINCT musteri_id)
    INTO v_musteri_sayisi
    FROM siparisler
    WHERE restoran_id = v_restoran_id AND DATE(created_at) = CURRENT_DATE;

    -- En çok satılan ürün
    SELECT urunler->0->>'urun_adi', COUNT(*)
    INTO v_en_cok_satilan_urun, v_en_cok_satilan_adet
    FROM siparisler
    WHERE restoran_id = v_restoran_id AND DATE(created_at) = CURRENT_DATE
    GROUP BY urunler->0->>'urun_adi'
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    -- Günlük özeti ekle veya güncelle
    INSERT INTO gunluk_basari_ozeti (
      restoran_id, tarih, toplam_ciro, siparis_sayisi, 
      ortalama_siparis_degeri, musteri_sayisi, en_cok_satilan_urun, en_cok_satilan_urun_adet
    )
    VALUES (
      v_restoran_id, CURRENT_DATE, v_toplam_ciro, v_siparis_sayisi,
      CASE WHEN v_siparis_sayisi > 0 THEN v_toplam_ciro / v_siparis_sayisi ELSE 0 END,
      v_musteri_sayisi, v_en_cok_satilan_urun, v_en_cok_satilan_adet
    )
    ON CONFLICT (restoran_id, tarih) DO UPDATE SET
      toplam_ciro = v_toplam_ciro,
      siparis_sayisi = v_siparis_sayisi,
      ortalama_siparis_degeri = CASE WHEN v_siparis_sayisi > 0 THEN v_toplam_ciro / v_siparis_sayisi ELSE 0 END,
      musteri_sayisi = v_musteri_sayisi,
      en_cok_satilan_urun = v_en_cok_satilan_urun,
      en_cok_satilan_urun_adet = v_en_cok_satilan_adet;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 8. Trigger: Ciro hedef başarısını hesapla
CREATE OR REPLACE FUNCTION guncelle_ciro_hedefi()
RETURNS TRIGGER AS $$
DECLARE
  v_hedef_ciro DECIMAL(10,2);
  v_gercek_ciro DECIMAL(10,2);
  v_basari_yuzde DECIMAL(5,2);
BEGIN
  IF NEW.durum = 'tamamlandi' THEN
    -- Bugünün hedefini bul
    SELECT hedef_ciro INTO v_hedef_ciro
    FROM ciro_hedefleri
    WHERE restoran_id = NEW.restoran_id
    AND ay = EXTRACT(MONTH FROM NOW())
    AND yil = EXTRACT(YEAR FROM NOW());

    IF v_hedef_ciro IS NOT NULL THEN
      -- Bugünün gerçek cirosunu hesapla
      SELECT COALESCE(SUM(toplam_tutar), 0)
      INTO v_gercek_ciro
      FROM siparisler
      WHERE restoran_id = NEW.restoran_id
      AND DATE(created_at) = CURRENT_DATE
      AND durum = 'tamamlandi';

      -- Başarı yüzdesini hesapla
      v_basari_yuzde := (v_gercek_ciro / v_hedef_ciro) * 100;

      -- Hedefi güncelle
      UPDATE ciro_hedefleri
      SET 
        gercek_ciro = v_gercek_ciro,
        basari_yuzde = LEAST(v_basari_yuzde, 100)
      WHERE restoran_id = NEW.restoran_id
      AND ay = EXTRACT(MONTH FROM NOW())
      AND yil = EXTRACT(YEAR FROM NOW());
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_guncelle_ciro_hedefi ON siparisler;
CREATE TRIGGER tr_guncelle_ciro_hedefi
  AFTER UPDATE ON siparisler
  FOR EACH ROW
  EXECUTE FUNCTION guncelle_ciro_hedefi();

-- 9. İndeksler
CREATE INDEX IF NOT EXISTS idx_ciro_hedefleri_restoran ON ciro_hedefleri(restoran_id);
CREATE INDEX IF NOT EXISTS idx_rakip_fiyat_restoran ON rakip_fiyat_casusu(restoran_id);
CREATE INDEX IF NOT EXISTS idx_oto_rapor_restoran ON oto_rapor_ayarlari(restoran_id);
CREATE INDEX IF NOT EXISTS idx_basari_rozetleri_restoran ON basari_rozetleri(restoran_id);
CREATE INDEX IF NOT EXISTS idx_gunluk_basari_restoran ON gunluk_basari_ozeti(restoran_id);

-- 10. Row Level Security
ALTER TABLE ciro_hedefleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE rakip_fiyat_casusu ENABLE ROW LEVEL SECURITY;
ALTER TABLE oto_rapor_ayarlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE basari_rozetleri ENABLE ROW LEVEL SECURITY;
ALTER TABLE gunluk_basari_ozeti ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ciro_hedefleri_access" ON ciro_hedefleri
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );

CREATE POLICY "rakip_fiyat_access" ON rakip_fiyat_casusu
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );

CREATE POLICY "basari_rozetleri_access" ON basari_rozetleri
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );
