'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Clock, User, FileText, AlertCircle, CheckCircle, XCircle, Filter
} from 'lucide-react'

type AuditLog = {
  id: string
  kullanici_id: string
  islem_tipi: string
  tablo_adi: string
  degisiklik_ozeti: string
  islem_durumu: string
  created_at: string
  ip_adresi: string
}

type AktiviteOzeti = {
  id: string
  kullanici_id: string
  tarih: string
  toplam_islem: number
  basarili_islem: number
  hata_islem: number
  son_islem_saati: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [aktivite, setAktivite] = useState<AktiviteOzeti[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const router = useRouter()

  useEffect(() => { loadData() }, [filter])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar').select('*').eq('sahibi_id', user.id).single()
    if (!restoranData) { toast.error('Restoran bulunamadı'); return }

    // Audit Logs
    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (filter !== 'all') {
      query = query.eq('islem_tipi', filter)
    }

    const { data: logsData } = await query
    if (logsData) setLogs(logsData)

    // Aktivite Özeti
    const { data: aktiviteData } = await supabase
      .from('kullanici_aktivite_ozeti')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .order('tarih', { ascending: false })
      .limit(7)
    if (aktiviteData) setAktivite(aktiviteData)

    setYukleniyor(false)
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Shield className="w-16 h-16 text-blue-500" />
        </motion.div>
      </div>
    )
  }

  const basariliIslem = logs.filter(l => l.islem_durumu === 'basarili').length
  const hataliIslem = logs.filter(l => l.islem_durumu === 'hata').length

  return (
    <div className="p-4 md:p-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <Shield className="w-8 h-8 text-blue-500" />
            Audit Logs
          </h1>
          <p className="text-zinc-400 text-sm mt-1">İşlem Geçmişi ve Güvenlik Takibi</p>
        </div>
      </motion.div>

      {/* İstatistikler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <Card className="p-4 bg-blue-900/30 border-blue-700 text-center">
          <p className="text-xs text-blue-300 mb-1">Toplam İşlem</p>
          <p className="text-3xl font-black text-blue-400">{logs.length}</p>
        </Card>
        <Card className="p-4 bg-green-900/30 border-green-700 text-center">
          <p className="text-xs text-green-300 mb-1">Başarılı</p>
          <p className="text-3xl font-black text-green-400">{basariliIslem}</p>
        </Card>
        <Card className="p-4 bg-red-900/30 border-red-700 text-center">
          <p className="text-xs text-red-300 mb-1">Hata</p>
          <p className="text-3xl font-black text-red-400">{hataliIslem}</p>
        </Card>
        <Card className="p-4 bg-purple-900/30 border-purple-700 text-center">
          <p className="text-xs text-purple-300 mb-1">Başarı Oranı</p>
          <p className="text-3xl font-black text-purple-400">
            {logs.length > 0 ? Math.round((basariliIslem / logs.length) * 100) : 0}%
          </p>
        </Card>
      </motion.div>

      {/* Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="mb-6 flex gap-2 flex-wrap"
      >
        {['all', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg font-bold transition-all ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
            }`}
          >
            {f === 'all' ? 'Tümü' : f}
          </button>
        ))}
      </motion.div>

      {/* Audit Logs Tablosu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-700">
          <h2 className="font-black text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            İşlem Geçmişi
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900 border-b border-zinc-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">İşlem Tipi</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Tablo</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Açıklama</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-zinc-300">Zaman</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {logs.map((log, idx) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className="border-b border-zinc-700 hover:bg-zinc-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-white">{log.islem_tipi}</td>
                    <td className="px-6 py-4 text-zinc-400">{log.tablo_adi}</td>
                    <td className="px-6 py-4 text-zinc-300 text-sm">{log.degisiklik_ozeti}</td>
                    <td className="px-6 py-4">
                      <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold w-fit ${
                        log.islem_durumu === 'basarili'
                          ? 'bg-green-900/50 text-green-300'
                          : 'bg-red-900/50 text-red-300'
                      }`}>
                        {log.islem_durumu === 'basarili' ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {log.islem_durumu === 'basarili' ? 'Başarılı' : 'Hata'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-zinc-400">
                      {new Date(log.created_at).toLocaleString('tr-TR')}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </motion.div>

      {logs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Shield className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">Henüz işlem geçmişi yok</p>
        </motion.div>
      )}
    </div>
  )
}
