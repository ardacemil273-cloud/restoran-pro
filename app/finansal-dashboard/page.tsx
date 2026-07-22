'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3, Wallet,
  AlertCircle, Plus, Calendar, Filter
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Gider = {
  id: string
  kategori: string
  miktar: number
  aciklama: string
  tarih: string
}

type FinansalOzet = {
  gunlukCiro: number
  gunlukGider: number
  gunlukKar: number
  aylikCiro: number
  aylikGider: number
  aylikKar: number
  karMarji: number
  vergiler: number
}

export default function FinansalDashboardPage() {
  const [giderler, setGiderler] = useState<Gider[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [finansalOzet, setFinansalOzet] = useState<FinansalOzet | null>(null)
  const [timeRange, setTimeRange] = useState<'gun' | 'ay' | 'yil'>('ay')
  const router = useRouter()

  useEffect(() => { loadData() }, [timeRange])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar').select('*').eq('sahibi_id', user.id).single()
    if (!restoranData) { toast.error('Restoran bulunamadı'); return }
    setRestoran(restoranData)

    // Giderleri çek
    const { data: giderlerData } = await supabase
      .from('giderler')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .order('tarih', { ascending: false })

    if (giderlerData) setGiderler(giderlerData)

    // Finansal özeti hesapla
    await calculateFinancialSummary(restoranData.id)
    setYukleniyor(false)
  }

  async function calculateFinancialSummary(restoranId: string) {
    const today = new Date()
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const thisYear = new Date(today.getFullYear(), 0, 1)

    // Günlük ciro
    const { data: gunlukSiparisler } = await supabase
      .from('siparisler')
      .select('toplam_tutar')
      .eq('restoran_id', restoranId)
      .eq('durum', 'tamamlandi')
      .gte('created_at', today.toISOString().split('T')[0])

    const gunlukCiro = gunlukSiparisler?.reduce((sum, s) => sum + (s.toplam_tutar || 0), 0) || 0

    // Aylık ciro
    const { data: aylikSiparisler } = await supabase
      .from('siparisler')
      .select('toplam_tutar')
      .eq('restoran_id', restoranId)
      .eq('durum', 'tamamlandi')
      .gte('created_at', thisMonth.toISOString().split('T')[0])

    const aylikCiro = aylikSiparisler?.reduce((sum, s) => sum + (s.toplam_tutar || 0), 0) || 0

    // Giderleri hesapla
    const gunlukGider = giderler
      .filter(g => g.tarih === today.toISOString().split('T')[0])
      .reduce((sum, g) => sum + g.miktar, 0)

    const aylikGider = giderler
      .filter(g => {
        const giderTarih = new Date(g.tarih)
        return giderTarih >= thisMonth && giderTarih <= today
      })
      .reduce((sum, g) => sum + g.miktar, 0)

    const gunlukKar = gunlukCiro - gunlukGider
    const aylikKar = aylikCiro - aylikGider
    const karMarji = aylikCiro > 0 ? ((aylikKar / aylikCiro) * 100) : 0
    const vergiler = aylikKar * 0.18 // KDV %18

    setFinansalOzet({
      gunlukCiro,
      gunlukGider,
      gunlukKar,
      aylikCiro,
      aylikGider,
      aylikKar,
      karMarji,
      vergiler
    })
  }

  const giderKategorileri = Array.from(new Set(giderler.map(g => g.kategori)))
  const giderChartData = giderKategorileri.map(kat => ({
    name: kat,
    value: giderler.filter(g => g.kategori === kat).reduce((sum, g) => sum + g.miktar, 0)
  }))

  const COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899']

  if (yukleniyor || !finansalOzet) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <DollarSign className="w-16 h-16 text-yellow-500" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Wallet className="w-7 h-7 text-yellow-500" />
            Finansal Dashboard
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad} — Detaylı finansal analiz</p>
        </div>
        <Button className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold">
          <Plus className="w-4 h-4 mr-2" />
          Gider Ekle
        </Button>
      </motion.div>

      {/* Özet Kartları */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <Card className="p-4 bg-gradient-to-br from-green-900/50 to-zinc-800 border-green-700">
          <p className="text-xs text-green-300 mb-1">Günlük Ciro</p>
          <p className="text-2xl font-black text-green-400">{finansalOzet.gunlukCiro.toFixed(0)}₺</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-red-900/50 to-zinc-800 border-red-700">
          <p className="text-xs text-red-300 mb-1">Günlük Gider</p>
          <p className="text-2xl font-black text-red-400">{finansalOzet.gunlukGider.toFixed(0)}₺</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-900/50 to-zinc-800 border-blue-700">
          <p className="text-xs text-blue-300 mb-1">Günlük Kar</p>
          <p className="text-2xl font-black text-blue-400">{finansalOzet.gunlukKar.toFixed(0)}₺</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-900/50 to-zinc-800 border-yellow-700">
          <p className="text-xs text-yellow-300 mb-1">Kar Marjı</p>
          <p className="text-2xl font-black text-yellow-400">{finansalOzet.karMarji.toFixed(1)}%</p>
        </Card>
      </motion.div>

      {/* Aylık Özet */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6"
      >
        <Card className="p-6 bg-zinc-800 border-zinc-700">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            Aylık Ciro
          </h3>
          <p className="text-4xl font-black text-green-400">{finansalOzet.aylikCiro.toFixed(0)}₺</p>
        </Card>
        <Card className="p-6 bg-zinc-800 border-zinc-700">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-red-500" />
            Aylık Gider
          </h3>
          <p className="text-4xl font-black text-red-400">{finansalOzet.aylikGider.toFixed(0)}₺</p>
        </Card>
        <Card className="p-6 bg-zinc-800 border-zinc-700">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-yellow-500" />
            Aylık Kar (Vergi Öncesi)
          </h3>
          <p className="text-4xl font-black text-yellow-400">{finansalOzet.aylikKar.toFixed(0)}₺</p>
          <p className="text-xs text-zinc-400 mt-2">Vergi: {finansalOzet.vergiler.toFixed(0)}₺</p>
        </Card>
      </motion.div>

      {/* Grafikler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
      >
        {/* Gider Dağılımı */}
        <Card className="p-6 bg-zinc-800 border-zinc-700">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-yellow-500" />
            Gider Dağılımı
          </h3>
          {giderChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie data={giderChartData} cx="50%" cy="50%" outerRadius={80}>
                {giderChartData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </RechartsPie>
            </ResponsiveContainer>
          ) : (
            <p className="text-zinc-400 text-center py-12">Gider verisi yok</p>
          )}
        </Card>

        {/* Kar Trendi */}
        <Card className="p-6 bg-zinc-800 border-zinc-700">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-yellow-500" />
            Finansal Özet
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-zinc-900/50 rounded-lg">
              <span className="text-zinc-300">Aylık Ciro</span>
              <span className="font-black text-green-400">{finansalOzet.aylikCiro.toFixed(0)}₺</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-zinc-900/50 rounded-lg">
              <span className="text-zinc-300">Aylık Gider</span>
              <span className="font-black text-red-400">{finansalOzet.aylikGider.toFixed(0)}₺</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-zinc-900/50 rounded-lg">
              <span className="text-zinc-300">Net Kar</span>
              <span className="font-black text-yellow-400">{(finansalOzet.aylikKar - finansalOzet.vergiler).toFixed(0)}₺</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-zinc-900/50 rounded-lg">
              <span className="text-zinc-300">Vergi (%18)</span>
              <span className="font-black text-orange-400">{finansalOzet.vergiler.toFixed(0)}₺</span>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Giderler Tablosu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-700">
          <h3 className="font-bold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Son Giderler
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900 border-b border-zinc-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Miktar</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Açıklama</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {giderler.slice(0, 10).map((gider, idx) => (
                <motion.tr
                  key={gider.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-zinc-700 hover:bg-zinc-700/50 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-white">{gider.kategori}</td>
                  <td className="px-6 py-4 text-red-400 font-bold">{gider.miktar.toFixed(0)}₺</td>
                  <td className="px-6 py-4 text-zinc-300">{gider.aciklama}</td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">{new Date(gider.tarih).toLocaleDateString('tr-TR')}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
