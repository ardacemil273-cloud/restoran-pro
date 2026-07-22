/*
# Müşteriler tablosu oluştur

1. Yeni Tablo
- `musteriler`
- `id` (bigint, primary key, auto increment)
- `restoran_id` (uuid, restoranlar tablosuna foreign key)
- `telefon` (text, zorunlu — müşterinin telefon numarası)
- `ad` (text, zorunlu — müşteri adı soyadı)
- `adres` (text, opsiyonel — teslimat adresi)
- `notlar` (text, opsiyonel — müşteri hakkında not)
- `created_at` (timestamp, otomatik)

2. İndeksler
- `telefon` + `restoran_id` üzerinde unique indeks — aynı restoranda aynı telefon tek kayıt
- `restoran_id` üzerinde indeks — restorana göre sorgu

3. Güvenlik (RLS)
- RLS açık
- authenticated kullanıcılar kendi restoranlarının müşterilerini yönetebilir
- restoran sahipliği kullanici_restoran tablosu üzerinden kontrol edilir

4. Önemli Notlar
- Bu tablo mevcut siparisler tablosuyla çakışmaz
- siparisler tablosundaki musteri_adi alanı bu tabloya referans vermez, sadece isim kopyalanır
*/

CREATE TABLE IF NOT EXISTS musteriler (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  restoran_id uuid NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  telefon text NOT NULL,
  ad text NOT NULL,
  adres text,
  notlar text,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS musteriler_telefon_restoran_unique
  ON musteriler (restoran_id, telefon);

CREATE INDEX IF NOT EXISTS musteriler_restoran_idx
  ON musteriler (restoran_id);

ALTER TABLE musteriler ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_musteriler" ON musteriler;
CREATE POLICY "select_own_musteriler" ON musteriler FOR SELECT
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM kullanici_restoran
      WHERE kullanici_restoran.restoran_id = musteriler.restoran_id
      AND kullanici_restoran.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "insert_own_musteriler" ON musteriler;
CREATE POLICY "insert_own_musteriler" ON musteriler FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM kullanici_restoran
      WHERE kullanici_restoran.restoran_id = musteriler.restoran_id
      AND kullanici_restoran.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "update_own_musteriler" ON musteriler;
CREATE POLICY "update_own_musteriler" ON musteriler FOR UPDATE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM kullanici_restoran
      WHERE kullanici_restoran.restoran_id = musteriler.restoran_id
      AND kullanici_restoran.user_id = auth.uid()
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM kullanici_restoran
      WHERE kullanici_restoran.restoran_id = musteriler.restoran_id
      AND kullanici_restoran.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "delete_own_musteriler" ON musteriler;
CREATE POLICY "delete_own_musteriler" ON musteriler FOR DELETE
  TO authenticated USING (
    EXISTS (
      SELECT 1 FROM kullanici_restoran
      WHERE kullanici_restoran.restoran_id = musteriler.restoran_id
      AND kullanici_restoran.user_id = auth.uid()
    )
  );