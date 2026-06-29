'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, AlertTriangle, CheckCircle, Clock, TrendingDown, Plus, Send
} from 'lucide-react'

type OtomatikSiparis = {
  id: string
  siparis_numarasi: string
  toplam_tutar: number
  toplam_miktar: number
  durum: string
  created_at: string
  urunler: any[]
}

type StokUyarisi = {
  id: string
  urun_id: string
  uyari_tipi: string
  mevcut_stok: number
  minimum_seviye: number
  uyari_durumu: string
  created_at: string
}

export default function OtomatikTedarikPage() {
  const [siparisler, setSiparisler] = useState<OtomatikSiparis[]>([])
  const [uyarilar, setUyarilar] = useState<StokUyarisi[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar').select('*').eq('sahibi_id', user.id).single()
    if (!restoranData) { toast.error('Restoran bulunamadı'); return }

    // Otomatik Siparişler
    const { data: siparisData } = await supabase
      .from('otomatik_siparisler')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (siparisData) setSiparisler(siparisData)

    // Stok Uyarıları
    const { data: uyariData } = await supabase
      .from('stok_uyarilari')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .eq('uyari_durumu', 'aktif')
      .order('created_at', { ascending: false })

    if (uyariData) setUyarilar(uyariData)

    setYukleniyor(false)
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Package className="w-16 h-16 text-amber-500" />
        </motion.div>
      </div>
    )
  }

  const beklemeSiparisleri = siparisler.filter(s => s.durum === 'bekleme').length
  const gonderilen = siparisler.filter(s => s.durum === 'gonderildi').length
  const toplamTutar = siparisler.reduce((sum, s) => sum + s.toplam_tutar, 0)

  return (
    <div className="p-4 md:p-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Package className="w-8 h-8 text-amber-500" />
            Otomatik Tedarik
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Stok Azalınca Otomatik Sipariş</p>
        </div>
        <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
          <Plus className="w-4 h-4 mr-2" />
          Tedarikçi Ekle
        </Button>
      </motion.div>

      {/* İstatistikler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <Card className="p-4 bg-amber-900/30 border-amber-700 text-center">
          <p className="text-xs text-amber-300 mb-1">Bekleme</p>
          <p className="text-3xl font-black text-amber-400">{beklemeSiparisleri}</p>
        </Card>
        <Card className="p-4 bg-green-900/30 border-green-700 text-center">
          <p className="text-xs text-green-300 mb-1">Gönderilen</p>
          <p className="text-3xl font-black text-green-400">{gonderilen}</p>
        </Card>
        <Card className="p-4 bg-red-900/30 border-red-700 text-center">
          <p className="text-xs text-red-300 mb-1">Stok Uyarısı</p>
          <p className="text-3xl font-black text-red-400">{uyarilar.length}</p>
        </Card>
        <Card className="p-4 bg-blue-900/30 border-blue-700 text-center">
          <p className="text-xs text-blue-300 mb-1">Toplam Tutar</p>
          <p className="text-3xl font-black text-blue-400">{toplamTutar.toFixed(0)}₺</p>
        </Card>
      </motion.div>

      {/* Stok Uyarıları */}
      {uyarilar.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mb-6 bg-red-900/30 border border-red-700 rounded-xl p-6"
        >
          <h2 className="font-black text-red-400 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Stok Uyarıları ({uyarilar.length})
          </h2>
          <div className="space-y-2">
            <AnimatePresence>
              {uyarilar.slice(0, 5).map((uyari, idx) => (
                <motion.div
                  key={uyari.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-3 bg-zinc-800/50 rounded-lg flex justify-between items-center"
                >
                  <div>
                    <p className="font-bold text-white">Ürün ID: {uyari.urun_id}</p>
                    <p className="text-xs text-zinc-400">
                      Mevcut: {uyari.mevcut_stok} / Minimum: {uyari.minimum_seviye}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-red-900/50 text-red-300 rounded-full text-xs font-bold">
                    {uyari.uyari_tipi.replace('_', ' ').toUpperCase()}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Otomatik Siparişler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-700">
          <h2 className="font-black text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            Otomatik Siparişler
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900 border-b border-zinc-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Sipariş No</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Miktar</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Tutar</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Tarih</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {siparisler.map((siparis, idx) => (
                  <motion.tr
                    key={siparis.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b border-zinc-700 hover:bg-zinc-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-white">{siparis.siparis_numarasi}</td>
                    <td className="px-6 py-4 text-zinc-300">{siparis.toplam_miktar} adet</td>
                    <td className="px-6 py-4 font-bold text-green-400">{siparis.toplam_tutar.toFixed(0)}₺</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                        siparis.durum === 'gonderildi'
                          ? 'bg-green-900/50 text-green-300'
                          : siparis.durum === 'bekleme'
                          ? 'bg-amber-900/50 text-amber-300'
                          : 'bg-blue-900/50 text-blue-300'
                      }`}>
                        {siparis.durum === 'gonderildi' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : siparis.durum === 'bekleme' ? (
                          <Clock className="w-3 h-3" />
                        ) : (
                          <Package className="w-3 h-3" />
                        )}
                        {siparis.durum.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-400">
                      {new Date(siparis.created_at).toLocaleDateString('tr-TR')}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {siparisler.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Package className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">Henüz otomatik sipariş yok</p>
        </motion.div>
      )}
    </div>
  )
}
