'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Phone, PhoneCall, PhoneMissed, User, MapPin, Plus, Search,
  ShoppingCart, Clock, LayoutDashboard, Users, RefreshCw,
  CheckCircle, XCircle, PhoneOff, Timer
} from 'lucide-react'

type Musteri = {
  id: number
  telefon: string
  ad: string
  adres: string | null
  notlar: string | null
  created_at: string
}

type AramaKaydi = {
  id: string
  arayan_numara: string
  alici_numara: string | null
  arama_tarihi: string
  sure: number
  durum: string
  kaynak_sistem: string
  musteri_id: number | null
  musteriler: Musteri | null
}

type ManuelArama = {
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
  const [manuelGecmis, setManuelGecmis] = useState<ManuelArama[]>([])
  const [webhookKayitlari, setWebhookKayitlari] = useState<AramaKaydi[]>([])
  const [webhookYukleniyor, setWebhookYukleniyor] = useState(false)
  const [yeniMusteriAd, setYeniMusteriAd] = useState('')
  const [yeniMusteriAdres, setYeniMusteriAdres] = useState('')
  const [kaydetModal, setKaydetModal] = useState(false)
  const [aktifTab, setAktifTab] = useState<'manuel' | 'webhook'>('manuel')
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

    // Webhook kayıtlarını yükle
    await getWebhookKayitlari(restoranData.id)
  }

  const getWebhookKayitlari = async (restoranId: string) => {
    setWebhookYukleniyor(true)
    const { data, error } = await supabase
      .from('arama_kayitlari')
      .select(`
        id,
        arayan_numara,
        alici_numara,
        arama_tarihi,
        sure,
        durum,
        kaynak_sistem,
        musteri_id,
        musteriler (id, telefon, ad, adres, notlar, created_at)
      `)
      .eq('restoran_id', restoranId)
      .order('arama_tarihi', { ascending: false })
      .limit(50)

    if (!error && data) {
      setWebhookKayitlari(data as any)
    }
    setWebhookYukleniyor(false)
  }

  const numaraAra = async () => {
    if (!aramaNo.trim() || !restoran) return

    setAraniyor(true)
    setBulunanMusteri(null)

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

    const kayit: ManuelArama = {
      telefon: normalizeTel,
      musteri: musteri || null,
      zaman: new Date().toISOString()
    }
    setManuelGecmis(prev => [kayit, ...prev].slice(0, 20))
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

  const sipariseDonustur = (telefon?: string, musteri?: Musteri | null) => {
    const tel = telefon || aramaNo
    if (!tel.trim()) return

    const normalizeTel = tel.replace(/[\s\-\(\)]/g, '')
    const m = musteri !== undefined ? musteri : bulunanMusteri
    const params = new URLSearchParams({
      telefon: normalizeTel,
      ad: m?.ad || '',
      adres: m?.adres || '',
      musteri_id: m?.id?.toString() || ''
    })

    router.push(`/paket-siparis?${params.toString()}`)
  }

  const formatSure = (saniye: number) => {
    if (!saniye || saniye === 0) return '-'
    const dk = Math.floor(saniye / 60)
    const sn = saniye % 60
    return dk > 0 ? `${dk}dk ${sn}sn` : `${sn}sn`
  }

  const getDurumIcon = (durum: string) => {
    switch (durum) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'missed': return <PhoneMissed className="w-4 h-4 text-red-400" />
      case 'failed': return <XCircle className="w-4 h-4 text-red-400" />
      default: return <Phone className="w-4 h-4 text-zinc-400" />
    }
  }

  const getDurumRenk = (durum: string) => {
    switch (durum) {
      case 'completed': return 'text-green-400'
      case 'missed': return 'text-red-400'
      case 'failed': return 'text-red-400'
      default: return 'text-zinc-400'
    }
  }

  const getDurumMetin = (durum: string) => {
    switch (durum) {
      case 'completed': return 'Tamamlandı'
      case 'missed': return 'Cevapsız'
      case 'failed': return 'Başarısız'
      default: return durum
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-zinc-900 text-white p-4 flex items-center justify-center">Yükleniyor...</div>
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <PhoneCall className="w-7 h-7 text-green-500" />
            Gelen Aramalar
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Telefon numarasını gir veya webhook kayıtlarını görüntüle</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push('/dashboard')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <LayoutDashboard className="w-4 h-4 mr-1.5" />
            Dashboard
          </Button>
          <Button onClick={() => router.push('/musteriler')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <Users className="w-4 h-4 mr-1.5" />
            Müşteriler
          </Button>
          <Button onClick={() => router.push('/paket-siparis')} className="bg-green-600 hover:bg-green-700" size="sm">
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            Paket Sipariş
          </Button>
        </div>
      </div>

      {/* Tab Seçici */}
      <div className="flex gap-2 mb-6 border-b border-zinc-700">
        <button
          onClick={() => setAktifTab('manuel')}
          className={`pb-3 px-4 text-sm font-bold transition-all ${
            aktifTab === 'manuel'
              ? 'text-green-400 border-b-2 border-green-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Phone className="w-4 h-4 inline mr-2" />
          Manuel Arama
        </button>
        <button
          onClick={() => setAktifTab('webhook')}
          className={`pb-3 px-4 text-sm font-bold transition-all ${
            aktifTab === 'webhook'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <PhoneOff className="w-4 h-4 inline mr-2" />
          Otomatik Kayıtlar
          {webhookKayitlari.length > 0 && (
            <span className="ml-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              {webhookKayitlari.length}
            </span>
          )}
        </button>
      </div>

      {/* Manuel Arama Sekmesi */}
      {aktifTab === 'manuel' && (
        <div className="space-y-4">
          {/* Numara Giriş Kartı */}
          <Card className="p-6 bg-zinc-800 border-zinc-700">
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

          {/* Bulunan Müşteri */}
          {bulunanMusteri && (
            <Card className="p-6 bg-green-950/30 border-green-700 animate-in fade-in slide-in-from-bottom-4">
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
                  onClick={() => sipariseDonustur()}
                  className="bg-yellow-500 text-black hover:bg-yellow-600 font-bold"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Sipariş Al
                </Button>
              </div>
            </Card>
          )}

          {/* Kayıtlı değilse kaydet */}
          {aramaNo && !bulunanMusteri && manuelGecmis.length > 0 && manuelGecmis[0].telefon === aramaNo.replace(/[\s\-\(\)]/g, '') && (
            <Card className="p-6 bg-orange-950/30 border-orange-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-orange-400">Bu numara kayıtlı değil</h3>
                  <p className="text-sm text-zinc-400 mt-1">Müşteri bilgilerini kaydedebilirsin</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => sipariseDonustur()}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Yine de Sipariş Al
                  </Button>
                  <Button
                    onClick={() => setKaydetModal(true)}
                    className="bg-orange-600 hover:bg-orange-700"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Müşteri Kaydet
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Manuel Arama Geçmişi */}
          {manuelGecmis.length > 0 && (
            <div>
              <h2 className="text-lg font-bold mb-3 text-zinc-400 flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Bu Oturumdaki Aramalar
              </h2>
              <div className="space-y-2">
                {manuelGecmis.map((arama, i) => (
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
                        <Button
                          size="sm"
                          onClick={() => {
                            setAramaNo(arama.telefon)
                            setBulunanMusteri(arama.musteri)
                            sipariseDonustur(arama.telefon, arama.musteri)
                          }}
                          className="bg-yellow-500 text-black hover:bg-yellow-600"
                        >
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Sipariş
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Webhook Kayıtları Sekmesi */}
      {aktifTab === 'webhook' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-300">Otomatik Kaydedilen Aramalar</h2>
              <p className="text-sm text-zinc-500 mt-1">
                VoIP/Telefon sisteminizden gelen webhook aramaları
              </p>
            </div>
            <Button
              onClick={() => restoran && getWebhookKayitlari(restoran.id)}
              disabled={webhookYukleniyor}
              className="bg-zinc-700 hover:bg-zinc-600"
              size="sm"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${webhookYukleniyor ? 'animate-spin' : ''}`} />
              Yenile
            </Button>
          </div>

          {webhookYukleniyor ? (
            <div className="text-center py-12 text-zinc-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3" />
              <p>Kayıtlar yükleniyor...</p>
            </div>
          ) : webhookKayitlari.length === 0 ? (
            <Card className="p-12 bg-zinc-800 border-zinc-700 text-center">
              <PhoneOff className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-400 mb-2">Henüz otomatik arama kaydı yok</h3>
              <p className="text-zinc-500 text-sm max-w-md mx-auto mb-6">
                Twilio, Asterisk veya FreePBX gibi bir VoIP sistemi kurarak aramaların otomatik kaydedilmesini sağlayabilirsiniz.
              </p>
              <div className="bg-zinc-900 rounded-lg p-4 text-left max-w-md mx-auto">
                <p className="text-xs text-zinc-400 font-mono mb-2">Webhook URL:</p>
                <p className="text-xs text-green-400 font-mono break-all">
                  POST /api/phone-webhook
                </p>
                <p className="text-xs text-zinc-500 mt-2">
                  Test: GET /api/phone-webhook?test=true
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {webhookKayitlari.map((kayit) => (
                <Card key={kayit.id} className="p-4 bg-zinc-800 border-zinc-700 hover:bg-zinc-750 transition">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        kayit.musteriler ? 'bg-green-600' : 'bg-zinc-600'
                      }`}>
                        {getDurumIcon(kayit.durum)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold">
                            {kayit.musteriler?.ad || kayit.arayan_numara}
                          </p>
                          <span className={`text-xs font-medium ${getDurumRenk(kayit.durum)}`}>
                            {getDurumMetin(kayit.durum)}
                          </span>
                        </div>
                        <p className="text-sm text-zinc-400">{kayit.arayan_numara}</p>
                        {kayit.musteriler?.adres && (
                          <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {kayit.musteriler.adres}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-zinc-500">
                          {new Date(kayit.arama_tarihi).toLocaleDateString('tr-TR', {
                            day: '2-digit', month: '2-digit'
                          })} {new Date(kayit.arama_tarihi).toLocaleTimeString('tr-TR', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                        {kayit.sure > 0 && (
                          <p className="text-xs text-zinc-500 flex items-center justify-end gap-1 mt-0.5">
                            <Timer className="w-3 h-3" />
                            {formatSure(kayit.sure)}
                          </p>
                        )}
                        <p className="text-xs text-zinc-600 mt-0.5">{kayit.kaynak_sistem}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => sipariseDonustur(kayit.arayan_numara, kayit.musteriler)}
                        className="bg-yellow-500 text-black hover:bg-yellow-600"
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Sipariş
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
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
