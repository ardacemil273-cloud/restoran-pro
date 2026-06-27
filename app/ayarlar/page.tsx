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
import { Upload, Save, Copy } from 'lucide-react'
import Image from 'next/image'

export default function AyarlarPage() {
  const [restoran, setRestoran] = useState<any>(null)
  const [ad, setAd] = useState('')
  const [slug, setSlug] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [temaRenk, setTemaRenk] = useState('#f59e0b')
  const [uploading, setUploading] = useState(false)
  const [kaydediyor, setKaydediyor] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  // TEMA RENGİNİ ANINDA UYGULA
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
      console.log('Supabase Error:', error)
      return
    }

    if (data) {
      console.log('RESTORAN DATA:', data)
      setRestoran(data)
      setAd(data.ad || '')
      setSlug(data.slug || '')
      setAciklama(data.aciklama || '')
      setLogoUrl(data.logo_url || '')
      setTemaRenk(data.tema_renk?.replace(/'/g, '') || '#f59e0b')
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file ||!restoran) return

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
    if (!ad ||!slug) {
      toast.error('Restoran adı ve slug zorunlu')
      return
    }

    if (!restoran?.id) {
      toast.error('Restoran ID bulunamadı')
      console.log('restoran state:', restoran)
      return
    }

    setKaydediyor(true)

    const payload = {
      id: restoran.id,
      ad: ad.trim(),
      slug: slug.trim(),
      aciklama: aciklama.trim(),
      logo_url: logoUrl || null,
      tema_renk: temaRenk
    }

    console.log('GONDERILEN:', payload)

    const res = await fetch('/api/ayarlar/guncelle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    const data = await res.json()
    console.log('API CEVAP:', data)

    setKaydediyor(false)

    if (!res.ok) {
      toast.error('Kaydedilemedi: ' + (data.error || 'Bilinmeyen hata'))
      return
    }

    toast.success('Ayarlar kaydedildi')
    loadData()
  }

  const menuLink = `https://restoran-pro.vercel.app/menu/${slug}`

  function linkKopyala() {
    navigator.clipboard.writeText(menuLink)
    toast.success('Menü linki kopyalandı')
  }

  if (!restoran) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
          <p>Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <h1 style={{ color: temaRenk }} className="text-3xl font-bold mb-6">
          Restoran Ayarları
        </h1>

        <Card
          style={{ borderColor: temaRenk + '40' }}
          className="p-6 bg-zinc-800 border-zinc-700"
        >
          <div className="space-y-6">
            <div>
              <Label className="mb-2 block">Logo</Label>
              <div className="flex items-center gap-4">
                {logoUrl? (
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-zinc-700">
                    <Image src={logoUrl} alt="Logo" fill className="object-cover" />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-zinc-700 flex items-center justify-center text-zinc-500">
                    Yok
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="bg-zinc-700 border-zinc-600"
                  />
                  <p className="text-xs text-zinc-400 mt-1">PNG, JPG max 2MB</p>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="ad">Restoran Adı *</Label>
              <Input
                id="ad"
                value={ad}
                onChange={(e) => setAd(e.target.value)}
                placeholder="Örn: Usta Döner"
                className="bg-zinc-700 border-zinc-600"
              />
            </div>

            <div>
              <Label htmlFor="slug">Menü Linki (Slug) *</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="orn: usta-doner"
                className="bg-zinc-700 border-zinc-600"
              />
              <p className="text-xs text-zinc-400 mt-1">Sadece küçük harf, rakam ve tire kullanın</p>
            </div>

            <div>
              <Label htmlFor="aciklama">Açıklama</Label>
              <Textarea
                id="aciklama"
                value={aciklama}
                onChange={(e) => setAciklama(e.target.value)}
                placeholder="Restoran hakkında kısa bilgi"
                className="bg-zinc-700 border-zinc-600"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="renk">Tema Rengi</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="renk"
                  type="color"
                  value={temaRenk}
                  onChange={(e) => setTemaRenk(e.target.value)}
                  className="w-16 h-10 p-1 bg-zinc-700 border-zinc-600 cursor-pointer"
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
                  className="bg-zinc-700 border-zinc-600"
                />
              </div>
            </div>

            {slug && (
              <div
                style={{ borderColor: temaRenk + '40' }}
                className="p-4 bg-zinc-900 rounded-lg border"
              >
                <p className="text-sm text-zinc-400 mb-2">Müşteri Menü Linkin:</p>
                <div className="flex items-center gap-2">
                  <Input value={menuLink} readOnly className="bg-zinc-800 border-zinc-600 text-sm" />
                  <Button
                    onClick={linkKopyala}
                    size="icon"
                    variant="outline"
                    className="shrink-0"
                    style={{ borderColor: temaRenk }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={kaydet}
              disabled={kaydediyor || uploading ||!ad ||!slug}
              style={{ backgroundColor: temaRenk }}
              className="w-full text-white hover:opacity-80 font-bold"
            >
              <Save className="w-4 h-4 mr-2" />
              {kaydediyor? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
