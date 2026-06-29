-- Siparişler tablosuna eksik alanlar ekleniyor
ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS siparis_notu TEXT;
ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS indirim_kodu TEXT;
ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS indirim_tutari NUMERIC(10,2) DEFAULT 0;

-- Mutfak siparişler tablosuna siparis_notu ekleniyor
ALTER TABLE mutfak_siparisler ADD COLUMN IF NOT EXISTS siparis_notu TEXT;

-- Restoranlar tablosuna eksik alanlar ekleniyor
ALTER TABLE restoranlar ADD COLUMN IF NOT EXISTS telefon TEXT;
ALTER TABLE restoranlar ADD COLUMN IF NOT EXISTS adres TEXT;
ALTER TABLE restoranlar ADD COLUMN IF NOT EXISTS aktif BOOLEAN DEFAULT true;

-- Ürünler tablosuna etiket/badge alanı ekleniyor
ALTER TABLE urunler ADD COLUMN IF NOT EXISTS etiket TEXT;
ALTER TABLE urunler ADD COLUMN IF NOT EXISTS popüler BOOLEAN DEFAULT false;

-- Masalar tablosuna QR kod URL alanı ekleniyor
ALTER TABLE masalar ADD COLUMN IF NOT EXISTS qr_url TEXT;

-- Garsonlar tablosuna son_giris alanı ekleniyor
ALTER TABLE garsonlar ADD COLUMN IF NOT EXISTS son_giris TIMESTAMPTZ;

-- Giderler tablosuna fatura_no alanı ekleniyor
ALTER TABLE giderler ADD COLUMN IF NOT EXISTS fatura_no TEXT;
ALTER TABLE giderler ADD COLUMN IF NOT EXISTS notlar TEXT;

-- İndirimler tablosuna kullanim_adedi alanı ekleniyor (mevcut kullanim_sayisi ile aynı ama yedek)
-- Zaten var, skip

-- Rezervasyonlar tablosuna onay_durumu ekleniyor
ALTER TABLE rezervasyonlar ADD COLUMN IF NOT EXISTS onaylandi BOOLEAN DEFAULT false;

-- Performans için index'ler
CREATE INDEX IF NOT EXISTS idx_siparisler_restoran_tarih ON siparisler(restoran_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_siparisler_durum ON siparisler(restoran_id, durum);
CREATE INDEX IF NOT EXISTS idx_mutfak_siparisler_restoran ON mutfak_siparisler(restoran_id, durum);
CREATE INDEX IF NOT EXISTS idx_rezervasyonlar_tarih ON rezervasyonlar(restoran_id, tarih);
CREATE INDEX IF NOT EXISTS idx_indirimler_kod ON indirimler(restoran_id, kod);
