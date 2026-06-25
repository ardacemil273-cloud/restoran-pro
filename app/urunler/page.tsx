'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { X, Loader2, QrCode, ListOrdered } from 'lucide-react'
import Image from 'next/image'

export default function UrunlerPage() {
  const [urunler, setUrunler] = useState<any[]>([])
  const [kategoriler, setKategoriler] = useState<any[]>([])
  const [restoranId, setRestoranId] = useState('')
  const [yeniUrun, setYeniUrun] = useState({ ad: '', fiyat: '', kategori_id: '' })
  const [yukleniyor, setYukleniyor] = useState(false)
  const [resimDosya, setResimDosya] = useState<File | null>(null)
  const [resimOnizleme, setResimOnizleme] = useState('')
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

    const { data: katData } = await supabase
  .from('kategoriler')
  .select('*')
  .eq('restoran_id', restoran.id)
  .order('sira')

    setKategoriler(katData || [])

    const { data: urunData } = await supabase
  .from('urunler')
  .select('*, kategoriler(ad)')
  .eq('restoran_id', restoran.id)
  .order('ad')

    setUrunler(urunData || [])
  }

  const handleResimSec = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('INPUT CHANGE ÇALIŞTI')
    const file = e.target.files?.[0]
    if (!file) return

    console.log('DOSYA:', file.name, file.size)

    // DÜZELTME 1: 2MB = 2 * 1024 * 1024, sen 2KB yapmışsın
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Resim 2MB\'dan büyük olamaz')
      e.target.value = ''
      return
    }

    setResimDosya(file)
    setResimOnizleme(URL.createObjectURL(file))
    toast.success('Resim seçildi: ' + file.name)
  }

  const resimYukle = async (): Promise<string | null> => {
    if (!resimDosya ||!restoranId) return null

    const fileExt = resimDosya.name.split('.').pop()
    const fileName = `${restoranId}/${Date.now()}.${fileExt}`

    console.log('YÜKLENİYOR:', fileName)

    const { error } = await supabase.storage
   .from('urun-resimleri')
   .upload(fileName, resimDosya)

    if (error) {
      console.log('UPLOAD HATA:', error)
      toast.error('Resim yüklenemedi: ' + error.message)
      return null
    }

    const { data } = supabase.storage
   .from('urun-resimleri')
   .getPublicUrl(fileName)

    console.log('URL:', data.publicUrl)
    return data.publicUrl
  }

  const urunEkle = async () => {
    if (!yeniUrun.ad ||!yeniUrun.fiyat ||!yeniUrun.kategori_id) {
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
      resim_url,
      aktif: true
    })

    if (error) {
      toast.error('Hata: ' + error.message)
      setYukleniyor(false)
      return
    }

    toast.success('Ürün eklendi')
    setYeniUrun({ ad: '', fiyat: '', kategori_id: '' })
    setResimDosya(null)
    setResimOnizleme('')
    setYukleniyor(false)
    loadData()
  }

  const urunSil = async (id: string, resim_url: string | null) => {
    if (resim_url) {
      const path = resim_url.split('/urun-resimleri/')[1]
      if (path) {
        await supabase.storage.from('urun-resimleri').remove([path])
      }
    }

    await supabase.from('urunler').delete().eq('id', id)
    toast.success('Ürün silindi')
    loadData()
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      {/* DÜZELTME 2: Header butonları eklendi */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Ürünler</h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/qr')} className="bg-zinc-700">
            <QrCode className="w-4 h-4 mr-2" />
            QR Kodlar
          </Button>
          <Button onClick={() => router.push('/siparisler')} className="bg-zinc-700">
            <ListOrdered className="w-4 h-4 mr-2" />
            Siparişler
          </Button>
          <Button onClick={() => router.push('/masalar')} className="bg-zinc-700">
            Masalar
          </Button>
        </div>
      </div>

      <Card className="p-4 bg-zinc-800 mb-6 border-zinc-700">
        <h2 className="font-bold mb-3">Yeni Ürün Ekle</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input
            placeholder="Ürün Adı"
            value={yeniUrun.ad}
            onChange={e => setYeniUrun({...yeniUrun, ad: e.target.value})}
            className="bg-zinc-700 border-zinc-600"
          />
          <Input
            type="number"
            placeholder="Fiyat"
            value={yeniUrun.fiyat}
            onChange={e => setYeniUrun({...yeniUrun, fiyat: e.target.value})}
            className="bg-zinc-700 border-zinc-600"
          />
          <Select
            value={yeniUrun.kategori_id}
            onValueChange={val => setYeniUrun({...yeniUrun, kategori_id: val})}
          >
            <SelectTrigger className="bg-zinc-700 border-zinc-600">
              <SelectValue placeholder="Kategori Seç" />
            </SelectTrigger>
            <SelectContent>
              {kategoriler.map(kat => (
                <SelectItem key={kat.id} value={kat.id}>{kat.ad}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="file"
            accept="image/*"
            onChange={handleResimSec}
            className="bg-zinc-700 border-zinc-600 file:bg-zinc-600 file:text-white file:border-0 file:rounded file:px-2 file:mr-2"
          />
        </div>

        {resimOnizleme && (
          <div className="mt-3 relative w-32 h-32">
            <img src={resimOnizleme} alt="Önizleme" className="w-full h-full object-cover rounded" />
            <button
              onClick={() => {
                setResimOnizleme('')
                setResimDosya(null)
              }}
              className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
            >
              <X className="w-4 h-4" />
            </button>
            <p className="text-xs text-zinc-400 mt-1 truncate">{resimDosya?.name}</p>
          </div>
        )}

        <Button
          onClick={urunEkle}
          disabled={yukleniyor}
          className="bg-yellow-500 text-black hover:bg-yellow-400 mt-3 w-full"
        >
          {yukleniyor? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Ekle
        </Button>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {urunler.map(urun => (
          <Card key={urun.id} className="p-4 bg-zinc-800 border-zinc-700 overflow-hidden">
            {urun.resim_url? (
              <div className="relative w-full h-40 mb-3 -mx-4 -mt-4">
                {/* DÜZELTME 3: sizes eklendi, LCP uyarısı gider */}
                <Image
                  src={urun.resim_url}
                  alt={urun.ad}
                  fill
                  sizes="(max-width: 768px) 100vw, 25vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-40 mb-3 -mx-4 -mt-4 bg-zinc-700 flex items-center justify-center text-zinc-500">
                Resim Yok
              </div>
            )}

            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold">{urun.ad}</p>
                <p className="text-sm text-zinc-400">{urun.kategoriler?.ad}</p>
              </div>
              <p className="text-yellow-500 font-bold text-xl">{urun.fiyat}₺</p>
            </div>
            <Button
              onClick={() => urunSil(urun.id, urun.resim_url)}
              variant="destructive"
              size="sm"
              className="w-full mt-2"
            >
              Sil
            </Button>
          </Card>
        ))}
      </div>

      {urunler.length === 0 && (
        <p className="text-center text-zinc-500 py-12">Henüz ürün eklenmemiş</p>
      )}
    </div>
  )
}
