'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  TrendingUp, Award, Clock, DollarSign, Star, Users, Zap, Calendar,
  RefreshCw, Download, Filter
} from 'lucide-react'

type Garson = {
  id: string
  ad: string
  telefon: string
  toplam_siparis: number
  toplam_ciro: number
  ortalama_rating: number
  ortalama_sure: number
  son_gunluk_siparis: number
  son_gunluk_ciro: number
}

type PerformansGunluk = {
  tarih: string
  siparis_sayisi: number
  toplam_ciro: number
  ortalama_sure: number
}

export default function GarsonPerformansPage() {
  const [garsonlar, setGarsonlar] = useState<Garson[]>([])
  const [performansData, setPerformansData] = useState<Record<string, PerformansGunluk[]>>({})
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [selectedGarson, setSelectedGarson] = useState<string | null>(null)
  const [timeRange, setTimeRange] = useState<'7gun' | '30gun' | '90gun'>('7gun')
  const router = useRouter()

  useEffect(() => { loadData() }, [])
  useEffect(() => { if (selectedGarson) loadPerformansData(selectedGarson) }, [selectedGarson, timeRange])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar').select('*').eq('sahibi_id', user.id).single()
    if (!restoranData) { toast.error('Restoran bulunamadı'); return }
    setRestoran(restoranData)

    const { data: garsonlarData } = await supabase
      .from('garsonlar')
      .select('id, ad, telefon, toplam_siparis, toplam_ciro, ortalama_rating, ortalama_sure, son_gunluk_siparis, son_gunluk_ciro')
      .eq('restoran_id', restoranData.id)
      .order('toplam_ciro', { ascending: false })

    if (garsonlarData) {
      setGarsonlar(garsonlarData)
      if (garsonlarData.length > 0) setSelectedGarson(garsonlarData[0].id)
    }
    setYukleniyor(false)
  }

  async function loadPerformansData(garsonId: string) {
    const days = timeRange === '7gun' ? 7 : timeRange === '30gun' ? 30 : 90
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data } = await supabase
      .from('garson_performans_gunluk')
      .select('tarih, siparis_sayisi, toplam_ciro, ortalama_sure')
      .eq('garson_id', garsonId)
      .gte('tarih', startDate.toISOString().split('T')[0])
      .order('tarih', { ascending: true })

    if (data) {
      setPerformansData(prev => ({
        ...prev,
        [garsonId]: data.map(d => ({
          ...d,
          tarih: new Date(d.tarih).toLocaleDateString('tr-TR', { month: 'short', day: 'numeric' })
        }))
      }))
    }
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const selectedGarsonData = garsonlar.find(g => g.id === selectedGarson)
  const selectedPerformans = selectedGarson ? performansData[selectedGarson] || [] : []

  return (
    <div className="p-4 md:p-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Award className="w-7 h-7 text-yellow-500" />
            Garson Performans
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad} — Garsonlarının performans analizi</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setTimeRange('7gun')}
            variant={timeRange === '7gun' ? 'default' : 'outline'}
            size="sm"
            className={timeRange === '7gun' ? 'bg-yellow-600' : 'border-zinc-600'}
          >
            7 Gün
          </Button>
          <Button
            onClick={() => setTimeRange('30gun')}
            variant={timeRange === '30gun' ? 'default' : 'outline'}
            size="sm"
            className={timeRange === '30gun' ? 'bg-yellow-600' : 'border-zinc-600'}
          >
            30 Gün
          </Button>
          <Button
            onClick={() => setTimeRange('90gun')}
            variant={timeRange === '90gun' ? 'default' : 'outline'}
            size="sm"
            className={timeRange === '90gun' ? 'bg-yellow-600' : 'border-zinc-600'}
          >
            90 Gün
          </Button>
        </div>
      </motion.div>

      {/* Leaderboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-yellow-500" />
          Performans Sıralaması
        </h2>
        <div className="space-y-2">
          {garsonlar.map((garson, idx) => (
            <motion.div
              key={garson.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => setSelectedGarson(garson.id)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                selectedGarson === garson.id
                  ? 'bg-yellow-600/20 border-yellow-500'
                  : 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center font-black text-yellow-400">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{garson.ad}</h3>
                    <p className="text-xs text-zinc-400">{garson.telefon}</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 text-right">
                  <div>
                    <p className="text-xs text-zinc-400">Sipariş</p>
                    <p className="font-black text-white">{garson.toplam_siparis}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Ciro</p>
                    <p className="font-black text-green-400">{garson.toplam_ciro.toFixed(0)}₺</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Rating</p>
                    <p className="font-black text-yellow-400 flex items-center gap-1 justify-end">
                      <Star className="w-3 h-3 fill-yellow-400" />
                      {garson.ortalama_rating.toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400">Ort. Süre</p>
                    <p className="font-black text-blue-400">{garson.ortalama_sure}dk</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Detaylı Analiz */}
      {selectedGarsonData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Özet Kartlar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-green-900/50 to-zinc-800 border-green-700">
              <p className="text-xs text-zinc-400 mb-1">Günlük Sipariş</p>
              <p className="text-2xl font-black text-green-400">{selectedGarsonData.son_gunluk_siparis}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-yellow-900/50 to-zinc-800 border-yellow-700">
              <p className="text-xs text-zinc-400 mb-1">Günlük Ciro</p>
              <p className="text-2xl font-black text-yellow-400">{selectedGarsonData.son_gunluk_ciro.toFixed(0)}₺</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-blue-900/50 to-zinc-800 border-blue-700">
              <p className="text-xs text-zinc-400 mb-1">Ort. Süre</p>
              <p className="text-2xl font-black text-blue-400">{selectedGarsonData.ortalama_sure}dk</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-purple-900/50 to-zinc-800 border-purple-700">
              <p className="text-xs text-zinc-400 mb-1">Rating</p>
              <p className="text-2xl font-black text-purple-400 flex items-center gap-1">
                <Star className="w-5 h-5 fill-purple-400" />
                {selectedGarsonData.ortalama_rating.toFixed(1)}/5
              </p>
            </Card>
          </div>

          {/* Grafikler */}
          {selectedPerformans.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ciro Trendi */}
              <Card className="p-6 bg-zinc-800 border-zinc-700">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-yellow-500" />
                  Ciro Trendi
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={selectedPerformans}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="tarih" stroke="#a1a1aa" />
                    <YAxis stroke="#a1a1aa" />
                    <Tooltip contentStyle={{ backgroundColor: '#27272a', border: '1px solid #52525b' }} />
                    <Line type="monotone" dataKey="toplam_ciro" stroke="#eab308" strokeWidth={2} dot={{ fill: '#eab308' }} />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              {/* Sipariş Sayısı */}
              <Card className="p-6 bg-zinc-800 border-zinc-700">
                <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-yellow-500" />
                  Sipariş Sayısı
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={selectedPerformans}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="tarih" stroke="#a1a1aa" />
                    <YAxis stroke="#a1a1aa" />
                    <Tooltip contentStyle={{ backgroundColor: '#27272a', border: '1px solid #52525b' }} />
                    <Bar dataKey="siparis_sayisi" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}
        </motion.div>
      )}

      {garsonlar.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Users className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">Henüz garson eklenmemiş</p>
          <Button onClick={() => router.push('/garsonlar')} className="mt-4 bg-yellow-600 hover:bg-yellow-700">
            Garson Ekle
          </Button>
        </motion.div>
      )}
    </div>
  )
}
