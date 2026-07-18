'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UtensilsCrossed, Clock, CheckCircle, Plus, RefreshCw, LogOut, ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type Masa = {
  id: string
  ad: string
  durum: 'bos' | 'dolu'
  kapasite: number
  aktifSiparis?: {
    id: string
    created_at: string
    toplam_tutar: number
    urun_sayisi: number
  } | null
}

export default function GarsonPage() {
  const [masalar, setMasalar] = useState<Masa[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [garson, setGarson] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [yenileniyor, setYenileniyor] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!restoran) return
    // Realtime masa güncellemeleri
    const channel = supabase
      .channel('garson-masalar')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'siparisler',
        filter: `restoran_id=eq.${restoran.id}`
      }, () => {
        getMasalar(restoran.id)
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'masalar',
        filter: `restoran_id=eq.${restoran.id}`
      }, () => {
        getMasalar(restoran.id)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [restoran])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/garson/giris')

    // Garson profili
    const { data: garsonData } = await supabase
      .from('garsonlar')
      .select('*, restoranlar(*)')
      .eq('kullanici_id', user.id)
      .eq('aktif', true)
      .maybeSingle()

    // Eğer garson değilse, restoran sahibi mi kontrol et
    if (!garsonData) {
      const { data: restoranData } = await supabase
      .from('restoranlar')
      .select('*')
      .eq('sahibi_id', user.id)
      .maybeSingle()

      if (!restoranData) {
        // kullanici_restoran tablosundan dene
        const { data: krData } = await supabase
          .from('kullanici_restoran')
          .select('restoran_id, restoranlar(*)')
          .eq('user_id', user.id)
          .maybeSingle()

        if (!krData) {
          toast.error('Erişim reddedildi')
          return router.push('/garson/giris')
        }

        const r = (krData as any).restoranlar
        setRestoran(r)
        setGarson({ ad: 'Yönetici', rol: 'yonetici', restoran_id: r.id })
        await getMasalar(r.id)
        setYukleniyor(false)
        return
      }

      setRestoran(restoranData)
      setGarson({ ad: 'Yönetici', rol: 'yonetici', restoran_id: restoranData.id })
      await getMasalar(restoranData.id)
    } else {
      setRestoran(garsonData.restoranlar)
      setGarson(garsonData)
      await getMasalar(garsonData.restoran_id)
    }

    setYukleniyor(false)
  }

  const getMasalar = async (restoranId: string) => {
    const { data: masaData } = await supabase
      .from('masalar')
      .select(`
        id, ad, durum, kapasite,
        siparisler!left(id, created_at, toplam_tutar, durum, siparis_urunleri(id))
      `)
      .eq('restoran_id', restoranId)
      .order('ad')

    const masalarWithSiparis = masaData?.map(masa => {
      const aktifSiparis = masa.siparisler?.find((s: any) => s.durum === 'hazirlaniyor' || s.durum === 'hazir')
      return {
        ...masa,
        aktifSiparis: aktifSiparis ? {
          id: aktifSiparis.id,
          created_at: aktifSiparis.created_at,
          toplam_tutar: aktifSiparis.toplam_tutar,
          urun_sayisi: aktifSiparis.siparis_urunleri?.length || 0
        } : null
      }
    }) || []

    setMasalar(masalarWithSiparis)
  }

  const yenile = async () => {
    if (!restoran) return
    setYenileniyor(true)
    await getMasalar(restoran.id)
    setYenileniyor(false)
  }

  const cikisYap = async () => {
    await supabase.auth.signOut()
    router.push('/garson/giris')
  }

  const dakikaHesapla = (tarih: string) => {
    const fark = Math.floor((Date.now() - new Date(tarih).getTime()) / 60000)
    if (fark < 1) return 'Az önce'
    if (fark < 60) return `${fark} dk`
    return `${Math.floor(fark / 60)} sa ${fark % 60} dk`
  }

  const bosMasaSayisi = masalar.filter(m => !m.aktifSiparis).length
  const doluMasaSayisi = masalar.filter(m => m.aktifSiparis).length

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center text-white">
          <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 text-yellow-500 animate-pulse" />
          <p>Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <div className="bg-zinc-800 border-b border-zinc-700 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-yellow-500" />
            <div>
              <p className="font-bold text-sm leading-tight">{restoran?.ad}</p>
              <p className="text-xs text-zinc-400">{garson?.ad} · Garson Paneli</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => router.push('/garson/mutfak')}
              className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-8"
            >
              <ChefHat className="w-3 h-3 mr-1" />
              Mutfak
            </Button>
            <Button
              size="icon"
              onClick={yenile}
              className="bg-zinc-700 h-8 w-8"
            >
              <RefreshCw className={`w-4 h-4 ${yenileniyor ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              size="icon"
              onClick={cikisYap}
              className="bg-zinc-700 h-8 w-8"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Özet */}
        <div className="flex gap-3 mt-2">
          <span className="text-xs bg-green-900/50 text-green-400 px-2 py-1 rounded-full">
            {bosMasaSayisi} boş masa
          </span>
          <span className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded-full">
            {doluMasaSayisi} dolu masa
          </span>
        </div>
      </div>

      {/* Masa Grid */}
      <div className="p-4">
        {masalar.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <UtensilsCrossed className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Henüz masa eklenmemiş</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {masalar.map(masa => (
              <Card
                key={masa.id}
                onClick={() => router.push(`/garson/siparis/${masa.id}`)}
                className={`p-4 cursor-pointer active:scale-95 transition-all border-2 ${
                  masa.aktifSiparis
                    ? 'bg-red-950/40 border-red-700 hover:bg-red-950/60'
                    : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-750 hover:border-zinc-500'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-base">{masa.ad}</h3>
                  {masa.aktifSiparis ? (
                    <Badge className="bg-red-700 text-red-100 text-xs">Dolu</Badge>
                  ) : (
                    <Badge className="bg-green-800 text-green-200 text-xs">Boş</Badge>
                  )}
                </div>

                {masa.aktifSiparis ? (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-xs text-zinc-400">
                      <Clock className="w-3 h-3" />
                      {dakikaHesapla(masa.aktifSiparis.created_at)}
                    </div>
                    <p className="text-xs text-zinc-400">{masa.aktifSiparis.urun_sayisi} kalem</p>
                    <p className="text-yellow-400 font-bold text-sm">{masa.aktifSiparis.toplam_tutar}₺</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-xs text-zinc-500 mt-2">
                    <Plus className="w-3 h-3" />
                    Sipariş al
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
