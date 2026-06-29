// Paket sistemi - ödeme entegrasyonu hazır ama henüz aktif değil
// Şu an tüm özellikler tüm kullanıcılara açık (beta dönemi)

export const PAKETLER = {
  basit: {
    ad: 'Basit',
    fiyat: 0,
    ozellikler: {
      garson_panel: true,
      kasa: true,
      qr_menu: true,
      rapor: true,
      ai_analiz: true,
      rezervasyon: true,
      stok: true,
      gider: true,
      musteriler: true,
      indirimler: true,
      sinirsiz_masa: false,
      sinirsiz_urun: false
    },
    limit: {
      masa: 5,
      urun: 20
    }
  },
  big: {
    ad: 'Big',
    fiyat: 199,
    ozellikler: {
      garson_panel: true,
      kasa: true,
      qr_menu: true,
      rapor: false,
      ai_analiz: false,
      rezervasyon: true,
      stok: true,
      gider: true,
      musteriler: true,
      indirimler: true,
      sinirsiz_masa: true,
      sinirsiz_urun: true
    },
    limit: {
      masa: 999,
      urun: 999
    }
  },
  pro: {
    ad: 'Pro',
    fiyat: 399,
    ozellikler: {
      garson_panel: true,
      kasa: true,
      qr_menu: true,
      rapor: true,
      ai_analiz: true,
      rezervasyon: true,
      stok: true,
      gider: true,
      musteriler: true,
      indirimler: true,
      sinirsiz_masa: true,
      sinirsiz_urun: true
    },
    limit: {
      masa: 999,
      urun: 999
    }
  }
}

export function paketKontrol(paketTuru: string, ozellik: string) {
  // Şu an beta: tüm özellikler açık
  return true
  // Gerçek kontrol (ödeme aktif olduğunda):
  // return PAKETLER[paketTuru as keyof typeof PAKETLER]?.ozellikler[ozellik as keyof typeof PAKETLER.basit.ozellikler] || false
}
