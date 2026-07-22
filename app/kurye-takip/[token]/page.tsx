'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { useRouter, useParams } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  MapPin, Phone, Clock, Truck, CheckCircle, AlertCircle
} from 'lucide-react'

type KuryeTakip = {
  siparis_id: string
  kurye_id: string
  konum_lat: number
  konum_lng: number
  durum: string
  mesafe_km: number
  tahmini_sure_dakika: number
}

type Kurye = {
  ad: string
  telefon: string
  plaka: string
  rating: number
}

type Siparis = {
  id: string
  musteri_adi: string
  musteri_telefon: string
  adres: string
  toplam_tutar: number
  durum: string
}

export default function KuryeTakipPage() {
  const params = useParams()
  const token = params.token as string
  const [takip, setTakip] = useState<KuryeTakip | null>(null)
  const [kurye, setKurye] = useState<Kurye | null>(null)
  const [siparis, setSiparis] = useState<Siparis | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 5000) // Her 5 saniyede güncelle
    return () => clearInterval(interval)
  }, [token])

  async function loadData() {
    try {
      // Takip linkini doğrula
      const { data: linkData } = await supabase
        .from('kurye_takip_linki')
        .select('*')
        .eq('token', token)
        .single()

      if (!linkData || !linkData.aktif) {
        toast.error('Geçersiz veya süresi dolmuş link')
        return
      }

      // Kurye takip bilgisini çek
      const { data: takipData } = await supabase
        .from('kurye_takip')
        .select('*')
        .eq('siparis_id', linkData.siparis_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (takipData) setTakip(takipData)

      // Kurye bilgisini çek
      if (takipData?.kurye_id) {
        const { data: kuryeData } = await supabase
          .from('kuryeler')
          .select('*')
          .eq('id', takipData.kurye_id)
          .single()

        if (kuryeData) setKurye(kuryeData)
      }

      // Sipariş bilgisini çek
      const { data: siparisData } = await supabase
        .from('siparisler')
        .select('*')
        .eq('id', linkData.siparis_id)
        .single()

      if (siparisData) setSiparis(siparisData)

      setYukleniyor(false)
    } catch (err) {
      console.error('Takip yüklenemedi:', err)
    }
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Truck className="w-16 h-16 text-blue-500" />
        </motion.div>
      </div>
    )
  }

  if (!takip || !kurye || !siparis) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <Card className="p-8 bg-zinc-800 border-zinc-700 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-xl font-bold">Sipariş bulunamadı</p>
        </Card>
      </div>
    )
  }

  const durum = takip.durum || 'yolda'
  const yuzde = durum === 'teslim_edildi' ? 100 : durum === 'yolda' ? 50 : 25

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-black flex items-center gap-2 mb-2">
          <Truck className="w-8 h-8 text-blue-500" />
          Kurye Takibi
        </h1>
        <p className="text-zinc-400">Siparişiniz yolda!</p>
      </motion.div>

      {/* Kurye Bilgisi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mb-6 p-6 bg-gradient-to-r from-blue-900/50 to-zinc-800 border-2 border-blue-600 rounded-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-black text-white">{kurye.ad}</h2>
            <p className="text-zinc-400 flex items-center gap-1 mt-1">
              <Phone className="w-4 h-4" />
              {kurye.telefon}
            </p>
            <p className="text-zinc-400 mt-1">🚗 {kurye.plaka}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end mb-2">
              <span className="text-2xl font-black text-yellow-400">{kurye.rating.toFixed(1)}</span>
              <span className="text-yellow-400">⭐</span>
            </div>
            <p className="text-xs text-zinc-400">Müşteri Memnuniyeti</p>
          </div>
        </div>
      </motion.div>

      {/* Konum & Mesafe */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-2 gap-4 mb-6"
      >
        <Card className="p-4 bg-zinc-800 border-zinc-700">
          <p className="text-xs text-zinc-400 mb-2 flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            Mesafe
          </p>
          <p className="text-3xl font-black text-blue-400">{takip.mesafe_km.toFixed(1)} km</p>
        </Card>
        <Card className="p-4 bg-zinc-800 border-zinc-700">
          <p className="text-xs text-zinc-400 mb-2 flex items-center gap-1">
            <Clock className="w-4 h-4" />
            Tahmini Süre
          </p>
          <p className="text-3xl font-black text-blue-400">{takip.tahmini_sure_dakika} dk</p>
        </Card>
      </motion.div>

      {/* Durum Barı */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="mb-6"
      >
        <div className="mb-3 flex justify-between">
          <span className="text-sm font-bold text-zinc-300">Sipariş Durumu</span>
          <span className="text-sm font-bold text-blue-400">{yuzde}%</span>
        </div>
        <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${yuzde}%` }}
            transition={{ duration: 1 }}
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400"
          />
        </div>
        <div className="flex justify-between mt-3 text-xs text-zinc-400">
          <span>Hazırlanıyor</span>
          <span>Yolda</span>
          <span>Teslim Edildi</span>
        </div>
      </motion.div>

      {/* Sipariş Özeti */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="mb-6 p-6 bg-zinc-800 border border-zinc-700 rounded-xl"
      >
        <h3 className="font-bold text-white mb-4">Sipariş Özeti</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-zinc-300">Müşteri</span>
            <span className="font-bold text-white">{siparis.musteri_adi}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-300">Telefon</span>
            <span className="font-bold text-white">{siparis.musteri_telefon}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-300">Adres</span>
            <span className="font-bold text-white text-right">{siparis.adres}</span>
          </div>
          <div className="border-t border-zinc-700 pt-3 flex justify-between items-center">
            <span className="text-zinc-300 font-bold">Toplam</span>
            <span className="text-2xl font-black text-green-400">{siparis.toplam_tutar.toFixed(0)}₺</span>
          </div>
        </div>
      </motion.div>

      {/* Durum Mesajı */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className={`p-6 rounded-xl border-2 text-center ${
          durum === 'teslim_edildi'
            ? 'bg-green-900/30 border-green-600'
            : 'bg-blue-900/30 border-blue-600'
        }`}
      >
        {durum === 'teslim_edildi' ? (
          <>
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h2 className="text-2xl font-black text-green-400 mb-1">Teslim Edildi!</h2>
            <p className="text-zinc-300">Siparişiniz başarıyla teslim edildi. Afiyet olsun! 🍽️</p>
          </>
        ) : (
          <>
            <Truck className="w-12 h-12 text-blue-400 mx-auto mb-3 animate-bounce" />
            <h2 className="text-2xl font-black text-blue-400 mb-1">Yolda!</h2>
            <p className="text-zinc-300">Kurye {takip.tahmini_sure_dakika} dakika içinde kapında olacak</p>
          </>
        )}
      </motion.div>

      {/* Kurye Çağır */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
        className="mt-6 flex gap-3"
      >
        <a
          href={`tel:${kurye.telefon}`}
          className="flex-1 p-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Phone className="w-5 h-5" />
          Kurye Ara
        </a>
        <a
          href={`https://wa.me/${kurye.telefon}`}
          target="_blank"
          className="flex-1 p-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          WhatsApp
        </a>
      </motion.div>
    </div>
  )
}

import { MessageCircle } from 'lucide-react'
