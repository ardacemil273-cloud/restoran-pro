'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Download, Printer, Mail, CheckCircle, AlertCircle, DollarSign, Calendar
} from 'lucide-react'

type Fatura = {
  id: string
  fatura_numarasi: string
  fatura_tarihi: string
  musteri_adi: string
  toplam_tutar: number
  fatura_durumu: string
  odeme_durumu: string
  created_at: string
}

export default function FaturalarPage() {
  const [faturalar, setFaturalar] = useState<Fatura[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar').select('*').eq('sahibi_id', user.id).single()
    if (!restoranData) { toast.error('Restoran bulunamadı'); return }

    const { data: faturaData } = await supabase
      .from('faturalar')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .order('fatura_tarihi', { ascending: false })

    if (faturaData) setFaturalar(faturaData)

    setYukleniyor(false)
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <FileText className="w-16 h-16 text-blue-500" />
        </motion.div>
      </div>
    )
  }

  const gonderilen = faturalar.filter(f => f.fatura_durumu === 'gonderildi').length
  const odenmiş = faturalar.filter(f => f.odeme_durumu === 'odenmiş').length
  const toplamTutar = faturalar.reduce((sum, f) => sum + f.toplam_tutar, 0)

  return (
    <div className="p-4 md:p-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <FileText className="w-8 h-8 text-blue-500" />
            E-Faturalar
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Resmi Muhasebe Entegrasyonu</p>
        </div>
      </motion.div>

      {/* İstatistikler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <Card className="p-4 bg-blue-900/30 border-blue-700 text-center">
          <p className="text-xs text-blue-300 mb-1">Toplam Fatura</p>
          <p className="text-3xl font-black text-blue-400">{faturalar.length}</p>
        </Card>
        <Card className="p-4 bg-green-900/30 border-green-700 text-center">
          <p className="text-xs text-green-300 mb-1">Ödenen</p>
          <p className="text-3xl font-black text-green-400">{odenmiş}</p>
        </Card>
        <Card className="p-4 bg-purple-900/30 border-purple-700 text-center">
          <p className="text-xs text-purple-300 mb-1">Gönderilen</p>
          <p className="text-3xl font-black text-purple-400">{gonderilen}</p>
        </Card>
        <Card className="p-4 bg-yellow-900/30 border-yellow-700 text-center">
          <p className="text-xs text-yellow-300 mb-1">Toplam Tutar</p>
          <p className="text-3xl font-black text-yellow-400">{toplamTutar.toFixed(0)}₺</p>
        </Card>
      </motion.div>

      {/* Faturalar Tablosu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-700">
          <h2 className="font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            Fatura Listesi
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900 border-b border-zinc-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Fatura No</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Müşteri</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Tutar</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">İşlem</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {faturalar.map((fatura, idx) => (
                  <motion.tr
                    key={fatura.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b border-zinc-700 hover:bg-zinc-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-white">{fatura.fatura_numarasi}</td>
                    <td className="px-6 py-4 text-zinc-300">{fatura.musteri_adi || 'Bilinmiyor'}</td>
                    <td className="px-6 py-4 font-bold text-green-400">{fatura.toplam_tutar.toFixed(0)}₺</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit ${
                        fatura.odeme_durumu === 'odenmiş'
                          ? 'bg-green-900/50 text-green-300'
                          : 'bg-amber-900/50 text-amber-300'
                      }`}>
                        {fatura.odeme_durumu === 'odenmiş' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <AlertCircle className="w-3 h-3" />
                        )}
                        {fatura.odeme_durumu === 'odenmiş' ? 'Ödendi' : 'Beklemede'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-400">
                      {new Date(fatura.fatura_tarihi).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <button className="p-2 hover:bg-zinc-700 rounded-lg transition-colors" title="İndir">
                        <Download className="w-4 h-4 text-blue-400" />
                      </button>
                      <button className="p-2 hover:bg-zinc-700 rounded-lg transition-colors" title="Yazdır">
                        <Printer className="w-4 h-4 text-purple-400" />
                      </button>
                      <button className="p-2 hover:bg-zinc-700 rounded-lg transition-colors" title="E-posta Gönder">
                        <Mail className="w-4 h-4 text-green-400" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {faturalar.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <FileText className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">Henüz fatura yok</p>
        </motion.div>
      )}
    </div>
  )
}
