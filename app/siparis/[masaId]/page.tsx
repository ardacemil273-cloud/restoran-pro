'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function SiparisPage() {
  const params = useParams()
  const router = useRouter()
  const masaId = params.masaId as string
  const [masa, setMasa] = useState<any>(null)
  const [kategoriler, setKategoriler] = useState<any[]>([])
  const [urunler, setUrunler] = useState<any[]>([])
  const [sepet, setSepet] = useState<any[]>([])
  const [aktifKategori, setAktifKategori] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (masaId) loadData()
  }, [masaId])

  const loadData = async () => {
    setLoading(true)

    // 1. Masa bilgisi
    const { data: masaData, error: masaError } = await supabase
   .from('masalar')
   .select('*, restoranlar(*)')
   .eq('id', masaId)
   .single()

    if (masaError ||!masaData) {
      toast.error('Masa bulunamadı')
      router.push('/masalar')
      return
    }

    setMasa(masaData)

    // 2. Kategoriler
    const { data: katData, error: katError } = await supabase
   .from('kategoriler')
   .select('*')
   .eq('restoran_id', masaData.restoran_id)
   .order('sira', { ascending: true })

    if (katError) {
      console.log('Kategori Error:', katError)
      toast.error('Kategoriler çekilemedi: ' + katError.message)
    }

    setKategoriler(katData || [])
    if (katData && katData.length > 0) setAktifKategori(katData[0].id)

    // 3. Ürünler
    const { data: urunData, error: urunError } = await supabase
   .from('urunler')
   .select('*')
   .eq('restoran_id', masaData.restoran_id)
   .eq('aktif', true)

    if (urunError) {
      console.log('Urun Error:', urunError)
    }

    setUrunler(urunData || [])
    setLoading(false)
  }

  const sepeteEkle = (urun: any) => {
    const mevcut = sepet.find(s => s.id === urun.id)
    if (mevcut) {
      setSepet(sepet.map(s => s.id === urun.id? {...s, adet: s.adet + 1} : s))
    } else {
      setSepet([...sepet, {...urun, adet: 1}])
    }
    toast.success(`${urun.ad} eklendi`)
  }

  const sepettenCikar = (urunId: string) => {
    setSepet(sepet.filter(s => s.id!== urunId))
  }

  const adetDegistir = (urunId: string, yeniAdet: number) => {
    if (yeniAdet <= 0) {
      sepettenCikar(urunId)
      return
    }
    setSepet(sepet.map(s => s.id === urunId? {...s, adet: yeniAdet} : s))
  }

  const siparisVer = async () => {
    if (sepet.length === 0) return toast.error('Sepet boş')
    if (!masa?.restoran_id) return toast.error('Restoran bilgisi yok')

    // 1. Sipariş oluştur
    const { data: siparis, error: siparisError } = await supabase
   .from('siparisler')
   .insert({
        masa_id: masaId,
        restoran_id: masa.restoran_id,
        toplam_tutar: sepet.reduce((t, u) => t + u.fiyat * u.adet, 0),
        durum: 'hazirlaniyor'
      })
   .select()
   .single()

    if (siparisError) {
      toast.error('Sipariş hatası: ' + siparisError.message)
      return
    }

    // 2. Sipariş ürünlerini ekle - DÜZELTİLDİ
    const siparisUrunleri = sepet.map(u => ({
      siparis_id: siparis.id,
      urun_id: u.id,
      urun_adi: u.ad,
      adet: u.adet,
      birim_fiyat: u.fiyat
    }))

    const { error: urunError } = await supabase.from('siparis_urunleri').insert(siparisUrunleri)

    if (urunError) {
      toast.error('Ürün ekleme hatası: ' + urunError.message)
      console.log('Siparis Urunleri Error:', urunError)
      return
    }

    // 3. Masa durumunu güncelle
    await supabase.from('masalar').update({ durum: 'dolu' }).eq('id', masaId)

    toast.success('Sipariş verildi!')
    setSepet([])
    router.push('/masalar')
  }

  const toplam = sepet.reduce((t, u) => t + u.fiyat * u.adet, 0)

  if (loading) {
    return <div className="min-h-screen bg-zinc-900 text-white p-4 flex items-center justify-center">Yükleniyor...</div>
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4 pb-32">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{masa?.ad} - Sipariş</h1>
        <Button onClick={() => router.push('/masalar')} className="bg-zinc-700">
          Geri
        </Button>
      </div>

      {kategoriler.length === 0? (
        <Card className="p-6 bg-zinc-800 text-center border-zinc-700">
          <p className="text-zinc-400 mb-3">Kategori eklenmemiş</p>
          <Button
            onClick={() => router.push('/kategoriler')}
            className="bg-yellow-500 text-black hover:bg-yellow-600"
          >
            Kategori Ekle
          </Button>
        </Card>
      ) : (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {kategoriler.map(kat => (
              <Button
                key={kat.id}
                onClick={() => setAktifKategori(kat.id)}
                className={aktifKategori === kat.id? 'bg-yellow-500 text-black' : 'bg-zinc-800'}
              >
                {kat.ad}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {urunler.filter(u => u.kategori_id === aktifKategori).map(urun => (
              <Card
                key={urun.id}
                onClick={() => sepeteEkle(urun)}
                className="p-4 bg-zinc-800 border-zinc-700 cursor-pointer hover:bg-zinc-700 active:scale-95 transition"
              >
                <p className="font-bold text-sm mb-1">{urun.ad}</p>
                <p className="text-yellow-500 font-bold">{urun.fiyat}₺</p>
              </Card>
            ))}
          </div>

          {urunler.filter(u => u.kategori_id === aktifKategori).length === 0 && (
            <Card className="p-6 bg-zinc-800 text-center border-zinc-700">
              <p className="text-zinc-400 mb-3">Bu kategoride ürün yok</p>
              <Button
                onClick={() => router.push('/urunler')}
                className="bg-yellow-500 text-black"
              >
                Ürün Ekle
              </Button>
            </Card>
          )}
        </>
      )}

      {sepet.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-800 p-4 border-t border-zinc-700">
          <div className="max-h-40 overflow-y-auto mb-3">
            {sepet.map(item => (
              <div key={item.id} className="flex justify-between items-center py-2">
                <span className="text-sm">{item.ad}</span>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => adetDegistir(item.id, item.adet - 1)}
                    className="h-7 w-7 p-0 bg-zinc-700"
                  >
                    -
                  </Button>
                  <span className="w-6 text-center">{item.adet}</span>
                  <Button
                    size="sm"
                    onClick={() => adetDegistir(item.id, item.adet + 1)}
                    className="h-7 w-7 p-0 bg-zinc-700"
                  >
                    +
                  </Button>
                  <span className="w-16 text-right text-yellow-500">{item.fiyat * item.adet}₺</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-3 border-t border-zinc-700">
            <div>
              <p className="text-sm text-zinc-400">Toplam</p>
              <p className="text-2xl font-bold">{toplam}₺</p>
            </div>
            <Button onClick={siparisVer} className="bg-yellow-500 text-black font-bold px-8">
              Sipariş Ver
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
