'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingUp, AlertTriangle, Package, Zap, Brain, BarChart3,
  RefreshCw, ShoppingCart, TrendingDown, AlertCircle
} from 'lucide-react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type Urun = {
  id: string
  ad: string
  miktar: number
  ortalama_gunluk_satis: number
  tahmini_gunluk_satis: number
  trend_yuzde: number
  kritik_seviye: number
  optimal_siparis_miktari: number
}

type StokUyarisi = {
  id: string
  urun_id: string
  tip: 'kritik' | 'dusuk' | 'fazla'
  mesaj: string
  okundu: boolean
}

export default function StokTahminPage() {
  const [urunler, setUrunler] = useState<Urun[]>([])
  const [uyarilar, setUyarilar] = useState<StokUyarisi[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [tahminGuncelleniyorMu, setTahminGuncelleniyorMu] = useState(false)
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar').select('*').eq('sahibi_id', user.id).single()
    if (!restoranData) { toast.error('Restoran bulunamadı'); return }
    setRestoran(restoranData)

    const { data: urunlerData } = await supabase
      .from('stok')
      .select('id, ad, miktar, ortalama_gunluk_satis, tahmini_gunluk_satis, trend_yuzde, kritik_seviye, optimal_siparis_miktari')
      .eq('restoran_id', restoranData.id)
      .order('tahmini_gunluk_satis', { ascending: false })

    if (urunlerData) setUrunler(urunlerData)

    const { data: uyarilarData } = await supabase
      .from('stok_uyarilari')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .eq('okundu', false)
      .order('created_at', { ascending: false })

    if (uyarilarData) setUyarilar(uyarilarData)
    setYukleniyor(false)
  }

  async function updatePredictions() {
    setTahminGuncelleniyorMu(true)
    try {
      const { error } = await supabase.rpc('calculate_daily_prediction')
      if (error) throw error
      toast.success('✅ Tahminler güncellendi!')
      await loadData()
    } catch (err) {
      toast.error('Tahminler güncellenemedi')
    } finally {
      setTahminGuncelleniyorMu(false)
    }
  }

  async function markAlertAsRead(alertId: string) {
    await supabase.from('stok_uyarilari').update({ okundu: true }).eq('id', alertId)
    setUyarilar(prev => prev.filter(a => a.id !== alertId))
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Brain className="w-16 h-16 text-yellow-500" />
        </motion.div>
      </div>
    )
  }

  const kritikUrunler = urunler.filter(u => u.miktar <= u.kritik_seviye)
  const yuksekTrendUrunler = urunler.filter(u => u.trend_yuzde > 10)

  return (
    <div className="p-4 md:p-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Brain className="w-7 h-7 text-yellow-500" />
            AI Stok Tahmin
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad} — Akıllı stok yönetimi</p>
        </div>
        <Button
          onClick={updatePredictions}
          disabled={tahminGuncelleniyorMu}
          className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${tahminGuncelleniyorMu ? 'animate-spin' : ''}`} />
          {tahminGuncelleniyorMu ? 'Güncelleniyor...' : 'Tahminleri Güncelle'}
        </Button>
      </motion.div>

      {/* Uyarılar */}
      {uyarilar.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="mb-6 space-y-2"
        >
          <h2 className="font-bold text-white mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Stok Uyarıları ({uyarilar.length})
          </h2>
          {uyarilar.map(uyari => (
            <motion.div
              key={uyari.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`p-4 rounded-lg border-2 flex items-center justify-between ${
                uyari.tip === 'kritik'
                  ? 'bg-red-900/30 border-red-600'
                  : uyari.tip === 'dusuk'
                  ? 'bg-orange-900/30 border-orange-600'
                  : 'bg-yellow-900/30 border-yellow-600'
              }`}
            >
              <p className="text-white font-medium">{uyari.mesaj}</p>
              <Button
                onClick={() => markAlertAsRead(uyari.id)}
                size="sm"
                variant="outline"
                className="border-zinc-600"
              >
                Kapat
              </Button>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* İstatistikler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <Card className="p-4 bg-gradient-to-br from-red-900/50 to-zinc-800 border-red-700">
          <p className="text-xs text-red-300 mb-1">Kritik Stok</p>
          <p className="text-3xl font-black text-red-400">{kritikUrunler.length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-green-900/50 to-zinc-800 border-green-700">
          <p className="text-xs text-green-300 mb-1">Toplam Ürün</p>
          <p className="text-3xl font-black text-green-400">{urunler.length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-900/50 to-zinc-800 border-blue-700">
          <p className="text-xs text-blue-300 mb-1">Artan Trend</p>
          <p className="text-3xl font-black text-blue-400">{yuksekTrendUrunler.length}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-900/50 to-zinc-800 border-yellow-700">
          <p className="text-xs text-yellow-300 mb-1">Ortalama Trend</p>
          <p className="text-3xl font-black text-yellow-400">
            {(urunler.reduce((sum, u) => sum + u.trend_yuzde, 0) / Math.max(urunler.length, 1)).toFixed(1)}%
          </p>
        </Card>
      </motion.div>

      {/* Ürünler Tablosu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900 border-b border-zinc-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Ürün</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Mevcut</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Ort. Satış</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Tahmin</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Trend</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Optimal Sipariş</th>
              </tr>
            </thead>
            <tbody>
              {urunler.map((urun, idx) => (
                <motion.tr
                  key={urun.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-zinc-700 hover:bg-zinc-700/50 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-white">{urun.ad}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold ${
                      urun.miktar <= urun.kritik_seviye ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {urun.miktar}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-zinc-300">{urun.ortalama_gunluk_satis.toFixed(1)}</td>
                  <td className="px-6 py-4 text-yellow-400 font-bold">{urun.tahmini_gunluk_satis.toFixed(1)}</td>
                  <td className="px-6 py-4">
                    <span className={`font-bold flex items-center gap-1 ${
                      urun.trend_yuzde > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {urun.trend_yuzde > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {urun.trend_yuzde.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-blue-400 font-bold">{urun.optimal_siparis_miktari}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {urunler.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Package className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">Henüz ürün eklenmemiş</p>
        </motion.div>
      )}
    </div>
  )
}
