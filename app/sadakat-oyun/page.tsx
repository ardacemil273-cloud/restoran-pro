'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Gift, Cake, RotateCw, Trophy, Star, Sparkles, Percent
} from 'lucide-react'

type MusteriSadakat = {
  id: string
  musteri_adi: string
  toplam_puan: number
  bakiye_puan: number
  seviye: 'bronz' | 'gumush' | 'altin' | 'platin'
  son_siparis_tarihi: string
}

type CarkOdulu = {
  id: string
  odul_tipi: string
  odul_degeri: number
  odul_aciklama: string
  kazandi: boolean
}

const SEVIYE_RENKLER: Record<string, string> = {
  bronz: 'from-yellow-900/50 border-yellow-700',
  gumush: 'from-gray-600/50 border-gray-500',
  altin: 'from-yellow-600/50 border-yellow-500',
  platin: 'from-purple-900/50 border-purple-700'
}

const SEVIYE_EMOJIS: Record<string, string> = {
  bronz: '🥉',
  gumush: '🥈',
  altin: '🥇',
  platin: '👑'
}

export default function SadakatOyunPage() {
  const [musteriler, setMusteriler] = useState<MusteriSadakat[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [carkCeviriyor, setCarkCeviriyor] = useState(false)
  const [carkOdulu, setCarkOdulu] = useState<CarkOdulu | null>(null)
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar').select('*').eq('sahibi_id', user.id).single()
    if (!restoranData) { toast.error('Restoran bulunamadı'); return }
    setRestoran(restoranData)

    const { data: musterilerData } = await supabase
      .from('musteri_sadakat')
      .select('id, musteri_id, toplam_puan, bakiye_puan, seviye, son_siparis_tarihi')
      .eq('restoran_id', restoranData.id)
      .order('toplam_puan', { ascending: false })

    if (musterilerData) {
      // Müşteri adlarını getir
      const musterilerWithNames = await Promise.all(
        musterilerData.map(async (m: any) => {
          const { data: musteri } = await supabase
            .from('musteriler')
            .select('ad')
            .eq('id', m.musteri_id)
            .single()
          return { ...m, musteri_adi: musteri?.ad || 'Anonim' }
        })
      )
      setMusteriler(musterilerWithNames)
    }
    setYukleniyor(false)
  }

  async function cevriCark() {
    setCarkCeviriyor(true)
    // Rastgele ödül seç
    const oduller = [
      { tipi: 'indirim', deger: 10, aciklama: '%10 İndirim' },
      { tipi: 'indirim', deger: 15, aciklama: '%15 İndirim' },
      { tipi: 'indirim', deger: 20, aciklama: '%20 İndirim' },
      { tipi: 'puan', deger: 50, aciklama: '50 Puan' },
      { tipi: 'puan', deger: 100, aciklama: '100 Puan' },
      { tipi: 'ucretsiz_urun', deger: 1, aciklama: 'Ücretsiz Tatlı' }
    ]
    const randomOdul = oduller[Math.floor(Math.random() * oduller.length)]
    
    // Animasyon için bekle
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    setCarkOdulu({
      id: Math.random().toString(),
      odul_tipi: randomOdul.tipi,
      odul_degeri: randomOdul.deger,
      odul_aciklama: randomOdul.aciklama,
      kazandi: true
    })
    setCarkCeviriyor(false)
    toast.success('🎉 Ödül kazandın!')
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Sparkles className="w-16 h-16 text-purple-500" />
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
            <Sparkles className="w-7 h-7 text-purple-500" />
            Sadakat & Oyunlaştırma
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad} — Müşteri bağlılığı artır</p>
        </div>
      </motion.div>

      {/* Çark Çevir */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mb-6 p-8 bg-gradient-to-br from-purple-900/50 to-zinc-800 border-2 border-purple-600 rounded-xl text-center"
      >
        <h2 className="font-black text-2xl text-white mb-4">🎡 Çark Çevir & Ödül Kazan!</h2>
        <p className="text-zinc-300 mb-6">Her müşteri masada QR'ı okutunca çark çevirip ödül kazanabilir</p>
        
        <motion.div
          animate={carkCeviriyor ? { rotate: 360 } : { rotate: 0 }}
          transition={{ duration: 2, repeat: carkCeviriyor ? Infinity : 0 }}
          className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-6xl shadow-lg"
        >
          🎯
        </motion.div>

        <Button
          onClick={cevriCark}
          disabled={carkCeviriyor}
          className="bg-purple-600 hover:bg-purple-700 text-white font-black text-lg px-8 py-6"
        >
          <RotateCw className={`w-6 h-6 mr-2 ${carkCeviriyor ? 'animate-spin' : ''}`} />
          {carkCeviriyor ? 'Çevriliyor...' : 'Çarkı Çevir'}
        </Button>

        <AnimatePresence>
          {carkOdulu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="mt-6 p-4 bg-green-900/50 border-2 border-green-500 rounded-lg"
            >
              <p className="text-2xl font-black text-green-400 mb-2">🎉 Tebrikler!</p>
              <p className="text-white font-bold text-xl">{carkOdulu.odul_aciklama}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* İstatistikler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <Card className="p-4 bg-purple-900/30 border-purple-700 text-center">
          <p className="text-xs text-purple-300 mb-1">Toplam Müşteri</p>
          <p className="text-3xl font-black text-purple-400">{musteriler.length}</p>
        </Card>
        <Card className="p-4 bg-yellow-900/30 border-yellow-700 text-center">
          <p className="text-xs text-yellow-300 mb-1">Altın Üye</p>
          <p className="text-3xl font-black text-yellow-400">{musteriler.filter(m => m.seviye === 'altin').length}</p>
        </Card>
        <Card className="p-4 bg-purple-900/30 border-purple-700 text-center">
          <p className="text-xs text-purple-300 mb-1">Platin Üye</p>
          <p className="text-3xl font-black text-purple-400">{musteriler.filter(m => m.seviye === 'platin').length}</p>
        </Card>
        <Card className="p-4 bg-blue-900/30 border-blue-700 text-center">
          <p className="text-xs text-blue-300 mb-1">Toplam Puan</p>
          <p className="text-3xl font-black text-blue-400">{musteriler.reduce((sum, m) => sum + m.toplam_puan, 0)}</p>
        </Card>
      </motion.div>

      {/* Müşteri Sadakat Listesi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-700">
          <h2 className="font-black text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Müşteri Sadakat Sıralaması
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900 border-b border-zinc-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Müşteri</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Seviye</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Toplam Puan</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Bakiye</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Son Sipariş</th>
              </tr>
            </thead>
            <tbody>
              {musteriler.map((musteri, idx) => (
                <motion.tr
                  key={musteri.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-zinc-700 hover:bg-zinc-700/50 transition-colors"
                >
                  <td className="px-6 py-4 font-bold text-white">{musteri.musteri_adi}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-lg">
                      {SEVIYE_EMOJIS[musteri.seviye]} {musteri.seviye.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-yellow-400 font-bold">{musteri.toplam_puan}</td>
                  <td className="px-6 py-4 text-green-400 font-bold">{musteri.bakiye_puan}</td>
                  <td className="px-6 py-4 text-zinc-400 text-sm">
                    {musteri.son_siparis_tarihi 
                      ? new Date(musteri.son_siparis_tarihi).toLocaleDateString('tr-TR')
                      : '-'
                    }
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {musteriler.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Gift className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">Henüz müşteri yok</p>
        </motion.div>
      )}
    </div>
  )
}
