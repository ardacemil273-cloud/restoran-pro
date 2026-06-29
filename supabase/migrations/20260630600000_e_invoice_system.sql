-- 📄 E-Fatura Sistemi - Resmi Muhasebe Entegrasyonu
-- Sipariş kapatılınca otomatik fatura oluştur, resmi standartlara uygun

-- 1. Fatura Tablosu
CREATE TABLE IF NOT EXISTS faturalar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  siparis_id UUID NOT NULL REFERENCES siparisler(id) ON DELETE CASCADE,
  
  -- Fatura Bilgileri
  fatura_numarasi TEXT UNIQUE NOT NULL,
  fatura_tarihi DATE DEFAULT CURRENT_DATE,
  vade_tarihi DATE,
  
  -- Müşteri Bilgileri
  musteri_adi TEXT,
  musteri_telefon TEXT,
  musteri_email TEXT,
  musteri_adres TEXT,
  musteri_vergi_numarasi TEXT,
  
  -- Ürün Bilgileri
  urunler JSONB, -- [{urun_adi, miktar, birim_fiyati, kdv_orani, toplam}]
  
  -- Tutarlar
  ara_toplam DECIMAL(10,2),
  kdv_tutari DECIMAL(10,2),
  genel_indirim DECIMAL(10,2) DEFAULT 0,
  indirim_orani DECIMAL(5,2) DEFAULT 0,
  toplam_tutar DECIMAL(10,2),
  
  -- Ödeme
  odeme_sekli TEXT, -- 'nakit', 'kart', 'cek', 'havale'
  odeme_durumu TEXT DEFAULT 'beklemede', -- 'beklemede', 'odenmiş', 'iptal'
  odeme_tarihi TIMESTAMP,
  
  -- Fatura Durumu
  fatura_durumu TEXT DEFAULT 'taslak', -- 'taslak', 'gonderildi', 'iptal'
  
  -- Notlar
  notlar TEXT,
  
  -- Muhasebe
  muhasebe_kaydı BOOLEAN DEFAULT false,
  muhasebe_tarihi TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 2. Fatura Şablonları
CREATE TABLE IF NOT EXISTS fatura_sablonlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  
  -- Şablon Bilgileri
  sablon_adi TEXT NOT NULL,
  
  -- Restoran Bilgileri
  restoran_adi TEXT,
  restoran_adres TEXT,
  restoran_telefon TEXT,
  restoran_email TEXT,
  restoran_vergi_numarasi TEXT,
  restoran_logo_url TEXT,
  
  -- Fatura Ayarları
  fatura_serisi TEXT DEFAULT 'F', -- Fatura serisinin ilk harfi
  kdv_orani DECIMAL(5,2) DEFAULT 18,
  
  -- Dipnot
  dipnot TEXT,
  
  created_at TIMESTAMP DEFAULT now()
);

-- 3. Fatura Numarası Sayacı
CREATE TABLE IF NOT EXISTS fatura_sayaci (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  
  -- Sayaç
  yil INTEGER,
  ay INTEGER,
  son_numara INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(restoran_id, yil, ay)
);

-- 4. Muhasebe Kaydı
CREATE TABLE IF NOT EXISTS muhasebe_kayitlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  fatura_id UUID NOT NULL REFERENCES faturalar(id) ON DELETE CASCADE,
  
  -- Muhasebe Bilgileri
  kayit_tarihi DATE DEFAULT CURRENT_DATE,
  kayit_saati TIME DEFAULT CURRENT_TIME,
  
  -- Hesap Bilgileri
  hesap_kodu TEXT, -- '600', '700' vb
  hesap_adi TEXT,
  
  -- Tutar
  borç DECIMAL(10,2) DEFAULT 0,
  alacak DECIMAL(10,2) DEFAULT 0,
  
  -- Açıklama
  aciklama TEXT,
  
  created_at TIMESTAMP DEFAULT now()
);

