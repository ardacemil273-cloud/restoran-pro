export const PAKETLER = {
  basit: {
    ad: 'Basit',
    fiyat: 0,
    ozellikler: {
      garson_panel: true,
      kasa: false,
      qr_menu: false,
      rapor: false,
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
  return PAKETLER[paketTuru as keyof typeof PAKETLER]?.ozellikler[ozellik as keyof typeof PAKETLER.basit.ozellikler] || false
}
