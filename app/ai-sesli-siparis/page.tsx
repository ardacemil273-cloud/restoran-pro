'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Mic, Brain, TrendingUp, Clock, Zap, Volume2, CheckCircle, AlertCircle
} from 'lucide-react'

type AISesliSiparis = {
  id: string
  musteri_telefon: string
  musteri_adi: string
  transkripsiyon: string
  anlas_yuzde: number
  durum: 'bekleniyor' | 'isleniyor' | 'tamamlandi' | 'iptal'
  created_at: string
}

type DinamisFiyat = {
  id: string
  urun_id: string
  taban_fiyat: number
  sabah_fiyat: number
  ogle_fiyat: number
  aksam_fiyat: number
  gece_fiyat: number
  yuksek_yogunluk_artis: number
  yagmur_artis: number
  hafta_sonu_artis: number
}

export default function AISesliSiparisPage() {
  const [siparisler, setSiparisler] = useState<AISesliSiparis[]>([])
  const [dinamikFiyatlar, setDinamikFiyatlar] = useState<DinamisFiyat[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [kaydediyor, setKaydediyor] = useState(false)
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar').select('*').eq('sahibi_id', user.id).single()
    if (!restoranData) { toast.error('Restoran bulunamadı'); return }
    setRestoran(restoranData)

    const { data: siparislerData } = await supabase
      .from('ai_sesli_siparisler')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .order('created_at', { ascending: false })

    if (siparislerData) setSiparisler(siparislerData)

    const { data: fiyatlarData } = await supabase
      .from('dinamik_fiyatlandirma')
      .select('*')
      .eq('restoran_id', restoranData.id)

    if (fiyatlarData) setDinamikFiyatlar(fiyatlarData)
    setYukleniyor(false)
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Mic className="w-16 h-16 text-purple-500" />
        </motion.div>
      </div>
    )
  }

  const basarili = siparisler.filter(s => s.anlas_yuzde >= 0.8)
  const basarisiz = siparisler.filter(s => s.anlas_yuzde < 0.8)

  return (
    <div className="p-4 md:p-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Mic className="w-7 h-7 text-purple-500" />
            AI Sesli Sipariş
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad} — Müşteriler sesle sipariş verebilir</p>
        </div>
      </motion.div>

      {/* İstatistikler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <Card className="p-4 bg-purple-900/30 border-purple-700 text-center">
          <p className="text-xs text-purple-300 mb-1">Toplam Sesli Sipariş</p>
          <p className="text-3xl font-black text-purple-400">{siparisler.length}</p>
        </Card>
        <Card className="p-4 bg-green-900/30 border-green-700 text-center">
          <p className="text-xs text-green-300 mb-1">Başarılı (%80+)</p>
          <p className="text-3xl font-black text-green-400">{basarili.length}</p>
        </Card>
        <Card className="p-4 bg-red-900/30 border-red-700 text-center">
          <p className="text-xs text-red-300 mb-1">Düşük Anlama</p>
          <p className="text-3xl font-black text-red-400">{basarisiz.length}</p>
        </Card>
        <Card className="p-4 bg-blue-900/30 border-blue-700 text-center">
          <p className="text-xs text-blue-300 mb-1">Dinamik Fiyat</p>
          <p className="text-3xl font-black text-blue-400">{dinamikFiyatlar.length}</p>
        </Card>
      </motion.div>

      {/* Sesli Siparişler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
          <Volume2 className="w-6 h-6 text-purple-400" />
          Son Sesli Siparişler
        </h2>
        <div className="space-y-3">
          <AnimatePresence>
            {siparisler.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="text-center py-8 text-zinc-500"
              >
                <Mic className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Henüz sesli sipariş yok</p>
              </motion.div>
            ) : (
              siparisler.slice(0, 5).map((siparis, idx) => (
                <motion.div
                  key={siparis.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`p-4 border-l-4 ${
                    siparis.anlas_yuzde >= 0.8
                      ? 'bg-zinc-800 border-l-green-600 border-zinc-700'
                      : 'bg-zinc-800 border-l-red-600 border-zinc-700'
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-white">{siparis.musteri_adi || 'Anonim'}</h3>
                        <p className="text-xs text-zinc-400 mt-1">{siparis.musteri_telefon}</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <span className={`font-black text-lg ${
                            siparis.anlas_yuzde >= 0.8 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {(siparis.anlas_yuzde * 100).toFixed(0)}%
                          </span>
                          <Brain className="w-4 h-4 text-purple-400" />
                        </div>
                      </div>
                    </div>
                    <p className="text-white mb-3 p-2 bg-zinc-900/50 rounded text-sm">
                      "{siparis.transkripsiyon}"
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-zinc-400">
                        {new Date(siparis.created_at).toLocaleTimeString('tr-TR')}
                      </span>
                      {siparis.anlas_yuzde >= 0.8 ? (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Başarılı
                        </span>
                      ) : (
                        <span className="text-xs text-red-400 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Kontrol Gerekli
                        </span>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Dinamik Fiyatlandırma */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-700">
          <h2 className="font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-yellow-500" />
            Dinamik Fiyatlandırma Kuralları
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900 border-b border-zinc-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Ürün</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Taban</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Öğle</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Akşam</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Yoğun +%</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Yağmur +%</th>
              </tr>
            </thead>
            <tbody>
              {dinamikFiyatlar.map((fiyat, idx) => (
                <motion.tr
                  key={fiyat.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-zinc-700 hover:bg-zinc-700/50 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-white">Ürün {idx + 1}</td>
                  <td className="px-6 py-4 text-green-400 font-bold">{fiyat.taban_fiyat.toFixed(0)}₺</td>
                  <td className="px-6 py-4 text-blue-400">{fiyat.ogle_fiyat?.toFixed(0) || '-'}₺</td>
                  <td className="px-6 py-4 text-orange-400">{fiyat.aksam_fiyat?.toFixed(0) || '-'}₺</td>
                  <td className="px-6 py-4 text-red-400 font-bold">+{fiyat.yuksek_yogunluk_artis?.toFixed(0) || 0}%</td>
                  <td className="px-6 py-4 text-yellow-400 font-bold">+{fiyat.yagmur_artis?.toFixed(0) || 0}%</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {dinamikFiyatlar.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-12 text-zinc-400"
        >
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Henüz dinamik fiyatlandırma kuralı eklenmemiş</p>
        </motion.div>
      )}
    </div>
  )
}