-- 5. Fatura Numarası Oluştur
CREATE OR REPLACE FUNCTION olustur_fatura_numarasi(p_restoran_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_yil INTEGER := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
  v_ay INTEGER := EXTRACT(MONTH FROM CURRENT_DATE)::INTEGER;
  v_son_numara INTEGER;
  v_fatura_numarasi TEXT;
BEGIN
  -- Sayacı güncelle
  INSERT INTO fatura_sayaci (restoran_id, yil, ay, son_numara)
  VALUES (p_restoran_id, v_yil, v_ay, 1)
  ON CONFLICT (restoran_id, yil, ay) DO UPDATE SET
    son_numara = fatura_sayaci.son_numara + 1
  RETURNING son_numara INTO v_son_numara;

  -- Fatura numarası oluştur: F-2026-06-00001
  v_fatura_numarasi := 'F-' || v_yil || '-' || LPAD(v_ay::TEXT, 2, '0') || '-' || LPAD(v_son_numara::TEXT, 5, '0');
  
  RETURN v_fatura_numarasi;
END;
$$ LANGUAGE plpgsql;

-- 6. Sipariş Tamamlanınca Fatura Oluştur
CREATE OR REPLACE FUNCTION olustur_fatura_otomatik()
RETURNS TRIGGER AS $$
DECLARE
  v_fatura_id UUID;
  v_fatura_numarasi TEXT;
  v_ara_toplam DECIMAL(10,2);
  v_kdv_tutari DECIMAL(10,2);
  v_toplam DECIMAL(10,2);
BEGIN
  IF NEW.durum = 'tamamlandi' AND OLD.durum != 'tamamlandi' THEN
    -- Fatura numarası oluştur
    v_fatura_numarasi := olustur_fatura_numarasi(NEW.restoran_id);
    
    -- Tutarları hesapla
    v_ara_toplam := NEW.toplam_tutar;
    v_kdv_tutari := v_ara_toplam * 0.18;
    v_toplam := v_ara_toplam + v_kdv_tutari;
    
    -- Fatura oluştur
    INSERT INTO faturalar (
      restoran_id, siparis_id, fatura_numarasi, fatura_tarihi,
      ara_toplam, kdv_tutari, toplam_tutar, odeme_sekli
    )
    VALUES (
      NEW.restoran_id, NEW.id, v_fatura_numarasi, CURRENT_DATE,
      v_ara_toplam, v_kdv_tutari, v_toplam, 'nakit'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_olustur_fatura_otomatik ON siparisler;
CREATE TRIGGER tr_olustur_fatura_otomatik
  AFTER UPDATE ON siparisler
  FOR EACH ROW
  EXECUTE FUNCTION olustur_fatura_otomatik();

-- 7. İndeksler
CREATE INDEX IF NOT EXISTS idx_faturalar_restoran ON faturalar(restoran_id);
CREATE INDEX IF NOT EXISTS idx_faturalar_siparis ON faturalar(siparis_id);
CREATE INDEX IF NOT EXISTS idx_faturalar_numarasi ON faturalar(fatura_numarasi);
CREATE INDEX IF NOT EXISTS idx_faturalar_tarihi ON faturalar(fatura_tarihi);
CREATE INDEX IF NOT EXISTS idx_faturalar_durumu ON faturalar(fatura_durumu);
CREATE INDEX IF NOT EXISTS idx_muhasebe_kayitlari_restoran ON muhasebe_kayitlari(restoran_id);
CREATE INDEX IF NOT EXISTS idx_muhasebe_kayitlari_fatura ON muhasebe_kayitlari(fatura_id);

-- 8. Row Level Security
ALTER TABLE faturalar ENABLE ROW LEVEL SECURITY;
ALTER TABLE fatura_sablonlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE muhasebe_kayitlari ENABLE ROW LEVEL SECURITY;

CREATE POLICY "faturalar_access" ON faturalar
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );

CREATE POLICY "muhasebe_kayitlari_access" ON muhasebe_kayitlari
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );
