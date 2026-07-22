-- Ürünler tablosuna stok takip alanları ekleniyor
-- stok: mevcut stok miktarı (null = stok takibi yok)
-- kritik_stok: bu seviyenin altına düşünce uyarı ver
-- stok_birimi: adet, kg, litre, porsiyon vb.

ALTER TABLE urunler
  ADD COLUMN IF NOT EXISTS stok INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS kritik_stok INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS stok_birimi TEXT DEFAULT 'adet';

-- Stok güncelleme için index
CREATE INDEX IF NOT EXISTS idx_urunler_stok ON urunler(restoran_id, stok, kritik_stok)
  WHERE stok IS NOT NULL;

-- Stok uyarısı view'i: kritik seviyenin altındaki ürünler
CREATE OR REPLACE VIEW stok_uyarilari AS
SELECT
  u.id,
  u.restoran_id,
  u.ad,
  u.stok,
  u.kritik_stok,
  u.stok_birimi,
  k.ad AS kategori_ad,
  CASE
    WHEN u.stok = 0 THEN 'tukendi'
    WHEN u.stok <= u.kritik_stok THEN 'kritik'
    ELSE 'normal'
  END AS stok_durumu
FROM urunler u
LEFT JOIN kategoriler k ON k.id = u.kategori_id
WHERE u.stok IS NOT NULL
  AND u.stok <= u.kritik_stok
  AND u.aktif = true;
