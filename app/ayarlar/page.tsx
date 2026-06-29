'use client'
import { useEffect, useState } from 'react'
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
  CheckCircle2, XCircle, AlertCircle, Sparkles
} from 'lucide-react'
import Image from 'next/image'
import { type OzellikAdi, type OzellikAyarlari } from '@/hooks/useFeatureFlags'

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
    kategori: 'Müşteri Deneyimi',
  },
  {
    id: 'sadakat_sistemi',
    baslik: 'Sadakat Sistemi',
    aciklama: 'Puan biriktirme, seviye atlama ve ödül sistemi',
    ikon: <Gift className="w-5 h-5" />,
    renk: 'yellow',
    kategori: 'Müşteri Deneyimi',
  },
  {
    id: 'qr_kupon',
    baslik: 'QR Kupon',
    aciklama: 'Müşteriler QR menüde özel kupon kodu görebilir',
    ikon: <Sparkles className="w-5 h-5" />,
    renk: 'pink',
    kategori: 'Müşteri Deneyimi',
  },
  {
    id: 'ai_analiz',
    baslik: 'AI Satış Analizi',
    aciklama: 'Yapay zeka destekli satış tahminleri ve öneriler',
    ikon: <Brain className="w-5 h-5" />,
    renk: 'blue',
    kategori: 'Analitik',
  },
  {
    id: 'stok_tahmin',
    baslik: 'AI Stok Tahmini',
    aciklama: 'Geçmiş verilere göre stok tüketim tahmini',
    ikon: <TrendingUp className="w-5 h-5" />,
    renk: 'cyan',
    kategori: 'Analitik',
  },
  {
    id: 'garson_performans',
    baslik: 'Garson Performansı',
    aciklama: 'Garsonların sipariş hızı ve müşteri memnuniyeti takibi',
    ikon: <Users className="w-5 h-5" />,
    renk: 'green',
    kategori: 'Operasyon',
  },
  {
    id: 'rezervasyon',
    baslik: 'Online Rezervasyon',
    aciklama: 'Müşteriler online masa rezervasyonu yapabilir',
    ikon: <CalendarCheck className="w-5 h-5" />,
    renk: 'teal',
    kategori: 'Müşteri Deneyimi',
  },
  {
    id: 'whatsapp_siparis',
    baslik: 'WhatsApp Sipariş',
    aciklama: 'WhatsApp üzerinden sipariş alma ve bildirim gönderme',
    ikon: <MessageSquare className="w-5 h-5" />,
    renk: 'green',
    kategori: 'Entegrasyon',
    uyari: 'WhatsApp Business API hesabı gerektirir',
  },
  {
    id: 'dinamik_fiyat',
    baslik: 'Dinamik Fiyatlandırma',
    aciklama: 'Yoğun saatlerde fiyatları otomatik artır/azalt',
    ikon: <DollarSign className="w-5 h-5" />,
    renk: 'orange',
    kategori: 'Gelir Optimizasyonu',
    uyari: 'Müşteri deneyimini etkileyebilir, dikkatli kullanın',
  },
]

const RENK_MAP: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  amber: { bg: 'bg-amber-900/20', border: 'border-amber-700/50', text: 'text-amber-400', badge: 'bg-amber-900/50 text-amber-300' },
  purple: { bg: 'bg-purple-900/20', border: 'border-purple-700/50', text: 'text-purple-400', badge: 'bg-purple-900/50 text-purple-300' },
  yellow: { bg: 'bg-yellow-900/20', border: 'border-yellow-700/50', text: 'text-yellow-400', badge: 'bg-yellow-900/50 text-yellow-300' },
  pink: { bg: 'bg-pink-900/20', border: 'border-pink-700/50', text: 'text-pink-400', badge: 'bg-pink-900/50 text-pink-300' },
  blue: { bg: 'bg-blue-900/20', border: 'border-blue-700/50', text: 'text-blue-400', badge: 'bg-blue-900/50 text-blue-300' },
  cyan: { bg: 'bg-cyan-900/20', border: 'border-cyan-700/50', text: 'text-cyan-400', badge: 'bg-cyan-900/50 text-cyan-300' },
  green: { bg: 'bg-green-900/20', border: 'border-green-700/50', text: 'text-green-400', badge: 'bg-green-900/50 text-green-300' },
  teal: { bg: 'bg-teal-900/20', border: 'border-teal-700/50', text: 'text-teal-400', badge: 'bg-teal-900/50 text-teal-300' },
  orange: { bg: 'bg-orange-900/20', border: 'border-orange-700/50', text: 'text-orange-400', badge: 'bg-orange-900/50 text-orange-300' },
}

