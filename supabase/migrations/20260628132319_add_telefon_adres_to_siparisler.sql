/*
# Siparisler tablosuna telefon ve adres alanları ekle

1. Değişiklikler
- `siparisler` tablosuna `telefon` (text, opsiyonel) — paket sipariş için müşteri telefonu
- `siparisler` tablosuna `adres` (text, opsiyonel) — paket sipariş için teslimat adresi
- `siparisler` tablosuna `musteri_id` (bigint, opsiyonel) — musteriler tablosuna referans

2. Önemli Notlar
- Mevcut veriler etkilenmez — yeni sütunlar opsiyonel (nullable)
- masa siparişlerinde bu alanlar boş kalır
- paket siparişlerinde bu alanlar dolar
*/

ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS telefon text;
ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS adres text;
ALTER TABLE siparisler ADD COLUMN IF NOT EXISTS musteri_id bigint REFERENCES musteriler(id) ON DELETE SET NULL;