-- 📦 Otomatik Tedarik Sistemi - Stok Azalınca Otomatik Sipariş
-- Minimum stok seviyesine ulaşınca tedarikçiye otomatik sipariş gönder

-- 1. Tedarikçiler Tablosu
CREATE TABLE IF NOT EXISTS tedarikciler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  ad TEXT NOT NULL,
  kategori TEXT, -- 'et', 'sebze', 'icecek', 'malzeme'
  telefon TEXT,
  email TEXT,
  adres TEXT,
  
  -- Ödeme Bilgileri
  banka_hesap IBAN,
  vergi_numarasi TEXT,
  
  -- Tercihleri
  varsayilan_teslimat_suresi INTEGER, -- Gün cinsinden
  minimum_siparis_tutari DECIMAL(10,2),
  
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- 2. Ürün-Tedarikçi İlişkisi
CREATE TABLE IF NOT EXISTS urun_tedarikciler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  urun_id UUID NOT NULL REFERENCES urunler(id) ON DELETE CASCADE,
  tedarikci_id UUID NOT NULL REFERENCES tedarikciler(id) ON DELETE CASCADE,
  
  -- Fiyat Bilgileri
  birim_fiyati DECIMAL(10,2) NOT NULL,
  minimum_siparis_miktari INTEGER DEFAULT 1,
  
  -- Stok Kontrolü
  minimum_stok_seviyesi INTEGER, -- Bu seviyeye ulaşınca sipariş et
  optimal_siparis_miktari INTEGER, -- Kaç adet sipariş et
  
  -- Tercih
  tercih_sirasi INTEGER DEFAULT 1, -- 1. tercih, 2. tercih vb
  
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(urun_id, tedarikci_id)
);

-- 3. Otomatik Sipariş Geçmişi
CREATE TABLE IF NOT EXISTS otomatik_siparisler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  tedarikci_id UUID NOT NULL REFERENCES tedarikciler(id) ON DELETE CASCADE,
  
  -- Sipariş Bilgileri
  siparis_numarasi TEXT UNIQUE,
  toplam_tutar DECIMAL(10,2),
  toplam_miktar INTEGER,
  
  -- Durum
  durum TEXT DEFAULT 'bekleme', -- 'bekleme', 'gonderildi', 'teslim_alindi', 'iptal'
  
  -- Ürünler
  urunler JSONB, -- [{urun_id, urun_adi, miktar, fiyat}]
  
  -- Teslimat
  teslimat_tarihi DATE,
  teslimat_adresi TEXT,
  
  -- Notlar
  notlar TEXT,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 4. Stok Uyarıları
CREATE TABLE IF NOT EXISTS stok_uyarilari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  urun_id UUID NOT NULL REFERENCES urunler(id) ON DELETE CASCADE,
  
  -- Uyarı Bilgileri
  uyari_tipi TEXT, -- 'minimum_seviye', 'sifir_stok', 'sona_yaklas'
  mevcut_stok INTEGER,
  minimum_seviye INTEGER,
  
  -- Durum
  uyari_durumu TEXT DEFAULT 'aktif', -- 'aktif', 'cozuldu'
  cozum_tarihi TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT now()
);

-- 5. Stok Kontrolü ve Otomatik Sipariş Fonksiyonu
CREATE OR REPLACE FUNCTION kontrol_et_ve_siparis_olustur()
RETURNS void AS $$
DECLARE
  v_urun RECORD;
  v_tedarikci RECORD;
  v_siparis_id UUID;
  v_toplam_tutar DECIMAL(10,2) := 0;
