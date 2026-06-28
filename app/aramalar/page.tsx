'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Phone, PhoneCall, User, MapPin, Plus, Search, ShoppingCart, Clock } from 'lucide-react'

type Musteri = {
  id: number
  telefon: string
  ad: string
  adres: string | null
  notlar: string | null
  created_at: string
}

type AramaKaydi = {
  telefon: string
  musteri: Musteri | null
  zaman: string
}

export default function AramalarPage() {
  const [restoran, setRestoran] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [aramaNo, setAramaNo] = useState('')
  const [bulunanMusteri, setBulunanMusteri] = useState<Musteri | null>(null)
  const [araniyor, setAraniyor] = useState(false)
  const [aramaGecmisi, setAramaGecmisi] = useState<AramaKaydi[]>([])
  const [yeniMusteriAd, setYeniMusteriAd] = useState('')
  const [yeniMusteriAdres, setYeniMusteriAdres] = useState('')
  const [kaydetModal, setKaydetModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadData()
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
    setLoading(false)
  }

  const numaraAra = async () => {
    if (!aramaNo.trim() || !restoran) return

    setAraniyor(true)
    setBulunanMusteri(null)

    // Numarayı normalize et — boşlukları ve parantezleri temizle
    const normalizeTel = aramaNo.replace(/[\s\-\(\)]/g, '')

    const { data: musteri } = await supabase
      .from('musteriler')
      .select('*')
      .eq('restoran_id', restoran.id)
      .or(`telefon.eq.${normalizeTel},telefon.ilike.%${normalizeTel.slice(-10)}%`)
      .maybeSingle()

    if (musteri) {
      setBulunanMusteri(musteri)
      toast.success(`Kayıtlı müşteri: ${musteri.ad}`)
    } else {
      toast.info('Bu numara kayıtlı değil')
    }

    // Arama geçmişine ekle
    const kayit: AramaKaydi = {
      telefon: normalizeTel,
      musteri: musteri || null,
      zaman: new Date().toISOString()
    }
    setAramaGecmisi(prev => [kayit, ...prev].slice(0, 20))

    setAraniyor(false)
  }

  const musteriKaydet = async () => {
    if (!yeniMusteriAd.trim() || !aramaNo.trim()) {
      toast.error('İsim ve telefon zorunlu')
      return
    }

    const normalizeTel = aramaNo.replace(/[\s\-\(\)]/g, '')

    const { data, error } = await supabase
      .from('musteriler')
      .insert({
        restoran_id: restoran.id,
        telefon: normalizeTel,
        ad: yeniMusteriAd.trim(),
        adres: yeniMusteriAdres.trim() || null
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        toast.error('Bu numara zaten kayıtlı')
      } else {
        toast.error('Kaydedilemedi: ' + error.message)
      }
      return
    }

    toast.success('Müşteri kaydedildi')
    setBulunanMusteri(data)
    setKaydetModal(false)
    setYeniMusteriAd('')
    setYeniMusteriAdres('')
  }

  const sipariseDonustur = () => {
    if (!aramaNo.trim()) return

    const normalizeTel = aramaNo.replace(/[\s\-\(\)]/g, '')
    const params = new URLSearchParams({
      telefon: normalizeTel,
      ad: bulunanMusteri?.ad || '',
      adres: bulunanMusteri?.adres || '',
      musteri_id: bulunanMusteri?.id?.toString() || ''
    })

    router.push(`/paket-siparis?${params.toString()}`)
  }

  if (loading) {
    return <div className="min-h-screen bg-zinc-900 text-white p-4 flex items-center justify-center">Yükleniyor...</div>
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Gelen Aramalar</h1>
          <p className="text-sm text-zinc-400 mt-1">Telefon açıldığında numarayı gir, sistemi otomatik tanır</p>
        </div>
        <Button
          onClick={() => router.push('/musteriler')}
          className="bg-zinc-700 hover:bg-zinc-600"
        >
          <User className="w-4 h-4 mr-2" />
          Müşteriler
        </Button>
      </div>

      {/* Arama Girişi */}
      <Card className="p-6 bg-zinc-800 border-zinc-700 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center animate-pulse">
            <PhoneCall className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Numara Gir</h2>
            <p className="text-sm text-zinc-400">Arayan kişinin telefon numarasını yaz</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Input
            type="tel"
            placeholder="05XX XXX XX XX"
            value={aramaNo}
            onChange={(e) => setAramaNo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && numaraAra()}
            className="bg-zinc-700 border-zinc-600 text-lg h-12"
          />
          <Button
            onClick={numaraAra}
            disabled={araniyor || !aramaNo.trim()}
            className="bg-green-600 hover:bg-green-700 h-12 px-6"
          >
            {araniyor ? (
              <Clock className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Search className="w-5 h-5 mr-2" />
                Ara
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Sonuç */}
      {bulunanMusteri && (
        <Card className="p-6 bg-green-950/30 border-green-700 mb-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-green-600 flex items-center justify-center">
                <User className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-green-400">{bulunanMusteri.ad}</h3>
                <p className="text-zinc-300 mt-1 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {bulunanMusteri.telefon}
                </p>
                {bulunanMusteri.adres && (
                  <p className="text-zinc-300 mt-1 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {bulunanMusteri.adres}
                  </p>
                )}
                {bulunanMusteri.notlar && (
                  <p className="text-yellow-500 mt-2 text-sm">Not: {bulunanMusteri.notlar}</p>
                )}
              </div>
            </div>
            <Button
              onClick={sipariseDonustur}
              className="bg-yellow-500 text-black hover:bg-yellow-600 font-bold"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Sipariş Al
            </Button>
          </div>
        </Card>
      )}

      {/* Kayıtlı değilse kaydet butonu */}
      {aramaNo && !bulunanMusteri && aramaGecmisi.length > 0 && aramaGecmisi[0].telefon === aramaNo.replace(/[\s\-\(\)]/g, '') && (
        <Card className="p-6 bg-orange-950/30 border-orange-700 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-orange-400">Bu numara kayıtlı değil</h3>
              <p className="text-sm text-zinc-400 mt-1">Müşteri bilgilerini kaydedebilirsin</p>
            </div>
            <Button
              onClick={() => setKaydetModal(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Müşteri Kaydet
            </Button>
          </div>
        </Card>
      )}

      {/* Arama Geçmişi */}
      {aramaGecmisi.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3 text-zinc-400">Son Aramalar</h2>
          <div className="space-y-2">
            {aramaGecmisi.map((arama, i) => (
              <Card
                key={i}
                className={`p-4 ${arama.musteri ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-800/50 border-zinc-800'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${arama.musteri ? 'bg-green-600' : 'bg-zinc-600'}`}>
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold">{arama.musteri?.ad || 'Bilinmeyen Numara'}</p>
                      <p className="text-sm text-zinc-400">{arama.telefon}</p>
                      {arama.musteri?.adres && (
                        <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {arama.musteri.adres}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-zinc-500">
                      {new Date(arama.zaman).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {arama.musteri && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setAramaNo(arama.telefon)
                          setBulunanMusteri(arama.musteri)
                        }}
                        className="bg-yellow-500 text-black hover:bg-yellow-600"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Sipariş
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Müşteri Kaydet Modal */}
      {kaydetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 bg-zinc-900 border-zinc-700 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Yeni Müşteri Kaydet</h2>
            <div className="space-y-4">
              <div>
                <Label>Telefon</Label>
                <Input
                  value={aramaNo}
                  disabled
                  className="bg-zinc-800 border-zinc-700 mt-2"
                />
              </div>
              <div>
                <Label>Ad Soyad</Label>
                <Input
                  value={yeniMusteriAd}
                  onChange={(e) => setYeniMusteriAd(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  className="bg-zinc-800 border-zinc-700 mt-2"
                />
              </div>
              <div>
                <Label>Adres</Label>
                <Input
                  value={yeniMusteriAdres}
                  onChange={(e) => setYeniMusteriAdres(e.target.value)}
                  placeholder="Mahalle, Sokak, No, Daire"
                  className="bg-zinc-800 border-zinc-700 mt-2"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setKaydetModal(false)}
                  variant="outline"
                  className="flex-1 border-zinc-600"
                >
                  İptal
                </Button>
                <Button
                  onClick={musteriKaydet}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Kaydet
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
