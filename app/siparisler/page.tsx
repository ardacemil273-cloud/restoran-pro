'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Check, Clock, Truck, Volume2, VolumeX, Printer,
  Trash2, ChefHat, Receipt, ShoppingCart, LayoutDashboard,
  RefreshCw, AlertCircle, CheckCircle2, Timer, Package
} from 'lucide-react'
import { fisYazdir } from '@/components/FisYazdir'

type Siparis = {
  id: string
  masa_id: string | null
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

function SiparisSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="rounded-xl border-2 border-zinc-700 p-4 space-y-3 animate-pulse">
          <div className="flex justify-between">
            <div className="h-5 bg-zinc-700 rounded w-24" />
            <div className="h-5 bg-zinc-700 rounded w-16" />
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-zinc-700 rounded w-full" />
            <div className="h-4 bg-zinc-700 rounded w-3/4" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 bg-zinc-700 rounded flex-1" />
            <div className="h-8 bg-zinc-700 rounded w-8" />
          </div>
        </div>
      ))}
    </div>
  )
}

function SiparisKart({ siparis, onDurumGuncelle, onSil, onKasaFisi, onMutfakFisi }: {
  siparis: Siparis
  onDurumGuncelle: (id: string, durum: string, masaId: string | null) => void
  onSil: (id: string, masaId: string | null) => void
  onKasaFisi: (s: Siparis) => void
  onMutfakFisi: (s: Siparis) => void
}) {
  const renkMap: Record<string, string> = {
    hazirlaniyor: 'border-orange-600 bg-orange-950/20',
    hazir: 'border-green-600 bg-green-950/20',
    tamamlandi: 'border-blue-700 bg-blue-950/20',
    iptal: 'border-zinc-700 bg-zinc-900/50'
  }
  const durumRenk: Record<string, string> = {
    hazirlaniyor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    hazir: 'bg-green-500/20 text-green-300 border-green-500/30',
    tamamlandi: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    iptal: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30'
  }
  const durumLabel: Record<string, string> = {
    hazirlaniyor: 'Hazırlanıyor',
    hazir: 'Hazır',
    tamamlandi: 'Teslim Edildi',
    iptal: 'İptal'
  }
  const sure = Math.floor((Date.now() - new Date(siparis.created_at).getTime()) / 60000)
  const gecikme = sure > 20

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <Card className={`p-4 border-2 ${renkMap[siparis.durum]} transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/5 ${gecikme ? 'ring-1 ring-red-500/30' : ''}`}>
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-black text-white text-base">{siparis.masa_ad}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs px-2 py-0.5 rounded-full border font-bold ${durumRenk[siparis.durum]}`}>
                {durumLabel[siparis.durum]}
              </span>
              <span className={`text-xs flex items-center gap-1 ${gecikme ? 'text-red-400 font-bold' : 'text-zinc-500'}`}>
                <Timer className="w-3 h-3" />
                {sure}dk
                {gecikme && <AlertCircle className="w-3 h-3" />}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-black text-yellow-400">{Number(siparis.toplam_tutar).toFixed(2)}₺</p>
            <p className="text-xs text-zinc-500">{new Date(siparis.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
          </div>
        </div>
        <div className="space-y-1 mb-3 max-h-32 overflow-y-auto">
          {siparis.siparis_urunleri?.map(su => (
            <div key={su.id} className="flex justify-between text-sm">
              <span className="text-zinc-300">
                <span className="text-yellow-400 font-bold">{su.adet}x</span> {su.urunler?.ad}
              </span>
              <span className="text-zinc-400">{(su.adet * su.birim_fiyat).toFixed(2)}₺</span>
            </div>
          ))}
        </div>
        {siparis.not && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 mb-3">
            <p className="text-xs text-yellow-300 flex items-start gap-1">
              <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
              {siparis.not}
            </p>
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          {siparis.durum === 'hazirlaniyor' && (
            <Button onClick={() => onDurumGuncelle(siparis.id, 'hazir', siparis.masa_id)} size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold text-xs">
              <Check className="w-3 h-3 mr-1" />Hazırlandı
            </Button>
          )}
          {siparis.durum === 'hazir' && (
            <Button onClick={() => onDurumGuncelle(siparis.id, 'tamamlandi', siparis.masa_id)} size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs">
              <Truck className="w-3 h-3 mr-1" />Teslim Edildi
            </Button>
          )}
          <Button onClick={() => onKasaFisi(siparis)} size="sm" variant="outline" className="border-zinc-600 hover:bg-zinc-800 text-xs px-2" title="Kasa Fişi">
            <Receipt className="w-3 h-3" />
          </Button>
          <Button onClick={() => onMutfakFisi(siparis)} size="sm" variant="outline" className="border-zinc-600 hover:bg-zinc-800 text-xs px-2" title="Mutfak Fişi">
            <Printer className="w-3 h-3" />
          </Button>
          {siparis.durum !== 'tamamlandi' && siparis.durum !== 'iptal' && (
            <Button onClick={() => onSil(siparis.id, siparis.masa_id)} size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-950 px-2" title="İptal Et">
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  )
}

function SiparisGrid({ siparisler, onDurumGuncelle, onSil, onKasaFisi, onMutfakFisi }: {
  siparisler: Siparis[]
  onDurumGuncelle: (id: string, durum: string, masaId: string | null) => void
  onSil: (id: string, masaId: string | null) => void
  onKasaFisi: (s: Siparis) => void
  onMutfakFisi: (s: Siparis) => void
}) {
  if (siparisler.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
        <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-zinc-600" />
        </div>
        <p className="text-zinc-400 font-medium">Bu durumda sipariş yok</p>
        <p className="text-zinc-600 text-sm mt-1">Yeni siparişler burada görünecek</p>
      </motion.div>
    )
  }
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <AnimatePresence mode="popLayout">
        {siparisler.map(siparis => (
          <SiparisKart key={siparis.id} siparis={siparis} onDurumGuncelle={onDurumGuncelle} onSil={onSil} onKasaFisi={onKasaFisi} onMutfakFisi={onMutfakFisi} />
        ))}
      </AnimatePresence>
    </div>
  )
}

function SiparislerPageInner() {
  const [siparisler, setSiparisler] = useState<Siparis[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [sesAcik, setSesAcik] = useState(true)
  const [yenileniyor, setYenileniyor] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!restoran) return
    const channel = supabase
      .channel('siparisler-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'siparisler', filter: `restoran_id=eq.${restoran.id}` },
        (payload) => {
          if (sesAcik) audioRef.current?.play().catch(() => {})
          toast.success('🔔 Yeni sipariş!', { description: `Masa: ${payload.new.masa_ad}`, duration: 5000 })
          getSiparisler(restoran.id)
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'siparisler', filter: `restoran_id=eq.${restoran.id}` },
        () => getSiparisler(restoran.id)
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [restoran, sesAcik])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    const { data: restoranData } = await supabase.from('restoranlar').select('*').eq('sahibi_id', user.id).single()
    if (!restoranData) { toast.error('Restoran bulunamadı'); return }
    setRestoran(restoranData)
    await getSiparisler(restoranData.id)
    setYukleniyor(false)
  }

  async function getSiparisler(restoranId: string) {
    const { data } = await supabase
      .from('siparisler')
      .select('*, siparis_urunleri(id, adet, birim_fiyat, urunler(ad, fiyat))')
      .eq('restoran_id', restoranId)
      .neq('durum', 'iptal')
      .order('created_at', { ascending: false })
    setSiparisler(data || [])
  }

  // 🔧 KRİTİK FIX: Masa doluluk senkronizasyonu
  async function masaDurumSenkronize(masaId: string | null) {
    if (!masaId) return
    const { data: aktifSiparisler } = await supabase
      .from('siparisler').select('id').eq('masa_id', masaId).in('durum', ['hazirlaniyor', 'hazir'])
    if ((aktifSiparisler?.length ?? 0) === 0) {
      await supabase.from('masalar').update({ durum: 'bos' }).eq('id', masaId)
    }
  }

  async function durumGuncelle(siparisId: string, yeniDurum: string, masaId: string | null) {
    const { error } = await supabase.from('siparisler').update({ durum: yeniDurum }).eq('id', siparisId)
    if (error) { toast.error('Güncellenemedi: ' + error.message); return }
    if (yeniDurum === 'tamamlandi') {
      toast.success('✅ Sipariş teslim edildi')
      await masaDurumSenkronize(masaId)
    } else if (yeniDurum === 'hazir') {
      toast.success('🍽️ Sipariş hazırlandı')
    }
    getSiparisler(restoran.id)
  }

  async function siparisSil(siparisId: string, masaId: string | null) {
    if (!confirm('Siparişi iptal etmek istediğine emin misin?')) return
    const { error } = await supabase.from('siparisler').update({ durum: 'iptal' }).eq('id', siparisId)
    if (error) { toast.error('Silinemedi: ' + error.message); return }
    toast.success('Sipariş iptal edildi')
    await masaDurumSenkronize(masaId)
    getSiparisler(restoran.id)
  }

  function kasaFisiYazdir(siparis: Siparis) {
    fisYazdir({ siparis, restoranAd: restoran?.ad || 'Restoran', restoranTelefon: restoran?.telefon, restoranAdres: restoran?.adres, tip: 'kasa' })
  }

  function mutfakFisiYazdir(siparis: Siparis) {
    fisYazdir({ siparis, restoranAd: restoran?.ad || 'Restoran', tip: 'mutfak' })
  }

  async function yenile() {
    setYenileniyor(true)
    await getSiparisler(restoran.id)
    setYenileniyor(false)
    toast.success('Siparişler güncellendi')
  }

  const hazirlaniyor = siparisler.filter(s => s.durum === 'hazirlaniyor')
  const hazir = siparisler.filter(s => s.durum === 'hazir')
  const tamamlandi = siparisler.filter(s => s.durum === 'tamamlandi')
  const masaIdFilter = searchParams?.get('masa_id')
  const filtreliSiparisler = masaIdFilter ? siparisler.filter(s => s.masa_id === masaIdFilter) : null

  if (yukleniyor) {
    return (
      <div className="p-6 bg-zinc-900 min-h-screen">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 bg-zinc-700 rounded-lg animate-pulse" />
          <div className="h-7 w-40 bg-zinc-700 rounded animate-pulse" />
        </div>
        <SiparisSkeleton />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 bg-zinc-900 min-h-screen">
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ShoppingCart className="w-7 h-7 text-yellow-500" />Siparişler
          </h1>
          {masaIdFilter && <p className="text-sm text-yellow-400 mt-1">Masa filtresi aktif</p>}
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-orange-400 font-medium">{hazirlaniyor.length} Hazırlanıyor</span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-green-400 font-medium">{hazir.length} Hazır</span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-blue-400 font-medium">{tamamlandi.length} Teslim</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setSesAcik(!sesAcik)} variant="outline" size="sm" className={`border-zinc-600 ${sesAcik ? 'text-green-400' : 'text-zinc-500'}`} title={sesAcik ? 'Sesi Kapat' : 'Sesi Aç'}>
            {sesAcik ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </Button>
          <Button onClick={yenile} variant="outline" size="sm" className="border-zinc-600 hover:bg-zinc-800" disabled={yenileniyor}>
            <RefreshCw className={`w-4 h-4 ${yenileniyor ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => router.push('/dashboard')} className="bg-zinc-700 hover:bg-zinc-600 text-sm" size="sm">
            <LayoutDashboard className="w-4 h-4 mr-1.5" />Dashboard
          </Button>
        </div>
      </motion.div>

      {filtreliSiparisler ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex items-center gap-2 mb-4">
            <Button onClick={() => router.push('/siparisler')} variant="outline" size="sm" className="border-zinc-600 hover:bg-zinc-800 text-xs">← Tüm Siparişler</Button>
            <span className="text-zinc-400 text-sm">{filtreliSiparisler.length} sipariş</span>
          </div>
          <SiparisGrid siparisler={filtreliSiparisler} onDurumGuncelle={durumGuncelle} onSil={siparisSil} onKasaFisi={kasaFisiYazdir} onMutfakFisi={mutfakFisiYazdir} />
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="p-3 bg-orange-950/30 border-orange-700/50 text-center">
              <p className="text-2xl font-black text-orange-400">{hazirlaniyor.length}</p>
              <p className="text-xs text-zinc-400 mt-1">Hazırlanıyor</p>
            </Card>
            <Card className="p-3 bg-green-950/30 border-green-700/50 text-center">
              <p className="text-2xl font-black text-green-400">{hazir.length}</p>
              <p className="text-xs text-zinc-400 mt-1">Hazır</p>
            </Card>
            <Card className="p-3 bg-blue-950/30 border-blue-700/50 text-center">
              <p className="text-2xl font-black text-blue-400">{tamamlandi.length}</p>
              <p className="text-xs text-zinc-400 mt-1">Teslim</p>
            </Card>
          </div>
          <Tabs defaultValue="hazirlaniyor" className="space-y-4">
            <TabsList className="bg-zinc-800 border border-zinc-700 w-full">
              <TabsTrigger value="hazirlaniyor" className="flex-1 data-[state=active]:bg-orange-600 data-[state=active]:text-white text-xs sm:text-sm">
                <Clock className="w-3 h-3 mr-1" />Hazırlanıyor
                {hazirlaniyor.length > 0 && <span className="ml-1.5 bg-orange-500 text-white text-xs font-black rounded-full w-4 h-4 flex items-center justify-center">{hazirlaniyor.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="hazir" className="flex-1 data-[state=active]:bg-green-600 data-[state=active]:text-white text-xs sm:text-sm">
                <Bell className="w-3 h-3 mr-1" />Hazır
                {hazir.length > 0 && <span className="ml-1.5 bg-green-500 text-white text-xs font-black rounded-full w-4 h-4 flex items-center justify-center">{hazir.length}</span>}
              </TabsTrigger>
              <TabsTrigger value="tamamlandi" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white text-xs sm:text-sm">
                <CheckCircle2 className="w-3 h-3 mr-1" />Teslim
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
        </motion.div>
      )}
    </div>
  )
}

export default function SiparislerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full" />
      </div>
    }>
      <SiparislerPageInner />
    </Suspense>
  )
}
