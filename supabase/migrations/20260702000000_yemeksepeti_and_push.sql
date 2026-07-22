-- Yemeksepeti Siparişleri Tablosu
CREATE TABLE IF NOT EXISTS yemeksepeti_siparisler (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    yemeksepeti_order_id TEXT UNIQUE NOT NULL,
    musteri_ad TEXT,
    musteri_telefon TEXT,
    urunler JSONB,
    toplam_tutar DECIMAL(10,2),
    teslimat_adresi TEXT,
    notlar TEXT,
    durum TEXT DEFAULT 'yeni', -- 'yeni', 'onaylandi', 'hazirlaniyor', 'yolda', 'tamamlandi', 'iptal'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Restoranlar tablosuna Yemeksepeti ayarları ekle
ALTER TABLE restoranlar 
ADD COLUMN IF NOT EXISTS yemeksepeti_api_key TEXT,
ADD COLUMN IF NOT EXISTS yemeksepeti_aktif BOOLEAN DEFAULT false;

-- Push abonelikleri tablosu
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, subscription)
);

-- RLS Politikaları
ALTER TABLE yemeksepeti_siparisler ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Yemeksepeti siparişlerini herkes görebilir (şimdilik)" 
ON yemeksepeti_siparisler FOR SELECT USING (true);

CREATE POLICY "Kullanıcılar kendi push aboneliklerini yönetebilir" 
ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_yemeksepeti_order_id ON yemeksepeti_siparisler(yemeksepeti_order_id);
CREATE INDEX IF NOT EXISTS idx_yemeksepeti_durum ON yemeksepeti_siparisler(durum);
