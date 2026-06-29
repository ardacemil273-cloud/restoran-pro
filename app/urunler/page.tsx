'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import {
  X, Loader2, Package, Plus, Search, Edit2, Trash2,
  Image as ImageIcon, Tag, LayoutDashboard, ChefHat
} from 'lucide-react'
import Image from 'next/image'

export default function UrunlerPage() {
  const [urunler, setUrunler] = useState<any[]>([])
  const [kategoriler, setKategoriler] = useState<any[]>([])
  const [restoranId, setRestoranId] = useState('')
  const [yeniUrun, setYeniUrun] = useState({ ad: '', fiyat: '', kategori_id: '', aciklama: '' })
  const [yukleniyor, setYukleniyor] = useState(false)
  const [resimDosya, setResimDosya] = useState<File | null>(null)
  const [resimOnizleme, setResimOnizleme] = useState('')
  const [aramaMetni, setAramaMetni] = useState('')
  const [seciliKategori, setSeciliKategori] = useState('hepsi')
  const [formAcik, setFormAcik] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoran } = await supabase
      .from('restoranlar')
      .select('id')
      .eq('sahibi_id', user.id)
      .single()

    if (!restoran) return
    setRestoranId(restoran.id)

    const [katRes, urunRes] = await Promise.all([
      supabase.from('kategoriler').select('*').eq('restoran_id', restoran.id).order('sira'),
      supabase.from('urunler').select('*, kategoriler(ad)').eq('restoran_id', restoran.id).order('ad')
    ])

    setKategoriler(katRes.data || [])
    setUrunler(urunRes.data || [])
  }

  const handleResimSec = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Resim 2MB\'dan büyük olamaz')
      e.target.value = ''
      return
    }
    setResimDosya(file)
    setResimOnizleme(URL.createObjectURL(file))
  }

  const resimYukle = async (): Promise<string | null> => {
    if (!resimDosya || !restoranId) return null
    const fileExt = resimDosya.name.split('.').pop()
    const fileName = `${restoranId}/${Date.now()}.${fileExt}`

    const { error } = await supabase.storage.from('urun-resimleri').upload(fileName, resimDosya)
    if (error) {
      toast.error('Resim yüklenemedi: ' + error.message)
      return null
    }

    const { data } = supabase.storage.from('urun-resimleri').getPublicUrl(fileName)
    return data.publicUrl
  }

  const urunEkle = async () => {
    if (!yeniUrun.ad || !yeniUrun.fiyat || !yeniUrun.kategori_id) {
      return toast.error('Ürün adı, fiyat ve kategori zorunlu')
    }

    setYukleniyor(true)

    let resim_url = null
    if (resimDosya) {
      resim_url = await resimYukle()
      if (!resim_url && resimDosya) {
        setYukleniyor(false)
        return
      }
    }

    const { error } = await supabase.from('urunler').insert({
      restoran_id: restoranId,
      kategori_id: yeniUrun.kategori_id,
      ad: yeniUrun.ad,
      fiyat: parseFloat(yeniUrun.fiyat),
      aciklama: yeniUrun.aciklama || null,
      resim_url,
      aktif: true
    })

    if (error) {
      toast.error('Hata: ' + error.message)
      setYukleniyor(false)
      return
    }

    toast.success('Ürün eklendi!')
    setYeniUrun({ ad: '', fiyat: '', kategori_id: '', aciklama: '' })
    setResimDosya(null)
    setResimOnizleme('')
    setYukleniyor(false)
    setFormAcik(false)
    loadData()
  }

  const urunSil = async (id: string, resim_url: string | null) => {
    if (!confirm('Bu ürünü silmek istediğine emin misin?')) return

    if (resim_url) {
      const path = resim_url.split('/urun-resimleri/')[1]
      if (path) await supabase.storage.from('urun-resimleri').remove([path])
    }

    const { error } = await supabase.from('urunler').delete().eq('id', id)
    if (error) {
      toast.error('Silinemedi')
      return
    }
    toast.success('Ürün silindi')
    loadData()
  }

  const aktifToggle = async (id: string, aktif: boolean) => {
    await supabase.from('urunler').update({ aktif: !aktif }).eq('id', id)
    toast.success(aktif ? 'Ürün pasif yapıldı' : 'Ürün aktif edildi')
    loadData()
  }

  const filtreliUrunler = urunler.filter(u => {
    const aramaUygun = u.ad.toLowerCase().includes(aramaMetni.toLowerCase())
    const kategoriUygun = seciliKategori === 'hepsi' || u.kategori_id === seciliKategori
    return aramaUygun && kategoriUygun
  })

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Package className="w-7 h-7 text-purple-500" />
            Ürün Yönetimi
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{urunler.length} ürün</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push('/dashboard')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <LayoutDashboard className="w-4 h-4 mr-1.5" />
            Dashboard
          </Button>
          <Button onClick={() => router.push('/kategoriler')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <Tag className="w-4 h-4 mr-1.5" />
            Kategoriler
          </Button>
          <Button
            onClick={() => setFormAcik(!formAcik)}
            className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Ürün Ekle
          </Button>
        </div>
      </div>

      {/* Ürün Ekleme Formu */}
      {formAcik && (
        <Card className="p-5 bg-zinc-800 border-zinc-700 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Plus className="w-5 h-5 text-yellow-500" />
              Yeni Ürün Ekle
            </h2>
            <button onClick={() => setFormAcik(false)} className="text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
            <div>
              <Label className="text-zinc-300 text-xs mb-1 block">Ürün Adı *</Label>
              <Input
                placeholder="Örn: Adana Kebap"
                value={yeniUrun.ad}
                onChange={e => setYeniUrun({ ...yeniUrun, ad: e.target.value })}
                className="bg-zinc-700 border-zinc-600 focus:border-yellow-500"
              />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs mb-1 block">Fiyat (₺) *</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={yeniUrun.fiyat}
                onChange={e => setYeniUrun({ ...yeniUrun, fiyat: e.target.value })}
                className="bg-zinc-700 border-zinc-600 focus:border-yellow-500"
              />
            </div>
            <div>
              <Label className="text-zinc-300 text-xs mb-1 block">Kategori *</Label>
              <Select
                value={yeniUrun.kategori_id}
                onValueChange={val => setYeniUrun({ ...yeniUrun, kategori_id: val })}
              >
                <SelectTrigger className="bg-zinc-700 border-zinc-600">
                  <SelectValue placeholder="Kategori Seç" />
                </SelectTrigger>
                <SelectContent>
                  {kategoriler.length === 0 ? (
                    <SelectItem value="yok" disabled>Önce kategori ekleyin</SelectItem>
                  ) : (
                    kategoriler.map(kat => (
                      <SelectItem key={kat.id} value={kat.id}>{kat.ad}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-zinc-300 text-xs mb-1 block">Açıklama</Label>
              <Input
                placeholder="Opsiyonel"
                value={yeniUrun.aciklama}
                onChange={e => setYeniUrun({ ...yeniUrun, aciklama: e.target.value })}
                className="bg-zinc-700 border-zinc-600 focus:border-yellow-500"
              />
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex-1">
              <Label className="text-zinc-300 text-xs mb-1 block">Ürün Resmi</Label>
              <label className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 border border-zinc-600 rounded-lg text-sm transition w-fit">
                  <ImageIcon className="w-4 h-4" />
                  Resim Seç
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleResimSec}
                  className="hidden"
                />
              </label>
              <p className="text-xs text-zinc-500 mt-1">PNG, JPG max 2MB</p>
            </div>

            {resimOnizleme && (
              <div className="relative w-20 h-20 shrink-0">
                <img src={resimOnizleme} alt="Önizleme" className="w-full h-full object-cover rounded-lg" />
                <button
                  onClick={() => { setResimOnizleme(''); setResimDosya(null) }}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              onClick={() => setFormAcik(false)}
              variant="outline"
              className="border-zinc-600 hover:bg-zinc-700"
            >
              İptal
            </Button>
            <Button
              onClick={urunEkle}
              disabled={yukleniyor || kategoriler.length === 0}
              className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold"
            >
              {yukleniyor ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              {yukleniyor ? 'Ekleniyor...' : 'Ürün Ekle'}
            </Button>
          </div>

          {kategoriler.length === 0 && (
            <div className="mt-3 p-3 bg-yellow-900/30 border border-yellow-700/50 rounded-lg">
              <p className="text-yellow-400 text-sm">
                Önce kategori eklemeniz gerekiyor.{' '}
                <button
                  onClick={() => router.push('/kategoriler')}
                  className="underline hover:text-yellow-300"
                >
                  Kategorilere git →
                </button>
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Filtreler */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
          <Input
            placeholder="Ürün ara..."
            value={aramaMetni}
            onChange={e => setAramaMetni(e.target.value)}
            className="bg-zinc-800 border-zinc-700 pl-9 focus:border-yellow-500"
          />
        </div>
        <Select value={seciliKategori} onValueChange={setSeciliKategori}>
          <SelectTrigger className="bg-zinc-800 border-zinc-700 w-full sm:w-48">
            <SelectValue placeholder="Tüm Kategoriler" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="hepsi">Tüm Kategoriler</SelectItem>
            {kategoriler.map(kat => (
              <SelectItem key={kat.id} value={kat.id}>{kat.ad}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Ürün Listesi */}
      {filtreliUrunler.length === 0 ? (
        <Card className="p-12 bg-zinc-800 border-zinc-700 text-center">
          <Package className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
          <p className="text-zinc-400 font-bold mb-2">
            {aramaMetni || seciliKategori !== 'hepsi' ? 'Arama sonucu bulunamadı' : 'Henüz ürün eklenmemiş'}
          </p>
          {!aramaMetni && seciliKategori === 'hepsi' && (
            <Button
              onClick={() => setFormAcik(true)}
              className="bg-yellow-500 text-black font-bold hover:bg-yellow-400 mt-2"
            >
              <Plus className="w-4 h-4 mr-2" />
              İlk Ürünü Ekle
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtreliUrunler.map(urun => (
            <Card
              key={urun.id}
              className={`bg-zinc-800 border-zinc-700 overflow-hidden transition hover:border-zinc-500 ${!urun.aktif ? 'opacity-60' : ''}`}
            >
              {urun.resim_url ? (
                <div className="relative w-full h-40">
                  <Image
                    src={urun.resim_url}
                    alt={urun.ad}
                    fill
                    sizes="(max-width: 768px) 100vw, 25vw"
                    className="object-cover"
                  />
                  {!urun.aktif && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-zinc-800/80 px-2 py-1 rounded">PASİF</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-40 bg-zinc-700 flex items-center justify-center">
                  <Package className="w-10 h-10 text-zinc-500" />
                </div>
              )}

              <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                  <p className="font-bold text-white leading-tight">{urun.ad}</p>
                  <p className="text-yellow-500 font-black text-lg shrink-0 ml-2">{urun.fiyat}₺</p>
                </div>
                <p className="text-xs text-zinc-400 mb-3">
                  {urun.kategoriler?.ad || 'Kategori yok'}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={urun.aktif}
                      onCheckedChange={() => aktifToggle(urun.id, urun.aktif)}
                    />
                    <span className="text-xs text-zinc-400">{urun.aktif ? 'Aktif' : 'Pasif'}</span>
                  </div>
                </div>

                <Button
                  onClick={() => urunSil(urun.id, urun.resim_url)}
                  variant="destructive"
                  size="sm"
                  className="w-full"
                >
                  <Trash2 className="w-3 h-3 mr-1.5" />
                  Sil
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
