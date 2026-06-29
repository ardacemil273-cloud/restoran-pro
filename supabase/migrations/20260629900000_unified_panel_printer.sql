-- 🎯 Tek Panel Entegrasyonu + Yazıcı Fiş Sistemi
-- Yemek Sepeti, Getir, Trendyol siparişleri tek ekranda, otomatik yazıcı fiş

-- 1. Platform Entegrasyonu
CREATE TABLE IF NOT EXISTS platform_entegrasyonlari (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  platform TEXT NOT NULL, -- 'yemek_sepeti', 'getir', 'trendyol', 'whatsapp', 'telefon'
  api_key TEXT,
  api_secret TEXT,
  aktif BOOLEAN DEFAULT true,
  son_senkronizasyon TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- 2. Birleştirilmiş Sipariş Tablosu
CREATE TABLE IF NOT EXISTS platform_siparisler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  platform_siparis_id TEXT UNIQUE,
  musteri_adi TEXT NOT NULL,
  musteri_telefon TEXT,
  musteri_adres TEXT,
  urunler JSONB, -- [{ urun_adi, miktar, fiyat }]
  toplam_tutar DECIMAL(10,2),
  komisyon_yuzde DECIMAL(5,2),
  komisyon_tutari DECIMAL(10,2),
  durum TEXT DEFAULT 'yeni', -- 'yeni', 'onaylandi', 'hazirlaniyor', 'hazir', 'teslim_alindi', 'teslim_edildi', 'iptal'
  ozel_istekler TEXT,
  tahmini_hazirlanma_suresi INTEGER, -- dakika
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- 3. Yazıcı Fiş Sistemi
CREATE TABLE IF NOT EXISTS yazici_fisler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  platform_siparis_id UUID NOT NULL REFERENCES platform_siparisler(id) ON DELETE CASCADE,
  fis_numarasi TEXT UNIQUE,
  fis_icerigi TEXT,
  yazici_adi TEXT,
  durum TEXT DEFAULT 'bekleniyor', -- 'bekleniyor', 'yazildi', 'hata'
  hata_mesaji TEXT,
  yazim_tarihi TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- 4. Platform Senkronizasyon Günlüğü
CREATE TABLE IF NOT EXISTS platform_senkronizasyon_gunlugu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  senkronize_edilen_siparis_sayisi INTEGER DEFAULT 0,
  hata_sayisi INTEGER DEFAULT 0,
  durum TEXT, -- 'basarili', 'kismipbasarili', 'hata'
  hata_mesaji TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- 5. Yazıcı Konfigürasyonu
CREATE TABLE IF NOT EXISTS yazici_konfigurasyonu (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  yazici_adi TEXT NOT NULL,
  yazici_tipi TEXT, -- 'termal', 'inkjet', 'lazer'
  ip_adresi TEXT,
  port INTEGER DEFAULT 9100,
  aktif BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- 6. Trigger: Platform siparişi gelince yazıcıya fiş gönder
CREATE OR REPLACE FUNCTION gonder_fis_yaziciya()
RETURNS TRIGGER AS $$
DECLARE
  v_fis_icerigi TEXT;
  v_yazici_id UUID;
BEGIN
  IF NEW.durum = 'onaylandi' THEN
    -- Fiş içeriğini oluştur
    v_fis_icerigi := '
    ╔════════════════════════════════════════╗
    ║         ' || NEW.platform || ' SİPARİŞİ        ║
    ╚════════════════════════════════════════╝
    
    Müşteri: ' || NEW.musteri_adi || '
    Telefon: ' || COALESCE(NEW.musteri_telefon, '-') || '
    Adres: ' || COALESCE(NEW.musteri_adres, '-') || '
    
    ─────────────────────────────────────────
    ÜRÜNLER:
    ─────────────────────────────────────────
    ' || NEW.urunler::TEXT || '
    
    ─────────────────────────────────────────
    Toplam: ' || NEW.toplam_tutar || '₺
    Komisyon: ' || NEW.komisyon_tutari || '₺ (%' || NEW.komisyon_yuzde || ')
    
    Özel İstekler: ' || COALESCE(NEW.ozel_istekler, 'Yok') || '
    
    Tahmini Hazırlanma: ' || NEW.tahmini_hazirlanma_suresi || ' dk
    ═════════════════════════════════════════
    ';

    -- Yazıcı ID'sini al
    SELECT id INTO v_yazici_id FROM yazici_konfigurasyonu 
    WHERE restoran_id = NEW.restoran_id AND aktif = true LIMIT 1;

    -- Fiş kaydını oluştur
    INSERT INTO yazici_fisler (restoran_id, platform_siparis_id, fis_icerigi, yazici_adi, durum)
    VALUES (NEW.restoran_id, NEW.id, v_fis_icerigi, 'Yazıcı 1', 'bekleniyor');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_gonder_fis_yaziciya ON platform_siparisler;
CREATE TRIGGER tr_gonder_fis_yaziciya
  AFTER UPDATE ON platform_siparisler
  FOR EACH ROW
  EXECUTE FUNCTION gonder_fis_yaziciya();

-- 7. İndeksler
CREATE INDEX IF NOT EXISTS idx_platform_siparisler_restoran ON platform_siparisler(restoran_id);
CREATE INDEX IF NOT EXISTS idx_platform_siparisler_platform ON platform_siparisler(platform);
CREATE INDEX IF NOT EXISTS idx_platform_siparisler_durum ON platform_siparisler(durum);
CREATE INDEX IF NOT EXISTS idx_yazici_fisler_restoran ON yazici_fisler(restoran_id);
CREATE INDEX IF NOT EXISTS idx_yazici_konfigurasyonu_restoran ON yazici_konfigurasyonu(restoran_id);

-- 8. Row Level Security
ALTER TABLE platform_entegrasyonlari ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_siparisler ENABLE ROW LEVEL SECURITY;
ALTER TABLE yazici_fisler ENABLE ROW LEVEL SECURITY;
ALTER TABLE yazici_konfigurasyonu ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_entegrasyonlari_access" ON platform_entegrasyonlari
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );

CREATE POLICY "platform_siparisler_access" ON platform_siparisler
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );

CREATE POLICY "yazici_konfigurasyonu_access" ON yazici_konfigurasyonu
  FOR SELECT USING (
    restoran_id IN (SELECT id FROM restoranlar WHERE sahibi_id = auth.uid())
  );
