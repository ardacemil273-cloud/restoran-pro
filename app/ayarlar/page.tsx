'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, Save, Copy, Settings, ExternalLink, Palette, Globe,
  Image as ImageIcon, Crown, ChevronRight, Phone, MapPin, Info,
  Zap, RotateCw, Gift, Brain, MessageSquare, CalendarCheck,
  TrendingUp, Users, DollarSign, Package, ToggleLeft, ToggleRight,
  CheckCircle2, XCircle, AlertCircle, Sparkles, Link2, Eye, EyeOff, Loader
} from 'lucide-react'
import Image from 'next/image'
import { type OzellikAdi, type OzellikAyarlari } from '@/hooks/useFeatureFlags'
import { useScrollPreservation } from '@/hooks/useScrollPreservation'

const OZELLIK_LISTESI: {
  id: OzellikAdi
  baslik: string
  aciklama: string
  ikon: React.ReactNode
  renk: string
  kategori: string
  modSecenekleri?: { deger: string; etiket: string; aciklama: string }[]
  uyari?: string
}[] = [
  {
    id: 'otomatik_tedarik',
    baslik: 'Otomatik Tedarik',
    aciklama: 'Stok kritik seviyeye düştüğünde otomatik sipariş oluşturur',
    ikon: <Package className="w-5 h-5" />,
    renk: 'amber',
    kategori: 'Operasyon',
    modSecenekleri: [
      { deger: 'taslak', etiket: 'Taslak Oluştur', aciklama: 'Sipariş taslağı oluşturur, sen onaylarsın' },
      { deger: 'direkt', etiket: 'Direkt Gönder', aciklama: 'Onay beklemeden tedarikçiye gönderir' },
    ]
  },
  {
    id: 'cark_cevirme',
    baslik: 'Çark Çevirme',
    aciklama: 'Müşteriler QR menüde çark çevirip indirim/ödül kazanabilir',
    ikon: <RotateCw className="w-5 h-5" />,
    renk: 'purple',
    kategori: 'Pazarlama'
  },
  {
    id: 'dogum_gunu_bildirimi',
    baslik: 'Doğum Günü Bildirimi',
    aciklama: 'Müşterilerin doğum günlerinde özel indirim mesajı gönder',
    ikon: <Gift className="w-5 h-5" />,
    renk: 'pink',
    kategori: 'Pazarlama'
  },
  {
    id: 'ai_analiz',
    baslik: 'AI Analiz',
    aciklama: 'Yapay zeka ile sipariş ve müşteri analizi yap',
    ikon: <Brain className="w-5 h-5" />,
    renk: 'cyan',
    kategori: 'Analiz'
  },
  {
    id: 'sesli_siparis',
    baslik: 'Sesli Sipariş',
    aciklama: 'Garsonlar sesli komut ile sipariş oluşturabilir',
    ikon: <MessageSquare className="w-5 h-5" />,
    renk: 'green',
    kategori: 'Operasyon'
  },
  {
    id: 'dinamik_fiyatlandirma',
    baslik: 'Dinamik Fiyatlandırma',
    aciklama: 'Talep ve stoka göre fiyatları otomatik ayarla',
    ikon: <TrendingUp className="w-5 h-5" />,
    renk: 'orange',
    kategori: 'Satış'
  },
  {
    id: 'musteri_sadakati',
    baslik: 'Müşteri Sadakati',
    aciklama: 'Puan sistemi ile müşteri bağlılığını artır',
    ikon: <Users className="w-5 h-5" />,
    renk: 'red',
    kategori: 'Pazarlama'
  },
  {
    id: 'gelir_tahmini',
    baslik: 'Gelir Tahmini',
    aciklama: 'AI ile aylık gelir tahminleri al',
    ikon: <DollarSign className="w-5 h-5" />,
    renk: 'green',
    kategori: 'Analiz'
  },
]

