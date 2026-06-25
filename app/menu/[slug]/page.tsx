'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useParams, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { ShoppingCart, Plus, Minus, X } from 'lucide-react'
import Image from 'next/image' // <-- BUNU EKLE

type SepetItem = {
  id: string
  ad: string
  fiyat: number
  adet: number
  resim_url?: string | null // <-- RESİM EKLEDİK
}

export default function MenuPage() {
  const { slug } = useParams()
  const searchParams = useSearchParams()
  const masaAd = searchParams.get('masa')

  const [restoran, setRestoran] = useState<any>(null)
  const [kategoriler, setKategoriler] = useState<any[]>([])
  const [urunler, setUrunler] = useState<any[]>([])
  const [aktifKategori, setAktifKategori] = useState<string | null>(null)
  const [sepet, setSepet] = useState<SepetItem[]>([])
  const [sepetAcik, setSepetAcik] = useState(false)
  const [masa, setMasa] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [siparisGonderiliyor, setSiparisGonderiliyor] = useState(false)

  useEffect(() => {
    loadMenu()
  }, [slug, masaAd])

  async function loadMenu() {
    setLoading(true)

    // 1. Restoranı bul
    const { data: restoranData, error: restoranError } = await supabase
.from('restoranlar')
.select('*')
.eq('slug', slug)
.single()

    if (restoranError ||!restoranData) {
      toast.error('Restoran bulunamadı')
      setLoading(false)
      return
    }

    setRestoran(restoranData)

    // 2. Masa var mı kontrol et - boşluk/tire normalize
    if (masaAd) {
      const masaAdiNormalize = masaAd.replace(/[-_]/g, ' ').trim()

      const { data: masaData } = await supabase
.from('masalar')
.select('*')
.eq('restoran_id', restoranData.id)
.ilike('ad', masaAdiNormalize)
.maybeSingle()

      if (masaData) {
        setMasa(masaData)
      } else {
        toast.error(`Masa bulunamadı: ${masaAd}`)
      }
    }

    // 3. Kategorileri çek
    const { data: kategorilerData } = await supabase
.from('kategoriler')
.select('*')
.eq('restoran_id', restoranData.id)
.order('sira')

    setKategoriler(kategorilerData || [])
    if (kategorilerData && kategorilerData.length > 0) {
      setAktifKategori(kategorilerData[0].id)
    }

    // 4. Ürünleri çek
    const { data: urunlerData } = await supabase
.from('urunler')
.select('*')
.eq('restoran_id', restoranData.id)
.eq('aktif', true)
.order('ad')

    setUrunler(urunlerData || [])
    setLoading(false)
  }

  function sepeteEkle(urun: any) {
    setSepet(prev => {
      const varMi = prev.find(item => item.id === urun.id)
      if (varMi) {
        return prev.map(item =>
          item.id === urun.id
        ? {...item, adet: item.adet + 1 }
            : item
        )
      }
      // RESİM_URL'İ DE SEPETE EKLE
      return [...prev, {
        id: urun.id,
        ad: urun.ad,
        fiyat: urun.fiyat,
        adet: 1,
        resim_url: urun.resim_url
      }]
    })
    toast.success(`${urun.ad} sepete eklendi`)
  }

  function adetAzalt(urunId: string) {
    setSepet(prev => {
      return prev.map(item => {
        if (item.id === urunId) {
          return {...item, adet: Math.max(0, item.adet - 1) }
        }
        return item
      }).filter(item => item.adet > 0)
    })
  }

  function adetArttir(urunId: string) {
    setSepet(prev => {
      return prev.map(item => {
        if (item.id === urunId) {
          return {...item, adet: item.adet + 1 }
        }
        return item
      })
    })
  }

  function sepettenSil(urunId: string) {
    setSepet(prev => prev.filter(item => item.id!== urunId))
  }

  async function siparisVer() {
    if (!masa) {
      toast.error('Masa seçilmedi. QR kodu tekrar okutun')
      return
    }
    if (sepet.length === 0) {
      toast.error('Sepet boş')
      return
    }

    setSiparisGonderiliyor(true)

    const toplam = sepet.reduce((sum, item) => sum + item.fiyat * item.adet, 0)

    const { data: siparis, error: siparisError } = await supabase
.from('siparisler')
.insert({
        restoran_id: restoran.id,
        masa_id: masa.id,
        toplam_tutar: toplam,
        durum: 'hazirlaniyor'
      })
.select()
.single()

    if (siparisError) {
      setSiparisGonderiliyor(false)
      toast.error('Sipariş oluşturulamadı: ' + siparisError.message)
      return
    }

    const siparisUrunleri = sepet.map(item => ({
      siparis_id: siparis.id,
      urun_id: item.id,
      adet: item.adet,
      birim_fiyat: item.fiyat
    }))

    const { error: urunError } = await supabase
.from('siparis_urunleri')
.insert(siparisUrunleri)

    if (urunError) {
      setSiparisGonderiliyor(false)
      toast.error('Ürünler eklenemedi')
      return
    }

    await supabase
.from('masalar')
.update({ durum: 'dolu' })
.eq('id', masa.id)

    setSiparisGonderiliyor(false)
    setSepet([])
    setSepetAcik(false)
    toast.success('Siparişiniz alındı! Hazırlanıyor...', {
      duration: 5000
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p>Menü yükleniyor...</p>
      </div>
    )
  }

  if (!restoran) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p>Restoran bulunamadı</p>
      </div>
    )
  }

  const filtrelenmisUrunler = aktifKategori
