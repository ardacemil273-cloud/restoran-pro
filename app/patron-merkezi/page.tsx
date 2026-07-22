'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Crown, TrendingUp, Target, Zap, Award, BarChart3, Eye, Send
} from 'lucide-react'

type CiroHedefi = {
  id: string
  ay: number
  yil: number
  hedef_ciro: number
  gercek_ciro: number
  basari_yuzde: number
}

type RakipFiyat = {
  id: string
  urun_adi: string
  bizim_fiyat: number
  rakip_fiyat: number
  rakip_adi: string
  fiyat_farki: number
  fiyat_durumu: 'dusuk' | 'esit' | 'yuksek'
}

type BasariRozeti = {
  id: string
  rozet_adi: string
  rozet_emoji: string
  kazanildi: boolean
  kazanma_tarihi: string
}

type GunlukOzet = {
  id: string
  tarih: string
  toplam_ciro: number
  siparis_sayisi: number
  ortalama_siparis_degeri: number
  musteri_sayisi: number
  en_cok_satilan_urun: string
  gunun_yildizi_garson: string
  gunun_yildizi_garson_ciro: number
}

export default function PatronMerkeziPage() {
  const [ciroHedefi, setCiroHedefi] = useState<CiroHedefi | null>(null)
  const [rakipFiyatlar, setRakipFiyatlar] = useState<RakipFiyat[]>([])
  const [rozetler, setRozetler] = useState<BasariRozeti[]>([])
  const [gunlukOzet, setGunlukOzet] = useState<GunlukOzet | null>(null)
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar').select('*').eq('sahibi_id', user.id).single()
    if (!restoranData) { toast.error('Restoran bulunamadı'); return }
    setRestoran(restoranData)

    // Ciro hedefi
    const { data: hedefData } = await supabase
      .from('ciro_hedefleri')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .eq('ay', new Date().getMonth() + 1)
      .eq('yil', new Date().getFullYear())
      .single()
    if (hedefData) setCiroHedefi(hedefData)

    // Rakip fiyatlar
    const { data: fiyatlarData } = await supabase
      .from('rakip_fiyat_casusu')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .order('kontrol_tarihi', { ascending: false })
      .limit(10)
    if (fiyatlarData) setRakipFiyatlar(fiyatlarData)

    // Başarı rozetleri
    const { data: rozetlerData } = await supabase
      .from('basari_rozetleri')
      .select('*')
      .eq('restoran_id', restoranData.id)
    if (rozetlerData) setRozetler(rozetlerData)

    // Günlük özet
    const { data: ozetData } = await supabase
      .from('gunluk_basari_ozeti')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .eq('tarih', new Date().toISOString().split('T')[0])
      .single()
    if (ozetData) setGunlukOzet(ozetData)

    setYukleniyor(false)
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Crown className="w-16 h-16 text-yellow-500" />
        </motion.div>
      </div>
    )
  }

  const hedefBasarisi = ciroHedefi?.basari_yuzde || 0

  return (
    <div className="p-4 md:p-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-3xl font-black text-yellow-400 flex items-center gap-2">
            <Crown className="w-8 h-8" />
            Patron Merkezi
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad} — Başarı Paneli</p>
        </div>
      </motion.div>

      {/* Ciro Hedef Barı */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mb-6 p-6 bg-gradient-to-r from-yellow-900/50 to-zinc-800 border-2 border-yellow-600 rounded-xl"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-2xl text-yellow-400 flex items-center gap-2">
            <Target className="w-6 h-6" />
            {new Date().toLocaleString('tr-TR', { month: 'long', year: 'numeric' })} Hedefi
          </h2>
          <span className="text-3xl font-black text-yellow-300">{hedefBasarisi.toFixed(0)}%</span>
        </div>

        <div className="mb-4 flex justify-between text-sm">
          <span className="text-zinc-300">Hedef: {ciroHedefi?.hedef_ciro.toFixed(0) || '-'}₺</span>
          <span className="text-yellow-400 font-bold">Gerçek: {ciroHedefi?.gercek_ciro.toFixed(0) || '0'}₺</span>
        </div>

        <div className="w-full h-4 bg-zinc-900 rounded-full overflow-hidden border border-yellow-600">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(hedefBasarisi, 100)}%` }}
            transition={{ duration: 1.5 }}
            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-400"
          />
        </div>

        {hedefBasarisi >= 100 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 p-3 bg-green-900/50 border border-green-600 rounded-lg text-center"
          >
            <p className="text-green-400 font-black">🎉 HEDEF BAŞARILI!</p>
          </motion.div>
        )}
      </motion.div>

      {/* Günlük Özet */}
      {gunlukOzet && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <Card className="p-4 bg-green-900/30 border-green-700 text-center">
            <p className="text-xs text-green-300 mb-1">Bugünün Cirosu</p>
            <p className="text-3xl font-black text-green-400">{gunlukOzet.toplam_ciro.toFixed(0)}₺</p>
          </Card>
          <Card className="p-4 bg-blue-900/30 border-blue-700 text-center">
            <p className="text-xs text-blue-300 mb-1">Sipariş Sayısı</p>
            <p className="text-3xl font-black text-blue-400">{gunlukOzet.siparis_sayisi}</p>
          </Card>
          <Card className="p-4 bg-purple-900/30 border-purple-700 text-center">
            <p className="text-xs text-purple-300 mb-1">Müşteri Sayısı</p>
            <p className="text-3xl font-black text-purple-400">{gunlukOzet.musteri_sayisi}</p>
          </Card>
          <Card className="p-4 bg-orange-900/30 border-orange-700 text-center">
            <p className="text-xs text-orange-300 mb-1">Ort. Sipariş</p>
            <p className="text-3xl font-black text-orange-400">{gunlukOzet.ortalama_siparis_degeri.toFixed(0)}₺</p>
          </Card>
        </motion.div>
      )}

      {/* Başarı Rozetleri */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
          <Award className="w-6 h-6 text-yellow-500" />
          Başarı Rozetleri
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
          <AnimatePresence>
            {rozetler.map((rozet, idx) => (
              <motion.div
                key={rozet.id}
                layout
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ delay: idx * 0.05 }}
                className={`p-4 rounded-lg text-center border-2 ${
                  rozet.kazanildi
                    ? 'bg-yellow-900/50 border-yellow-600'
                    : 'bg-zinc-800/50 border-zinc-700 opacity-50'
                }`}
              >
                <p className="text-3xl mb-2">{rozet.rozet_emoji}</p>
                <p className="text-xs font-bold text-white">{rozet.rozet_adi}</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Rakip Fiyat Casusu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-700">
          <h2 className="font-black text-white flex items-center gap-2">
            <Eye className="w-5 h-5 text-red-500" />
            Rakip Fiyat Casusu
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900 border-b border-zinc-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Ürün</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Bizim Fiyat</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Rakip Fiyat</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Fark</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Durum</th>
              </tr>
            </thead>
            <tbody>
              {rakipFiyatlar.map((fiyat, idx) => (
                <motion.tr
                  key={fiyat.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-zinc-700 hover:bg-zinc-700/50 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-white">{fiyat.urun_adi}</td>
                  <td className="px-6 py-4 text-green-400 font-bold">{fiyat.bizim_fiyat.toFixed(0)}₺</td>
                  <td className="px-6 py-4 text-orange-400 font-bold">{fiyat.rakip_fiyat.toFixed(0)}₺</td>
                  <td className={`px-6 py-4 font-bold ${
                    fiyat.fiyat_farki > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {fiyat.fiyat_farki > 0 ? '+' : ''}{fiyat.fiyat_farki.toFixed(0)}₺
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      fiyat.fiyat_durumu === 'dusuk'
                        ? 'bg-red-900/50 text-red-300'
                        : fiyat.fiyat_durumu === 'esit'
                        ? 'bg-yellow-900/50 text-yellow-300'
                        : 'bg-green-900/50 text-green-300'
                    }`}>
                      {fiyat.fiyat_durumu === 'dusuk' ? '⬇️ Düşük' : fiyat.fiyat_durumu === 'esit' ? '➡️ Eşit' : '⬆️ Yüksek'}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {rakipFiyatlar.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-12 text-zinc-400"
        >
          <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Henüz rakip fiyat verisi yok</p>
        </motion.div>
      )}
    </div>
  )
}
