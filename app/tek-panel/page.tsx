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
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Tek Panel</h1>
          <p className="text-white/50 text-sm">{restoran?.ad} — Tüm platformlar bir ekranda</p>
        </div>
        <button
          onClick={() => setAyarlarAcik(true)}
          className="px-6 py-3 bg-primary/10 hover:bg-primary/20 text-primary rounded-xl font-bold transition-all flex items-center gap-2 active:scale-95"
        >
          <Settings size={18} />
          Platform Ayarları
        </button>
      </motion.div>

      {/* Platform Filtreleri */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 lg:mx-0 lg:px-0"
      >
        <button
          onClick={() => setSecilenPlatform(null)}
          className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all active:scale-95 ${
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
              className={`px-4 py-2.5 rounded-xl font-bold whitespace-nowrap transition-all active:scale-95 ${
                secilenPlatform === platform
                  ? 'bg-primary text-black shadow-lg shadow-primary/20'
                  : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              {PLATFORM_EMOJIS[platform]} {platform.replace(/_/g, ' ')} ({count})
            </button>
          )
        })}
      </motion.div>

      {/* İstatistikler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        {[
          { icon: AlertCircle, label: 'Yeni Siparişler', value: yeni.length, color: 'text-red-400' },
          { icon: Clock, label: 'Onaylanan', value: onaylandi.length, color: 'text-yellow-400' },
          { icon: TrendingUp, label: 'Hazırlanıyor', value: hazirlaniyor.length, color: 'text-blue-400' },
          { icon: Package, label: 'Toplam Ciro', value: `₺${filtrelenmis.reduce((s, p) => s + (p.toplam_tutar || 0), 0).toLocaleString('tr-TR')}`, color: 'text-green-400' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            className="p-4 rounded-2xl bg-card border border-white/5 hover:border-primary/20 transition-all"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-xs font-bold uppercase mb-1">{stat.label}</p>
                <p className="text-2xl font-black text-white">{stat.value}</p>
              </div>
              <stat.icon className={`w-8 h-8 ${stat.color} opacity-50`} />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Siparişler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        {filtrelenmis.length > 0 ? (
          filtrelenmis.map((siparis, i) => (
            <motion.div
              key={siparis.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              className={`p-5 rounded-2xl border border-white/10 hover:border-primary/20 transition-all bg-gradient-to-br ${PLATFORM_RENKLER[siparis.platform]}`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl">{PLATFORM_EMOJIS[siparis.platform]}</span>
                    <h3 className="text-lg font-black text-white">{siparis.musteri_adi}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg border ${
                      siparis.durum === 'yeni' ? 'bg-red-500/20 text-red-400 border-red-500/20' :
                      siparis.durum === 'onaylandi' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20' :
                      siparis.durum === 'hazirlaniyor' ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' :
                      'bg-green-500/20 text-green-400 border-green-500/20'
                    }`}>
                      {siparis.durum.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm">{siparis.musteri_telefon}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-white">₺{siparis.toplam_tutar.toLocaleString('tr-TR')}</p>
                  <p className="text-xs text-white/40">Komisyon: ₺{siparis.komisyon_tutari.toLocaleString('tr-TR')}</p>
                </div>
              </div>

              {/* Ürünler */}
              <div className="mb-3 p-3 bg-white/5 rounded-xl">
                <p className="text-xs font-bold text-white/50 mb-2 uppercase">Ürünler:</p>
                <div className="space-y-1">
                  {siparis.urunler?.map((urun: any, idx: number) => (
                    <p key={idx} className="text-sm text-white/70">
                      {urun.adet}x {urun.ad}
                    </p>
                  ))}
                </div>
              </div>

              {/* Özel İstekler */}
              {siparis.ozel_istekler && (
                <div className="mb-3 p-3 bg-white/5 rounded-xl">
                  <p className="text-xs font-bold text-white/50 mb-1 uppercase">Özel İstekler:</p>
                  <p className="text-sm text-white/70">{siparis.ozel_istekler}</p>
                </div>
              )}

              {/* Butonlar */}
              <div className="flex gap-2 flex-wrap">
                {siparis.durum === 'yeni' && (
                  <>
                    <button
                      onClick={() => durumGuncelle(siparis.id, 'onaylandi')}
                      className="flex-1 px-4 py-2.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/20 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      <Check size={16} /> Onayla
                    </button>
                    <button
                      onClick={() => durumGuncelle(siparis.id, 'iptal')}
                      className="flex-1 px-4 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/20 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      <X size={16} /> İptal
                    </button>
                  </>
                )}
                {siparis.durum === 'onaylandi' && (
                  <button
                    onClick={() => durumGuncelle(siparis.id, 'hazirlaniyor')}
                    className="flex-1 px-4 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/20 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    Hazırlamaya Başla
                  </button>
                )}
                {siparis.durum === 'hazirlaniyor' && (
                  <button
                    onClick={() => durumGuncelle(siparis.id, 'hazir')}
                    className="flex-1 px-4 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/20 rounded-xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 min-h-[44px]"
                  >
                    <CheckCircle size={16} /> Hazır
                  </button>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-12 rounded-2xl bg-card border border-white/5 text-center">
            <Package size={48} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/40">Sipariş yok</p>
          </div>
        )}
      </motion.div>

      {/* Platform Ayarları Modal */}
      {ayarlarAcik && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setAyarlarAcik(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-white/10 rounded-3xl p-8 max-w-md w-full"
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
                      <span className="font-bold text-white capitalize">{platform.replace(/_/g, ' ')}</span>
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
