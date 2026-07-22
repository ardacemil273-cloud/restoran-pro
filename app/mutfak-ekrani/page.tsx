'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock, Check, AlertCircle, Volume2, VolumeX, RefreshCw, Zap, ChefHat,
  Flame, Timer, TrendingUp
} from 'lucide-react'

type Siparis = {
  id: string
  masa_ad: string
  durum: 'hazirlaniyor' | 'hazir' | 'tamamlandi'
  created_at: string
  siparis_urunleri: {
    id: string
    adet: number
    urunler: { ad: string }
  }[]
}

export default function MutfakEkraniPage() {
  const [siparisler, setSiparisler] = useState<Siparis[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [sesAcik, setSesAcik] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!restoran) return
    const channel = supabase
      .channel('mutfak-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'siparisler', filter: `restoran_id=eq.${restoran.id}` },
        (payload) => {
          if (sesAcik) playSound()
          toast.success('🔔 Yeni sipariş!', { description: `Masa: ${payload.new.masa_ad}` })
          getSiparisler(restoran.id)
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'siparisler', filter: `restoran_id=eq.${restoran.id}` },
        () => getSiparisler(restoran.id)
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [restoran, sesAcik])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar').select('*').eq('sahibi_id', user.id).single()
    if (!restoranData) { toast.error('Restoran bulunamadı'); return }
    setRestoran(restoranData)
    await getSiparisler(restoranData.id)
    setYukleniyor(false)
  }

  async function getSiparisler(restoranId: string) {
    const { data } = await supabase
      .from('siparisler')
      .select('*, siparis_urunleri(id, adet, urunler(ad))')
      .eq('restoran_id', restoranId)
      .in('durum', ['hazirlaniyor', 'hazir'])
      .order('created_at', { ascending: true })
    setSiparisler(data || [])
  }

  function playSound() {
    audioRef.current?.play().catch(() => {})
  }

  async function durumGuncelle(siparisId: string, yeniDurum: string) {
    const { error } = await supabase.from('siparisler').update({ durum: yeniDurum }).eq('id', siparisId)
    if (error) { toast.error('Güncellenemedi'); return }
    toast.success(yeniDurum === 'hazir' ? '✅ Hazır!' : '🎉 Teslim!')
    getSiparisler(restoran.id)
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen()
      setFullscreen(true)
    } else {
      document.exitFullscreen()
      setFullscreen(false)
    }
  }

  const hazirlaniyor = siparisler.filter(s => s.durum === 'hazirlaniyor')
  const hazir = siparisler.filter(s => s.durum === 'hazir')

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-black text-white flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <ChefHat className="w-16 h-16 text-yellow-500" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className={`${fullscreen ? 'fixed inset-0' : ''} bg-gradient-to-br from-zinc-900 to-black text-white p-4 md:p-8 min-h-screen`}>
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white flex items-center gap-3">
            <Flame className="w-10 h-10 text-orange-500 animate-pulse" />
            Mutfak Ekranı
          </h1>
          <p className="text-zinc-400 text-lg mt-2">{restoran?.ad}</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={() => setSesAcik(!sesAcik)}
            className={`rounded-full p-3 ${sesAcik ? 'bg-green-600 hover:bg-green-700' : 'bg-zinc-700 hover:bg-zinc-600'}`}
            title={sesAcik ? 'Sesi Kapat' : 'Sesi Aç'}
          >
            {sesAcik ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
          </Button>
          <Button
            onClick={toggleFullscreen}
            className="rounded-full p-3 bg-blue-600 hover:bg-blue-700"
            title="Tam Ekran"
          >
            <Zap className="w-6 h-6" />
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-8"
      >
        <Card className="p-4 bg-orange-900/30 border-orange-700 text-center">
          <p className="text-xs text-orange-300 mb-1">Hazırlanıyor</p>
          <p className="text-4xl font-black text-orange-400">{hazirlaniyor.length}</p>
        </Card>
        <Card className="p-4 bg-green-900/30 border-green-700 text-center">
          <p className="text-xs text-green-300 mb-1">Hazır</p>
          <p className="text-4xl font-black text-green-400">{hazir.length}</p>
        </Card>
        <Card className="p-4 bg-yellow-900/30 border-yellow-700 text-center">
          <p className="text-xs text-yellow-300 mb-1">Toplam</p>
          <p className="text-4xl font-black text-yellow-400">{siparisler.length}</p>
        </Card>
      </motion.div>

      {/* Hazırlanıyor */}
      <div className="mb-8">
        <h2 className="text-2xl font-black text-orange-400 mb-4 flex items-center gap-2">
          <Flame className="w-6 h-6" />
          Hazırlanıyor ({hazirlaniyor.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {hazirlaniyor.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="col-span-full text-center py-12 text-zinc-500"
              >
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Hazırlanacak sipariş yok</p>
              </motion.div>
            ) : (
              hazirlaniyor.map((siparis, idx) => (
                <motion.div
                  key={siparis.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="p-6 bg-gradient-to-br from-orange-950 to-zinc-900 border-2 border-orange-600 hover:border-orange-400 transition-all h-full flex flex-col">
                    <div className="flex-1 mb-4">
                      <h3 className="text-2xl font-black text-white mb-2">{siparis.masa_ad}</h3>
                      <div className="flex items-center gap-2 text-orange-300 mb-4">
                        <Timer className="w-4 h-4" />
                        <span className="text-sm font-bold">
                          {Math.floor((Date.now() - new Date(siparis.created_at).getTime()) / 60000)}dk
                        </span>
                      </div>
                      <div className="space-y-2">
                        {siparis.siparis_urunleri.map(su => (
                          <div key={su.id} className="p-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
                            <p className="font-bold text-white">
                              <span className="text-orange-400 text-lg">{su.adet}x</span> {su.urunler.ad}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => durumGuncelle(siparis.id, 'hazir')}
                      className="w-full bg-green-600 hover:bg-green-700 text-white font-black text-lg py-6 rounded-xl transition-all"
                    >
                      <Check className="w-6 h-6 mr-2" />
                      HAZIR
                    </Button>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Hazır */}
      <div>
        <h2 className="text-2xl font-black text-green-400 mb-4 flex items-center gap-2">
          <Check className="w-6 h-6" />
          Hazır ({hazir.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {hazir.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="col-span-full text-center py-12 text-zinc-500"
              >
                <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Hazır sipariş yok</p>
              </motion.div>
            ) : (
              hazir.map((siparis, idx) => (
                <motion.div
                  key={siparis.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="p-6 bg-gradient-to-br from-green-950 to-zinc-900 border-2 border-green-600 hover:border-green-400 transition-all h-full flex flex-col">
                    <div className="flex-1 mb-4">
                      <h3 className="text-2xl font-black text-white mb-2">{siparis.masa_ad}</h3>
                      <div className="space-y-2">
                        {siparis.siparis_urunleri.map(su => (
                          <div key={su.id} className="p-2 bg-zinc-800/50 rounded-lg border border-zinc-700">
                            <p className="font-bold text-white">
                              <span className="text-green-400 text-lg">{su.adet}x</span> {su.urunler.ad}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <Button
                      onClick={() => durumGuncelle(siparis.id, 'tamamlandi')}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-black text-lg py-6 rounded-xl transition-all"
                    >
                      <TrendingUp className="w-6 h-6 mr-2" />
                      TESLİM ET
                    </Button>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
