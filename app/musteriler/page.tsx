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
import { User, Phone, MapPin, Plus, Search, Pencil, Trash2, ShoppingCart, X, LayoutDashboard, PhoneCall } from 'lucide-react'

type Musteri = {
  id: number
  telefon: string
  ad: string
  adres: string | null
  notlar: string | null
  created_at: string
}

export default function MusterilerPage() {
  const [restoran, setRestoran] = useState<any>(null)
  const [musteriler, setMusteriler] = useState<Musteri[]>([])
  const [loading, setLoading] = useState(true)
  const [ara, setAra] = useState('')
  const [ekleModal, setEkleModal] = useState(false)
  const [duzenleId, setDuzenleId] = useState<number | null>(null)

  // Form
  const [formTelefon, setFormTelefon] = useState('')
  const [formAd, setFormAd] = useState('')
  const [formAdres, setFormAdres] = useState('')
  const [formNotlar, setFormNotlar] = useState('')

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
    await getMusteriler(restoranData.id)
    setLoading(false)
  }

  const getMusteriler = async (restoranId: string) => {
    const { data } = await supabase
      .from('musteriler')
      .select('*')
      .eq('restoran_id', restoranId)
      .order('created_at', { ascending: false })

    setMusteriler(data || [])
  }

  const musteriEkle = async () => {
    if (!formTelefon.trim() || !formAd.trim()) {
      toast.error('Telefon ve ad zorunlu')
      return
    }

    const { error } = await supabase
      .from('musteriler')
      .insert({
        restoran_id: restoran.id,
        telefon: formTelefon.replace(/[\s\-\(\)]/g, ''),
        ad: formAd.trim(),
        adres: formAdres.trim() || null,
        notlar: formNotlar.trim() || null
      })

    if (error) {
      if (error.code === '23505') {
        toast.error('Bu numara zaten kayıtlı')
      } else {
        toast.error('Eklenemedi: ' + error.message)
      }
      return
    }

    toast.success('Müşteri eklendi')
    modalKapat()
    getMusteriler(restoran.id)
  }

  const musteriGuncelle = async () => {
    if (!duzenleId) return

    const { error } = await supabase
      .from('musteriler')
      .update({
        telefon: formTelefon.replace(/[\s\-\(\)]/g, ''),
        ad: formAd.trim(),
        adres: formAdres.trim() || null,
        notlar: formNotlar.trim() || null
      })
      .eq('id', duzenleId)

    if (error) {
      toast.error('Güncellenemedi: ' + error.message)
      return
    }

    toast.success('Müşteri güncellendi')
    modalKapat()
    getMusteriler(restoran.id)
  }

  const musteriSil = async (id: number) => {
    if (!confirm('Bu müşteri silinsin mi?')) return

    const { error } = await supabase
      .from('musteriler')
      .delete()
      .eq('id', id)

    if (error) {
      toast.error('Silinemedi')
      return
    }

    toast.success('Müşteri silindi')
    getMusteriler(restoran.id)
  }

  const duzenleAc = (m: Musteri) => {
    setDuzenleId(m.id)
    setFormTelefon(m.telefon)
    setFormAd(m.ad)
    setFormAdres(m.adres || '')
    setFormNotlar(m.notlar || '')
    setEkleModal(true)
  }

  const modalKapat = () => {
    setEkleModal(false)
    setDuzenleId(null)
    setFormTelefon('')
    setFormAd('')
    setFormAdres('')
    setFormNotlar('')
  }

  const sipariseDonustur = (m: Musteri) => {
    const params = new URLSearchParams({
      telefon: m.telefon,
      ad: m.ad,
      adres: m.adres || '',
      musteri_id: m.id.toString()
    })
    router.push(`/paket-siparis?${params.toString()}`)
  }

  const filtreliMusteriler = musteriler.filter(m => {
    if (!ara) return true
    const q = ara.toLowerCase()
    return m.ad.toLowerCase().includes(q) || m.telefon.includes(q) || (m.adres || '').toLowerCase().includes(q)
  })

  if (loading) {
    return <div className="min-h-screen bg-zinc-900 text-white p-4 flex items-center justify-center">Yükleniyor...</div>
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <User className="w-7 h-7 text-blue-500" />
            Müşteriler
          </h1>
          <p className="text-sm text-zinc-400 mt-1">{musteriler.length} kayıtlı müşteri</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push('/dashboard')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <LayoutDashboard className="w-4 h-4 mr-1.5" />
            Dashboard
          </Button>
          <Button onClick={() => router.push('/aramalar')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <PhoneCall className="w-4 h-4 mr-1.5" />
            Aramalar
          </Button>
          <Button
            onClick={() => setEkleModal(true)}
            className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Müşteri Ekle
          </Button>
        </div>
      </div>

      {/* Arama */}
      <div className="mb-4 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          placeholder="İsim, telefon veya adres ara..."
          value={ara}
          onChange={(e) => setAra(e.target.value)}
          className="bg-zinc-800 border-zinc-700 pl-10"
        />
      </div>

      {/* Müşteri Listesi */}
      {filtreliMusteriler.length === 0 ? (
        <Card className="p-12 bg-zinc-800 text-center border-zinc-700">
          <User className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400 mb-4">{ara ? 'Sonuç bulunamadı' : 'Henüz müşteri yok'}</p>
          {!ara && (
            <Button
              onClick={() => setEkleModal(true)}
              className="bg-yellow-500 text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              İlk Müşteriyi Ekle
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtreliMusteriler.map(m => (
            <Card key={m.id} className="p-4 bg-zinc-800 border-zinc-700">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-600 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">{m.ad}</h3>
                    <p className="text-sm text-zinc-400 flex items-center gap-1 mt-1">
                      <Phone className="w-3 h-3" />
                      {m.telefon}
                    </p>
                    {m.adres && (
                      <p className="text-xs text-zinc-500 flex items-start gap-1 mt-1">
                        <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                        {m.adres}
                      </p>
                    )}
                    {m.notlar && (
                      <p className="text-xs text-yellow-500 mt-1">Not: {m.notlar}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => sipariseDonustur(m)}
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  Sipariş
                </Button>
                <Button
                  onClick={() => duzenleAc(m)}
                  size="sm"
                  variant="outline"
                  className="border-zinc-600"
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => musteriSil(m.id)}
                  size="sm"
                  variant="destructive"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Ekle/Düzenle Modal */}
      {ekleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="p-6 bg-zinc-900 border-zinc-700 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {duzenleId ? 'Müşteri Düzenle' : 'Yeni Müşteri'}
              </h2>
              <Button onClick={modalKapat} variant="ghost" size="icon">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label>Telefon *</Label>
                <Input
                  value={formTelefon}
                  onChange={(e) => setFormTelefon(e.target.value)}
                  placeholder="05XX XXX XX XX"
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label>Ad Soyad *</Label>
                <Input
                  value={formAd}
                  onChange={(e) => setFormAd(e.target.value)}
                  placeholder="Ahmet Yılmaz"
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div>
                <Label>Adres</Label>
                <Textarea
                  value={formAdres}
                  onChange={(e) => setFormAdres(e.target.value)}
                  placeholder="Mahalle, Sokak, No, Daire"
                  className="bg-zinc-800 border-zinc-700 mt-1"
                  rows={2}
                />
              </div>
              <div>
                <Label>Notlar</Label>
                <Input
                  value={formNotlar}
                  onChange={(e) => setFormNotlar(e.target.value)}
                  placeholder="Alerjiler, tercihler..."
                  className="bg-zinc-800 border-zinc-700 mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={modalKapat} variant="outline" className="flex-1 border-zinc-600">
                  İptal
                </Button>
                <Button
                  onClick={duzenleId ? musteriGuncelle : musteriEkle}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {duzenleId ? 'Güncelle' : 'Kaydet'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
