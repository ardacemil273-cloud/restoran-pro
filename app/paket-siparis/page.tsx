'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSearchParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Search, ShoppingCart, User, MapPin, Phone, Plus, Minus, Trash2, Check } from 'lucide-react'

function PaketSiparisContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [restoran, setRestoran] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [kategoriler, setKategoriler] = useState<any[]>([])
  const [urunler, setUrunler] = useState<any[]>([])
  const [sepet, setSepet] = useState<any[]>([])
  const [aktifKategori, setAktifKategori] = useState('')

  // Müşteri bilgileri
  const [telefon, setTelefon] = useState('')
  const [musteriAd, setMusteriAd] = useState('')
  const [musteriAdres, setMusteriAdres] = useState('')
  const [musteriId, setMusteriId] = useState<number | null>(null)
  const [siparisNotu, setSiparisNotu] = useState('')

  // Müşteri arama
  const [araTelefon, setAraTelefon] = useState('')
  const [aramaSonuclari, setAramaSonuclari] = useState<any[]>([])

  useEffect(() => {
    loadData()

    // URL parametrelerinden müşteri bilgisi al
    const tel = params.get('telefon')
    const ad = params.get('ad')
    const adres = params.get('adres')
    const mid = params.get('musteri_id')

    if (tel) setTelefon(tel)
    if (ad) setMusteriAd(ad)
    if (adres) setMusteriAdres(adres)
    if (mid) setMusteriId(Number(mid))
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

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

    const { data: katData } = await supabase
      .from('kategoriler')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .order('sira', { ascending: true })

    setKategoriler(katData || [])
    if (katData && katData.length > 0) setAktifKategori(katData[0].id)

    const { data: urunData } = await supabase
      .from('urunler')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .eq('aktif', true)
      .order('ad')

    setUrunler(urunData || [])
    setLoading(false)
  }

  const musteriAra = async () => {
    if (araTelefon.length < 3 || !restoran) return

    const { data } = await supabase
      .from('musteriler')
      .select('*')
      .eq('restoran_id', restoran.id)
      .or(`telefon.ilike.%${araTelefon}%,ad.ilike.%${araTelefon}%`)
      .limit(5)

    setAramaSonuclari(data || [])
  }

  const musteriSec = (m: any) => {
    setTelefon(m.telefon)
    setMusteriAd(m.ad)
    setMusteriAdres(m.adres || '')
    setMusteriId(m.id)
    setAraTelefon('')
    setAramaSonuclari([])
    toast.success(`${m.ad} seçildi`)
  }

  const sepeteEkle = (urun: any) => {
    const mevcut = sepet.find(s => s.id === urun.id)
    if (mevcut) {
      setSepet(sepet.map(s => s.id === urun.id ? { ...s, adet: s.adet + 1 } : s))
    } else {
      setSepet([...sepet, { ...urun, adet: 1 }])
    }
  }

  const adetDegistir = (urunId: number, yeniAdet: number) => {
    if (yeniAdet <= 0) {
      setSepet(sepet.filter(s => s.id !== urunId))
    } else {
      setSepet(sepet.map(s => s.id === urunId ? { ...s, adet: yeniAdet } : s))
    }
  }

  const siparisGonder = async () => {
    if (sepet.length === 0) return toast.error('Sepet boş')
    if (!telefon.trim()) return toast.error('Telefon numarası gerekli')
    if (!musteriAd.trim()) return toast.error('Müşteri adı gerekli')
    if (!musteriAdres.trim()) return toast.error('Teslimat adresi gerekli')
    if (!restoran) return

    const toplam = sepet.reduce((t, u) => t + Number(u.fiyat) * u.adet, 0)

    // Eğer müşteri kayıtlı değilse, kaydet
    let finalMusteriId = musteriId
    if (!finalMusteriId) {
      const { data: yeniMusteri, error: musteriError } = await supabase
        .from('musteriler')
        .insert({
          restoran_id: restoran.id,
          telefon: telefon.replace(/[\s\-\(\)]/g, ''),
          ad: musteriAd.trim(),
          adres: musteriAdres.trim()
        })
        .select()
        .single()

      if (!musteriError && yeniMusteri) {
        finalMusteriId = yeniMusteri.id
      }
    }

    // Sipariş oluştur — mevcut siparisler tablosuna
    const { data: siparis, error: siparisError } = await supabase
      .from('siparisler')
      .insert({
        restoran_id: restoran.id,
        masa_id: null,
        masa_ad: 'Paket Sipariş',
        musteri_adi: musteriAd.trim(),
        telefon: telefon.replace(/[\s\-\(\)]/g, ''),
        adres: musteriAdres.trim(),
        musteri_id: finalMusteriId,
        siparis_tipi: 'paket',
        toplam_tutar: toplam,
        durum: 'hazirlaniyor',
        not: siparisNotu.trim() || null
      })
      .select()
      .single()

    if (siparisError) {
      toast.error('Sipariş hatası: ' + siparisError.message)
      return
    }

    // Sipariş ürünlerini ekle
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
      return
    }

    toast.success('Paket sipariş alındı!')
    router.push('/siparisler')
  }

  const toplam = sepet.reduce((t, u) => t + Number(u.fiyat) * u.adet, 0)

  if (loading) {
    return <div className="min-h-screen bg-zinc-900 text-white p-4 flex items-center justify-center">Yükleniyor...</div>
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4 pb-40">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Paket Sipariş</h1>
        <Button onClick={() => router.push('/aramalar')} className="bg-zinc-700">
          Geri
        </Button>
      </div>

      {/* Müşteri Bilgileri */}
      <Card className="p-4 bg-zinc-800 border-zinc-700 mb-4">
        <h2 className="font-bold mb-3 flex items-center gap-2">
          <User className="w-5 h-5 text-yellow-500" />
          Müşteri Bilgileri
        </h2>

        {/* Hızlı müşteri arama */}
        <div className="mb-3">
          <Label className="text-xs text-zinc-400">Kayıtlı müşteri ara</Label>
          <div className="flex gap-2 mt-1">
            <Input
              placeholder="Telefon veya isim..."
              value={araTelefon}
              onChange={(e) => {
                setAraTelefon(e.target.value)
                if (e.target.value.length >= 3) musteriAra()
                else setAramaSonuclari([])
              }}
              className="bg-zinc-700 border-zinc-600"
            />
          </div>
          {aramaSonuclari.length > 0 && (
            <div className="mt-2 space-y-1">
              {aramaSonuclari.map(m => (
                <button
                  key={m.id}
                  onClick={() => musteriSec(m)}
                  className="w-full text-left p-2 bg-zinc-700 hover:bg-zinc-600 rounded transition flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-green-500" />
                  <div>
                    <p className="text-sm font-bold">{m.ad}</p>
                    <p className="text-xs text-zinc-400">{m.telefon} {m.adres && `• ${m.adres}`}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Telefon *</Label>
            <Input
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              placeholder="05XX XXX XX XX"
              className="bg-zinc-700 border-zinc-600 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Ad Soyad *</Label>
            <Input
              value={musteriAd}
              onChange={(e) => setMusteriAd(e.target.value)}
              placeholder="Ahmet Yılmaz"
              className="bg-zinc-700 border-zinc-600 mt-1"
            />
          </div>
        </div>
        <div className="mt-3">
          <Label className="text-xs">Teslimat Adresi *</Label>
          <Textarea
            value={musteriAdres}
            onChange={(e) => setMusteriAdres(e.target.value)}
            placeholder="Mahalle, Sokak, No, Daire, Kat..."
            className="bg-zinc-700 border-zinc-600 mt-1"
            rows={2}
          />
        </div>
      </Card>

      {/* Ürün Seçimi */}
      {kategoriler.length === 0 ? (
        <Card className="p-6 bg-zinc-800 text-center border-zinc-700">
          <p className="text-zinc-400">Kategori eklenmemiş</p>
        </Card>
      ) : (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {kategoriler.map(kat => (
              <Button
                key={kat.id}
                onClick={() => setAktifKategori(kat.id)}
                className={aktifKategori === kat.id ? 'bg-yellow-500 text-black' : 'bg-zinc-800'}
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
            <p className="text-center text-zinc-500 py-4">Bu kategoride ürün yok</p>
          )}
        </>
      )}

      {/* Sepet — Fixed bottom */}
      {sepet.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-800 p-4 border-t border-zinc-700 max-h-[50vh] overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-yellow-500" />
                Sepet ({sepet.length} ürün)
              </h3>
              <Button
                onClick={() => setSepet([])}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Temizle
              </Button>
            </div>

            <div className="space-y-2 mb-3">
              {sepet.map(item => (
                <div key={item.id} className="flex justify-between items-center py-1">
                  <span className="text-sm">{item.ad}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => adetDegistir(item.id, item.adet - 1)}
                      className="h-7 w-7 p-0 bg-zinc-700"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-6 text-center">{item.adet}</span>
                    <Button
                      size="sm"
                      onClick={() => adetDegistir(item.id, item.adet + 1)}
                      className="h-7 w-7 p-0 bg-zinc-700"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <span className="w-16 text-right text-yellow-500">{Number(item.fiyat) * item.adet}₺</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mb-3">
              <Input
                placeholder="Sipariş notu (örn: acı olmasın, kapı zilini çalmayın)"
                value={siparisNotu}
                onChange={(e) => setSiparisNotu(e.target.value)}
                className="bg-zinc-700 border-zinc-600"
              />
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-zinc-700">
              <div>
                <p className="text-sm text-zinc-400">Toplam</p>
                <p className="text-2xl font-bold">{toplam}₺</p>
              </div>
              <Button
                onClick={siparisGonder}
                className="bg-green-600 hover:bg-green-700 font-bold px-8"
              >
                <Check className="w-4 h-4 mr-2" />
                Siparişi Onayla
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PaketSiparisPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-900 text-white p-4 flex items-center justify-center">Yükleniyor...</div>}>
      <PaketSiparisContent />
    </Suspense>
  )
}
