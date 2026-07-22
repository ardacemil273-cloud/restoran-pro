'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, MapPin, TrendingUp, Users, DollarSign, Plus, Edit, Trash2, Eye
} from 'lucide-react'

type Sube = {
  id: string
  ad: string
  sehir: string
  bolge: string
  adres: string
  telefon: string
  aktif: boolean
  masa_sayisi: number
  garson_sayisi: number
  created_at: string
}

type SubePerformans = {
  id: string
  sube_id: string
  tarih: string
  gunluk_ciro: number
  gunluk_gider: number
  gunluk_kar: number
  kar_marji: number
  siparis_sayisi: number
  musteri_sayisi: number
}

export default function SubelerPage() {
  const [subeler, setSubeler] = useState<Sube[]>([])
  const [performans, setPerformans] = useState<Record<string, SubePerformans>>({})
  const [yukleniyor, setYukleniyor] = useState(true)
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: subelerData } = await supabase
      .from('subeler')
      .select('*')
      .eq('sahibi_id', user.id)
      .order('created_at', { ascending: false })

    if (subelerData) {
      setSubeler(subelerData)
      
      // Her şube için performans verisi çek
      for (const sube of subelerData) {
        const { data: perfData } = await supabase
          .from('sube_performans_ozeti')
          .select('*')
          .eq('sube_id', sube.id)
          .eq('tarih', new Date().toISOString().split('T')[0])
          .single()
        
        if (perfData) {
          setPerformans(prev => ({ ...prev, [sube.id]: perfData }))
        }
      }
    }
    setYukleniyor(false)
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Building2 className="w-16 h-16 text-blue-500" />
        </motion.div>
      </div>
    )
  }

  const toplamCiro = Object.values(performans).reduce((sum, p) => sum + p.gunluk_ciro, 0)
  const toplamSiparis = Object.values(performans).reduce((sum, p) => sum + p.siparis_sayisi, 0)
  const toplamMusteri = Object.values(performans).reduce((sum, p) => sum + p.musteri_sayisi, 0)

  return (
    <div className="p-4 md:p-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-500" />
            Şubeler Yönetimi
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Tüm şubelerinizi tek panelden yönetin</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
          <Plus className="w-4 h-4 mr-2" />
          Yeni Şube Ekle
        </Button>
      </motion.div>

      {/* İstatistikler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <Card className="p-4 bg-blue-900/30 border-blue-700 text-center">
          <p className="text-xs text-blue-300 mb-1">Toplam Şube</p>
          <p className="text-3xl font-black text-blue-400">{subeler.length}</p>
        </Card>
        <Card className="p-4 bg-green-900/30 border-green-700 text-center">
          <p className="text-xs text-green-300 mb-1">Bugünün Cirosu</p>
          <p className="text-3xl font-black text-green-400">{toplamCiro.toFixed(0)}₺</p>
        </Card>
        <Card className="p-4 bg-purple-900/30 border-purple-700 text-center">
          <p className="text-xs text-purple-300 mb-1">Toplam Sipariş</p>
          <p className="text-3xl font-black text-purple-400">{toplamSiparis}</p>
        </Card>
        <Card className="p-4 bg-orange-900/30 border-orange-700 text-center">
          <p className="text-xs text-orange-300 mb-1">Toplam Müşteri</p>
          <p className="text-3xl font-black text-orange-400">{toplamMusteri}</p>
        </Card>
      </motion.div>

      {/* Şubeler Listesi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        <AnimatePresence>
          {subeler.map((sube, idx) => {
            const perf = performans[sube.id]
            return (
              <motion.div
                key={sube.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={`p-6 border-l-4 ${
                  sube.aktif
                    ? 'bg-zinc-800 border-l-green-600 border-zinc-700'
                    : 'bg-zinc-800/50 border-l-red-600 border-zinc-700 opacity-60'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-black text-white text-lg">{sube.ad}</h3>
                      <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {sube.sehir} {sube.bolge && `• ${sube.bolge.toUpperCase()}`}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      sube.aktif
                        ? 'bg-green-900/50 text-green-300'
                        : 'bg-red-900/50 text-red-300'
                    }`}>
                      {sube.aktif ? '🟢 Aktif' : '🔴 Kapalı'}
                    </span>
                  </div>

                  {perf && (
                    <div className="mb-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Ciro</span>
                        <span className="font-bold text-green-400">{perf.gunluk_ciro.toFixed(0)}₺</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Sipariş</span>
                        <span className="font-bold text-blue-400">{perf.siparis_sayisi}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-zinc-400">Kar Marjı</span>
                        <span className="font-bold text-yellow-400">{perf.kar_marji.toFixed(1)}%</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mb-4">
                    <div className="flex-1 text-center text-xs">
                      <p className="text-zinc-400">Masalar</p>
                      <p className="font-bold text-white">{sube.masa_sayisi}</p>
                    </div>
                    <div className="flex-1 text-center text-xs">
                      <p className="text-zinc-400">Garsonlar</p>
                      <p className="font-bold text-white">{sube.garson_sayisi}</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => router.push(`/subeler/${sube.id}`)}
                      size="sm"
                      className="flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Detay
                    </Button>
                    <Button size="sm" variant="outline" className="border-zinc-600">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="border-zinc-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>

      {subeler.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Building2 className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">Henüz şube eklenmemiş</p>
          <Button className="mt-4 bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            İlk Şubenizi Ekleyin
          </Button>
        </motion.div>
      )}
    </div>
  )
}
