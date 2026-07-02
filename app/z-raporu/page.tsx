'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import { motion } from 'framer-motion'
import {
  Download, Printer, DollarSign, ShoppingCart, TrendingUp,
  Users, Clock, AlertCircle, CheckCircle, BarChart3, Calendar
} from 'lucide-react'
import { toast } from 'sonner'

interface ZRaporuData {
  tarih: string
  toplamSatislar: number
  toplamSiparis: number
  ortalamaSiparisFiyati: number
  enCokSatanUrunler: Array<{ ad: string; adet: number; tutar: number }>
  garsonPerformans: Array<{ ad: string; siparis: number; tutar: number }>
  saatlikSatislar: Array<{ saat: string; tutar: number }>
  odemeYontemi: Array<{ yontem: string; tutar: number }>
}

export default function ZRaporuPage() {
  const router = useRouter()
  const [rapor, setRapor] = useState<ZRaporuData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    loadZRaporu()
  }, [selectedDate])

  const loadZRaporu = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const { data: restoranData } = await supabase
        .from('restoranlar')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!restoranData) return

      // Seçilen günün siparişleri
      const { data: siparisler } = await supabase
        .from('siparisler')
        .select('*, urunler(ad, fiyat), garsonlar(ad)')
        .eq('restoran_id', restoranData.id)
        .gte('created_at', `${selectedDate}T00:00:00`)
        .lte('created_at', `${selectedDate}T23:59:59`)
        .eq('durum', 'tamamlandi')

      if (!siparisler || siparisler.length === 0) {
        setRapor({
          tarih: selectedDate,
          toplamSatislar: 0,
          toplamSiparis: 0,
          ortalamaSiparisFiyati: 0,
          enCokSatanUrunler: [],
          garsonPerformans: [],
          saatlikSatislar: [],
          odemeYontemi: []
        })
        return
      }

      // Toplam satışlar
      const toplamSatislar = siparisler.reduce((sum, s) => sum + (s.toplam_tutar || 0), 0)
      const toplamSiparis = siparisler.length
      const ortalamaSiparisFiyati = toplamSiparis > 0 ? toplamSatislar / toplamSiparis : 0

      // En çok satan ürünler
      const urunSatislari: { [key: string]: { ad: string; adet: number; tutar: number } } = {}
      siparisler.forEach(s => {
        const urun = s.urunler
        if (urun) {
          if (!urunSatislari[urun.ad]) {
            urunSatislari[urun.ad] = { ad: urun.ad, adet: 0, tutar: 0 }
          }
          urunSatislari[urun.ad].adet += 1
          urunSatislari[urun.ad].tutar += urun.fiyat || 0
        }
      })

      const enCokSatanUrunler = Object.values(urunSatislari)
        .sort((a, b) => b.adet - a.adet)
        .slice(0, 5)

      // Garson performansı
      const garsonPerf: { [key: string]: { ad: string; siparis: number; tutar: number } } = {}
      siparisler.forEach(s => {
        const garson = s.garsonlar
        if (garson) {
          if (!garsonPerf[garson.ad]) {
            garsonPerf[garson.ad] = { ad: garson.ad, siparis: 0, tutar: 0 }
          }
          garsonPerf[garson.ad].siparis += 1
          garsonPerf[garson.ad].tutar += s.toplam_tutar || 0
        }
      })

      const garsonPerformans = Object.values(garsonPerf)
        .sort((a, b) => b.tutar - a.tutar)

      // Saatlik satışlar
      const saatlikData: { [key: string]: number } = {}
      siparisler.forEach(s => {
        const hour = new Date(s.created_at).getHours()
        const saat = `${hour.toString().padStart(2, '0')}:00`
        saatlikData[saat] = (saatlikData[saat] || 0) + (s.toplam_tutar || 0)
      })

      const saatlikSatislar = Object.entries(saatlikData)
        .map(([saat, tutar]) => ({ saat, tutar }))
        .sort((a, b) => parseInt(a.saat) - parseInt(b.saat))

      setRapor({
        tarih: selectedDate,
        toplamSatislar,
        toplamSiparis,
        ortalamaSiparisFiyati,
        enCokSatanUrunler,
        garsonPerformans,
        saatlikSatislar,
        odemeYontemi: []
      })
    } catch (err) {
      console.error('Z-Raporu yükleme hatası:', err)
      toast.error('Rapor yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    if (!rapor) return

    const content = `
Z-RAPORU - ${new Date(rapor.tarih).toLocaleDateString('tr-TR')}
========================================

GENEL ÖZET
---------
Toplam Satışlar: ₺${rapor.toplamSatislar.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
Toplam Sipariş: ${rapor.toplamSiparis}
Ortalama Sipariş: ₺${rapor.ortalamaSiparisFiyati.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}

EN ÇOK SATAN ÜRÜNLER
-------------------
${rapor.enCokSatanUrunler.map((u, i) => `${i + 1}. ${u.ad} - ${u.adet} adet (₺${u.tutar.toLocaleString('tr-TR')})`).join('\n')}

GARSON PERFORMANSI
------------------
${rapor.garsonPerformans.map((g, i) => `${i + 1}. ${g.ad} - ${g.siparis} sipariş (₺${g.tutar.toLocaleString('tr-TR')})`).join('\n')}

SAATLIK SATIŞLAR
----------------
${rapor.saatlikSatislar.map(s => `${s.saat}: ₺${s.tutar.toLocaleString('tr-TR')}`).join('\n')}
    `

    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `z-raporu-${rapor.tarih}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('Rapor indirildi')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Z-Raporu" icon={<BarChart3 className="w-6 h-6" />} />
        <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-zinc-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader
        title="Z-Raporu (Günlük Özet)"
        subtitle="Günlük satış ve performans raporu"
        icon={<BarChart3 className="w-6 h-6" />}
      />

      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
        {/* Tarih Seçici ve Butonlar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div>
            <label className="block text-sm font-bold text-white/70 mb-2">Tarih Seç</label>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="px-4 py-2 rounded-xl bg-zinc-800/50 border border-white/10 text-white"
            />
          </div>
          <div className="flex gap-3">
            <motion.button
              onClick={handlePrint}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-blue-400 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              <Printer className="w-5 h-5" />
              Yazdır
            </motion.button>
            <motion.button
              onClick={handleDownload}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-xl font-bold transition-all flex items-center gap-2"
            >
              <Download className="w-5 h-5" />
              İndir
            </motion.button>
          </div>
        </div>

        {rapor && rapor.toplamSiparis > 0 ? (
          <>
            {/* Genel Özet */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="rounded-2xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white/60 text-sm font-bold">Toplam Satışlar</p>
                  <DollarSign className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-3xl font-black text-white">
                  ₺{rapor.toplamSatislar.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </h3>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white/60 text-sm font-bold">Toplam Sipariş</p>
                  <ShoppingCart className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-3xl font-black text-white">{rapor.toplamSiparis}</h3>
              </div>

              <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-white/60 text-sm font-bold">Ort. Sipariş</p>
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="text-3xl font-black text-white">
                  ₺{rapor.ortalamaSiparisFiyati.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                </h3>
              </div>
            </motion.div>

            {/* En Çok Satan Ürünler */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-zinc-800/50 border border-white/10 p-6"
            >
              <h3 className="text-xl font-black text-white mb-4">🏆 En Çok Satan Ürünler</h3>
              <div className="space-y-3">
                {rapor.enCokSatanUrunler.map((urun, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <p className="font-bold text-white">{urun.ad}</p>
                      <p className="text-xs text-white/60">{urun.adet} adet satıldı</p>
                    </div>
                    <p className="font-black text-primary">₺{urun.tutar.toLocaleString('tr-TR')}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Garson Performansı */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-zinc-800/50 border border-white/10 p-6"
            >
              <h3 className="text-xl font-black text-white mb-4">👥 Garson Performansı</h3>
              <div className="space-y-3">
                {rapor.garsonPerformans.map((garson, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                    <div>
                      <p className="font-bold text-white">{idx + 1}. {garson.ad}</p>
                      <p className="text-xs text-white/60">{garson.siparis} sipariş</p>
                    </div>
                    <p className="font-black text-cyan-400">₺{garson.tutar.toLocaleString('tr-TR')}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Saatlik Satışlar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl bg-zinc-800/50 border border-white/10 p-6"
            >
              <h3 className="text-xl font-black text-white mb-4">⏰ Saatlik Satışlar</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {rapor.saatlikSatislar.map((saat, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-xs text-white/60 mb-1">{saat.saat}</p>
                    <p className="font-black text-white">₺{saat.tutar.toLocaleString('tr-TR')}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-2xl bg-zinc-800/50 border border-white/10 p-12 text-center"
          >
            <AlertCircle className="w-12 h-12 mx-auto text-white/20 mb-4" />
            <p className="text-white/60 mb-2">Bu tarihte tamamlanan sipariş yok</p>
            <p className="text-xs text-white/40">Başka bir tarih seçmeyi deneyin</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
