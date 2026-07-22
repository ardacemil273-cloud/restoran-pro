-- Yemeksepeti Entegrasyonu Tabloları

-- 1. Yemeksepeti Bağlantı Bilgileri
CREATE TABLE IF NOT EXISTS yemeksepeti_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  
  -- OAuth Bilgileri
  client_id VARCHAR(255) NOT NULL,
  client_secret VARCHAR(255) NOT NULL,
  access_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Chain Bilgileri
  chain_id VARCHAR(255),
  vendor_id VARCHAR(255),
  
  -- Webhook Bilgileri
  webhook_secret VARCHAR(255),
  webhook_aktif BOOLEAN DEFAULT true,
  
  -- Durum
  baglanti_aktif BOOLEAN DEFAULT false,
  son_senkronizasyon TIMESTAMP WITH TIME ZONE,
  hata_mesaji TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(restoran_id),
  UNIQUE(client_id)
);

-- 2. Yemeksepeti Siparişleri
CREATE TABLE IF NOT EXISTS yemeksepeti_siparisler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  
  -- Yemeksepeti Sipariş Bilgileri
  yemeksepeti_order_id VARCHAR(255) NOT NULL UNIQUE,
  chain_id VARCHAR(255),
  vendor_id VARCHAR(255),
  
  -- Sipariş Detayları
  durum VARCHAR(50), -- PENDING, CONFIRMED, PREPARING, READY, COMPLETED, CANCELLED
  toplam_tutar DECIMAL(10, 2),
  para_birimi VARCHAR(3),
  
  -- Müşteri Bilgileri
  musteri_adi VARCHAR(255),
  musteri_telefon VARCHAR(20),
  musteri_email VARCHAR(255),
  
  -- Teslimat Bilgileri
  teslimat_adresi TEXT,
  teslimat_notu TEXT,
  
  -- Ürünler (JSON olarak saklanır)
  urunler JSONB,
  
  -- Zaman Bilgileri
  siparis_tarihi TIMESTAMP WITH TIME ZONE,
  hazirlik_suresi_dakika INTEGER,
  
  -- Senkronizasyon
  local_siparis_id UUID REFERENCES siparisler(id) ON DELETE SET NULL,
  senkronize BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Yemeksepeti Ürünleri (Katalog)
CREATE TABLE IF NOT EXISTS yemeksepeti_urunler (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  
  -- Yemeksepeti Bilgileri
  yemeksepeti_sku VARCHAR(255) NOT NULL,
  yemeksepeti_product_id VARCHAR(255),
  
  -- Ürün Bilgileri
  adi VARCHAR(255) NOT NULL,
  aciklama TEXT,
  kategori VARCHAR(255),
  
  -- Fiyatlandırma
  fiyat DECIMAL(10, 2),
  yemeksepeti_fiyat DECIMAL(10, 2),
  
  -- Stok
  stok INTEGER,
  aktif BOOLEAN DEFAULT true,
  
  -- Senkronizasyon
  local_urun_id UUID REFERENCES urunler(id) ON DELETE SET NULL,
  son_guncelleme TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(restoran_id, yemeksepeti_sku)
);

-- 4. Yemeksepeti Webhook Logları
CREATE TABLE IF NOT EXISTS yemeksepeti_webhook_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restoran_id UUID NOT NULL REFERENCES restoranlar(id) ON DELETE CASCADE,
  
  -- Webhook Bilgileri
  event_type VARCHAR(100), -- order.created, order.updated, order.cancelled
  payload JSONB,
  
  -- İşleme Bilgileri
  islem_basarili BOOLEAN,
  hata_mesaji TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. İndeksler
CREATE INDEX idx_yemeksepeti_connections_restoran_id ON yemeksepeti_connections(restoran_id);
CREATE INDEX idx_yemeksepeti_siparisler_restoran_id ON yemeksepeti_siparisler(restoran_id);
CREATE INDEX idx_yemeksepeti_siparisler_yemeksepeti_order_id ON yemeksepeti_siparisler(yemeksepeti_order_id);
CREATE INDEX idx_yemeksepeti_urunler_restoran_id ON yemeksepeti_urunler(restoran_id);
CREATE INDEX idx_yemeksepeti_webhook_logs_restoran_id ON yemeksepeti_webhook_logs(restoran_id);

-- 6. RLS (Row Level Security) Politikaları
ALTER TABLE yemeksepeti_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE yemeksepeti_siparisler ENABLE ROW LEVEL SECURITY;
ALTER TABLE yemeksepeti_urunler ENABLE ROW LEVEL SECURITY;
ALTER TABLE yemeksepeti_webhook_logs ENABLE ROW LEVEL SECURITY;

-- RLS Politikaları - Kullanıcı sadece kendi restoranının verilerini görebilir
CREATE POLICY "Kullanıcı kendi Yemeksepeti bağlantısını görebilir"
  ON yemeksepeti_connections FOR SELECT
  USING (
    restoran_id IN (
      SELECT id FROM restoranlar WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Kullanıcı kendi Yemeksepeti siparişlerini görebilir"
  ON yemeksepeti_siparisler FOR SELECT
  USING (
    restoran_id IN (
      SELECT id FROM restoranlar WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Kullanıcı kendi Yemeksepeti ürünlerini görebilir"
  ON yemeksepeti_urunler FOR SELECT
  USING (
    restoran_id IN (
      SELECT id FROM restoranlar WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Kullanıcı kendi Yemeksepeti webhook loglarını görebilir"
  ON yemeksepeti_webhook_logs FOR SELECT
  USING (
    restoran_id IN (
      SELECT id FROM restoranlar WHERE user_id = auth.uid()
    )
  );
