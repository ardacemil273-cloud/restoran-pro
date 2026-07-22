'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain, Users, TrendingUp, AlertTriangle, Target, Zap, BarChart3
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

type RFMAnaliz = {
  id: string
  musteri_id: string
  rfm_puani: number
  segment: string
  tahmin_ciro: number
  churn_riski: number
}

type SegmentStats = {
  segment: string
  musteri_sayisi: number
  toplam_ciro: number
  emoji: string
}

export default function AIMusteriAnalitikleriPage() {
  const [rfmVerileri, setRfmVerileri] = useState<RFMAnaliz[]>([])
  const [segmentStats, setSegmentStats] = useState<SegmentStats[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar').select('*').eq('sahibi_id', user.id).single()
    if (!restoranData) { toast.error('Restoran bulunamadı'); return }

    const { data: rfmData } = await supabase
      .from('rfm_analizi')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .order('rfm_puani', { ascending: false })

    if (rfmData) {
      setRfmVerileri(rfmData)

      // Segment istatistikleri
      const segments = {
        'champion': { musteri_sayisi: 0, toplam_ciro: 0, emoji: '👑' },
        'loyal': { musteri_sayisi: 0, toplam_ciro: 0, emoji: '💎' },
        'at_risk': { musteri_sayisi: 0, toplam_ciro: 0, emoji: '⚠️' },
        'new': { musteri_sayisi: 0, toplam_ciro: 0, emoji: '🆕' },
        'lost': { musteri_sayisi: 0, toplam_ciro: 0, emoji: '❌' }
      }

      rfmData.forEach(item => {
        if (segments[item.segment as keyof typeof segments]) {
          segments[item.segment as keyof typeof segments].musteri_sayisi++
          segments[item.segment as keyof typeof segments].toplam_ciro += item.tahmin_ciro || 0
        }
      })

      setSegmentStats(Object.entries(segments).map(([key, val]) => ({
        segment: key,
        musteri_sayisi: val.musteri_sayisi,
        toplam_ciro: val.toplam_ciro,
        emoji: val.emoji
      })))
    }

    setYukleniyor(false)
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Brain className="w-16 h-16 text-purple-500" />
        </motion.div>
      </div>
    )
  }

  const championsCount = segmentStats.find(s => s.segment === 'champion')?.musteri_sayisi || 0
  const atRiskCount = segmentStats.find(s => s.segment === 'at_risk')?.musteri_sayisi || 0
  const avgRfm = rfmVerileri.length > 0 ? (rfmVerileri.reduce((sum, r) => sum + r.rfm_puani, 0) / rfmVerileri.length).toFixed(2) : '0'

  const pieData = segmentStats.map(s => ({
    name: s.segment,
    value: s.musteri_sayisi
  }))

  const COLORS = {
    'champion': '#FFD700',
    'loyal': '#9333EA',
    'at_risk': '#EF4444',
    'new': '#3B82F6',
    'lost': '#6B7280'
  }

  return (
    <div className="p-4 md:p-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-500" />
            AI Müşteri Analitikleri
          </h1>
          <p className="text-zinc-400 text-sm mt-1">RFM Analizi & Segmentasyon</p>
        </div>
      </motion.div>

      {/* İstatistikler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <Card className="p-4 bg-yellow-900/30 border-yellow-700 text-center">
          <p className="text-xs text-yellow-300 mb-1">Champions</p>
          <p className="text-3xl font-black text-yellow-400">👑 {championsCount}</p>
        </Card>
        <Card className="p-4 bg-purple-900/30 border-purple-700 text-center">
          <p className="text-xs text-purple-300 mb-1">Ort. RFM Puanı</p>
          <p className="text-3xl font-black text-purple-400">{avgRfm}</p>
        </Card>
        <Card className="p-4 bg-red-900/30 border-red-700 text-center">
          <p className="text-xs text-red-300 mb-1">Risk Altında</p>
          <p className="text-3xl font-black text-red-400">⚠️ {atRiskCount}</p>
        </Card>
        <Card className="p-4 bg-blue-900/30 border-blue-700 text-center">
          <p className="text-xs text-blue-300 mb-1">Toplam Müşteri</p>
          <p className="text-3xl font-black text-blue-400">{rfmVerileri.length}</p>
        </Card>
      </motion.div>

      {/* Segment Dağılımı */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
      >
        {/* Pie Chart */}
        <Card className="p-6 bg-zinc-800 border-zinc-700">
          <h2 className="font-black text-white mb-4">Müşteri Segmentleri</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Segment Detayları */}
        <Card className="p-6 bg-zinc-800 border-zinc-700">
          <h2 className="font-black text-white mb-4">Segment Analizi</h2>
          <div className="space-y-3">
            <AnimatePresence>
              {segmentStats.map((stat, idx) => (
                <motion.div
                  key={stat.segment}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-3 bg-zinc-700/50 rounded-lg"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-white">
                      {stat.emoji} {stat.segment.toUpperCase()}
                    </span>
                    <span className="text-xs text-zinc-400">{stat.musteri_sayisi} müşteri</span>
                  </div>
                  <div className="w-full h-2 bg-zinc-600 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(stat.musteri_sayisi / rfmVerileri.length) * 100}%` }}
                      transition={{ duration: 1 }}
                      className={`h-full ${
                        stat.segment === 'champion' ? 'bg-yellow-500' :
                        stat.segment === 'loyal' ? 'bg-purple-500' :
                        stat.segment === 'at_risk' ? 'bg-red-500' :
                        stat.segment === 'new' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>

      {/* Top Müşteriler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-700">
          <h2 className="font-black text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-500" />
            En Değerli Müşteriler (Champions)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900 border-b border-zinc-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Segment</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">RFM Puanı</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Tahmin Ciro</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Churn Riski</th>
              </tr>
            </thead>
            <tbody>
              {rfmVerileri.slice(0, 10).map((item, idx) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-zinc-700 hover:bg-zinc-700/50 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-white">
                    {item.segment === 'champion' ? '👑' : item.segment === 'loyal' ? '💎' : item.segment === 'at_risk' ? '⚠️' : '🆕'}
                    {' '}{item.segment.toUpperCase()}
                  </td>
                  <td className="px-6 py-4 font-bold text-yellow-400">{item.rfm_puani.toFixed(2)}</td>
                  <td className="px-6 py-4 font-bold text-green-400">{item.tahmin_ciro?.toFixed(0) || '0'}₺</td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      item.churn_riski > 50
                        ? 'bg-red-900/50 text-red-300'
                        : 'bg-green-900/50 text-green-300'
                    }`}>
                      {item.churn_riski?.toFixed(0) || '0'}%
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {rfmVerileri.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Brain className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">Henüz müşteri analitik verisi yok</p>
        </motion.div>
      )}
    </div>
  )
}
