'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Layers, Printer, CheckCircle, Clock, AlertCircle, TrendingUp, Package, Settings
} from 'lucide-react'

type PlatformSiparis = {
  id: string
  platform: string
  musteri_adi: string
  musteri_telefon: string
  musteri_adres: string
  urunler: any
  toplam_tutar: number
  komisyon_tutari: number
  durum: 'yeni' | 'onaylandi' | 'hazirlaniyor' | 'hazir' | 'teslim_alindi' | 'teslim_edildi' | 'iptal'
  ozel_istekler: string
  tahmini_hazirlanma_suresi: number
  created_at: string
}

const PLATFORM_RENKLER: Record<string, string> = {
  yemek_sepeti: 'from-red-900/50 border-red-700',
  getir: 'from-red-600/50 border-red-600',
  trendyol: 'from-blue-900/50 border-blue-700',
  whatsapp: 'from-green-900/50 border-green-700',
  telefon: 'from-purple-900/50 border-purple-700'
}

const PLATFORM_EMOJIS: Record<string, string> = {
  yemek_sepeti: '🍽️',
  getir: '🚴',
  trendyol: '📦',
  whatsapp: '💬',
  telefon: '☎️'
}

export default function TekPanelPage() {
  const [siparisler, setSiparisler] = useState<PlatformSiparis[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [secilenPlatform, setSecilenPlatform] = useState<string | null>(null)
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
      .from('platform_siparisler')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .order('created_at', { ascending: false })

    if (siparislerData) setSiparisler(siparislerData)
    setYukleniyor(false)
  }

  async function durumGuncelle(siparisId: string, yeniDurum: string) {
    const { error } = await supabase
      .from('platform_siparisler')
      .update({ durum: yeniDurum })
      .eq('id', siparisId)
    
    if (error) { toast.error('Güncellenemedi'); return }
    toast.success('✅ Durum güncellendi!')
    await loadData()
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Layers className="w-16 h-16 text-blue-500" />
        </motion.div>
      </div>
    )
  }

  const platformlar = ['yemek_sepeti', 'getir', 'trendyol', 'whatsapp', 'telefon']
  const filtrelenmis = secilenPlatform 
    ? siparisler.filter(s => s.platform === secilenPlatform)
    : siparisler

  const yeni = filtrelenmis.filter(s => s.durum === 'yeni')
  const onaylandi = filtrelenmis.filter(s => s.durum === 'onaylandi')
  const hazirlaniyor = filtrelenmis.filter(s => s.durum === 'hazirlaniyor')
  const hazir = filtrelenmis.filter(s => s.durum === 'hazir')

  return (
    <div className="p-4 md:p-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-blue-500" />
            Tek Panel
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad} — Tüm platformlar bir ekranda</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
          <Settings className="w-4 h-4 mr-2" />
          Platform Ayarları
        </Button>
      </motion.div>

      {/* Platform Filtreleri */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mb-6 flex gap-2 overflow-x-auto pb-2"
      >
        <Button
          onClick={() => setSecilenPlatform(null)}
          className={`whitespace-nowrap ${
            secilenPlatform === null
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-zinc-800 hover:bg-zinc-700'
          }`}
        >
          Tümü ({siparisler.length})
        </Button>
        {platformlar.map(platform => {
          const count = siparisler.filter(s => s.platform === platform).length
          return (
            <Button
              key={platform}
              onClick={() => setSecilenPlatform(platform)}
              className={`whitespace-nowrap ${
                secilenPlatform === platform
                  ? 'bg-blue-600 hover:bg-blue-700'
                  : 'bg-zinc-800 hover:bg-zinc-700'
              }`}
            >
              {PLATFORM_EMOJIS[platform]} {platform.replace('_', ' ')} ({count})
            </Button>
          )
        })}
      </motion.div>

      {/* İstatistikler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <Card className="p-4 bg-orange-900/30 border-orange-700 text-center">
          <p className="text-xs text-orange-300 mb-1">Yeni</p>
          <p className="text-3xl font-black text-orange-400">{yeni.length}</p>
        </Card>
        <Card className="p-4 bg-blue-900/30 border-blue-700 text-center">
          <p className="text-xs text-blue-300 mb-1">Onaylı</p>
          <p className="text-3xl font-black text-blue-400">{onaylandi.length}</p>
        </Card>
        <Card className="p-4 bg-yellow-900/30 border-yellow-700 text-center">
          <p className="text-xs text-yellow-300 mb-1">Hazırlanıyor</p>
          <p className="text-3xl font-black text-yellow-400">{hazirlaniyor.length}</p>
        </Card>
        <Card className="p-4 bg-green-900/30 border-green-700 text-center">
          <p className="text-xs text-green-300 mb-1">Hazır</p>
          <p className="text-3xl font-black text-green-400">{hazir.length}</p>
        </Card>
      </motion.div>

      {/* Siparişler */}
      <div className="space-y-6">
        {/* Yeni Siparişler */}
        {yeni.length > 0 && (
          <div>
            <h2 className="text-xl font-black text-orange-400 mb-4 flex items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              Yeni Siparişler ({yeni.length})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AnimatePresence>
                {yeni.map((siparis, idx) => (
                  <motion.div
                    key={siparis.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className={`p-4 bg-gradient-to-br to-zinc-800 border-l-4 ${PLATFORM_RENKLER[siparis.platform]}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-black text-white text-lg">{PLATFORM_EMOJIS[siparis.platform]} {siparis.musteri_adi}</h3>
                          <p className="text-xs text-zinc-400 mt-1">{siparis.musteri_telefon}</p>
                        </div>
                        <span className="text-2xl font-black text-green-400">{siparis.toplam_tutar.toFixed(0)}₺</span>
                      </div>
                      <p className="text-white mb-3 text-sm">{siparis.musteri_adres}</p>
                      {siparis.ozel_istekler && (
                        <p className="text-xs text-yellow-400 mb-3">📝 {siparis.ozel_istekler}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => durumGuncelle(siparis.id, 'onaylandi')}
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Onayla
                        </Button>
                        <Button
                          onClick={() => durumGuncelle(siparis.id, 'iptal')}
                          size="sm"
                          variant="outline"
                          className="border-zinc-600"
                        >
                          İptal
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Hazırlanıyor */}
        {hazirlaniyor.length > 0 && (
          <div>
            <h2 className="text-xl font-black text-yellow-400 mb-4 flex items-center gap-2">
              <Clock className="w-6 h-6" />
              Hazırlanıyor ({hazirlaniyor.length})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {hazirlaniyor.map((siparis, idx) => (
                <motion.div
                  key={siparis.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className={`p-4 bg-gradient-to-br to-zinc-800 border-l-4 ${PLATFORM_RENKLER[siparis.platform]}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white">{PLATFORM_EMOJIS[siparis.platform]} {siparis.musteri_adi}</h3>
                        <p className="text-xs text-zinc-400 mt-1">{siparis.tahmini_hazirlanma_suresi} dk</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => durumGuncelle(siparis.id, 'hazir')}
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      Hazır
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {filtrelenmis.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <Package className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-400 font-medium">Sipariş yok</p>
        </motion.div>
      )}
    </div>
  )
}