export default function AyarlarPage() {
  const router = useRouter()
  const { saveScrollPosition, restoreScrollPosition } = useScrollPreservation()
  const [loading, setLoading] = useState(true)
  const [restoran, setRestoran] = useState<any>(null)
  const [restoranAdi, setRestoranAdi] = useState('')
  const [restoranTelefonu, setRestoranTelefonu] = useState('')
  const [restoranAdresi, setRestoranAdresi] = useState('')
  const [restoranAciklama, setRestoranAciklama] = useState('')
  const [restoranLogosu, setRestoranLogosu] = useState('')
  const [kaydediyor, setKaydediyor] = useState(false)
  const [ozellikAyarlari, setOzellikAyarlari] = useState<OzellikAyarlari>({})
  const [ozellikKaydediyor, setOzellikKaydediyor] = useState(false)
  const [degisiklikVar, setDegisiklikVar] = useState(false)
  const [aktifSekme, setAktifSekme] = useState<'genel' | 'ozellikler' | 'entegrasyonlar' | 'patron-sifre'>('genel')
  const [kategoriler, setKategoriler] = useState<string[]>([])
  const [seciliKategori, setSeciliKategori] = useState<string>('Tümü')
  
  // Patron Şifre Değiştirme
  const [mevcutSifre, setMevcutSifre] = useState('')
  const [yeniSifre, setYeniSifre] = useState('')
  const [yeniSifreOnay, setYeniSifreOnay] = useState('')
  const [sifreGuncelleniyor, setSifreGuncelleniyor] = useState(false)
  const [sifreGosterme, setSifreGosterme] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let { data, error } = await supabase
        .from('restoranlar')
        .select('*')
        .eq('kullanici_id', user.id)
        .maybeSingle()

      if (!data && (error?.message?.includes('schema') || !error)) {
        const { data: retry } = await supabase
          .from('restoranlar')
          .select('*')
          .eq('sahibi_id', user.id)
          .maybeSingle()
        data = retry
      }

      if (data) {
        setRestoran(data)
        setRestoranAdi(data.adi || '')
        setRestoranTelefonu(data.telefonu || '')
        setRestoranAdresi(data.adresi || '')
        setRestoranAciklama(data.aciklama || '')
        setRestoranLogosu(data.logosu || '')
        
        if (data.ozellik_ayarlari) {
          setOzellikAyarlari(data.ozellik_ayarlari)
        }
      }

      const uniqueKategoriler = [...new Set(OZELLIK_LISTESI.map(o => o.kategori))]
      setKategoriler(uniqueKategoriler)
    } catch (err) {
      console.error('Veri yükleme hatası:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenel = async () => {
    setKaydediyor(true)
    try {
      const { error } = await supabase
        .from('restoranlar')
        .update({
          adi: restoranAdi,
          telefonu: restoranTelefonu,
          adresi: restoranAdresi,
          aciklama: restoranAciklama,
          logosu: restoranLogosu,
          updated_at: new Date().toISOString()
        })
        .eq('id', restoran.id)

      if (error) throw error
      toast.success('✅ Genel ayarlar kaydedildi')
    } catch (err: any) {
      toast.error('Hata: ' + (err.message || 'Bilinmeyen hata'))
    } finally {
      setKaydediyor(false)
    }
  }

  const handleOzellikKaydet = async () => {
    setOzellikKaydediyor(true)
    try {
      const { error } = await supabase
        .from('restoranlar')
        .update({
          ozellik_ayarlari: ozellikAyarlari,
          updated_at: new Date().toISOString()
        })
        .eq('id', restoran.id)

      if (error) throw error
      toast.success('✅ Özellik ayarları kaydedildi')
      setDegisiklikVar(false)
    } catch (err: any) {
      toast.error('Hata: ' + (err.message || 'Bilinmeyen hata'))
    } finally {
      setOzellikKaydediyor(false)
    }
  }

  const handlePatronSifreGuncelle = async () => {
    if (!mevcutSifre.trim()) {
      return toast.error('Mevcut şifreyi girin')
    }
    if (!yeniSifre.trim() || yeniSifre.length < 4) {
      return toast.error('Yeni şifre en az 4 karakter olmalıdır')
    }
    if (yeniSifre !== yeniSifreOnay) {
      return toast.error('Yeni şifreler eşleşmiyor')
    }

    setSifreGuncelleniyor(true)
    try {
      const { error } = await supabase
        .from('restoranlar')
        .update({
          patron_sifre: yeniSifre,
          updated_at: new Date().toISOString()
        })
        .eq('id', restoran.id)

      if (error) throw error
      toast.success('✅ Patron şifresi başarıyla değiştirildi')
      setMevcutSifre('')
      setYeniSifre('')
      setYeniSifreOnay('')
    } catch (err: any) {
      toast.error('Hata: ' + (err.message || 'Bilinmeyen hata'))
    } finally {
      setSifreGuncelleniyor(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!restoran) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-zinc-400">Restoran bulunamadı</p>
      </div>
    )
  }

  const filteredOzellikler = seciliKategori === 'Tümü'
    ? OZELLIK_LISTESI
    : OZELLIK_LISTESI.filter(o => o.kategori === seciliKategori)

  const aktifSayisi = Object.values(ozellikAyarlari).filter(Boolean).length

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-4xl mx-auto p-4 md:p-6">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-black">Ayarlar</h1>
        </div>

        {/* Sekme Navigasyonu */}
        <div className="flex gap-1 mb-6 bg-zinc-800 p-1 rounded-xl border border-zinc-700 overflow-x-auto">
          <button
            onClick={() => {
              saveScrollPosition()
              setAktifSekme('genel')
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              aktifSekme === 'genel'
                ? 'bg-zinc-700 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            Genel
          </button>
          <button
            onClick={() => {
              saveScrollPosition()
              setAktifSekme('ozellikler')
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all relative whitespace-nowrap ${
              aktifSekme === 'ozellikler'
                ? 'bg-yellow-500/20 text-yellow-400 shadow border border-yellow-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            Özellikler
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 text-black text-xs font-black rounded-full flex items-center justify-center">
              {aktifSayisi}
            </span>
          </button>
          <button
            onClick={() => {
              saveScrollPosition()
              setAktifSekme('entegrasyonlar')
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              aktifSekme === 'entegrasyonlar'
                ? 'bg-blue-500/20 text-blue-400 shadow border border-blue-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Link2 className="w-4 h-4" />
            Entegrasyonlar
          </button>
          <button
            onClick={() => {
              saveScrollPosition()
              setAktifSekme('patron-sifre')
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
              aktifSekme === 'patron-sifre'
                ? 'bg-red-500/20 text-red-400 shadow border border-red-500/30'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Crown className="w-4 h-4" />
            Patron Şifre
          </button>
        </div>

        {/* İçerik Container - Ghosting Fix */}
        <div className="relative min-h-[800px]">
          <AnimatePresence mode="wait">
            {/* GENEL SEKMESİ */}
            {aktifSekme === 'genel' && (
              <motion.div
                key="genel-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Card className="bg-zinc-800 border-zinc-700 p-6 space-y-6">
                  <div>
                    <Label className="text-sm font-bold mb-2 block">Restoran Adı</Label>
                    <Input
                      value={restoranAdi}
                      onChange={e => setRestoranAdi(e.target.value)}
                      className="bg-zinc-700 border-zinc-600"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-bold mb-2 block">Telefon</Label>
                    <Input
                      value={restoranTelefonu}
                      onChange={e => setRestoranTelefonu(e.target.value)}
                      className="bg-zinc-700 border-zinc-600"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-bold mb-2 block">Adres</Label>
                    <Textarea
                      value={restoranAdresi}
                      onChange={e => setRestoranAdresi(e.target.value)}
                      className="bg-zinc-700 border-zinc-600"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-bold mb-2 block">Açıklama</Label>
                    <Textarea
                      value={restoranAciklama}
                      onChange={e => setRestoranAciklama(e.target.value)}
                      className="bg-zinc-700 border-zinc-600"
                    />
                  </div>
                  <Button
                    onClick={handleGenel}
                    disabled={kaydediyor}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {kaydediyor ? 'Kaydediliyor...' : 'Genel Ayarları Kaydet'}
                  </Button>
                </Card>
              </motion.div>
            )}

            {/* ÖZELLİKLER SEKMESİ */}
            {aktifSekme === 'ozellikler' && (
              <motion.div
                key="ozellikler-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <div className="space-y-6">
                  {/* Kategori Filtreleme */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    <button
                      onClick={() => setSeciliKategori('Tümü')}
                      className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${
                        seciliKategori === 'Tümü'
                          ? 'bg-primary text-black'
                          : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                      }`}
                    >
                      Tümü
                    </button>
                    {kategoriler.map(kat => (
                      <button
                        key={kat}
                        onClick={() => setSeciliKategori(kat)}
                        className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${
                          seciliKategori === kat
                            ? 'bg-primary text-black'
                            : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                        }`}
                      >
                        {kat}
                      </button>
                    ))}
                  </div>

                  {/* Özellikler Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredOzellikler.map(ozellik => (
                      <Card
                        key={ozellik.id}
                        className="bg-zinc-800 border-zinc-700 p-4 cursor-pointer hover:border-zinc-600 transition-all relative z-10"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`w-10 h-10 rounded-lg bg-${ozellik.renk}-500/20 flex items-center justify-center text-${ozellik.renk}-400 flex-shrink-0`}>
                              {ozellik.ikon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-sm text-white">{ozellik.baslik}</h3>
                              <p className="text-xs text-zinc-400 mt-1">{ozellik.aciklama}</p>
                              {ozellik.uyari && (
                                <div className="flex items-start gap-1 mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-300">
                                  <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                                  {ozellik.uyari}
                                </div>
                              )}
                            </div>
                          </div>
                          <Switch
                            checked={!!ozellikAyarlari[ozellik.id]}
                            onCheckedChange={(checked) => {
                              setOzellikAyarlari(prev => ({
                                ...prev,
                                [ozellik.id]: checked ? true : undefined
                              }))
                              setDegisiklikVar(true)
                            }}
                          />
                        </div>
                      </Card>
                    ))}
                  </div>

                  <Button
                    onClick={handleOzellikKaydet}
                    disabled={ozellikKaydediyor || !degisiklikVar}
                    className="w-full bg-yellow-600 hover:bg-yellow-500"
                  >
                    <Save className="w-5 h-5 mr-2" />
                    {ozellikKaydediyor ? 'Kaydediliyor...' : degisiklikVar ? 'Özellik Ayarlarını Kaydet' : 'Tüm Ayarlar Güncel'}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ENTEGRASYONlar SEKMESİ */}
            {aktifSekme === 'entegrasyonlar' && (
              <motion.div
                key="entegrasyonlar-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 mb-4 relative z-10">
                  <h2 className="font-black text-lg flex items-center gap-2 mb-2">
                    <Link2 className="w-5 h-5 text-blue-400" />
                    Platform Entegrasyonları
                  </h2>
                  <p className="text-zinc-400 text-sm mb-6">Yemeksepeti, GetirYemek ve Trendyol Yemek hesaplarını bağlayarak siparişleri otomatik alın.</p>
                  <div className="space-y-3">
                    {[
                      { emoji: '🍽️', name: 'Yemeksepeti', color: 'pink', href: '/entegrasyon-merkezi' },
                      { emoji: '🚗', name: 'GetirYemek', color: 'purple', href: '/entegrasyon-merkezi' },
                      { emoji: '🧡', name: 'Trendyol Yemek', color: 'orange', href: '/entegrasyon-merkezi' },
                    ].map(platform => (
                      <button
                        key={platform.name}
                        onClick={() => router.push(platform.href)}
                        className="w-full flex items-center justify-between p-4 bg-zinc-700/50 hover:bg-zinc-700 border border-zinc-600 hover:border-zinc-500 rounded-xl transition-all group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{platform.emoji}</span>
                          <div className="text-left">
                            <p className="font-bold text-sm text-white">{platform.name}</p>
                            <p className="text-xs text-zinc-400">API anahtarlarını bağla</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 transition-all" />
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => router.push('/entegrasyon-merkezi')}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2 relative z-10"
                >
                  <Globe className="w-5 h-5" />
                  Entegrasyon Merkezine Git
                </button>
              </motion.div>
            )}

            {/* PATRON ŞİFRE SEKMESİ */}
            {aktifSekme === 'patron-sifre' && (
              <motion.div
                key="patron-sifre-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <Card className="bg-zinc-800 border-zinc-700 p-6 relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                      <Crown className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h2 className="font-black text-lg">Patron Şifre Değiştir</h2>
                      <p className="text-sm text-zinc-400">Restoran giriş şifrenizi güvenle değiştirin</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-bold mb-2 block">Mevcut Şifre</Label>
                      <Input
                        type="password"
                        value={mevcutSifre}
                        onChange={e => setMevcutSifre(e.target.value)}
                        placeholder="Mevcut şifrenizi girin"
                        className="bg-zinc-700 border-zinc-600"
                      />
                    </div>

                    <div>
                      <Label className="text-sm font-bold mb-2 block">Yeni Şifre</Label>
                      <div className="relative">
                        <Input
                          type={sifreGosterme ? 'text' : 'password'}
                          value={yeniSifre}
                          onChange={e => setYeniSifre(e.target.value)}
                          placeholder="Yeni şifre girin"
                          className="bg-zinc-700 border-zinc-600 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setSifreGosterme(!sifreGosterme)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                        >
                          {sifreGosterme ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-bold mb-2 block">Yeni Şifre (Onay)</Label>
                      <Input
                        type="password"
                        value={yeniSifreOnay}
                        onChange={e => setYeniSifreOnay(e.target.value)}
                        placeholder="Yeni şifreyi tekrar girin"
                        className="bg-zinc-700 border-zinc-600"
                      />
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                      <p className="text-xs text-yellow-300 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        Şifreyi güvenli bir yerde saklayın. Şifreyi unutursanız sistem yöneticisine başvurunuz.
                      </p>
                    </div>

                    <Button
                      onClick={handlePatronSifreGuncelle}
                      disabled={sifreGuncelleniyor}
                      className="w-full bg-red-600 hover:bg-red-500"
                    >
                      {sifreGuncelleniyor ? (
                        <>
                          <Loader className="w-5 h-5 mr-2 animate-spin" />
                          Güncelleniyor...
                        </>
                      ) : (
                        <>
                          <Crown className="w-5 h-5 mr-2" />
                          Patron Şifresini Güncelle
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
