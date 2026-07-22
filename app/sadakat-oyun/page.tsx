'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, Gift, RotateCw, Trophy, Star, Sparkles, Percent,
  Settings, QrCode, Info, CheckCircle2, AlertCircle,
  Users, TrendingUp, Crown, Copy, RefreshCw
} from 'lucide-react'
import { useFeatureFlags } from '@/hooks/useFeatureFlags'

type MusteriSadakat = {
  id: string
  musteri_adi: string
  toplam_puan: number
  bakiye_puan: number
  seviye: 'bronz' | 'gumush' | 'altin' | 'platin'
  son_siparis_tarihi: string
}

const SEVIYE_RENKLER: Record<string, string> = {
  bronz: 'text-yellow-700',
  gumush: 'text-gray-400',
  altin: 'text-yellow-400',
  platin: 'text-purple-400'
}

const SEVIYE_EMOJIS: Record<string, string> = {
  bronz: '🥉',
  gumush: '🥈',
  altin: '🥇',
  platin: '👑'
}

const SEVIYE_BG: Record<string, string> = {
  bronz: 'bg-yellow-900/20 border-yellow-700/30',
  gumush: 'bg-gray-700/20 border-gray-600/30',
  altin: 'bg-yellow-600/20 border-yellow-500/30',
  platin: 'bg-purple-900/20 border-purple-700/30'
}

