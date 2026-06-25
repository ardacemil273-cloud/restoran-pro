'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRestoran } from '@/lib/useRestoran'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PAKETLER } from '@/lib/paketler'

export default function MasaEklePage() {
  const { restoran } = useRestoran()
  const [masaAd, setMasaAd] = useState('Masa')
  const [baslangic, setBaslangic] = useState('1')
  const [kapasite, setKapasite] = useState('4')
  const [loading, setLoading] = useState(false)
  const [mevcutMasaSayisi, setMevcutMasaSayisi] = useState(0)
  const router = useRouter()

  useEffect(() => {
    if (restoran) {
      getMevcutMasaSayisi()
    }
  }, [restoran])

  async function getMevcutMasaSayisi() {
    const { count } = await supabase
   .from('masalar')
   .select('*', { count: 'exact', head: true })
   .eq('restoran_id', restoran.id)

    setMevcutMasaSayisi(count || 0)
  }

  async function masaEkle() {
    if (!restoran) return toast.error('Restoran bulunamadı')
    if (!masaAd.trim()) return toast.error('Masa adı gir')
    if (!baslangic || Number(baslangic) < 1) return toast.error('Geçerli başlangıç gir')

    const paket = PAKETLER[restoran.paket_turu as keyof typeof PAKETLER]

    if (mevcutMasaSayisi >= paket.limit.masa) {
      toast.error(`${paket.ad} pakette max ${paket.limit.masa} masa. Paketi yükselt.`)
      return
    }

    setLoading(true)

    const masaNo = Number(baslangic)

    const { error } = await supabase.from('masalar').insert({
      restoran_id: restoran.id,
      ad: `${masaAd.trim()} ${baslangic}`,
      kapasite: Number(kapasite) || 4,
      durum: 'bos',
      sira_no: masaNo // EKLENDİ
    })

    setLoading(false)

    if (error) {
      toast.error('Hata: ' + error.message)
      return
    }

    toast.success('Masa eklendi!')
    setBaslangic(String(Number(baslangic) + 1))
    getMevcutMasaSayisi()
  }

  async function topluMasaEkle(adet: number) {
    if (!restoran) return toast.error('Restoran bulunamadı')
    if (!baslangic || Number(baslangic) < 1) return toast.error('Geçerli başlangıç gir')

    const paket = PAKETLER[restoran.paket_turu as keyof typeof PAKETLER]
    const kalanHak = paket.limit.masa - mevcutMasaSayisi

    if (mevcutMasaSayisi >= paket.limit.masa) {
      toast.error(`${paket.ad} pakette max ${paket.limit.masa} masa. Paketi yükselt.`, {
        action: {
          label: 'Paketi Yükselt',
          onClick: () => router.push('/ayarlar/paket')
        }
      })
      return
    }

    if (adet > kalanHak) {
      toast.error(`Sadece ${kalanHak} masa daha ekleyebilirsin. Paketi yükselt.`, {
        action: {
          label: 'Paketi Yükselt',
          onClick: () => router.push('/ayarlar/paket')
        }
      })
      return
    }

    setLoading(true)

    const baslangicNo = Number(baslangic)
    const yeniMasalar = Array.from({ length: adet }, (_, i) => ({
      restoran_id: restoran.id,
      ad: `${masaAd.trim()} ${baslangicNo + i}`,
      kapasite: Number(kapasite) || 4,
      durum: 'bos',
      sira_no: baslangicNo + i // EKLENDİ
    }))

    const { error } = await supabase.from('masalar').insert(yeniMasalar)

    setLoading(false)

    if (error) {
      toast.error('Hata: ' + error.message)
      console.log('Insert Error:', error)
      return
    }

    toast.success(`${adet} masa eklendi!`)
    setBaslangic(String(Number(baslangic) + adet))
    getMevcutMasaSayisi()

    setTimeout(() => router.push('/masalar'), 500)
  }

  if (!restoran) {
    return <div className="min-h-screen bg-zinc-900 text-white p-6 flex items-center justify-center">Yükleniyor...</div>
  }

  const paket = PAKETLER[restoran.paket_turu as keyof typeof PAKETLER]
  const kalanHak = paket.limit.masa - mevcutMasaSayisi

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Masa Ekle</h1>
        <Button onClick={() => router.push('/masalar')} className="bg-zinc-700">
          Geri
        </Button>
      </div>

      <div className="mb-4 p-3 bg-zinc-800 rounded text-sm max-w-md">
        <p>Paket: <span className="text-yellow-500 font-bold">{paket.ad}</span></p>
        <p>Mevcut: {mevcutMasaSayisi} / {paket.limit.masa === 999? '∞' : paket.limit.masa}</p>
        {kalanHak <= 5 && kalanHak > 0 && (
          <p className="text-orange-400 mt-1">⚠ Sadece {kalanHak} masa hakkın kaldı</p>
        )}
      </div>

      <Card className="p-6 bg-zinc-800 border-zinc-700 mb-6 max-w-md">
        <h2 className="font-bold mb-4">Tek Masa Ekle</h2>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-zinc-400">Masa Adı</label>
            <Input
              placeholder="Örn: Masa, Teras, Bahçe"
              value={masaAd}
              onChange={e => setMasaAd(e.target.value)}
              className="bg-zinc-700 mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-zinc-400">Başlangıç Numarası</label>
              <Input
                type="text"
                inputMode="numeric"
                value={baslangic}
                onChange={e => setBaslangic(e.target.value)}
                onFocus={e => e.target.select()}
                className="bg-zinc-700 mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400">Kapasite</label>
              <Input
                type="text"
                inputMode="numeric"
                value={kapasite}
                onChange={e => setKapasite(e.target.value)}
                onFocus={e => e.target.select()}
                className="bg-zinc-700 mt-1"
              />
            </div>
          </div>

          <p className="text-xs text-zinc-500">
            Önizleme: <span className="text-yellow-500">{masaAd} {baslangic || '?'}</span>
          </p>

          <Button
            onClick={masaEkle}
            disabled={loading || mevcutMasaSayisi >= paket.limit.masa}
            className="w-full bg-yellow-500 text-black font-bold disabled:bg-zinc-600"
          >
            {loading? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </div>
      </Card>

      <Card className="p-6 bg-zinc-800 border-zinc-700 max-w-md">
        <h2 className="font-bold mb-4">Toplu Masa Ekle</h2>
        <p className="text-sm text-zinc-400 mb-4">
          {masaAd} {baslangic || '?'} - {baslangic? Number(baslangic) + 9 : '?'} arası eklenir
        </p>
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={() => topluMasaEkle(5)}
            disabled={loading || kalanHak < 5}
            className="bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600"
          >
            +5 Masa
          </Button>
          <Button
            onClick={() => topluMasaEkle(10)}
            disabled={loading || kalanHak < 10}
            className="bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600"
          >
            +10 Masa
          </Button>
          <Button
            onClick={() => topluMasaEkle(20)}
            disabled={loading || kalanHak < 20}
            className="bg-zinc-700 disabled:bg-zinc-900 disabled:text-zinc-600"
          >
            +20 Masa
          </Button>
        </div>
        {kalanHak === 0 && (
          <p className="text-xs text-red-400 mt-2">
            Limit doldu. Paketi yükselt.
          </p>
        )}
      </Card>
    </div>
  )
}
