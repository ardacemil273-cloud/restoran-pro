'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Tag, Plus, Trash2, Copy, RefreshCw, Percent, DollarSign, ToggleLeft, ToggleRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Indirim = {
  id: string
  kod: string
  tip: 'yuzde' | 'sabit'
  deger: number
  min_tutar: number | null
  kullanim_sayisi: number
  max_kullanim: number | null
  bitis_tarihi: string | null
  aktif: boolean
  created_at: string
}

export default function IndirimlerPage() {
  const [indirimler, setIndirimler] = useState<Indirim[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [ekleModal, setEkleModal] = useState(false)
  const [yeni, setYeni] = useState({
    kod: '',
    tip: 'yuzde' as 'yuzde' | 'sabit',
    deger: '',
    min_tutar: '',
    max_kullanim: '',
    bitis_tarihi: ''
  })
  const [ekleniyor, setEkleniyor] = useState(false)
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar').select('*').eq('sahibi_id', user.id).single()

    if (!restoranData) return
    setRestoran(restoranData)

    const { data } = await supabase
      .from('indirimler')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .order('created_at', { ascending: false })

    setIndirimler(data || [])
    setYukleniyor(false)
  }

  const rastgeleKodOlustur = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    const kod = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    setYeni(p => ({ ...p, kod }))
  }

  const indirimEkle = async () => {
    if (!yeni.kod || !yeni.deger) return toast.error('Kod ve değer zorunlu')

    setEkleniyor(true)
    const { error } = await supabase.from('indirimler').insert({
      restoran_id: restoran.id,
      kod: yeni.kod.toUpperCase(),
      tip: yeni.tip,
      deger: parseFloat(yeni.deger),
      min_tutar: yeni.min_tutar ? parseFloat(yeni.min_tutar) : null,
      max_kullanim: yeni.max_kullanim ? parseInt(yeni.max_kullanim) : null,
      bitis_tarihi: yeni.bitis_tarihi || null,
      kullanim_sayisi: 0,
      aktif: true
    })

    if (error) { toast.error('Hata: ' + error.message); setEkleniyor(false); return }

    toast.success('İndirim kodu oluşturuldu')
    setYeni({ kod: '', tip: 'yuzde', deger: '', min_tutar: '', max_kullanim: '', bitis_tarihi: '' })
    setEkleModal(false)
    setEkleniyor(false)
    loadData()
  }

  const durumDegistir = async (id: string, aktif: boolean) => {
    await supabase.from('indirimler').update({ aktif }).eq('id', id)
    setIndirimler(prev => prev.map(i => i.id === id ? { ...i, aktif } : i))
    toast.success(aktif ? 'İndirim aktif edildi' : 'İndirim pasif yapıldı')
  }

  const indirimSil = async (id: string) => {
    if (!confirm('Bu indirim kodu silinsin mi?')) return
    await supabase.from('indirimler').delete().eq('id', id)
    setIndirimler(prev => prev.filter(i => i.id !== id))
    toast.success('İndirim silindi')
  }

  const kodKopyala = (kod: string) => {
    navigator.clipboard.writeText(kod)
    toast.success('Kod kopyalandı!')
  }

  if (yukleniyor) return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
      <RefreshCw className="w-8 h-8 animate-spin text-yellow-500" />
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tag className="text-pink-400" />
            İndirim & Kuponlar
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad}</p>
        </div>
        <Button onClick={() => setEkleModal(true)} className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold">
          <Plus className="w-4 h-4 mr-2" />
          Kupon Oluştur
        </Button>
      </div>

      {indirimler.length === 0 ? (
        <Card className="p-12 bg-zinc-800 border-zinc-700 text-center">
          <Tag className="w-12 h-12 mx-auto mb-3 text-zinc-500 opacity-40" />
          <p className="text-zinc-400 mb-4">Henüz indirim kodu oluşturulmamış</p>
          <Button onClick={() => setEkleModal(true)} className="bg-yellow-500 text-black">
            <Plus className="w-4 h-4 mr-2" />İlk Kuponu Oluştur
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {indirimler.map(indirim => (
            <Card key={indirim.id} className={`p-4 border ${indirim.aktif ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-800/50 border-zinc-700/50 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => kodKopyala(indirim.kod)}
                    className="font-black text-xl text-yellow-400 hover:text-yellow-300 flex items-center gap-1"
                  >
                    {indirim.kod}
                    <Copy className="w-3 h-3 opacity-60" />
                  </button>
                </div>
                <Badge className={indirim.aktif ? 'bg-green-800 text-green-200' : 'bg-zinc-700 text-zinc-400'}>
                  {indirim.aktif ? 'Aktif' : 'Pasif'}
                </Badge>
              </div>

              <div className="space-y-1 mb-3">
                <div className="flex items-center gap-2 text-sm">
                  {indirim.tip === 'yuzde' ? (
                    <Percent className="w-4 h-4 text-green-400" />
                  ) : (
                    <DollarSign className="w-4 h-4 text-green-400" />
                  )}
                  <span className="text-green-400 font-bold">
                    {indirim.tip === 'yuzde' ? `%${indirim.deger} indirim` : `${indirim.deger}₺ indirim`}
                  </span>
                </div>
                {indirim.min_tutar && (
                  <p className="text-xs text-zinc-400">Min. tutar: {indirim.min_tutar}₺</p>
                )}
                <p className="text-xs text-zinc-400">
                  Kullanım: {indirim.kullanim_sayisi}{indirim.max_kullanim ? `/${indirim.max_kullanim}` : ''}
                </p>
                {indirim.bitis_tarihi && (
                  <p className="text-xs text-zinc-400">
                    Bitiş: {new Date(indirim.bitis_tarihi).toLocaleDateString('tr-TR')}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => durumDegistir(indirim.id, !indirim.aktif)}
                  className={`flex-1 ${indirim.aktif ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-green-700 hover:bg-green-600'}`}
                >
                  {indirim.aktif ? <ToggleRight className="w-3 h-3 mr-1" /> : <ToggleLeft className="w-3 h-3 mr-1" />}
                  {indirim.aktif ? 'Pasif Yap' : 'Aktif Et'}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => indirimSil(indirim.id)} className="w-9 p-0">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Ekle Modal */}
      {ekleModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="p-6 bg-zinc-800 border-zinc-700 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Kupon Oluştur</h2>
            <div className="space-y-3">
              <div>
                <Label className="text-zinc-300 mb-1 block">Kupon Kodu</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="YENI20"
                    value={yeni.kod}
                    onChange={e => setYeni(p => ({ ...p, kod: e.target.value.toUpperCase() }))}
                    className="bg-zinc-700 border-zinc-600 font-mono"
                  />
                  <Button onClick={rastgeleKodOlustur} variant="outline" className="border-zinc-600 flex-shrink-0">
                    Rastgele
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-zinc-300 mb-1 block">Tip</Label>
                  <Select value={yeni.tip} onValueChange={v => setYeni(p => ({ ...p, tip: v as any }))}>
                    <SelectTrigger className="bg-zinc-700 border-zinc-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                      <SelectItem value="yuzde" className="text-white">Yüzde (%)</SelectItem>
                      <SelectItem value="sabit" className="text-white">Sabit (₺)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-zinc-300 mb-1 block">Değer</Label>
                  <Input
                    type="number"
                    placeholder={yeni.tip === 'yuzde' ? '20' : '50'}
                    value={yeni.deger}
                    onChange={e => setYeni(p => ({ ...p, deger: e.target.value }))}
                    className="bg-zinc-700 border-zinc-600"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-zinc-300 mb-1 block">Min. Tutar (₺)</Label>
                  <Input
                    type="number"
                    placeholder="100"
                    value={yeni.min_tutar}
                    onChange={e => setYeni(p => ({ ...p, min_tutar: e.target.value }))}
                    className="bg-zinc-700 border-zinc-600"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300 mb-1 block">Max Kullanım</Label>
                  <Input
                    type="number"
                    placeholder="Sınırsız"
                    value={yeni.max_kullanim}
                    onChange={e => setYeni(p => ({ ...p, max_kullanim: e.target.value }))}
                    className="bg-zinc-700 border-zinc-600"
                  />
                </div>
              </div>
              <div>
                <Label className="text-zinc-300 mb-1 block">Bitiş Tarihi</Label>
                <Input
                  type="date"
                  value={yeni.bitis_tarihi}
                  onChange={e => setYeni(p => ({ ...p, bitis_tarihi: e.target.value }))}
                  className="bg-zinc-700 border-zinc-600"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <Button onClick={() => setEkleModal(false)} variant="outline" className="flex-1 border-zinc-600">İptal</Button>
              <Button onClick={indirimEkle} disabled={ekleniyor} className="flex-1 bg-yellow-500 text-black font-bold">
                {ekleniyor ? 'Oluşturuluyor...' : 'Oluştur'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
