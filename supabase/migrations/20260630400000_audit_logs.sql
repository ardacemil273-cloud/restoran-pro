-- 📋 Audit Logs - İşlem Geçmişi ve Güvenlik Takibi
-- Her işlemin kim tarafından, ne zaman, ne yapıldığını kaydet

-- 1. Audit Logs Tablosu
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  kullanici_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- İşlem Bilgileri
  islem_tipi TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT'
  tablo_adi TEXT, -- 'siparisler', 'musteriler', 'masalar'
  kayit_id UUID,
  
  -- Değişiklik Detayları
  eski_veri JSONB,
  yeni_veri JSONB,
  degisiklik_ozeti TEXT,
  
  -- İşlem Detayları
  ip_adresi INET,
  user_agent TEXT,
  islem_durumu TEXT DEFAULT 'basarili', -- 'basarili', 'hata'
  hata_mesaji TEXT,
  
  -- Zaman
  created_at TIMESTAMP DEFAULT now()
);

-- 2. Audit Logs Arşivi (Aylık Arşiv)
CREATE TABLE IF NOT EXISTS audit_logs_archive (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL,
  kullanici_id UUID,
  islem_tipi TEXT,
  tablo_adi TEXT,
  kayit_id UUID,
  eski_veri JSONB,
  yeni_veri JSONB,
  degisiklik_ozeti TEXT,
  ip_adresi INET,
  user_agent TEXT,
  islem_durumu TEXT,
  hata_mesaji TEXT,
  created_at TIMESTAMP,
  archive_date TIMESTAMP DEFAULT now()
);

-- 3. Kullanıcı Aktivite Özeti
CREATE TABLE IF NOT EXISTS kullanici_aktivite_ozeti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  kullanici_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tarih DATE DEFAULT CURRENT_DATE,
  
  -- Aktivite Sayıları
  toplam_islem INTEGER DEFAULT 0,
  siparis_islemleri INTEGER DEFAULT 0,
  musteri_islemleri INTEGER DEFAULT 0,
  rapor_islemleri INTEGER DEFAULT 0,
  ayarlar_degisiklikleri INTEGER DEFAULT 0,
  
  -- Başarı/Hata
  basarili_islem INTEGER DEFAULT 0,
  hata_islem INTEGER DEFAULT 0,
  
  -- Zaman
  ilk_islem_saati TIMESTAMP,
  son_islem_saati TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(restoran_id, kullanici_id, tarih)
);

-- 4. Hassas İşlem Uyarıları
CREATE TABLE IF NOT EXISTS hassas_islem_uyarilari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  kullanici_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Uyarı Bilgileri
  uyari_tipi TEXT, -- 'yuksek_indirim', 'toplu_silme', 'veri_export', 'ayar_degisiklik'
  uyari_aciklama TEXT,
  islem_detayi JSONB,
  
  -- Onay
  onay_gerekli BOOLEAN DEFAULT true,
  onaylandi BOOLEAN DEFAULT false,
  onay_tarihi TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT now()
);

-- 5. Audit Log Trigger (Siparişler)
CREATE OR REPLACE FUNCTION log_siparis_degisikligi()
RETURNS TRIGGER AS $$
DECLARE
  v_degisiklik_ozeti TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_degisiklik_ozeti := 'Yeni sipariş oluşturuldu: ' || NEW.id;
    INSERT INTO audit_logs (
      restoran_id, kullanici_id, islem_tipi, tablo_adi, kayit_id,
      yeni_veri, degisiklik_ozeti
    )
    VALUES (
      NEW.restoran_id, auth.uid(), 'CREATE', 'siparisler', NEW.id,
      row_to_json(NEW), v_degisiklik_ozeti
    );
  ELSIF TG_OP = 'UPDATE' THEN
    v_degisiklik_ozeti := 'Sipariş güncellendi: ' || NEW.durum;
    INSERT INTO audit_logs (
      restoran_id, kullanici_id, islem_tipi, tablo_adi, kayit_id,
      eski_veri, yeni_veri, degisiklik_ozeti
    )
    VALUES (
      NEW.restoran_id, auth.uid(), 'UPDATE', 'siparisler', NEW.id,
      row_to_json(OLD), row_to_json(NEW), v_degisiklik_ozeti
    );
  ELSIF TG_OP = 'DELETE' THEN
    v_degisiklik_ozeti := 'Sipariş silindi: ' || OLD.id;
    INSERT INTO audit_logs (
      restoran_id, kullanici_id, islem_tipi, tablo_adi, kayit_id,
      eski_veri, degisiklik_ozeti
    )
    VALUES (
      OLD.restoran_id, auth.uid(), 'DELETE', 'siparisler', OLD.id,
      row_to_json(OLD), v_degisiklik_ozeti
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Audit Log Triggers
DROP TRIGGER IF EXISTS tr_log_siparis_degisikligi ON siparisler;
CREATE TRIGGER tr_log_siparis_degisikligi
  AFTER INSERT OR UPDATE OR DELETE ON siparisler
  FOR EACH ROW
  EXECUTE FUNCTION log_siparis_degisikligi();

-- 7. Audit Logs Arşivleme (Aylık)
CREATE OR REPLACE FUNCTION archive_audit_logs()
RETURNS void AS $$
BEGIN
  INSERT INTO audit_logs_archive
  SELECT * FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
  
  DELETE FROM audit_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 8. Aktivite Özeti Güncelle
CREATE OR REPLACE FUNCTION guncelle_aktivite_ozeti()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO kullanici_aktivite_ozeti (
    restoran_id, kullanici_id, tarih, toplam_islem, basarili_islem
  )
  VALUES (
    NEW.restoran_id, NEW.kullanici_id, CURRENT_DATE, 1, 1
  )
  ON CONFLICT (restoran_id, kullanici_id, tarih) DO UPDATE SET
    toplam_islem = kullanici_aktivite_ozeti.toplam_islem + 1,
    basarili_islem = CASE WHEN NEW.islem_durumu = 'basarili' THEN kullanici_aktivite_ozeti.basarili_islem + 1 ELSE kullanici_aktivite_ozeti.basarili_islem END,
    son_islem_saati = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_guncelle_aktivite_ozeti ON audit_logs;
CREATE TRIGGER tr_guncelle_aktivite_ozeti
  AFTER INSERT ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION guncelle_aktivite_ozeti();

-- 9. İndeksler
CREATE INDEX IF NOT EXISTS idx_audit_logs_restoran ON audit_logs(restoran_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_kullanici ON audit_logs(kullanici_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_islem_tipi ON audit_logs(islem_tipi);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tablo ON audit_logs(tablo_adi);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_kullanici_aktivite_restoran ON kullanici_aktivite_ozeti(restoran_id);
CREATE INDEX IF NOT EXISTS idx_hassas_islem_restoran ON hassas_islem_uyarilari(restoran_id);

-- 10. Row Level Security
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE kullanici_aktivite_ozeti ENABLE ROW LEVEL SECURITY;
ALTER TABLE hassas_islem_uyarilari ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_access" ON audit_logs
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );

CREATE POLICY "kullanici_aktivite_access" ON kullanici_aktivite_ozeti
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );
