-- Restoranlar tablosuna sipariş webhook URL'si ekle
ALTER TABLE restoranlar
ADD COLUMN IF NOT EXISTS siparis_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS siparis_webhook_aktif BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS siparis_webhook_secret TEXT;

-- İndeks
CREATE INDEX IF NOT EXISTS idx_restoranlar_webhook ON restoranlar(siparis_webhook_aktif) WHERE siparis_webhook_aktif = true;
