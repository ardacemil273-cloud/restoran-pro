'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Bell, Check, Clock, Truck, Volume2, VolumeX, Printer,
  Trash2, ChefHat, Receipt, ShoppingCart, LayoutDashboard,
  RefreshCw, AlertCircle
} from 'lucide-react'
import { fisYazdir } from '@/components/FisYazdir'

type Siparis = {
  id: string
  masa_ad: string
  durum: 'hazirlaniyor' | 'hazir' | 'tamamlandi' | 'iptal'
  not: string | null
  toplam_tutar: number
  created_at: string
  siparis_urunleri: {
    id: string
    adet: number
    birim_fiyat: number
    urunler: { ad: string; fiyat: number }
  }[]
}

export default function SiparislerPage() {
  const [siparisler, setSiparisler] = useState<Siparis[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [sesAcik, setSesAcik] = useState(true)
  const [yenileniyor, setYenileniyor] = useState(false)
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!restoran) return

    const channel = supabase
      .channel('siparisler-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'siparisler', filter: `restoran_id=eq.${restoran.id}` },
        (payload) => {
          if (sesAcik) audioRef.current?.play().catch(() => {})
          toast.success('Yeni sipariş!', {
            description: `Masa: ${payload.new.masa_ad}`,
            duration: 5000
          })
          getSiparisler(restoran.id)
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'siparisler', filter: `restoran_id=eq.${restoran.id}` },
        () => getSiparisler(restoran.id)
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [restoran, sesAcik])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar')
      .select('*')
      .eq('sahibi_id', user.id)
      .single()

    if (!restoranData) {
      toast.error('Restoran bulunamadı')
      router.push('/ayarlar')
      return
    }

    setRestoran(restoranData)
    await getSiparisler(restoranData.id)
    setYukleniyor(false)
  }

  async function getSiparisler(restoranId: string) {
    const { data } = await supabase
      .from('siparisler')
      .select(`
        *,
        siparis_urunleri (
          id,
          adet,
          birim_fiyat,
          urunler (ad, fiyat)
        )
      `)
      .eq('restoran_id', restoranId)
      .neq('durum', 'iptal')
      .order('created_at', { ascending: false })

    setSiparisler(data || [])
  }

  async function yenile() {
    if (!restoran) return
    setYenileniyor(true)
    await getSiparisler(restoran.id)
    setYenileniyor(false)
    toast.success('Siparişler güncellendi')
  }

  async function durumGuncelle(siparisId: string, yeniDurum: string) {
    const { error } = await supabase
      .from('siparisler')
      .update({ durum: yeniDurum })
      .eq('id', siparisId)

    if (error) {
      toast.error('Güncellenemedi')
      return
    }

    if (yeniDurum === 'tamamlandi') toast.success('Sipariş teslim edildi ✓')
    else if (yeniDurum === 'hazir') toast.success('Sipariş hazırlandı ✓')
  }

  async function siparisSil(siparisId: string) {
    if (!confirm('Siparişi iptal etmek istediğine emin misin?')) return
    const { error } = await supabase
      .from('siparisler')
      .update({ durum: 'iptal' })
      .eq('id', siparisId)

    if (error) toast.error('Silinemedi')
    else toast.success('Sipariş iptal edildi')
  }

  function kasaFisiYazdir(siparis: Siparis) {
    fisYazdir({
      siparis,
      restoranAd: restoran?.ad || 'Restoran',
      restoranTelefon: restoran?.telefon,
      restoranAdres: restoran?.adres,
      tip: 'kasa'
    })
  }

  function mutfakFisiYazdir(siparis: Siparis) {
    fisYazdir({
      siparis,
      restoranAd: restoran?.ad || 'Restoran',
      tip: 'mutfak'
    })
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500 mx-auto mb-3" />
          <p className="text-zinc-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  const hazirlaniyor = siparisler.filter(s => s.durum === 'hazirlaniyor')
  const hazir = siparisler.filter(s => s.durum === 'hazir')
  const tamamlandi = siparisler.filter(s => s.durum === 'tamamlandi')

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* Başlık */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-orange-500" />
            Siparişler
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-zinc-700 hover:bg-zinc-600"
            size="sm"
          >
            <LayoutDashboard className="w-4 h-4 mr-1.5" />
            Dashboard
          </Button>
          <Button
            onClick={() => router.push('/masalar')}
            className="bg-zinc-700 hover:bg-zinc-600"
            size="sm"
          >
            <ChefHat className="w-4 h-4 mr-1.5" />
            Masalar
          </Button>
          <Button
            onClick={yenile}
            disabled={yenileniyor}
            className="bg-zinc-700 hover:bg-zinc-600"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${yenileniyor ? 'animate-spin' : ''}`} />
            Yenile
          </Button>
          <Button
            onClick={() => setSesAcik(!sesAcik)}
            variant={sesAcik ? 'default' : 'outline'}
            className={sesAcik ? 'bg-green-600 hover:bg-green-700' : 'border-zinc-600'}
            size="sm"
          >
            {sesAcik ? <Volume2 className="w-4 h-4 mr-1.5" /> : <VolumeX className="w-4 h-4 mr-1.5" />}
            Ses {sesAcik ? 'Açık' : 'Kapalı'}
          </Button>
        </div>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-orange-900/30 border border-orange-700/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-orange-400">{hazirlaniyor.length}</p>
          <p className="text-xs text-orange-300/70">Hazırlanıyor</p>
        </div>
        <div className="bg-green-900/30 border border-green-700/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-green-400">{hazir.length}</p>
          <p className="text-xs text-green-300/70">Hazır</p>
        </div>
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-3 text-center">
          <p className="text-2xl font-black text-blue-400">{tamamlandi.length}</p>
          <p className="text-xs text-blue-300/70">Tamamlandı</p>
        </div>
      </div>

      <Tabs defaultValue="hazirlaniyor" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-800 mb-6">
          <TabsTrigger value="hazirlaniyor" className="data-[state=active]:bg-orange-600 data-[state=active]:text-white">
            <Clock className="w-4 h-4 mr-1.5" />
            Hazırlanıyor
            {hazirlaniyor.length > 0 && (
              <span className="ml-1.5 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {hazirlaniyor.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="hazir" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
            <Bell className="w-4 h-4 mr-1.5" />
            Hazır
            {hazir.length > 0 && (
              <span className="ml-1.5 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {hazir.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="tamamlandi" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
            <Check className="w-4 h-4 mr-1.5" />
            Teslim
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hazirlaniyor">
          <SiparisGrid siparisler={hazirlaniyor} onDurumGuncelle={durumGuncelle} onSil={siparisSil} onKasaFisi={kasaFisiYazdir} onMutfakFisi={mutfakFisiYazdir} />
        </TabsContent>
        <TabsContent value="hazir">
          <SiparisGrid siparisler={hazir} onDurumGuncelle={durumGuncelle} onSil={siparisSil} onKasaFisi={kasaFisiYazdir} onMutfakFisi={mutfakFisiYazdir} />
        </TabsContent>
        <TabsContent value="tamamlandi">
          <SiparisGrid siparisler={tamamlandi} onDurumGuncelle={durumGuncelle} onSil={siparisSil} onKasaFisi={kasaFisiYazdir} onMutfakFisi={mutfakFisiYazdir} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SiparisGrid({ siparisler, onDurumGuncelle, onSil, onKasaFisi, onMutfakFisi }: any) {
  if (siparisler.length === 0) {
    return (
      <Card className="p-12 bg-zinc-800 border-zinc-700 text-center">
        <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-zinc-600" />
        <p className="text-zinc-400 font-medium">Bu durumda sipariş yok</p>
        <p className="text-zinc-500 text-sm mt-1">Yeni siparişler geldiğinde burada görünecek</p>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {siparisler.map((siparis: Siparis) => (
        <SiparisCard
          key={siparis.id}
          siparis={siparis}
          onDurumGuncelle={onDurumGuncelle}
          onSil={onSil}
          onKasaFisi={onKasaFisi}
          onMutfakFisi={onMutfakFisi}
        />
      ))}
    </div>
  )
}

function SiparisCard({ siparis, onDurumGuncelle, onSil, onKasaFisi, onMutfakFisi }: any) {
  const gecenDakika = Math.floor((Date.now() - new Date(siparis.created_at).getTime()) / 60000)
  const zaman = new Date(siparis.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })

  const renkMap = {
    hazirlaniyor: 'border-orange-700 bg-orange-950/20',
    hazir: 'border-green-700 bg-green-950/20',
    tamamlandi: 'border-blue-700 bg-blue-950/20'
  }

  const gecikmeRenk = gecenDakika > 20 ? 'text-red-400' : gecenDakika > 10 ? 'text-yellow-400' : 'text-zinc-400'

  return (
    <Card className={`p-4 border-2 ${renkMap[siparis.durum as keyof typeof renkMap]} transition hover:shadow-lg`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-black text-white">{siparis.masa_ad}</h3>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-zinc-400">{zaman}</span>
            <span className={`text-xs font-bold ${gecikmeRenk}`}>
              {gecenDakika > 0 ? `${gecenDakika} dk önce` : 'Az önce'}
            </span>
            {gecenDakika > 20 && (
              <AlertCircle className="w-3 h-3 text-red-400" />
            )}
          </div>
        </div>
        <div className="text-right">
          <span className="text-xl font-black text-yellow-500">{siparis.toplam_tutar}₺</span>
        </div>
      </div>

      <div className="space-y-1.5 mb-3 max-h-36 overflow-y-auto">
        {siparis.siparis_urunleri.map((item: any) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-zinc-200">
              <span className="font-bold text-yellow-500">{item.adet}x</span> {item.urunler?.ad || 'Ürün'}
            </span>
            <span className="text-zinc-400">{item.adet * item.birim_fiyat}₺</span>
          </div>
        ))}
      </div>

      {siparis.not && (
        <div className="text-sm bg-zinc-800 p-2.5 rounded-lg mb-3 border border-yellow-700/30">
          <span className="text-yellow-500 font-bold">Not: </span>
          <span className="text-zinc-300">{siparis.not}</span>
        </div>
      )}

      {/* Durum Butonları */}
      <div className="flex gap-2 mb-2">
        {siparis.durum === 'hazirlaniyor' && (
          <Button
            onClick={() => onDurumGuncelle(siparis.id, 'hazir')}
            className="flex-1 bg-green-600 hover:bg-green-700 font-bold"
            size="sm"
          >
            <Check className="w-4 h-4 mr-1.5" />
            Hazır
          </Button>
        )}
        {siparis.durum === 'hazir' && (
          <Button
            onClick={() => onDurumGuncelle(siparis.id, 'tamamlandi')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 font-bold"
            size="sm"
          >
            <Truck className="w-4 h-4 mr-1.5" />
            Teslim Et
          </Button>
        )}
        {siparis.durum === 'tamamlandi' && (
          <div className="flex-1 flex items-center justify-center text-sm text-green-400 font-bold">
            <Check className="w-4 h-4 mr-1" /> Teslim Edildi
          </div>
        )}
        <Button
          onClick={() => onSil(siparis.id)}
          variant="destructive"
          size="icon"
          className="shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Yazdırma Butonları */}
      <div className="flex gap-2">
        <Button
          onClick={() => onKasaFisi(siparis)}
          variant="outline"
          size="sm"
          className="flex-1 border-yellow-700/50 text-yellow-500 hover:bg-yellow-950/30 text-xs"
        >
          <Receipt className="w-3 h-3 mr-1" />
          Kasa Fişi
        </Button>
        <Button
          onClick={() => onMutfakFisi(siparis)}
          variant="outline"
          size="sm"
          className="flex-1 border-blue-700/50 text-blue-400 hover:bg-blue-950/30 text-xs"
        >
          <ChefHat className="w-3 h-3 mr-1" />
          Mutfak Fişi
        </Button>
      </div>
    </Card>
  )
}
