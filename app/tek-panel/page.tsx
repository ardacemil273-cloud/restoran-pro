'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import {
  Layers, Settings, CheckCircle, Clock, AlertCircle, TrendingUp, Package, X, Check
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

const PLATFORM_LABELS: Record<string, string> = {
  yemek_sepeti: 'Yemek Sepeti',
  getir: 'Getir',
  trendyol: 'Trendyol',
  whatsapp: 'WhatsApp',
  telefon: 'Telefon'
}

export default function TekPanelPage() {
  const [siparisler, setSiparisler] = useState<PlatformSiparis[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [secilenPlatform, setSecilenPlatform] = useState<string | null>(null)
  const [ayarlarAcik, setAyarlarAcik] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: restoranData } = await supabase
        .from('restoranlar')
        .select('*')
        .eq('sahibi_id', user.id)
        .single()

      if (!restoranData) {
        toast.error('Restoran bulunamadı')
        return
      }

      setRestoran(restoranData)

      const { data: siparislerData } = await supabase
        .from('platform_siparisler')
        .select('*')
        .eq('restoran_id', restoranData.id)
        .order('created_at', { ascending: false })

      if (siparislerData) setSiparisler(siparislerData)
    } catch (err: any) {
      toast.error('Veri yüklenemedi: ' + err.message)
    } finally {
      setYukleniyor(false)
    }
  }

  async function durumGuncelle(siparisId: string, yeniDurum: string) {
    try {
      const { error } = await supabase
        .from('platform_siparisler')
        .update({ durum: yeniDurum })
        .eq('id', siparisId)

      if (error) {
        toast.error('Güncellenemedi')
        return
      }

      toast.success('✅ Durum güncellendi!')
      await loadData()
    } catch (err: any) {
      toast.error('Hata: ' + err.message)
    }
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-background text-white flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <Layers className="w-16 h-16 text-primary" />
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

  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
        >
          <div className="flex-1">
            <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight mb-1">Tek Panel</h1>
            <p className="text-white/50 text-sm">{restoran?.ad} — Tüm platformlar bir ekranda</p>
          </div>
          <button
            onClick={() => setAyarlarAcik(true)}
            className="w-full lg:w-auto px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            <Settings size={18} />
            Platform Ayarları
          </button>
        </motion.div>

        {/* Platform Filtreleri - Mobil Responsive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 lg:mx-0 lg:px-0 lg:flex-wrap"
        >
          <button
            onClick={() => setSecilenPlatform(null)}
            className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all active:scale-95 flex-shrink-0 ${
              secilenPlatform === null
                ? 'bg-primary text-black shadow-lg shadow-primary/20'
                : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            Tümü ({siparisler.length})
          </button>
          {platformlar.map(platform => {
            const count = siparisler.filter(s => s.platform === platform).length
            return (
              <button
                key={platform}
                onClick={() => setSecilenPlatform(platform)}
                className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all active:scale-95 flex-shrink-0 ${
                  secilenPlatform === platform
                    ? 'bg-primary text-black shadow-lg shadow-primary/20'
                    : 'bg-white/5 text-white hover:bg-white/10'
                }`}
              >
                {PLATFORM_EMOJIS[platform]} {PLATFORM_LABELS[platform]} ({count})
              </button>
            )
          })}
        </motion.div>

        {/* İstatistikler - Mobil Responsive */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4"
        >
          {[
            { icon: AlertCircle, label: 'Yeni', value: yeni.length, color: 'text-red-400' },
            { icon: Clock, label: 'Onaylı', value: onaylandi.length, color: 'text-yellow-400' },
            { icon: TrendingUp, label: 'Hazırlanan', value: hazirlaniyor.length, color: 'text-blue-400' },
            { icon: Package, label: 'Ciro', value: `₺${filtrelenmis.reduce((s, p) => s + (p.toplam_tutar || 0), 0).toLocaleString('tr-TR')}`, color: 'text-green-400' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}
              className="p-3 lg:p-4 rounded-2xl bg-card border border-white/5 hover:border-primary/20 transition-all"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-white/50 text-xs font-bold uppercase mb-1 truncate">{stat.label}</p>
                  <p className="text-xl lg:text-2xl font-black text-white truncate">{stat.value}</p>
                </div>
                <stat.icon className={`w-6 h-6 lg:w-8 lg:h-8 ${stat.color} opacity-50 shrink-0`} />
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Siparişler */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-3 lg:space-y-4"
        >
          {filtrelenmis.length > 0 ? (
            filtrelenmis.map((siparis, i) => (
              <motion.div
                key={siparis.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className={`p-4 lg:p-5 rounded-2xl border border-white/10 hover:border-primary/20 transition-all bg-gradient-to-br ${PLATFORM_RENKLER[siparis.platform]}`}
              >
                <div className="flex flex-col gap-3 mb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xl lg:text-2xl shrink-0">{PLATFORM_EMOJIS[siparis.platform]}</span>
                        <h3 className="text-base lg:text-lg font-black text-white truncate">{siparis.musteri_adi}</h3>
                        <span className={`text-[10px] lg:text-xs font-bold px-2 py-1 rounded-lg border whitespace-nowrap shrink-0 ${
                          siparis.durum === 'yeni' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                          siparis.durum === 'onaylandi' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' :
                          siparis.durum === 'hazirlaniyor' ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' :
                          'bg-green-500/20 text-green-400 border-green-500/20'
                        }`}>
                          {siparis.durum.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-white/60 text-xs lg:text-sm truncate">{siparis.musteri_telefon}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg lg:text-2xl font-black text-white">₺{siparis.toplam_tutar.toLocaleString('tr-TR')}</p>
                      <p className="text-[10px] lg:text-xs text-white/40">Kom: ₺{siparis.komisyon_tutari.toLocaleString('tr-TR')}</p>
                    </div>
                  </div>
                </div>

                {/* Ürünler */}
                <div className="mb-3 p-3 bg-white/5 rounded-xl">
                  <p className="text-xs font-bold text-white/50 mb-2 uppercase">Ürünler:</p>
                  <div className="space-y-1">
                    {siparis.urunler?.map((urun: any, idx: number) => (
                      <p key={idx} className="text-xs lg:text-sm text-white/70 break-words">
                        {urun.adet}x {urun.ad}
                      </p>
                    ))}
                  </div>
                </div>

                {/* Özel İstekler */}
                {siparis.ozel_istekler && (
                  <div className="mb-3 p-3 bg-white/5 rounded-xl">
                    <p className="text-xs font-bold text-white/50 mb-1 uppercase">Özel İstekler:</p>
                    <p className="text-xs lg:text-sm text-white/70 break-words">{siparis.ozel_istekler}</p>
                  </div>
                )}

                {/* Butonlar */}
                <div className="flex gap-2 flex-wrap">
                  {siparis.durum === 'yeni' && (
                    <>
                      <button
                        onClick={() => durumGuncelle(siparis.id, 'onaylandi')}
                        className="flex-1 min-w-[100px] px-3 lg:px-4 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/20 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 min-h-[44px] text-sm lg:text-base"
                      >
                        <Check size={16} /> Onayla
                      </button>
                      <button
                        onClick={() => durumGuncelle(siparis.id, 'iptal')}
                        className="flex-1 min-w-[100px] px-3 lg:px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 min-h-[44px] text-sm lg:text-base"
                      >
                        <X size={16} /> İptal
                      </button>
                    </>
                  )}
                  {siparis.durum === 'onaylandi' && (
                    <button
                      onClick={() => durumGuncelle(siparis.id, 'hazirlaniyor')}
                      className="flex-1 px-3 lg:px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/20 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 min-h-[44px] text-sm lg:text-base"
                    >
                      Hazırlamaya Başla
                    </button>
                  )}
                  {siparis.durum === 'hazirlaniyor' && (
                    <button
                      onClick={() => durumGuncelle(siparis.id, 'hazir')}
                      className="flex-1 px-3 lg:px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/20 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 min-h-[44px] text-sm lg:text-base"
                    >
                      <CheckCircle size={16} /> Hazır
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 lg:p-12 rounded-2xl bg-card border border-white/5 text-center">
              <Package size={48} className="text-white/20 mx-auto mb-3" />
              <p className="text-white/40">Sipariş yok</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Platform Ayarları Modal - Z-index düzeltildi */}
      {ayarlarAcik && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setAyarlarAcik(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-white/10 rounded-3xl p-6 lg:p-8 max-w-md w-full max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-white">Platform Ayarları</h2>
              <button
                onClick={() => setAyarlarAcik(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-all"
              >
                <X size={20} className="text-white/50" />
              </button>
            </div>

            <div className="space-y-4">
              {platformlar.map(platform => (
                <div key={platform} className="p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{PLATFORM_EMOJIS[platform]}</span>
                      <span className="font-bold text-white text-sm lg:text-base">{PLATFORM_LABELS[platform]}</span>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="w-5 h-5 rounded cursor-pointer"
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setAyarlarAcik(false)}
              className="w-full mt-6 px-6 py-3 bg-primary hover:bg-primary/90 text-black font-black rounded-xl transition-all"
            >
              Kapat
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