BEGIN
  -- Tüm ürünleri kontrol et
  FOR v_urun IN
    SELECT u.id, u.ad, u.mevcut_stok, ut.minimum_stok_seviyesi, ut.optimal_siparis_miktari, ut.birim_fiyati, ut.tedarikci_id
    FROM urunler u
    JOIN urun_tedarikciler ut ON u.id = ut.urun_id
    WHERE u.mevcut_stok <= ut.minimum_stok_seviyesi
    AND u.restoran_id = (SELECT id FROM restoranlar LIMIT 1)
  LOOP
    -- Tedarikçi bilgisini al
    SELECT * INTO v_tedarikci FROM tedarikciler WHERE id = v_urun.tedarikci_id;
    
    -- Otomatik sipariş oluştur
    v_siparis_id := gen_random_uuid();
    v_toplam_tutar := v_urun.optimal_siparis_miktari * v_urun.birim_fiyati;
    
    INSERT INTO otomatik_siparisler (
      id, restoran_id, tedarikci_id, siparis_numarasi,
      toplam_tutar, toplam_miktar, urunler, durum
    )
    VALUES (
      v_siparis_id,
      (SELECT id FROM restoranlar LIMIT 1),
      v_urun.tedarikci_id,
      'AUTO-' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
      v_toplam_tutar,
      v_urun.optimal_siparis_miktari,
      jsonb_build_array(
        jsonb_build_object(
          'urun_id', v_urun.id,
          'urun_adi', v_urun.ad,
          'miktar', v_urun.optimal_siparis_miktari,
          'fiyat', v_urun.birim_fiyati
        )
      ),
      'gonderildi'
    );
    
    -- Stok uyarısı oluştur
    INSERT INTO stok_uyarilari (
      restoran_id, urun_id, uyari_tipi, mevcut_stok, minimum_seviye
    )
    VALUES (
      (SELECT id FROM restoranlar LIMIT 1),
      v_urun.id,
      'minimum_seviye',
      v_urun.mevcut_stok,
      v_urun.minimum_stok_seviyesi
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. Stok Güncellemesi Trigger
CREATE OR REPLACE FUNCTION guncelle_stok_ve_siparis()
RETURNS TRIGGER AS $$
BEGIN
  -- Stok azalırsa kontrol et
  IF NEW.mevcut_stok < OLD.mevcut_stok THEN
    PERFORM kontrol_et_ve_siparis_olustur();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_guncelle_stok_ve_siparis ON urunler;
CREATE TRIGGER tr_guncelle_stok_ve_siparis
  AFTER UPDATE ON urunler
  FOR EACH ROW
  EXECUTE FUNCTION guncelle_stok_ve_siparis();

-- 7. İndeksler
CREATE INDEX IF NOT EXISTS idx_tedarikciler_restoran ON tedarikciler(restoran_id);
CREATE INDEX IF NOT EXISTS idx_urun_tedarikciler_urun ON urun_tedarikciler(urun_id);
CREATE INDEX IF NOT EXISTS idx_urun_tedarikciler_tedarikci ON urun_tedarikciler(tedarikci_id);
CREATE INDEX IF NOT EXISTS idx_otomatik_siparisler_restoran ON otomatik_siparisler(restoran_id);
CREATE INDEX IF NOT EXISTS idx_otomatik_siparisler_durum ON otomatik_siparisler(durum);
CREATE INDEX IF NOT EXISTS idx_stok_uyarilari_restoran ON stok_uyarilari(restoran_id);
CREATE INDEX IF NOT EXISTS idx_stok_uyarilari_durum ON stok_uyarilari(uyari_durumu);

-- 8. Row Level Security
ALTER TABLE tedarikciler ENABLE ROW LEVEL SECURITY;
ALTER TABLE urun_tedarikciler ENABLE ROW LEVEL SECURITY;
ALTER TABLE otomatik_siparisler ENABLE ROW LEVEL SECURITY;
ALTER TABLE stok_uyarilari ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tedarikciler_access" ON tedarikciler
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );

CREATE POLICY "otomatik_siparisler_access" ON otomatik_siparisler
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );

CREATE POLICY "stok_uyarilari_access" ON stok_uyarilari
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );
