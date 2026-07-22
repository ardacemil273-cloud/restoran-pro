'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { MapPin, Truck, Phone, CheckCircle, AlertCircle, Navigation, RefreshCw } from 'lucide-react'

export default function KuryeTakipPage() {
  const [kuryeler, setKuryeler] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadKuryeler()
  }, [])

  async function loadKuryeler() {
    setIsRefreshing(true)
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
      
      // Simüle edilmiş gecikme
      setTimeout(() => {
        setKuryeler(mockKuryeler)
        setYukleniyor(false)
        setIsRefreshing(false)
      }, 600)

    } catch (err: any) {
      toast.error('Kurye verileri yüklenemedi')
      setYukleniyor(false)
      setIsRefreshing(false)
    }
  }

  const getDurumRenk = (durum: string) => {
    switch (durum) {
      case 'aktif': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      case 'yolda': return 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      case 'teslim': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
    }
  }

  const getDurumIcon = (durum: string) => {
    switch (durum) {
      case 'aktif': return <Navigation size={14} />
      case 'yolda': return <Truck size={14} />
      case 'teslim': return <CheckCircle size={14} />
      default: return <AlertCircle size={14} />
    }
  }

  if (yukleniyor) {
    return (
      <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="h-12 w-48 bg-white/5 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-white/5 rounded-3xl animate-pulse border border-white/5" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto min-h-full flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <motion.div 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="space-y-1"
        >
          <h1 className="text-3xl lg:text-5xl font-black text-white tracking-tight">Kurye Takibi</h1>
          <p className="text-white/40 font-medium text-sm lg:text-base">Saha operasyonunuzu anlık olarak yönetin</p>
        </motion.div>
        
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={loadKuryeler}
          disabled={isRefreshing}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold border border-white/10 transition-all disabled:opacity-50"
        >
          <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
          {isRefreshing ? 'Güncelleniyor...' : 'Verileri Yenile'}
        </motion.button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Toplam Kurye', val: kuryeler.length, color: 'text-white' },
          { label: 'Yolda', val: kuryeler.filter(k => k.durum === 'yolda').length, color: 'text-amber-400' },
          { label: 'Aktif', val: kuryeler.filter(k => k.durum === 'aktif').length, color: 'text-emerald-400' },
          { label: 'Teslimat', val: kuryeler.filter(k => k.durum === 'teslim').length, color: 'text-blue-400' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-4 rounded-2xl bg-white/5 border border-white/5"
          >
            <p className="text-[10px] uppercase font-black text-white/30 tracking-widest">{stat.label}</p>
            <p className={`text-2xl font-black ${stat.color}`}>{stat.val}</p>
          </motion.div>
        ))}
      </div>

      {/* Kurye List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {kuryeler.map((kurye, i) => (
            <motion.div
              key={kurye.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="group p-6 rounded-3xl bg-card border border-white/5 hover:border-primary/30 transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <Truck size={80} className="text-white" />
              </div>

              <div className="flex items-start justify-between mb-6 relative z-10">
                <div className="space-y-1">
                  <h3 className="text-xl font-black text-white group-hover:text-primary transition-colors">{kurye.ad}</h3>
                  <div className="flex items-center gap-2 text-white/40 text-xs font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    {kurye.siparisler} Aktif Sipariş
                  </div>
                </div>
                <div className={`px-3 py-1.5 rounded-xl border font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 shadow-sm ${getDurumRenk(kurye.durum)}`}>
                  {getDurumIcon(kurye.durum)}
                  {kurye.durum}
                </div>
              </div>

              <div className="space-y-4 relative z-10">
                <a 
                  href={`tel:${kurye.telefon}`}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all border border-transparent hover:border-white/10"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Phone size={16} />
                  </div>
                  <span className="text-sm font-bold">{kurye.telefon}</span>
                </a>
                
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 text-white/50 border border-transparent">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                    <MapPin size={16} />
                  </div>
                  <span className="text-[10px] font-mono tracking-tighter">
                    {kurye.konum.lat.toFixed(6)}, {kurye.konum.lng.toFixed(6)}
                  </span>
                </div>
              </div>

              <button className="w-full mt-6 px-4 py-3 bg-primary text-black rounded-2xl font-black text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-lg shadow-primary/20">
                Kuryeyi İzle
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Map Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 min-h-[400px] rounded-3xl bg-card border border-white/5 overflow-hidden flex flex-col"
      >
        <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
          <h3 className="text-lg font-black text-white flex items-center gap-2">
            <MapPin size={20} className="text-primary" /> Canlı Saha Takibi
          </h3>
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Canlı Bağlantı Aktif</span>
          </div>
        </div>
        <div className="flex-1 bg-zinc-900/50 relative flex items-center justify-center group">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff05_1px,transparent_1px)] [background-size:20px_20px]" />
          <div className="text-center relative z-10 p-8">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mx-auto mb-4 border border-primary/10 group-hover:scale-110 transition-transform duration-500">
              <Navigation size={32} className="text-primary animate-pulse" />
            </div>
            <h4 className="text-xl font-black text-white mb-2">Harita Katmanı Yükleniyor</h4>
            <p className="text-white/30 max-w-xs mx-auto text-sm font-medium">
              Google Maps entegrasyonu API anahtarı beklendiği için şu an simülasyon modunda çalışıyor.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
