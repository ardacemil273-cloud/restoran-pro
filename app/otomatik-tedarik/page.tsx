'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, AlertTriangle, CheckCircle, Clock, Plus, Send,
  ThumbsUp, ThumbsDown, Eye, Settings, Zap, ShieldCheck,
  AlertCircle, XCircle, RefreshCw, TrendingDown, ChevronDown,
  ChevronUp, Info
} from 'lucide-react'
import { useFeatureFlags } from '@/hooks/useFeatureFlags'

type OtomatikSiparis = {
  id: string
  siparis_numarasi: string
  toplam_tutar: number
  toplam_miktar: number
  durum: string
  onay_durumu: string
  red_nedeni?: string
  onay_tarihi?: string
  created_at: string
  urunler: any[]
  tedarikci_id: string
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

const DURUM_CONFIG: Record<string, { renk: string; ikon: React.ReactNode; etiket: string }> = {
  bekleme: { renk: 'bg-amber-900/50 text-amber-300 border-amber-700', ikon: <Clock className="w-3 h-3" />, etiket: 'Bekliyor' },
  gonderildi: { renk: 'bg-green-900/50 text-green-300 border-green-700', ikon: <CheckCircle className="w-3 h-3" />, etiket: 'Gönderildi' },
  teslim_alindi: { renk: 'bg-blue-900/50 text-blue-300 border-blue-700', ikon: <Package className="w-3 h-3" />, etiket: 'Teslim Alındı' },
  iptal: { renk: 'bg-red-900/50 text-red-300 border-red-700', ikon: <XCircle className="w-3 h-3" />, etiket: 'İptal' },
}

const ONAY_CONFIG: Record<string, { renk: string; ikon: React.ReactNode; etiket: string }> = {
  bekliyor: { renk: 'bg-yellow-900/50 text-yellow-300 border-yellow-700', ikon: <Clock className="w-3 h-3" />, etiket: 'Onay Bekliyor' },
  onaylandi: { renk: 'bg-green-900/50 text-green-300 border-green-700', ikon: <ThumbsUp className="w-3 h-3" />, etiket: 'Onaylandı' },
  reddedildi: { renk: 'bg-red-900/50 text-red-300 border-red-700', ikon: <ThumbsDown className="w-3 h-3" />, etiket: 'Reddedildi' },
}

export default function OtomatikTedarikPage() {
  const [siparisler, setSiparisler] = useState<OtomatikSiparis[]>([])
  const [uyarilar, setUyarilar] = useState<StokUyarisi[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const [restoran, setRestoran] = useState<any>(null)
  const [islemYapiliyor, setIslemYapiliyor] = useState<string | null>(null)
  const [acikSiparis, setAcikSiparis] = useState<string | null>(null)
  const [redNedeni, setRedNedeni] = useState('')
  const [redDialogId, setRedDialogId] = useState<string | null>(null)
  const router = useRouter()
  const { ozellikAktifMi, ozellikModu } = useFeatureFlags(restoran?.id)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar').select('*').eq('sahibi_id', user.id).single()
    if (!restoranData) { toast.error('Restoran bulunamadı'); return }
    setRestoran(restoranData)

    const { data: siparisData } = await supabase
      .from('otomatik_siparisler')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (siparisData) setSiparisler(siparisData)

    const { data: uyariData } = await supabase
      .from('stok_uyarilari')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .eq('uyari_durumu', 'aktif')
      .order('created_at', { ascending: false })

    if (uyariData) setUyarilar(uyariData)
    setYukleniyor(false)
  }

  async function handleOnay(siparisId: string, islem: 'onayla' | 'reddet') {
    setIslemYapiliyor(siparisId)
    const { data: { user } } = await supabase.auth.getUser()

    const res = await fetch('/api/otomatik-tedarik/onayla', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siparis_id: siparisId,
        islem,
        red_nedeni: islem === 'reddet' ? redNedeni : undefined,
        kullanici_id: user?.id
      })
    })

    const data = await res.json()
    setIslemYapiliyor(null)
    setRedDialogId(null)
    setRedNedeni('')

    if (res.ok) {
      toast.success(data.mesaj)
      loadData()
    } else {
      toast.error(data.error || 'İşlem başarısız')
    }
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

  const taslakSiparisler = siparisler.filter(s => s.onay_durumu === 'bekliyor')
  const onaylananlar = siparisler.filter(s => s.onay_durumu === 'onaylandi')
  const reddedilenler = siparisler.filter(s => s.onay_durumu === 'reddedildi')
  const toplamTutar = siparisler.filter(s => s.onay_durumu === 'onaylandi').reduce((sum, s) => sum + s.toplam_tutar, 0)
  const tedarikModu = ozellikModu('otomatik_tedarik') || 'taslak'
  const tedarikAktif = ozellikAktifMi('otomatik_tedarik')

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
          <p className="text-zinc-400 text-sm mt-1">Stok Yönetimi & Sipariş Onay Merkezi</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push('/ayarlar')}
            variant="outline"
            size="sm"
            className="border-zinc-600 text-zinc-400 hover:text-white"
          >
            <Settings className="w-4 h-4 mr-1.5" />
            Ayarlar
          </Button>
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            className="border-zinc-600 text-zinc-400 hover:text-white"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Yenile
          </Button>
          <Button className="bg-amber-600 hover:bg-amber-700 text-white font-bold" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Tedarikçi Ekle
          </Button>
        </div>
      </motion.div>

      {/* Mod Göstergesi */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className={`mb-6 p-4 rounded-xl border flex items-center gap-3 ${
          !tedarikAktif
            ? 'bg-zinc-800/50 border-zinc-700 text-zinc-400'
            : tedarikModu === 'taslak'
            ? 'bg-blue-900/20 border-blue-700/50 text-blue-300'
            : 'bg-green-900/20 border-green-700/50 text-green-300'
        }`}
      >
        {!tedarikAktif ? (
          <XCircle className="w-5 h-5 flex-shrink-0" />
        ) : tedarikModu === 'taslak' ? (
          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
        ) : (
          <Zap className="w-5 h-5 flex-shrink-0" />
        )}
        <div>
          <p className="font-bold text-sm">
            {!tedarikAktif
              ? 'Otomatik Tedarik Devre Dışı'
              : tedarikModu === 'taslak'
              ? 'Mod: Taslak Oluştur & Onay Bekle'
              : 'Mod: Direkt Sipariş Gönder'
            }
          </p>
          <p className="text-xs opacity-70">
            {!tedarikAktif
              ? 'Ayarlar > Özellikler sekmesinden aktif edebilirsiniz'
              : tedarikModu === 'taslak'
              ? 'Stok azalınca taslak oluşturulur, sen onaylayınca tedarikçiye gönderilir'
              : 'Stok azalınca otomatik olarak tedarikçiye sipariş gönderilir'
            }
          </p>
        </div>
        <button
          onClick={() => router.push('/ayarlar')}
          className="ml-auto text-xs underline opacity-70 hover:opacity-100 flex-shrink-0"
        >
          Değiştir
        </button>
      </motion.div>

      {/* İstatistikler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <Card className="p-4 bg-yellow-900/30 border-yellow-700 text-center">
          <p className="text-xs text-yellow-300 mb-1 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" /> Onay Bekleyen
          </p>
          <p className="text-3xl font-black text-yellow-400">{taslakSiparisler.length}</p>
        </Card>
        <Card className="p-4 bg-green-900/30 border-green-700 text-center">
          <p className="text-xs text-green-300 mb-1 flex items-center justify-center gap-1">
            <CheckCircle className="w-3 h-3" /> Onaylanan
          </p>
          <p className="text-3xl font-black text-green-400">{onaylananlar.length}</p>
        </Card>
        <Card className="p-4 bg-red-900/30 border-red-700 text-center">
          <p className="text-xs text-red-300 mb-1 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3" /> Stok Uyarısı
          </p>
          <p className="text-3xl font-black text-red-400">{uyarilar.length}</p>
        </Card>
        <Card className="p-4 bg-blue-900/30 border-blue-700 text-center">
          <p className="text-xs text-blue-300 mb-1 flex items-center justify-center gap-1">
            <TrendingDown className="w-3 h-3" /> Onaylanan Tutar
          </p>
          <p className="text-3xl font-black text-blue-400">{toplamTutar.toFixed(0)}₺</p>
        </Card>
      </motion.div>

      {/* Onay Bekleyen Siparişler - En Önemli Bölüm */}
      {taslakSiparisler.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
            <h2 className="font-black text-yellow-400 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Onay Bekleyen Siparişler ({taslakSiparisler.length})
            </h2>
          </div>
          <div className="space-y-3">
            {taslakSiparisler.map((siparis, idx) => (
              <motion.div
                key={siparis.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="bg-yellow-900/10 border-yellow-700/50 overflow-hidden">
                  <div className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-yellow-900/50 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-yellow-400" />
                        </div>
                        <div>
                          <p className="font-bold text-white">{siparis.siparis_numarasi}</p>
                          <p className="text-sm text-zinc-400">
                            {siparis.toplam_miktar} ürün · <span className="text-green-400 font-bold">{siparis.toplam_tutar?.toFixed(0)}₺</span>
                          </p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {new Date(siparis.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          onClick={() => setAcikSiparis(acikSiparis === siparis.id ? null : siparis.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-xs text-zinc-300 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Detay
                          {acikSiparis === siparis.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => setRedDialogId(siparis.id)}
                          disabled={islemYapiliyor === siparis.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/50 hover:bg-red-900/70 border border-red-700 rounded-lg text-xs text-red-300 transition disabled:opacity-50"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          Reddet
                        </button>
                        <button
                          onClick={() => handleOnay(siparis.id, 'onayla')}
                          disabled={islemYapiliyor === siparis.id}
                          className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 hover:bg-green-500 rounded-lg text-xs text-white font-bold transition disabled:opacity-50"
                        >
                          {islemYapiliyor === siparis.id ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <ThumbsUp className="w-3.5 h-3.5" />
                          )}
                          Onayla & Gönder
                        </button>
                      </div>
                    </div>

                    {/* Detay Accordion */}
                    <AnimatePresence>
                      {acikSiparis === siparis.id && siparis.urunler && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 pt-3 border-t border-yellow-700/30"
                        >
                          <p className="text-xs font-bold text-zinc-400 mb-2">Sipariş İçeriği:</p>
                          <div className="space-y-1">
                            {(Array.isArray(siparis.urunler) ? siparis.urunler : []).map((urun: any, i: number) => (
                              <div key={i} className="flex justify-between text-xs text-zinc-300 bg-zinc-800/50 px-3 py-2 rounded-lg">
                                <span>{urun.urun_adi || `Ürün ${i + 1}`}</span>
                                <span className="text-zinc-400">{urun.miktar} adet · {urun.fiyat}₺</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stok Uyarıları */}
      {uyarilar.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="mb-6 bg-red-900/20 border border-red-700/50 rounded-xl p-4"
        >
          <h2 className="font-black text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Stok Uyarıları ({uyarilar.length})
          </h2>
          <div className="space-y-2">
            {uyarilar.slice(0, 5).map((uyari, idx) => (
              <motion.div
                key={uyari.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-3 bg-zinc-800/50 rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-bold text-white text-sm">Ürün ID: {uyari.urun_id.slice(0, 8)}...</p>
                  <p className="text-xs text-zinc-400">
                    Mevcut: <span className="text-red-400 font-bold">{uyari.mevcut_stok}</span> / Min: {uyari.minimum_seviye}
                  </p>
                </div>
                <span className="px-2 py-1 bg-red-900/50 text-red-300 rounded-full text-xs font-bold border border-red-700/50">
                  {uyari.uyari_tipi.replace('_', ' ').toUpperCase()}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Tüm Siparişler Tablosu */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden"
      >
        <div className="p-4 border-b border-zinc-700 flex items-center justify-between">
          <h2 className="font-black text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-amber-500" />
            Tüm Siparişler
          </h2>
          <span className="text-xs text-zinc-500">{siparisler.length} kayıt</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-900 border-b border-zinc-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-300">Sipariş No</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-300">Miktar</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-300">Tutar</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-300">Durum</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-300">Onay</th>
                <th className="px-4 py-3 text-left text-xs font-bold text-zinc-300">Tarih</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {siparisler.map((siparis, idx) => {
                  const durumConf = DURUM_CONFIG[siparis.durum] || DURUM_CONFIG.bekleme
                  const onayConf = ONAY_CONFIG[siparis.onay_durumu || 'bekliyor'] || ONAY_CONFIG.bekliyor
                  return (
                    <motion.tr
                      key={siparis.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.02 }}
                      className="border-b border-zinc-700 hover:bg-zinc-700/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-bold text-white text-sm">{siparis.siparis_numarasi}</td>
                      <td className="px-4 py-3 text-zinc-300 text-sm">{siparis.toplam_miktar} adet</td>
                      <td className="px-4 py-3 font-bold text-green-400 text-sm">{siparis.toplam_tutar?.toFixed(0)}₺</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit border ${durumConf.renk}`}>
                          {durumConf.ikon}
                          {durumConf.etiket}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-fit border ${onayConf.renk}`}>
                          {onayConf.ikon}
                          {onayConf.etiket}
                        </span>
                        {siparis.red_nedeni && (
                          <p className="text-xs text-red-400 mt-1 max-w-[150px] truncate" title={siparis.red_nedeni}>
                            {siparis.red_nedeni}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-400">
                        {new Date(siparis.created_at).toLocaleDateString('tr-TR')}
                      </td>
                    </motion.tr>
                  )
                })}
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
          <p className="text-zinc-600 text-sm mt-1">Stok seviyeleri minimuma düştüğünde otomatik taslak oluşturulacak</p>
        </motion.div>
      )}

      {/* Red Nedeni Dialog */}
      <AnimatePresence>
        {redDialogId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setRedDialogId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 max-w-md w-full"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-900/50 rounded-xl flex items-center justify-center">
                  <ThumbsDown className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="font-black text-white">Siparişi Reddet</h3>
                  <p className="text-zinc-400 text-sm">Neden reddediyorsunuz?</p>
                </div>
              </div>
              <textarea
                value={redNedeni}
                onChange={e => setRedNedeni(e.target.value)}
                placeholder="Örn: Bütçe yetersiz, bu ay sipariş vermeyelim..."
                className="w-full bg-zinc-700 border border-zinc-600 rounded-xl p-3 text-white text-sm resize-none focus:border-red-500 focus:outline-none"
                rows={3}
              />
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={() => setRedDialogId(null)}
                  variant="outline"
                  className="flex-1 border-zinc-600 text-zinc-400"
                >
                  İptal
                </Button>
                <Button
                  onClick={() => handleOnay(redDialogId, 'reddet')}
                  disabled={islemYapiliyor === redDialogId}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold"
                >
                  {islemYapiliyor === redDialogId ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <ThumbsDown className="w-4 h-4 mr-2" />
                  )}
                  Reddet
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
