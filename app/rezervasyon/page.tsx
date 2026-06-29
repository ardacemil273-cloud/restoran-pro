'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  CalendarDays, Plus, Trash2, Clock, Users,
  Phone, Check, X, RefreshCw, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Rezervasyon = {
  id: string
  musteri_ad: string
  musteri_tel: string
  tarih: string
  saat: string
  kisi_sayisi: number
  masa_id: string | null
  masa_ad: string | null
  not: string | null
  durum: 'bekliyor' | 'onaylandi' | 'iptal' | 'geldi'
  created_at: string
}

const DURUM_RENK: Record<string, string> = {
  bekliyor: 'bg-yellow-800 text-yellow-200',
  onaylandi: 'bg-green-800 text-green-200',
  iptal: 'bg-red-800 text-red-200',
  geldi: 'bg-blue-800 text-blue-200'
}

const DURUM_METIN: Record<string, string> = {
  bekliyor: 'Bekliyor',
  onaylandi: 'Onaylandı',
  iptal: 'İptal',
  geldi: 'Geldi'
}

export default function RezervasyonPage() {
  const [rezervasyonlar, setRezervasyonlar] = useState<Rezervasyon[]>([])
  const [masalar, setMasalar] = useState<any[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [ekleModal, setEkleModal] = useState(false)
  const [seciliTarih, setSeciliTarih] = useState(new Date().toISOString().split('T')[0])
  const [yeniRez, setYeniRez] = useState({
    musteri_ad: '',
    musteri_tel: '',
    tarih: new Date().toISOString().split('T')[0],
    saat: '19:00',
    kisi_sayisi: 2,
    masa_id: '',
    not: ''
  })
  const [ekleniyor, setEkleniyor] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (restoran) getRezervasyonlar(restoran.id)
  }, [seciliTarih, restoran])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar')
      .select('*')
      .eq('sahibi_id', user.id)
      .single()

    if (!restoranData) return
    setRestoran(restoranData)

    const { data: masaData } = await supabase
      .from('masalar')
      .select('id, ad, kapasite')
      .eq('restoran_id', restoranData.id)
      .order('ad')

    setMasalar(masaData || [])
    await getRezervasyonlar(restoranData.id)
    setYukleniyor(false)
  }

  const getRezervasyonlar = async (restoranId: string) => {
    const { data } = await supabase
      .from('rezervasyonlar')
      .select('*')
      .eq('restoran_id', restoranId)
      .eq('tarih', seciliTarih)
      .order('saat', { ascending: true })

    setRezervasyonlar(data || [])
  }

  const rezervasyonEkle = async () => {
    if (!yeniRez.musteri_ad || !yeniRez.tarih || !yeniRez.saat) {
      return toast.error('Ad, tarih ve saat zorunlu')
    }

    setEkleniyor(true)
    const { error } = await supabase.from('rezervasyonlar').insert({
      restoran_id: restoran.id,
      musteri_ad: yeniRez.musteri_ad,
      musteri_tel: yeniRez.musteri_tel || null,
      tarih: yeniRez.tarih,
      saat: yeniRez.saat,
      kisi_sayisi: yeniRez.kisi_sayisi,
      masa_id: yeniRez.masa_id || null,
      masa_ad: masalar.find(m => m.id === yeniRez.masa_id)?.ad || null,
      rezervasyon_notu: yeniRez.not || null,
      durum: 'bekliyor'
    })

    if (error) {
      toast.error('Hata: ' + error.message)
      setEkleniyor(false)
      return
    }

    toast.success('Rezervasyon eklendi')
    setYeniRez({ musteri_ad: '', musteri_tel: '', tarih: new Date().toISOString().split('T')[0], saat: '19:00', kisi_sayisi: 2, masa_id: '', not: '' })
    setEkleModal(false)
    setEkleniyor(false)
    getRezervasyonlar(restoran.id)
  }

  const durumGuncelle = async (id: string, durum: Rezervasyon['durum']) => {
    await supabase.from('rezervasyonlar').update({ durum }).eq('id', id)
    toast.success('Durum güncellendi')
    getRezervasyonlar(restoran.id)
  }

  const rezervasyonSil = async (id: string) => {
    if (!confirm('Rezervasyon silinsin mi?')) return
    await supabase.from('rezervasyonlar').delete().eq('id', id)
    toast.success('Rezervasyon silindi')
    getRezervasyonlar(restoran.id)
  }

  const tarihDegistir = (gun: number) => {
    const tarih = new Date(seciliTarih)
    tarih.setDate(tarih.getDate() + gun)
    setSeciliTarih(tarih.toISOString().split('T')[0])
  }

  const tarihFormatla = (tarih: string) => {
    return new Date(tarih).toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <CalendarDays className="w-7 h-7 text-blue-400" />
            Rezervasyon
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push('/dashboard')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <ChevronLeft className="w-4 h-4 mr-1" />
            Dashboard
          </Button>
          <Button onClick={() => router.push('/masalar')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <Users className="w-4 h-4 mr-1.5" />
            Masalar
          </Button>
          <Button
            onClick={() => setEkleModal(true)}
            className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Rezervasyon Ekle
          </Button>
        </div>
      </div>

      {/* Tarih Navigasyonu */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <Button onClick={() => tarihDegistir(-1)} variant="outline" className="border-zinc-600" size="icon">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <p className="font-bold text-lg">{tarihFormatla(seciliTarih)}</p>
          <p className="text-xs text-zinc-400">{rezervasyonlar.length} rezervasyon</p>
        </div>
        <Button onClick={() => tarihDegistir(1)} variant="outline" className="border-zinc-600" size="icon">
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          onClick={() => setSeciliTarih(new Date().toISOString().split('T')[0])}
          size="sm"
          variant="outline"
          className="border-zinc-600 text-zinc-400 text-xs"
        >
          Bugün
        </Button>
      </div>

      {/* Rezervasyon Listesi */}
      {rezervasyonlar.length === 0 ? (
        <Card className="p-12 bg-zinc-800 border-zinc-700 text-center">
          <CalendarDays className="w-12 h-12 mx-auto mb-3 text-zinc-500 opacity-40" />
          <p className="text-zinc-400">Bu gün için rezervasyon yok</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {rezervasyonlar.map(rez => (
            <Card key={rez.id} className="p-4 bg-zinc-800 border-zinc-700">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="bg-blue-900/50 text-blue-300 rounded-lg p-2 text-center min-w-[60px]">
                    <p className="text-xl font-black">{rez.saat}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-lg">{rez.musteri_ad}</p>
                      <Badge className={DURUM_RENK[rez.durum]}>{DURUM_METIN[rez.durum]}</Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {rez.kisi_sayisi} kişi
                      </span>
                      {rez.musteri_tel && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {rez.musteri_tel}
                        </span>
                      )}
                      {rez.masa_ad && (
                        <span className="text-yellow-400">{rez.masa_ad}</span>
                      )}
                    </div>
                    {(rez as any).rezervasyon_notu && (
                      <p className="text-xs text-zinc-500 mt-1">📝 {(rez as any).rezervasyon_notu}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {rez.durum === 'bekliyor' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => durumGuncelle(rez.id, 'onaylandi')}
                        className="bg-green-700 hover:bg-green-600 h-8 w-8 p-0"
                      >
                        <Check className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => durumGuncelle(rez.id, 'iptal')}
                        className="bg-red-800 hover:bg-red-700 h-8 w-8 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                  {rez.durum === 'onaylandi' && (
                    <Button
                      size="sm"
                      onClick={() => durumGuncelle(rez.id, 'geldi')}
                      className="bg-blue-700 hover:bg-blue-600 text-xs h-8 px-2"
                    >
                      Geldi
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => rezervasyonSil(rez.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Rezervasyon Ekle Modal */}
      {ekleModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="p-6 bg-zinc-800 border-zinc-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Rezervasyon Ekle</h2>
            <div className="space-y-3">
              <div>
                <Label className="text-zinc-300 mb-1 block">Müşteri Adı *</Label>
                <Input
                  placeholder="Ahmet Bey"
                  value={yeniRez.musteri_ad}
                  onChange={e => setYeniRez(p => ({ ...p, musteri_ad: e.target.value }))}
                  className="bg-zinc-700 border-zinc-600"
                />
              </div>
              <div>
                <Label className="text-zinc-300 mb-1 block">Telefon</Label>
                <Input
                  placeholder="0532 xxx xx xx"
                  value={yeniRez.musteri_tel}
                  onChange={e => setYeniRez(p => ({ ...p, musteri_tel: e.target.value }))}
                  className="bg-zinc-700 border-zinc-600"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-zinc-300 mb-1 block">Tarih *</Label>
                  <Input
                    type="date"
                    value={yeniRez.tarih}
                    onChange={e => setYeniRez(p => ({ ...p, tarih: e.target.value }))}
                    className="bg-zinc-700 border-zinc-600"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300 mb-1 block">Saat *</Label>
                  <Input
                    type="time"
                    value={yeniRez.saat}
                    onChange={e => setYeniRez(p => ({ ...p, saat: e.target.value }))}
                    className="bg-zinc-700 border-zinc-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-zinc-300 mb-1 block">Kişi Sayısı</Label>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={yeniRez.kisi_sayisi}
                    onChange={e => setYeniRez(p => ({ ...p, kisi_sayisi: parseInt(e.target.value) }))}
                    className="bg-zinc-700 border-zinc-600"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300 mb-1 block">Masa</Label>
                  <Select value={yeniRez.masa_id} onValueChange={v => setYeniRez(p => ({ ...p, masa_id: v }))}>
                    <SelectTrigger className="bg-zinc-700 border-zinc-600">
                      <SelectValue placeholder="Seç..." />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      {masalar.map(m => (
                        <SelectItem key={m.id} value={m.id} className="text-white">{m.ad}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-zinc-300 mb-1 block">Not</Label>
                <Input
                  placeholder="Doğum günü, pencere kenarı vb."
                  value={yeniRez.not}
                  onChange={e => setYeniRez(p => ({ ...p, not: e.target.value }))}
                  className="bg-zinc-700 border-zinc-600"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button onClick={() => setEkleModal(false)} variant="outline" className="flex-1 border-zinc-600">İptal</Button>
              <Button onClick={rezervasyonEkle} disabled={ekleniyor} className="flex-1 bg-yellow-500 text-black font-bold">
                {ekleniyor ? 'Ekleniyor...' : 'Kaydet'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
