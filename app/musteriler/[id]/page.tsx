'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Gift, TrendingUp, Calendar, Phone, Mail, History,
  Star, AlertCircle, Check, Zap, Award
} from 'lucide-react'

type Musteri = {
  id: string
  ad: string
  telefon: string
  email: string
  toplam_harcama: number
  sadakat_puani: number
  dogum_tarihi: string | null
  son_ziyaret: string | null
  ziyaret_sayisi: number
  mudavim: boolean
  notlar: string | null
}

type Siparis = {
  id: string
  toplam_tutar: number
  durum: string
  created_at: string
  siparis_urunleri: { adet: number; urunler: { ad: string } }[]
}

type SadaliakIslemi = {
  id: string
  tip: string
  miktar: number
  aciklama: string
  created_at: string
}

export default function MusteriDetailPage() {
  const [musteri, setMusteri] = useState<Musteri | null>(null)
  const [siparisler, setSiparisler] = useState<Siparis[]>([])
  const [sadaliakIslemleri, setSadaliakIslemleri] = useState<SadaliakIslemi[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const router = useRouter()
  const params = useParams()
  const musteriId = params.id as string

  useEffect(() => { loadData() }, [musteriId])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: musteriData } = await supabase
      .from('musteriler').select('*').eq('id', musteriId).single()
    if (musteriData) setMusteri(musteriData)

    const { data: siparisData } = await supabase
      .from('siparisler')
      .select('*, siparis_urunleri(adet, urunler(ad))')
      .eq('musteri_id', musteriId)
      .order('created_at', { ascending: false })
      .limit(10)
    if (siparisData) setSiparisler(siparisData)

    const { data: sadaliakData } = await supabase
      .from('sadakat_islemleri')
      .select('*')
      .eq('musteri_id', musteriId)
      .order('created_at', { ascending: false })
      .limit(20)
    if (sadaliakData) setSadaliakIslemleri(sadaliakData)

    setYukleniyor(false)
  }

  if (yukleniyor || !musteri) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  const indirimEligible = musteri.sadakat_puani >= 100
  const indirimTutari = Math.floor(musteri.sadakat_puani / 100) * 10

  return (
    <div className="p-4 md:p-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-6"
      >
        <Button onClick={() => router.back()} variant="outline" size="sm" className="border-zinc-600">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            {musteri.mudavim && <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />}
            {musteri.ad}
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{musteri.telefon} • {musteri.email}</p>
        </div>
      </motion.div>

      {/* Özet Kartlar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <Card className="p-4 bg-gradient-to-br from-green-900/50 to-zinc-800 border-green-700">
          <p className="text-xs text-zinc-400 mb-1">Toplam Harcama</p>
          <p className="text-2xl font-black text-green-400">{musteri.toplam_harcama.toFixed(2)}₺</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-yellow-900/50 to-zinc-800 border-yellow-700">
          <p className="text-xs text-zinc-400 mb-1">Sadakat Puanı</p>
          <p className="text-2xl font-black text-yellow-400">{musteri.sadakat_puani}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-blue-900/50 to-zinc-800 border-blue-700">
          <p className="text-xs text-zinc-400 mb-1">Ziyaret Sayısı</p>
          <p className="text-2xl font-black text-blue-400">{musteri.ziyaret_sayisi}</p>
        </Card>
        <Card className="p-4 bg-gradient-to-br from-purple-900/50 to-zinc-800 border-purple-700">
          <p className="text-xs text-zinc-400 mb-1">Son Ziyaret</p>
          <p className="text-sm font-bold text-purple-400">
            {musteri.son_ziyaret
              ? new Date(musteri.son_ziyaret).toLocaleDateString('tr-TR')
              : 'Henüz yok'}
          </p>
        </Card>
      </motion.div>

      {/* İndirim Uygunluğu */}
      {indirimEligible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mb-6 p-4 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-2 border-green-600 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <Gift className="w-6 h-6 text-green-400 mt-1 shrink-0" />
            <div className="flex-1">
              <h3 className="font-bold text-white mb-1">🎁 İndirim Uygun!</h3>
              <p className="text-sm text-green-200">
                {indirimTutari}₺ indirim almaya uygunsun. Sonraki siparişinde kullanabilirsin.
              </p>
            </div>
            <Button className="bg-green-600 hover:bg-green-700 text-white font-bold text-sm shrink-0">
              <Zap className="w-4 h-4 mr-1" />
              Kullan
            </Button>
          </div>
        </motion.div>
      )}

      {/* İletişim Bilgileri */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
      >
        <Card className="p-6 bg-zinc-800 border-zinc-700">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Phone className="w-5 h-5 text-yellow-500" />
            İletişim Bilgileri
          </h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-zinc-400 mb-1">Telefon</p>
              <p className="text-white font-medium">{musteri.telefon}</p>
            </div>
            <div>
              <p className="text-xs text-zinc-400 mb-1">Email</p>
              <p className="text-white font-medium">{musteri.email || 'Belirtilmemiş'}</p>
            </div>
            {musteri.dogum_tarihi && (
              <div>
                <p className="text-xs text-zinc-400 mb-1">Doğum Günü</p>
                <p className="text-white font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-yellow-500" />
                  {new Date(musteri.dogum_tarihi).toLocaleDateString('tr-TR')}
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-zinc-800 border-zinc-700">
          <h3 className="font-bold text-white mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Durum
          </h3>
          <div className="space-y-3">
            {musteri.mudavim && (
              <div className="flex items-center gap-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm text-yellow-300 font-bold">Müdavim Müşteri</span>
              </div>
            )}
            <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
              <Check className="w-4 h-4 text-green-400" />
              <span className="text-sm text-green-300">{musteri.ziyaret_sayisi} ziyaret</span>
            </div>
            {musteri.notlar && (
              <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-xs text-blue-300">{musteri.notlar}</p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Son Siparişler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="mb-6"
      >
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-yellow-500" />
          Son Siparişler
        </h3>
        <div className="space-y-3">
          {siparisler.length === 0 ? (
            <Card className="p-6 bg-zinc-800 border-zinc-700 text-center">
              <p className="text-zinc-400">Henüz sipariş yok</p>
            </Card>
          ) : (
            siparisler.map((siparis, idx) => (
              <motion.div
                key={siparis.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-4 bg-zinc-800 border-zinc-700 hover:border-yellow-500/30 transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-bold text-white">
                        {siparis.siparis_urunleri.map(su => su.urunler.ad).join(', ')}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {new Date(siparis.created_at).toLocaleString('tr-TR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-yellow-400">{siparis.toplam_tutar.toFixed(2)}₺</p>
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        siparis.durum === 'tamamlandi'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-zinc-600/50 text-zinc-300'
                      }`}>
                        {siparis.durum === 'tamamlandi' ? '✓ Tamamlandı' : 'Beklemede'}
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Sadakat İşlemleri */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      >
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-yellow-500" />
          Sadakat İşlemleri
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sadaliakIslemleri.length === 0 ? (
            <Card className="p-6 bg-zinc-800 border-zinc-700 text-center">
              <p className="text-zinc-400">İşlem yok</p>
            </Card>
          ) : (
            sadaliakIslemleri.map((islemi) => (
              <div
                key={islemi.id}
                className={`p-3 rounded-lg border flex items-center justify-between ${
                  islemi.tip === 'kazanc'
                    ? 'bg-green-500/10 border-green-500/30'
                    : islemi.tip === 'harcama'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-blue-500/10 border-blue-500/30'
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-white">{islemi.aciklama}</p>
                  <p className="text-xs text-zinc-400 mt-1">
                    {new Date(islemi.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
                <p className={`font-black text-lg ${
                  islemi.tip === 'kazanc'
                    ? 'text-green-400'
                    : islemi.tip === 'harcama'
                    ? 'text-red-400'
                    : 'text-blue-400'
                }`}>
                  {islemi.tip === 'harcama' ? '-' : '+'}
                  {islemi.miktar}
                </p>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  )
}