? urunler.filter(u => u.kategori_id === aktifKategori)
    : urunler

  const toplamTutar = sepet.reduce((sum, item) => sum + item.fiyat * item.adet, 0)
  const toplamAdet = sepet.reduce((sum, item) => sum + item.adet, 0)

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-24">
      <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-4 z-10">
        <h1 className="text-2xl font-bold">{restoran.ad}</h1>
        {masa && (
          <p className="text-sm text-yellow-500 mt-1">📍 {masa.ad}</p>
        )}
      </div>

      <div className="sticky top-[73px] bg-zinc-900 border-b border-zinc-800 p-2 z-10 overflow-x-auto">
        <div className="flex gap-2">
          {kategoriler.map(kat => (
            <button
              key={kat.id}
              onClick={() => setAktifKategori(kat.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                aktifKategori === kat.id
              ? 'bg-yellow-500 text-black'
                  : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {kat.ad}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {filtrelenmisUrunler.length === 0? (
          <p className="text-center text-zinc-500 py-12">Bu kategoride ürün yok</p>
        ) : (
          filtrelenmisUrunler.map(urun => (
            <Card key={urun.id} className="p-0 bg-zinc-800 border-zinc-700 overflow-hidden">
              <div className="flex gap-3 p-4">
                {/* RESİM KISMI - YENİ */}
                {urun.resim_url? (
                  <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={urun.resim_url}
                      alt={urun.ad}
                      fill
                      sizes="96px"
                      className="object-cover"
                      priority
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-zinc-700 flex items-center justify-center text-zinc-500 text-xs">
                    Resim Yok
                  </div>
                )}

                <div className="flex-1 flex justify-between items-start gap-3">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{urun.ad}</h3>
                    {urun.aciklama && (
                      <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{urun.aciklama}</p>
                    )}
                    <p className="text-xl font-bold text-yellow-500 mt-2">{urun.fiyat}₺</p>
                  </div>
                  <Button
                    onClick={() => sepeteEkle(urun)}
                    className="bg-yellow-500 text-black hover:bg-yellow-600 h-10 w-10 p-0 flex-shrink-0"
                  >
                    <Plus size={20} />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {sepet.length > 0 && (
        <button
          onClick={() => setSepetAcik(true)}
          className="fixed bottom-4 left-4 right-4 bg-yellow-500 text-black font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 z-20"
        >
          <ShoppingCart size={20} />
          Sepeti Görüntüle ({toplamAdet} ürün) - {toplamTutar}₺
        </button>
      )}

      {sepetAcik && (
        <div className="fixed inset-0 bg-black/80 z-30 flex items-end">
          <div className="bg-zinc-900 w-full max-h-[80vh] rounded-t-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h2 className="text-xl font-bold">Sepetim</h2>
              <button onClick={() => setSepetAcik(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {sepet.map(item => (
                <div key={item.id} className="flex gap-3 bg-zinc-800 p-3 rounded">
                  {/* SEPET İÇİ RESİM - YENİ */}
                  {item.resim_url? (
                    <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden">
                      <Image
                        src={item.resim_url}
                        alt={item.ad}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  ) : null}

                  <div className="flex-1 flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium">{item.ad}</p>
                      <p className="text-sm text-zinc-400">{item.fiyat}₺</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => adetAzalt(item.id)}
                        className="bg-zinc-700 w-8 h-8 rounded flex items-center justify-center"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-8 text-center font-bold">{item.adet}</span>
                      <button
                        onClick={() => adetArttir(item.id)}
                        className="bg-zinc-700 w-8 h-8 rounded flex items-center justify-center"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        onClick={() => sepettenSil(item.id)}
                        className="text-red-500 ml-2"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-zinc-800 bg-zinc-900">
              <div className="flex justify-between mb-4 text-lg">
                <span className="font-bold">Toplam:</span>
                <span className="font-bold text-yellow-500">{toplamTutar}₺</span>
              </div>
              <Button
                onClick={siparisVer}
                disabled={siparisGonderiliyor ||!masa}
                className="w-full bg-green-600 hover:bg-green-700 font-bold py-6 text-lg disabled:bg-zinc-600"
              >
                {siparisGonderiliyor? 'Gönderiliyor...' :!masa? 'Masa Seçilmedi' : 'Sipariş Ver'}
              </Button>
              {!masa && (
                <p className="text-xs text-red-400 text-center mt-2">
                  QR kodu masadan okutun
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