const KATEGORILER = ['Müşteri Deneyimi', 'Operasyon', 'Analitik', 'Entegrasyon', 'Gelir Optimizasyonu']

export default function AyarlarPage() {
  const [restoran, setRestoran] = useState<any>(null)
  const [ad, setAd] = useState('')
  const [slug, setSlug] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [temaRenk, setTemaRenk] = useState('#f59e0b')
  const [telefon, setTelefon] = useState('')
  const [adres, setAdres] = useState('')
  const [uploading, setUploading] = useState(false)
  const [kaydediyor, setKaydediyor] = useState(false)
  const [aktifSekme, setAktifSekme] = useState<'genel' | 'ozellikler'>('genel')
  const [ozellikAyarlari, setOzellikAyarlari] = useState<OzellikAyarlari>({} as OzellikAyarlari)
  const [ozellikKaydediyor, setOzellikKaydediyor] = useState(false)
  const [degisiklikVar, setDegisiklikVar] = useState(false)
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    document.documentElement.style.setProperty('--tema', temaRenk)
  }, [temaRenk])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data, error } = await supabase
      .from('restoranlar')
      .select('*')
      .eq('sahibi_id', user.id)
      .single()

    if (error) { toast.error('Restoran bulunamadı'); return }

    if (data) {
      setRestoran(data)
      setAd(data.ad || '')
      setSlug(data.slug || '')
      setAciklama(data.aciklama || '')
      setLogoUrl(data.logo_url || '')
      setTemaRenk(data.tema_renk?.replace(/'/g, '') || '#f59e0b')
      setTelefon(data.telefon || '')
      setAdres(data.adres || '')

      // Özellik ayarlarını yükle
      const varsayilan: OzellikAyarlari = {
        otomatik_tedarik: { aktif: true, mod: 'taslak', aciklama: '' },
        cark_cevirme: { aktif: false, aciklama: '' },
        sadakat_sistemi: { aktif: true, aciklama: '' },
        qr_kupon: { aktif: false, aciklama: '' },
        ai_analiz: { aktif: true, aciklama: '' },
        whatsapp_siparis: { aktif: false, aciklama: '' },
        rezervasyon: { aktif: true, aciklama: '' },
        stok_tahmin: { aktif: true, aciklama: '' },
        garson_performans: { aktif: true, aciklama: '' },
        dinamik_fiyat: { aktif: false, aciklama: '' },
      }
      setOzellikAyarlari({ ...varsayilan, ...(data.ozellik_ayarlari || {}) })
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !restoran) return

    if (file.size > 2 * 1024 * 1024) { toast.error('Logo 2MB\'dan küçük olmalı'); return }

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${restoran.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('logo').upload(fileName, file, { upsert: true })

    if (uploadError) { toast.error('Logo yüklenemedi: ' + uploadError.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('logo').getPublicUrl(fileName)
    setLogoUrl(publicUrl)
    setUploading(false)
    toast.success('Logo yüklendi')
  }

  async function kaydet() {
    if (!ad || !slug) { toast.error('Restoran adı ve slug zorunlu'); return }
    if (!restoran?.id) { toast.error('Restoran ID bulunamadı'); return }

    setKaydediyor(true)
    const payload = {
      id: restoran.id,
      ad: ad.trim(),
      slug: slug.trim(),
      aciklama: aciklama.trim(),
      logo_url: logoUrl || null,
      tema_renk: temaRenk,
      telefon: telefon.replace(/[\s\-\(\)]/g, '') || null,
      adres: adres.trim() || null
    }

    const res = await fetch('/api/ayarlar/guncelle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    setKaydediyor(false)

    if (!res.ok) { toast.error('Kaydedilemedi: ' + (data.error || 'Bilinmeyen hata')); return }
    toast.success('Ayarlar kaydedildi!')
    loadData()
  }

  async function ozellikKaydet() {
    if (!restoran?.id) return
    setOzellikKaydediyor(true)

    const res = await fetch('/api/ozellik-ayarlari', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ restoran_id: restoran.id, ozellik_ayarlari: ozellikAyarlari })
    })

    setOzellikKaydediyor(false)
    setDegisiklikVar(false)

    if (res.ok) {
      toast.success('Özellik ayarları kaydedildi!')
    } else {
      toast.error('Kaydedilemedi')
    }
  }

  function toggleOzellik(ozellikId: OzellikAdi) {
    setOzellikAyarlari(prev => ({
      ...prev,
      [ozellikId]: { ...prev[ozellikId], aktif: !prev[ozellikId]?.aktif }
    }))
    setDegisiklikVar(true)
  }

  function setOzellikMod(ozellikId: OzellikAdi, mod: string) {
    setOzellikAyarlari(prev => ({
      ...prev,
      [ozellikId]: { ...prev[ozellikId], mod }
    }))
    setDegisiklikVar(true)
  }

  const menuLink = slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${slug}` : ''

  function linkKopyala() {
    if (!menuLink) return
    navigator.clipboard.writeText(menuLink)
    toast.success('Menü linki kopyalandı!')
  }

  const aktifSayisi = Object.values(ozellikAyarlari).filter(a => a?.aktif).length

  if (!restoran) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500 mx-auto mb-4" />
          <p className="text-zinc-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        {/* Başlık */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-zinc-700 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Restoran Ayarları</h1>
            <p className="text-zinc-400 text-sm">{restoran.ad}</p>
          </div>
        </div>

        {/* Sekme Navigasyonu */}
        <div className="flex gap-1 mb-6 bg-zinc-800 p-1 rounded-xl border border-zinc-700">
          <button
            onClick={() => setAktifSekme('genel')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
              aktifSekme === 'genel'
                ? 'bg-zinc-700 text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            Genel Ayarlar
          </button>
          <button
            onClick={() => setAktifSekme('ozellikler')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-bold transition-all relative ${
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
        </div>

        <AnimatePresence mode="wait">
          {aktifSekme === 'genel' ? (
            <motion.div
              key="genel"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Paket Durumu */}
              <Card
                className="p-4 bg-zinc-800 border-zinc-700 mb-6 cursor-pointer hover:border-yellow-500/50 transition"
                onClick={() => router.push('/ayarlar/paket')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className="w-5 h-5 text-yellow-500" />
                    <div>
                      <p className="font-bold text-sm">Paket Yönetimi</p>
                      <p className="text-xs text-zinc-400">
                        Mevcut: <span className="text-yellow-500 font-bold capitalize">{restoran.paket_turu || 'Basit'}</span>
                        {' '}• Beta döneminde tüm özellikler açık
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500" />
                </div>
              </Card>

              {/* Ana Ayarlar */}
              <Card className="p-6 bg-zinc-800 border-zinc-700 mb-6">
                <h2 className="font-bold mb-4 flex items-center gap-2 text-zinc-200">
                  <ImageIcon className="w-4 h-4 text-zinc-400" />
                  Restoran Bilgileri
                </h2>
                <div className="space-y-5">
                  <div>
                    <Label className="mb-2 block text-zinc-300 text-sm">Logo</Label>
                    <div className="flex items-center gap-4">
                      {logoUrl ? (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-zinc-700 border border-zinc-600">
                          <Image src={logoUrl} alt="Logo" fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-zinc-700 border border-zinc-600 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-zinc-500" />
                        </div>
                      )}
                      <div className="flex-1">
                        <label className="cursor-pointer">
                          <div className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 rounded-lg text-sm transition w-fit">
                            <Upload className="w-4 h-4" />
                            {uploading ? 'Yükleniyor...' : 'Logo Yükle'}
                          </div>
                          <input type="file" accept="image/*" onChange={handleLogoUpload} disabled={uploading} className="hidden" />
                        </label>
                        <p className="text-xs text-zinc-500 mt-1.5">PNG, JPG max 2MB</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="ad" className="text-zinc-300 text-sm mb-1.5 block">
                      Restoran Adı <span className="text-red-400">*</span>
                    </Label>
                    <Input id="ad" value={ad} onChange={(e) => setAd(e.target.value)} placeholder="Örn: Usta Döner" className="bg-zinc-700 border-zinc-600 focus:border-yellow-500" />
                  </div>

                  <div>
                    <Label htmlFor="slug" className="text-zinc-300 text-sm mb-1.5 block">
                      Menü Linki (Slug) <span className="text-red-400">*</span>
                    </Label>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                      placeholder="orn: usta-doner"
                      className="bg-zinc-700 border-zinc-600 focus:border-yellow-500"
                    />
                    <p className="text-xs text-zinc-500 mt-1">Sadece küçük harf, rakam ve tire</p>
                  </div>

                  <div>
                    <Label htmlFor="aciklama" className="text-zinc-300 text-sm mb-1.5 block">Açıklama</Label>
                    <Textarea id="aciklama" value={aciklama} onChange={(e) => setAciklama(e.target.value)} placeholder="Restoran hakkında kısa bilgi" className="bg-zinc-700 border-zinc-600 focus:border-yellow-500" rows={3} />
                  </div>
                </div>
              </Card>

              {/* İletişim */}
              <Card className="p-6 bg-zinc-800 border-zinc-700 mb-6">
                <h2 className="font-bold mb-1 flex items-center gap-2 text-zinc-200">
                  <Phone className="w-4 h-4 text-zinc-400" />
                  İletişim Bilgileri
                </h2>
                <p className="text-xs text-zinc-500 mb-4 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Telefon numarası, otomatik arama tanıma (webhook) için kullanılır
                </p>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="telefon" className="text-zinc-300 text-sm mb-1.5 block">Restoran Telefonu</Label>
                    <Input id="telefon" type="tel" value={telefon} onChange={(e) => setTelefon(e.target.value)} placeholder="05XX XXX XX XX" className="bg-zinc-700 border-zinc-600 focus:border-yellow-500" />
                  </div>
                  <div>
                    <Label htmlFor="adres" className="text-zinc-300 text-sm mb-1.5 block">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      Restoran Adresi
                    </Label>
                    <Textarea id="adres" value={adres} onChange={(e) => setAdres(e.target.value)} placeholder="Mahalle, Cadde, No, İlçe, İl" className="bg-zinc-700 border-zinc-600 focus:border-yellow-500" rows={2} />
                  </div>
                </div>
              </Card>

              {/* Tema */}
              <Card className="p-6 bg-zinc-800 border-zinc-700 mb-6">
                <h2 className="font-bold mb-4 flex items-center gap-2 text-zinc-200">
                  <Palette className="w-4 h-4 text-zinc-400" />
                  Tema & Görünüm
                </h2>
                <div>
                  <Label htmlFor="renk" className="text-zinc-300 text-sm mb-1.5 block">Tema Rengi</Label>
                  <div className="flex items-center gap-3">
                    <input id="renk" type="color" value={temaRenk} onChange={(e) => setTemaRenk(e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent" />
                    <Input
                      value={temaRenk}
                      onChange={(e) => {
                        const val = e.target.value
                        if (/^#[0-9A-F]{6}$/i.test(val) || val === '') setTemaRenk(val)
                      }}
                      placeholder="#f59e0b"
                      className="bg-zinc-700 border-zinc-600 focus:border-yellow-500 max-w-[140px]"
                    />
                    <div className="flex-1 h-10 rounded-lg border border-zinc-600" style={{ backgroundColor: temaRenk }} />
                  </div>
                  <p className="text-xs text-zinc-500 mt-1.5">Bu renk QR menünüzde ve müşteri arayüzünde kullanılır</p>
                </div>
              </Card>

              {/* Menü Linki */}
              {slug && (
                <Card className="p-6 bg-zinc-800 border-zinc-700 mb-6">
                  <h2 className="font-bold mb-4 flex items-center gap-2 text-zinc-200">
                    <Globe className="w-4 h-4 text-zinc-400" />
                    Müşteri Menü Linki
                  </h2>
                  <div className="flex items-center gap-2">
                    <Input value={menuLink} readOnly className="bg-zinc-700 border-zinc-600 text-sm text-zinc-300" />
                    <Button onClick={linkKopyala} size="icon" className="shrink-0 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600">
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button onClick={() => window.open(menuLink, '_blank')} size="icon" className="shrink-0 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-2">Müşterilerinize bu linki veya QR kodu paylaşın</p>
                </Card>
              )}

              <Button
                onClick={kaydet}
                disabled={kaydediyor || uploading || !ad || !slug}
                className="w-full font-bold py-3 text-base"
                style={{ backgroundColor: temaRenk, color: '#000' }}
              >
                <Save className="w-5 h-5 mr-2" />
                {kaydediyor ? 'Kaydediliyor...' : 'Genel Ayarları Kaydet'}
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="ozellikler"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {/* Özellikler Başlık */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-black text-lg flex items-center gap-2">
                    <Zap className="w-5 h-5 text-yellow-500" />
                    Özellik Yönetim Paneli
                  </h2>
                  <p className="text-zinc-400 text-sm mt-0.5">
                    {aktifSayisi} özellik aktif · Değişiklikleri kaydetmeyi unutma
                  </p>
                </div>
                {degisiklikVar && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/40 rounded-lg"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-yellow-400 text-xs font-bold">Kaydedilmemiş değişiklik</span>
                  </motion.div>
                )}
              </div>

              {/* Kategorilere göre özellikler */}
              {KATEGORILER.map(kategori => {
                const kategoridekiler = OZELLIK_LISTESI.filter(o => o.kategori === kategori)
                return (
                  <div key={kategori} className="mb-6">
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <div className="h-px flex-1 bg-zinc-700" />
                      {kategori}
                      <div className="h-px flex-1 bg-zinc-700" />
                    </h3>
                    <div className="space-y-3">
                      {kategoridekiler.map((ozellik, idx) => {
                        const renkler = RENK_MAP[ozellik.renk] || RENK_MAP.amber
                        const ayar = ozellikAyarlari[ozellik.id]
                        const aktif = ayar?.aktif ?? false

                        return (
                          <motion.div
                            key={ozellik.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                          >
                            <Card className={`p-4 border transition-all duration-300 ${
                              aktif
                                ? `${renkler.bg} ${renkler.border}`
                                : 'bg-zinc-800/50 border-zinc-700/50'
                            }`}>
                              <div className="flex items-start gap-4">
                                {/* İkon */}
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                                  aktif ? `${renkler.bg} ${renkler.text}` : 'bg-zinc-700/50 text-zinc-500'
                                }`}>
                                  {ozellik.ikon}
                                </div>

                                {/* İçerik */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-0.5">
                                    <span className={`font-bold text-sm ${aktif ? 'text-white' : 'text-zinc-400'}`}>
                                      {ozellik.baslik}
                                    </span>
                                    {aktif ? (
                                      <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${renkler.badge}`}>
                                        Aktif
                                      </span>
                                    ) : (
                                      <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-zinc-700 text-zinc-500">
                                        Pasif
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-zinc-500 leading-relaxed">{ozellik.aciklama}</p>

                                  {/* Uyarı */}
                                  {ozellik.uyari && (
                                    <div className="flex items-center gap-1.5 mt-2 text-xs text-orange-400">
                                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                      {ozellik.uyari}
                                    </div>
                                  )}

                                  {/* Mod Seçimi (sadece aktifse ve mod seçenekleri varsa) */}
                                  {aktif && ozellik.modSecenekleri && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="mt-3 space-y-2"
                                    >
                                      <p className="text-xs font-bold text-zinc-400">Çalışma Modu:</p>
                                      <div className="flex flex-col sm:flex-row gap-2">
                                        {ozellik.modSecenekleri.map(mod => (
                                          <button
                                            key={mod.deger}
                                            onClick={() => setOzellikMod(ozellik.id, mod.deger)}
                                            className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                                              ayar?.mod === mod.deger
                                                ? `${renkler.bg} ${renkler.border} ${renkler.text}`
                                                : 'bg-zinc-800 border-zinc-600 text-zinc-400 hover:border-zinc-500'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2 mb-1">
                                              {ayar?.mod === mod.deger ? (
                                                <CheckCircle2 className="w-3.5 h-3.5" />
                                              ) : (
                                                <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
                                              )}
                                              <span className="text-xs font-bold">{mod.etiket}</span>
                                            </div>
                                            <p className="text-xs opacity-70 pl-5">{mod.aciklama}</p>
                                          </button>
                                        ))}
                                      </div>
                                    </motion.div>
                                  )}
                                </div>

                                {/* Toggle */}
                                <div className="flex-shrink-0">
                                  <Switch
                                    checked={aktif}
                                    onCheckedChange={() => toggleOzellik(ozellik.id)}
                                    className={aktif ? 'data-[state=checked]:bg-yellow-500' : ''}
                                  />
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}

              {/* Kaydet Butonu */}
              <div className="sticky bottom-4">
                <Button
                  onClick={ozellikKaydet}
                  disabled={ozellikKaydediyor}
                  className={`w-full font-bold py-3 text-base transition-all ${
                    degisiklikVar
                      ? 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg shadow-yellow-500/25'
                      : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                  }`}
                >
                  <Save className="w-5 h-5 mr-2" />
                  {ozellikKaydediyor ? 'Kaydediliyor...' : degisiklikVar ? 'Özellik Ayarlarını Kaydet' : 'Tüm Ayarlar Güncel'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