export default function SadakatOyunPage() {
  const [musteriler, setMusteriler] = useState<MusteriSadakat[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [carkKayitlari, setCarkKayitlari] = useState<any[]>([])
  const [aktifSekme, setAktifSekme] = useState<'sadakat' | 'cark' | 'ayarlar'>('sadakat')
  const router = useRouter()
  const { ozellikAktifMi, ayarlar, yukle } = useFeatureFlags(restoran?.id)

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
      const musterilerWithNames = await Promise.all(
        musterilerData.map(async (m: any) => {
          const { data: musteri } = await supabase
            .from('musteriler').select('ad').eq('id', m.musteri_id).single()
          return { ...m, musteri_adi: musteri?.ad || 'Anonim' }
        })
      )
      setMusteriler(musterilerWithNames)
    }

    // Çark kayıtları
    const { data: carkData } = await supabase
      .from('cark_cevir_kayitlari')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (carkData) setCarkKayitlari(carkData)
    setYukleniyor(false)
  }

  async function toggleOzellik(ozellik: 'cark_cevirme' | 'sadakat_sistemi' | 'qr_kupon') {
    if (!restoran?.id) return
    const mevcutDurum = ayarlar[ozellik]?.aktif ?? false
    const yeniAyarlar = {
      ...ayarlar,
      [ozellik]: { ...ayarlar[ozellik], aktif: !mevcutDurum }
    }

    const res = await fetch('/api/ozellik-ayarlari', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restoran_id: restoran.id, ozellik_ayarlari: yeniAyarlar })
    })

    if (res.ok) {
      toast.success(`${ozellik === 'cark_cevirme' ? 'Çark çevirme' : ozellik === 'sadakat_sistemi' ? 'Sadakat sistemi' : 'QR Kupon'} ${!mevcutDurum ? 'aktif edildi' : 'devre dışı bırakıldı'}`)
      yukle(restoran.id)
    } else {
      toast.error('Ayar kaydedilemedi')
    }
  }

  function menuLinkKopyala() {
    if (!restoran?.slug) return
    const link = `${window.location.origin}/menu/${restoran.slug}`
    navigator.clipboard.writeText(link)
    toast.success('Menü linki kopyalandı!')
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

  const carkAktif = ozellikAktifMi('cark_cevirme')
  const sadakatAktif = ozellikAktifMi('sadakat_sistemi')
  const qrKuponAktif = ozellikAktifMi('qr_kupon')

  const bugunCark = carkKayitlari.filter(k => {
    const bugun = new Date()
    const kayitTarih = new Date(k.created_at)
    return kayitTarih.toDateString() === bugun.toDateString()
  }).length

  const toplamIndirim = carkKayitlari
    .filter(k => k.odul_tipi === 'indirim' && k.kullanildi)
    .reduce((sum, k) => sum + (k.odul_degeri || 0), 0)

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
        <Button
          onClick={() => router.push('/ayarlar')}
          variant="outline"
          size="sm"
          className="border-zinc-600 text-zinc-400 hover:text-white"
        >
          <Settings className="w-4 h-4 mr-1.5" />
          Tüm Ayarlar
        </Button>
      </motion.div>

      {/* Sekme Navigasyonu */}
      <div className="flex gap-1 mb-6 bg-zinc-800 p-1 rounded-xl border border-zinc-700">
        {[
          { id: 'sadakat', etiket: 'Sadakat', ikon: <Trophy className="w-4 h-4" /> },
          { id: 'cark', etiket: 'Çark Çevirme', ikon: <RotateCw className="w-4 h-4" /> },
          { id: 'ayarlar', etiket: 'Hızlı Ayarlar', ikon: <Settings className="w-4 h-4" /> },
        ].map(sekme => (
          <button
            key={sekme.id}
            onClick={() => setAktifSekme(sekme.id as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
              aktifSekme === sekme.id
                ? 'bg-zinc-700 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {sekme.ikon}
            {sekme.etiket}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* Sadakat Sekmesi */}
        {aktifSekme === 'sadakat' && (
          <motion.div
            key="sadakat"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {!sadakatAktif && (
              <div className="mb-4 p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-zinc-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-zinc-400 text-sm font-bold">Sadakat sistemi devre dışı</p>
                  <p className="text-zinc-500 text-xs">Hızlı Ayarlar sekmesinden aktif edebilirsiniz</p>
                </div>
                <Button size="sm" onClick={() => setAktifSekme('ayarlar')} className="bg-zinc-700 hover:bg-zinc-600 text-xs">
                  Aktif Et
                </Button>
              </div>
            )}

            {/* İstatistikler */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {[
                { etiket: 'Toplam Müşteri', deger: musteriler.length, renk: 'purple' },
                { etiket: 'Altın Üye', deger: musteriler.filter(m => m.seviye === 'altin').length, renk: 'yellow' },
                { etiket: 'Platin Üye', deger: musteriler.filter(m => m.seviye === 'platin').length, renk: 'purple' },
                { etiket: 'Toplam Puan', deger: musteriler.reduce((sum, m) => sum + m.toplam_puan, 0), renk: 'blue' },
              ].map((stat, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                  <Card className={`p-4 text-center bg-${stat.renk}-900/30 border-${stat.renk}-700`}>
                    <p className={`text-xs text-${stat.renk}-300 mb-1`}>{stat.etiket}</p>
                    <p className={`text-3xl font-black text-${stat.renk}-400`}>{stat.deger}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Müşteri Listesi */}
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-zinc-700 flex items-center justify-between">
                <h2 className="font-black text-white flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Müşteri Sadakat Sıralaması
                </h2>
                <span className="text-xs text-zinc-500">{musteriler.length} müşteri</span>
              </div>
              {musteriler.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 font-medium">Henüz müşteri yok</p>
                  <p className="text-zinc-600 text-sm mt-1">Müşteriler sipariş verdikçe burada görünecek</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-700">
                  {musteriler.map((musteri, idx) => (
                    <motion.div
                      key={musteri.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`p-4 flex items-center gap-4 hover:bg-zinc-700/30 transition-colors ${SEVIYE_BG[musteri.seviye]}`}
                    >
                      <div className="w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center text-sm font-black text-zinc-400">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-white">{musteri.musteri_adi}</p>
                        <p className="text-xs text-zinc-500">
                          Son sipariş: {musteri.son_siparis_tarihi ? new Date(musteri.son_siparis_tarihi).toLocaleDateString('tr-TR') : '-'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-black ${SEVIYE_RENKLER[musteri.seviye]}`}>
                          {SEVIYE_EMOJIS[musteri.seviye]} {musteri.seviye.toUpperCase()}
                        </p>
                        <p className="text-xs text-zinc-400">{musteri.toplam_puan} puan</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Çark Çevirme Sekmesi */}
        {aktifSekme === 'cark' && (
          <motion.div
            key="cark"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Durum Kartı */}
            <Card className={`p-5 mb-6 border-2 ${carkAktif ? 'bg-purple-900/20 border-purple-600' : 'bg-zinc-800 border-zinc-600'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${carkAktif ? 'bg-purple-900/50' : 'bg-zinc-700'}`}>
                    🎡
                  </div>
                  <div>
                    <p className="font-black text-white">Çark Çevirme</p>
                    <p className={`text-xs ${carkAktif ? 'text-purple-300' : 'text-zinc-500'}`}>
                      {carkAktif ? 'Müşteriler QR menüde çark çevirebilir' : 'Şu an devre dışı'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={carkAktif}
                  onCheckedChange={() => toggleOzellik('cark_cevirme')}
                  className={carkAktif ? 'data-[state=checked]:bg-purple-500' : ''}
                />
              </div>

              {carkAktif && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="pt-3 border-t border-purple-700/30"
                >
                  <div className="flex items-start gap-2 text-xs text-purple-300">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <p>Müşteriler QR kodu okutup menüye girdiğinde "Sürpriz" butonu görünür. Her masa 24 saatte bir çark çevirebilir.</p>
                  </div>
                  <button
                    onClick={menuLinkKopyala}
                    className="mt-3 flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    QR menü linkini kopyala
                  </button>
                </motion.div>
              )}
            </Card>

            {/* İstatistikler */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <Card className="p-3 bg-purple-900/20 border-purple-700 text-center">
                <p className="text-xs text-purple-300 mb-1">Bugün</p>
                <p className="text-2xl font-black text-purple-400">{bugunCark}</p>
              </Card>
              <Card className="p-3 bg-blue-900/20 border-blue-700 text-center">
                <p className="text-xs text-blue-300 mb-1">Toplam</p>
                <p className="text-2xl font-black text-blue-400">{carkKayitlari.length}</p>
              </Card>
              <Card className="p-3 bg-green-900/20 border-green-700 text-center">
                <p className="text-xs text-green-300 mb-1">Kullanılan</p>
                <p className="text-2xl font-black text-green-400">{carkKayitlari.filter(k => k.kullanildi).length}</p>
              </Card>
            </div>

            {/* Son Çark Kayıtları */}
            <div className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-zinc-700">
                <h3 className="font-black text-white flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-purple-400" />
                  Son Çark Kayıtları
                </h3>
              </div>
              {carkKayitlari.length === 0 ? (
                <div className="text-center py-10">
                  <RotateCw className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400 text-sm">Henüz çark çevrilmedi</p>
                  <p className="text-zinc-600 text-xs mt-1">Çark çevirmeyi aktif edin ve QR menü linkini müşterilerinize gönderin</p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-700">
                  {carkKayitlari.map((kayit, idx) => (
                    <motion.div
                      key={kayit.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className="p-3 flex items-center gap-3 hover:bg-zinc-700/30 transition"
                    >
                      <div className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center text-sm">
                        {kayit.odul_tipi === 'indirim' ? '🎯' : kayit.odul_tipi === 'puan' ? '⭐' : '🎁'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-white">{kayit.odul_aciklama}</p>
                        <p className="text-xs text-zinc-500 font-mono">{kayit.kupon_kodu}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          kayit.kullanildi
                            ? 'bg-green-900/50 text-green-400'
                            : new Date(kayit.gecerlilik_tarihi) < new Date()
                            ? 'bg-zinc-700 text-zinc-500'
                            : 'bg-yellow-900/50 text-yellow-400'
                        }`}>
                          {kayit.kullanildi ? 'Kullanıldı' : new Date(kayit.gecerlilik_tarihi) < new Date() ? 'Süresi Doldu' : 'Aktif'}
                        </span>
                        <p className="text-xs text-zinc-600 mt-0.5">
                          {new Date(kayit.created_at).toLocaleDateString('tr-TR')}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Hızlı Ayarlar Sekmesi */}
        {aktifSekme === 'ayarlar' && (
          <motion.div
            key="ayarlar"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-3"
          >
            <p className="text-zinc-400 text-sm mb-4">Bu sayfayla ilgili özellikleri buradan hızlıca açıp kapatabilirsiniz.</p>

            {[
              {
                id: 'sadakat_sistemi' as const,
                baslik: 'Sadakat Sistemi',
                aciklama: 'Puan biriktirme, seviye atlama ve ödül sistemi',
                ikon: '🏆',
                aktif: sadakatAktif,
              },
              {
                id: 'cark_cevirme' as const,
                baslik: 'Çark Çevirme',
                aciklama: 'Müşteriler QR menüde çark çevirip ödül kazanabilir',
                ikon: '🎡',
                aktif: carkAktif,
              },
              {
                id: 'qr_kupon' as const,
                baslik: 'QR Kupon',
                aciklama: 'QR menüde özel indirim kuponu göster',
                ikon: '🎁',
                aktif: qrKuponAktif,
              },
            ].map((ozellik, idx) => (
              <motion.div
                key={ozellik.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className={`p-4 border transition-all ${
                  ozellik.aktif ? 'bg-zinc-800 border-zinc-600' : 'bg-zinc-800/50 border-zinc-700/50'
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                      ozellik.aktif ? 'bg-zinc-700' : 'bg-zinc-800 opacity-50'
                    }`}>
                      {ozellik.ikon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className={`font-bold text-sm ${ozellik.aktif ? 'text-white' : 'text-zinc-500'}`}>
                          {ozellik.baslik}
                        </p>
                        {ozellik.aktif && (
                          <span className="text-xs px-2 py-0.5 bg-green-900/50 text-green-400 rounded-full font-bold">
                            Aktif
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">{ozellik.aciklama}</p>
                    </div>
                    <Switch
                      checked={ozellik.aktif}
                      onCheckedChange={() => toggleOzellik(ozellik.id)}
                      className={ozellik.aktif ? 'data-[state=checked]:bg-yellow-500' : ''}
                    />
                  </div>
                </Card>
              </motion.div>
            ))}

            <div className="mt-4 p-4 bg-blue-900/20 border border-blue-700/30 rounded-xl">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-blue-300 text-sm font-bold">Tüm özellikler için</p>
                  <p className="text-blue-400/70 text-xs mt-0.5">
                    Daha fazla özelliği yönetmek için Ayarlar &gt; Özellikler sekmesini kullanın.
                  </p>
                  <button
                    onClick={() => router.push('/ayarlar')}
                    className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    Özellik Yönetim Panelini Aç →
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
