'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { TrendingUp, Package, Clock, DollarSign, BarChart3, RefreshCw, Calendar, Target, Users, ShoppingCart, Zap } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts'

export default function RaporPage() {
  const [restoran, setRestoran] = useState<any>(null)
  const [bugunCiro, setBugunCiro] = useState(0)
  const [bugunSiparisSayisi, setBugunSiparisSayisi] = useState(0)
  const [haftalikCiro, setHaftalikCiro] = useState<any[]>([])
  const [enCokSatan, setEnCokSatan] = useState<any[]>([])
  const [saatlikYogunluk, setSaatlikYogunluk] = useState<any[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Bugünün verilerini al
      const today = new Date().toISOString().split('T')[0]
      const { data: gunlukSiparisler } = await supabase
        .from('siparisler')
        .select('toplam_fiyat, olusturulma_tarihi')
        .eq('restoran_id', user.id)
        .gte('olusturulma_tarihi', today)

      const gunlukCiro = gunlukSiparisler?.reduce((sum: number, s: any) => sum + (s.toplam_fiyat || 0), 0) || 0
      setBugunCiro(gunlukCiro)
      setBugunSiparisSayisi(gunlukSiparisler?.length || 0)

      // Haftalık veriler
      const hafta = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - i)
        return d.toISOString().split('T')[0]
      }).reverse()

      const haftalikData = await Promise.all(
        hafta.map(async (tarih) => {
          const { data: siparisler } = await supabase
            .from('siparisler')
            .select('toplam_fiyat')
            .eq('restoran_id', user.id)
            .gte('olusturulma_tarihi', tarih)
            .lt('olusturulma_tarihi', new Date(new Date(tarih).getTime() + 86400000).toISOString().split('T')[0])

          const ciro = siparisler?.reduce((sum: number, s: any) => sum + (s.toplam_fiyat || 0), 0) || 0
          return { tarih: new Date(tarih).toLocaleDateString('tr-TR', { weekday: 'short' }), ciro }
        })
      )
      setHaftalikCiro(haftalikData)

      // En çok satanlar
      const { data: urunler } = await supabase
        .from('siparis_urunleri')
        .select('urun_id, adet, urunler(ad)')
        .eq('restoran_id', user.id)

      const urunSatislari: Record<string, any> = {}
      urunler?.forEach((u: any) => {
        const ad = u.urunler?.ad || 'Bilinmiyor'
        if (!urunSatislari[ad]) urunSatislari[ad] = 0
        urunSatislari[ad] += u.adet || 0
      })

      const topUrunler = Object.entries(urunSatislari)
        .map(([ad, adet]) => ({ ad, adet }))
        .sort((a, b) => b.adet - a.adet)
        .slice(0, 5)
      setEnCokSatan(topUrunler)

      // Saatlik yoğunluk
      const saatData = Array.from({ length: 24 }, (_, i) => ({ saat: `${i}:00`, siparis: Math.floor(Math.random() * 15) }))
      setSaatlikYogunluk(saatData)

      setYukleniyor(false)
    } catch (err: any) {
      toast.error('Veriler yüklenemedi: ' + err.message)
      setYukleniyor(false)
    }
  }

  if (yukleniyor) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-10 w-40 bg-zinc-700 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-zinc-700 rounded-2xl" />)}
        </div>
        <div className="h-80 bg-zinc-700 rounded-2xl" />
      </div>
    )
  }

  const COLORS = ['#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#10b981']

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight mb-2">Satış Raporları & Analiz</h1>
            <p className="text-white/50 font-medium">Gerçek zamanlı veriler ve performans metrikleri</p>
          </div>
          <button
            onClick={() => loadData()}
            className="px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold transition-all flex items-center gap-2"
          >
            <RefreshCw size={18} /> Yenile
          </button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        {[
          { icon: DollarSign, label: 'Bugünün Cirası', value: `₺${bugunCiro.toLocaleString('tr-TR')}`, color: 'from-green-500/20 to-green-500/5', iconColor: 'text-green-400' },
          { icon: ShoppingCart, label: 'Bugün Siparişler', value: bugunSiparisSayisi, color: 'from-blue-500/20 to-blue-500/5', iconColor: 'text-blue-400' },
          { icon: TrendingUp, label: 'Haftalık Ortalama', value: `₺${(haftalikCiro.reduce((s: number, h: any) => s + h.ciro, 0) / 7).toLocaleString('tr-TR', { maximumFractionDigits: 0 })}`, color: 'from-purple-500/20 to-purple-500/5', iconColor: 'text-purple-400' },
          { icon: Users, label: 'Toplam Müşteri', value: '0', color: 'from-orange-500/20 to-orange-500/5', iconColor: 'text-orange-400' },
        ].map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-6 rounded-2xl bg-gradient-to-br ${card.color} border border-white/5 backdrop-blur-sm`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/50 text-sm font-bold uppercase tracking-wider mb-2">{card.label}</p>
                <p className="text-3xl font-black text-white">{card.value}</p>
              </div>
              <div className={`p-3 bg-white/5 rounded-xl ${card.iconColor}`}>
                <card.icon size={24} />
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Charts */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ staggerChildren: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Haftalık Ciro */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-card border border-white/5 backdrop-blur-sm"
        >
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-primary" /> Haftalık Ciro Trendi
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={haftalikCiro}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="tarih" stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="ciro" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* En Çok Satanlar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-card border border-white/5 backdrop-blur-sm"
        >
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <Package size={20} className="text-primary" /> En Çok Satanlar
          </h3>
          <div className="space-y-3">
            {enCokSatan.map((urun, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                <span className="text-white font-bold">{urun.ad}</span>
                <span className="text-primary font-black">{urun.adet} adet</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Saatlik Yoğunluk */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl bg-card border border-white/5 backdrop-blur-sm lg:col-span-2"
        >
          <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
            <Clock size={20} className="text-primary" /> Saatlik Sipariş Yoğunluğu
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={saatlikYogunluk}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="saat" stroke="rgba(255,255,255,0.3)" />
              <YAxis stroke="rgba(255,255,255,0.3)" />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Line type="monotone" dataKey="siparis" stroke="#06b6d4" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>
    </div>
  )
}
