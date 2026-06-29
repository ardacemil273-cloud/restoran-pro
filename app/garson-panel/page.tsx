'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Clock, CheckCircle, AlertCircle, Settings, LogOut, Home, Loader } from 'lucide-react'
import dynamic from 'next/dynamic'

const SesliSiparis = dynamic(() => import('@/components/SesliSiparis'), { ssr: false })

function GarsonPanelInner() {
  const [garson, setGarson] = useState<any>(null)
  const [restoran, setRestoran] = useState<any>(null)
  const [siparisler, setSiparisler] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [sesliSiparisGoster, setSesliSiparisGoster] = useState(false)
  const [sesliSiparisAktif, setSesliSiparisAktif] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const masaId = searchParams.get('masa')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      setGarson(user)

      // Restoran bilgisi al (garson profil verilerinden)
      const { data: profile } = await supabase
        .from('profiles')
        .select('restoran_id')
        .eq('id', user.id)
        .single()

      if (!profile?.restoran_id) {
        toast.error('Restoran bilgisi bulunamadı')
        return
      }

      const { data: restoranData } = await supabase
        .from('restoranlar')
        .select('*')
        .eq('id', profile.restoran_id)
        .single()

      setRestoran(restoranData)

      // Feature flags kontrol
      const sesliAktif = restoranData?.ozellik_ayarlari?.sesli_siparis?.aktif === true
      setSesliSiparisAktif(sesliAktif)

      // Siparişleri yükle
      const { data: siparisData } = await supabase
        .from('sesli_siparisler')
        .select('*')
        .eq('restoran_id', profile.restoran_id)
        .order('created_at', { ascending: false })
        .limit(20)

      setSiparisler(siparisData || [])
    } catch (err: any) {
      toast.error('Veri yüklenemedi')
    } finally {
      setYukleniyor(false)
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-900/20 to-purple-900/20 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Loader className="w-16 h-16 text-cyan-400" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-900/20 to-purple-900/20 p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400">
            🎤 Garson Paneli
          </h1>
          <p className="text-cyan-300/70 text-sm mt-1">
            {restoran?.ad} — Sesle sipariş alma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-400 transition"
          >
            <Home className="w-5 h-5" />
          </button>
          <button
            onClick={logout}
            className="p-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 transition"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </motion.div>

      {/* Sesli Sipariş Butonu */}
      {sesliSiparisAktif && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={() => setSesliSiparisGoster(true)}
          whileTap={{ scale: 0.95 }}
          className="w-full mb-6 py-6 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-black text-lg rounded-2xl shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/70 transition flex items-center justify-center gap-3"
        >
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
            <Mic className="w-6 h-6" />
          </motion.div>
          Sesle Sipariş Al
        </motion.button>
      )}

      {!sesliSiparisAktif && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-yellow-300 font-bold text-sm">Sesli sipariş devre dışı</p>
            <p className="text-yellow-400/70 text-xs">Ayarlardan aktif edebilirsiniz</p>
          </div>
        </motion.div>
      )}

      {/* Siparişler Listesi */}
      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-cyan-500/30 flex items-center justify-between">
          <h2 className="font-black text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Son Siparişler
          </h2>
          <span className="text-xs px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded-full font-bold">
            {siparisler.length}
          </span>
        </div>

        {siparisler.length === 0 ? (
          <div className="text-center py-12">
            <Mic className="w-12 h-12 text-cyan-500/30 mx-auto mb-3" />
            <p className="text-cyan-300/70 font-medium">Henüz sipariş yok</p>
            <p className="text-cyan-400/50 text-sm mt-1">Sesle sipariş almaya başlayın</p>
          </div>
        ) : (
          <div className="divide-y divide-cyan-500/20">
            {siparisler.map((siparis, idx) => (
              <motion.div
                key={siparis.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 hover:bg-cyan-500/5 transition"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    siparis.durum === 'tamamlandi'
                      ? 'bg-green-500/20'
                      : siparis.durum === 'isleniyor'
                      ? 'bg-yellow-500/20'
                      : 'bg-cyan-500/20'
                  }`}>
                    {siparis.durum === 'tamamlandi' ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Mic className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-white font-bold text-sm line-clamp-2">
                      {siparis.transcribed_text || 'Ses kaydı'}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                        siparis.durum === 'tamamlandi'
                          ? 'bg-green-500/20 text-green-400'
                          : siparis.durum === 'isleniyor'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {siparis.durum === 'tamamlandi' ? 'Tamamlandı' : siparis.durum === 'isleniyor' ? 'İşleniyor' : 'Beklemede'}
                      </span>
                      <span className="text-xs text-cyan-300/50">
                        {new Date(siparis.created_at).toLocaleTimeString('tr-TR')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Sesli Sipariş Modal */}
      <AnimatePresence>
        {sesliSiparisGoster && restoran && (
          <SesliSiparis
            restoranId={restoran.id}
            garsonId={garson?.id}
            tip="garson"
            onKapat={() => setSesliSiparisGoster(false)}
            onSiparisKayit={() => {
              loadData()
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function GarsonPanel() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-cyan-900/20 to-purple-900/20 flex items-center justify-center">
        <Loader className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    }>
      <GarsonPanelInner />
    </Suspense>
  )
}
