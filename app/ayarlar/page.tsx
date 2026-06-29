'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Upload, Save, Copy, Settings, ExternalLink, Palette, Globe,
  Image as ImageIcon, Crown, ChevronRight, Phone, MapPin, Info
} from 'lucide-react'
import Image from 'next/image'

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
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

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

    if (error) {
      toast.error('Restoran bulunamadı')
      return
    }

    if (data) {
      setRestoran(data)
      setAd(data.ad || '')
      setSlug(data.slug || '')
      setAciklama(data.aciklama || '')
      setLogoUrl(data.logo_url || '')
      setTemaRenk(data.tema_renk?.replace(/'/g, '') || '#f59e0b')
      setTelefon(data.telefon || '')
      setAdres(data.adres || '')
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !restoran) return

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo 2MB\'dan küçük olmalı')
      return
    }

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `${restoran.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('logo')
      .upload(fileName, file, { upsert: true })

    if (uploadError) {
      toast.error('Logo yüklenemedi: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('logo')
      .getPublicUrl(fileName)

    setLogoUrl(publicUrl)
    setUploading(false)
    toast.success('Logo yüklendi')
  }

  async function kaydet() {
    if (!ad || !slug) {
      toast.error('Restoran adı ve slug zorunlu')
      return
    }

    if (!restoran?.id) {
      toast.error('Restoran ID bulunamadı')
      return
    }

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

    if (!res.ok) {
      toast.error('Kaydedilemedi: ' + (data.error || 'Bilinmeyen hata'))
      return
    }

    toast.success('Ayarlar kaydedildi!')
    loadData()
  }

  const menuLink = slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${slug}` : ''

  function linkKopyala() {
    if (!menuLink) return
    navigator.clipboard.writeText(menuLink)
    toast.success('Menü linki kopyalandı!')
  }

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
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-3xl mx-auto">
        {/* Başlık */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-zinc-700 rounded-xl flex items-center justify-center">
            <Settings className="w-5 h-5 text-yellow-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black">Restoran Ayarları</h1>
            <p className="text-zinc-400 text-sm">{restoran.ad}</p>
          </div>
        </div>

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
            {/* Logo */}
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
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-zinc-500 mt-1.5">PNG, JPG max 2MB</p>
                </div>
              </div>
            </div>

            {/* Restoran Adı */}
            <div>
              <Label htmlFor="ad" className="text-zinc-300 text-sm mb-1.5 block">
                Restoran Adı <span className="text-red-400">*</span>
              </Label>
              <Input
                id="ad"
                value={ad}
                onChange={(e) => setAd(e.target.value)}
                placeholder="Örn: Usta Döner"
                className="bg-zinc-700 border-zinc-600 focus:border-yellow-500"
              />
            </div>

            {/* Slug */}
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

            {/* Açıklama */}
            <div>
              <Label htmlFor="aciklama" className="text-zinc-300 text-sm mb-1.5 block">Açıklama</Label>
              <Textarea
                id="aciklama"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                placeholder="Restoran hakkında kısa bilgi"
                className="bg-zinc-700 border-zinc-600 focus:border-yellow-500"
                rows={3}
              />
            </div>
          </div>
        </Card>

        {/* İletişim Bilgileri */}
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
            {/* Telefon */}
            <div>
              <Label htmlFor="telefon" className="text-zinc-300 text-sm mb-1.5 block">
                Restoran Telefonu
              </Label>
              <Input
                id="telefon"
                type="tel"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                placeholder="05XX XXX XX XX"
                className="bg-zinc-700 border-zinc-600 focus:border-yellow-500"
              />
              <p className="text-xs text-zinc-500 mt-1">
                VoIP/telefon sisteminizin bu numaraya gelen aramaları otomatik kaydeder
              </p>
            </div>

            {/* Adres */}
            <div>
              <Label htmlFor="adres" className="text-zinc-300 text-sm mb-1.5 block">
                <MapPin className="w-3 h-3 inline mr-1" />
                Restoran Adresi
              </Label>
              <Textarea
                id="adres"
                value={adres}
                onChange={(e) => setAdres(e.target.value)}
                placeholder="Mahalle, Cadde, No, İlçe, İl"
                className="bg-zinc-700 border-zinc-600 focus:border-yellow-500"
                rows={2}
              />
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
              <input
                id="renk"
                type="color"
                value={temaRenk}
                onChange={(e) => setTemaRenk(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"
              />
              <Input
                value={temaRenk}
                onChange={(e) => {
                  const val = e.target.value
                  if (/^#[0-9A-F]{6}$/i.test(val) || val === '') {
                    setTemaRenk(val)
                  }
                }}
                placeholder="#f59e0b"
                className="bg-zinc-700 border-zinc-600 focus:border-yellow-500 max-w-[140px]"
              />
              <div
                className="flex-1 h-10 rounded-lg border border-zinc-600"
                style={{ backgroundColor: temaRenk }}
              />
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
              <Input
                value={menuLink}
                readOnly
                className="bg-zinc-700 border-zinc-600 text-sm text-zinc-300"
              />
              <Button
                onClick={linkKopyala}
                size="icon"
                className="shrink-0 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600"
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => window.open(menuLink, '_blank')}
                size="icon"
                className="shrink-0 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-zinc-500 mt-2">Müşterilerinize bu linki veya QR kodu paylaşın</p>
          </Card>
        )}

        {/* Kaydet Butonu */}
        <Button
          onClick={kaydet}
          disabled={kaydediyor || uploading || !ad || !slug}
          className="w-full font-bold py-3 text-base"
          style={{ backgroundColor: temaRenk, color: '#000' }}
        >
          <Save className="w-5 h-5 mr-2" />
          {kaydediyor ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
        </Button>
      </div>
    </div>
  )
}
