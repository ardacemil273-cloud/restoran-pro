'use client'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export type OzellikAdi =
  | 'otomatik_tedarik'
  | 'cark_cevirme'
  | 'sadakat_sistemi'
  | 'qr_kupon'
  | 'ai_analiz'
  | 'whatsapp_siparis'
  | 'rezervasyon'
  | 'stok_tahmin'
  | 'garson_performans'
  | 'dinamik_fiyat'

export type OzellikAyari = {
  aktif: boolean
  mod?: string
  aciklama?: string
}

export type OzellikAyarlari = Record<OzellikAdi, OzellikAyari>

const VARSAYILAN_AYARLAR: OzellikAyarlari = {
  otomatik_tedarik: { aktif: true, mod: 'taslak', aciklama: 'Stok azalınca otomatik sipariş taslağı oluştur' },
  cark_cevirme: { aktif: false, aciklama: 'Müşteriler QR menüde çark çevirip ödül kazanabilir' },
  sadakat_sistemi: { aktif: true, aciklama: 'Puan biriktirme ve seviye sistemi' },
  qr_kupon: { aktif: false, aciklama: 'QR menüde özel kupon göster' },
  ai_analiz: { aktif: true, aciklama: 'Yapay zeka destekli satış analizi' },
  whatsapp_siparis: { aktif: false, aciklama: 'WhatsApp üzerinden sipariş alma' },
  rezervasyon: { aktif: true, aciklama: 'Online masa rezervasyonu' },
  stok_tahmin: { aktif: true, aciklama: 'AI ile stok tüketim tahmini' },
  garson_performans: { aktif: true, aciklama: 'Garson performans takibi ve puanlama' },
  dinamik_fiyat: { aktif: false, aciklama: 'Yoğun saatlerde otomatik fiyat ayarı' },
}

export function useFeatureFlags(restoranId?: string) {
  const [ayarlar, setAyarlar] = useState<OzellikAyarlari>(VARSAYILAN_AYARLAR)
  const [yukleniyor, setYukleniyor] = useState(true)

  const yukle = useCallback(async (id?: string) => {
    const targetId = id || restoranId
    if (!targetId) { setYukleniyor(false); return }

    const { data } = await supabase
      .from('restoranlar')
      .select('ozellik_ayarlari')
      .eq('id', targetId)
      .single()

    if (data?.ozellik_ayarlari) {
      setAyarlar({ ...VARSAYILAN_AYARLAR, ...data.ozellik_ayarlari })
    }
    setYukleniyor(false)
  }, [restoranId])

  useEffect(() => {
    yukle()
  }, [yukle])

  const ozellikAktifMi = (ozellik: OzellikAdi): boolean => {
    return ayarlar[ozellik]?.aktif ?? VARSAYILAN_AYARLAR[ozellik]?.aktif ?? false
  }

  const ozellikModu = (ozellik: OzellikAdi): string | undefined => {
    return ayarlar[ozellik]?.mod
  }

  return { ayarlar, yukleniyor, ozellikAktifMi, ozellikModu, yukle }
}
