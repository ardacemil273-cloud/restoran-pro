'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MapPin, Truck, Phone, Clock, CheckCircle, AlertCircle, Navigation } from 'lucide-react'

export default function KuryeTakipPage() {
  const [kuryeler, setKuryeler] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadKuryeler()
  }, [])

  async function loadKuryeler() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Örnek kurye verileri
      const mockKuryeler = [
        { id: 1, ad: 'Ahmet Yılmaz', telefon: '0532 123 45 67', durum: 'aktif', konum: { lat: 41.0082, lng: 28.9784 }, siparisler: 5 },
        { id: 2, ad: 'Fatih Demir', telefon: '0533 234 56 78', durum: 'yolda', konum: { lat: 41.0150, lng: 28.9850 }, siparisler: 3 },
        { id: 3, ad: 'Zeynep Kaya', telefon: '0534 345 67 89', durum: 'teslim', konum: { lat: 41.0200, lng: 28.9900 }, siparisler: 8 },
      ]
      setKuryeler(mockKuryeler)
      setYukleniyor(false)
    } catch (err: any) {
      toast.error('Kurye verileri yüklenemedi')
      setYukleniyor(false)
    }
  }

  if (yukleniyor) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 w-40 bg-zinc-700 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-40 bg-zinc-700 rounded-2xl" />)}
        </div>
      </div>
    )
  }

  const getDurumRenk = (durum: string) => {
    switch (durum) {
      case 'aktif': return 'bg-green-500/10 text-green-400 border-green-500/20'
      case 'yolda': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      case 'teslim': return 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'
    }
  }

  const getDurumIcon = (durum: string) => {
    switch (durum) {
      case 'aktif': return <Navigation size={16} />
      case 'yolda': return <Truck size={16} />
      case 'teslim': return <CheckCircle size={16} />
      default: return <AlertCircle size={16} />
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Kurye Takibi</h1>
            <p className="text-white/50 font-medium">Aktif kuryelerinizi gerçek zamanlı izleyin</p>
          </div>
          <button
            onClick={() => loadKuryeler()}
            className="px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold transition-all"
          >
            Yenile
          </button>
        </div>
      </motion.div>

      {/* Kurye Kartları */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {kuryeler.map((kurye, i) => (
          <motion.div
            key={kurye.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-2xl bg-card border border-white/5 backdrop-blur-sm hover:border-primary/20 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-black text-white">{kurye.ad}</h3>
                <p className="text-white/40 text-sm">{kurye.siparisler} aktif sipariş</p>
              </div>
              <div className={`px-3 py-1.5 rounded-lg border font-bold text-xs flex items-center gap-1.5 ${getDurumRenk(kurye.durum)}`}>
                {getDurumIcon(kurye.durum)}
                {kurye.durum === 'aktif' ? 'Aktif' : kurye.durum === 'yolda' ? 'Yolda' : 'Teslim'}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/60">
                <Phone size={16} className="text-primary" />
                <a href={`tel:${kurye.telefon}`} className="hover:text-white transition-colors">{kurye.telefon}</a>
              </div>
              <div className="flex items-center gap-3 text-white/60">
                <MapPin size={16} className="text-primary" />
                <span className="text-sm">{kurye.konum.lat.toFixed(4)}, {kurye.konum.lng.toFixed(4)}</span>
              </div>
            </div>

            <button className="w-full mt-4 px-4 py-2.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold transition-all">
              Detaylar
            </button>
          </motion.div>
        ))}
      </motion.div>

      {/* Harita Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-card border border-white/5 backdrop-blur-sm"
      >
        <h3 className="text-lg font-black text-white mb-4 flex items-center gap-2">
          <MapPin size={20} className="text-primary" /> Canlı Harita
        </h3>
        <div className="w-full h-96 bg-zinc-800/50 rounded-xl flex items-center justify-center border border-white/5">
          <div className="text-center">
            <MapPin size={48} className="text-white/20 mx-auto mb-2" />
            <p className="text-white/40">Harita entegrasyonu yakında aktif olacak</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
