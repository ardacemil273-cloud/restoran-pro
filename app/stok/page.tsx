'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { AlertTriangle, Package, TrendingDown, CheckCircle, Edit2, Save, X, RefreshCw } from 'lucide-react'

type Urun = {
  id: string
  ad: string
  fiyat: number
  stok: number | null
  kritik_stok: number
  stok_birimi: string
  aktif: boolean
  kategoriler?: { ad: string }
}

export default function StokPage() {
  const [urunler, setUrunler] = useState<Urun[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null)
  const [duzenlemeVerisi, setDuzenlemeVerisi] = useState({ stok: '', kritik_stok: '', stok_birimi: '' })
  const [filtre, setFiltre] = useState<'hepsi' | 'kritik' | 'tukendi' | 'takipsiz'>('hepsi')
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

    if (!restoranData) return
    setRestoran(restoranData)

    const { data: urunData } = await supabase
      .from('urunler')
      .select('*, kategoriler(ad)')
      .eq('restoran_id', restoranData.id)
      .order('ad')

    setUrunler(urunData || [])
    setYukleniyor(false)
  }

  const stokDurumu = (urun: Urun): 'tukendi' | 'kritik' | 'normal' | 'takipsiz' => {
    if (urun.stok === null) return 'takipsiz'
    if (urun.stok === 0) return 'tukendi'
    if (urun.stok <= urun.kritik_stok) return 'kritik'
    return 'normal'
  }

  const duzenlemeBaslat = (urun: Urun) => {
    setDuzenlenenId(urun.id)
    setDuzenlemeVerisi({
      stok: urun.stok?.toString() ?? '',
      kritik_stok: urun.kritik_stok?.toString() ?? '5',
      stok_birimi: urun.stok_birimi ?? 'adet'
    })
  }

  const stokKaydet = async (urunId: string) => {
    const stokDeger = duzenlemeVerisi.stok === '' ? null : parseInt(duzenlemeVerisi.stok)
    const kritikDeger = parseInt(duzenlemeVerisi.kritik_stok) || 5

    const { error } = await supabase
      .from('urunler')
      .update({
        stok: stokDeger,
        kritik_stok: kritikDeger,
        stok_birimi: duzenlemeVerisi.stok_birimi || 'adet'
      })
      .eq('id', urunId)

    if (error) {
      toast.error('Stok güncellenemedi')
      return
    }

    toast.success('Stok güncellendi')
    setDuzenlenenId(null)
    loadData()
  }

  const hizliStokGuncelle = async (urunId: string, delta: number) => {
    const urun = urunler.find(u => u.id === urunId)
    if (!urun || urun.stok === null) return

    const yeniStok = Math.max(0, urun.stok + delta)
    await supabase.from('urunler').update({ stok: yeniStok }).eq('id', urunId)
    setUrunler(prev => prev.map(u => u.id === urunId ? { ...u, stok: yeniStok } : u))
  }

  const filtrelenmisUrunler = urunler.filter(u => {
    const durum = stokDurumu(u)
    if (filtre === 'hepsi') return true
    return durum === filtre
  })

  const kritikSayisi = urunler.filter(u => stokDurumu(u) === 'kritik').length
  const tukenenSayisi = urunler.filter(u => stokDurumu(u) === 'tukendi').length
  const takipliSayisi = urunler.filter(u => u.stok !== null).length

  const durumRenk = {
    tukendi: 'bg-red-500',
    kritik: 'bg-orange-500',
    normal: 'bg-green-500',
    takipsiz: 'bg-zinc-500'
  }

  const durumMetin = {
    tukendi: 'Tükendi',
    kritik: 'Kritik',
    normal: 'Yeterli',
    takipsiz: 'Takipsiz'
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin mr-2" />
        Stok verileri yükleniyor...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Package className="text-yellow-500" />
            Stok Yönetimi
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad}</p>
        </div>
        <Button onClick={loadData} variant="outline" className="border-zinc-600">
          <RefreshCw className="w-4 h-4 mr-2" />
          Yenile
        </Button>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4 bg-red-950/40 border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-400">Tükenen</p>
              <p className="text-3xl font-bold text-red-400">{tukenenSayisi}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
        <Card className="p-4 bg-orange-950/40 border-orange-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-orange-400">Kritik Seviye</p>
              <p className="text-3xl font-bold text-orange-400">{kritikSayisi}</p>
            </div>
            <TrendingDown className="w-8 h-8 text-orange-500" />
          </div>
        </Card>
        <Card className="p-4 bg-green-950/40 border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-400">Takipli Ürün</p>
              <p className="text-3xl font-bold text-green-400">{takipliSayisi}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4 bg-zinc-800 border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400">Toplam Ürün</p>
              <p className="text-3xl font-bold text-zinc-300">{urunler.length}</p>
            </div>
            <Package className="w-8 h-8 text-zinc-500" />
          </div>
        </Card>
      </div>

      {/* Filtreler */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['hepsi', 'tukendi', 'kritik', 'takipsiz'] as const).map(f => (
          <Button
            key={f}
            onClick={() => setFiltre(f)}
            variant={filtre === f ? 'default' : 'outline'}
            size="sm"
            className={filtre === f ? 'bg-yellow-500 text-black' : 'border-zinc-600 text-zinc-400'}
          >
            {f === 'hepsi' && 'Tümü'}
            {f === 'tukendi' && `Tükenen (${tukenenSayisi})`}
            {f === 'kritik' && `Kritik (${kritikSayisi})`}
            {f === 'takipsiz' && 'Takipsiz'}
          </Button>
        ))}
      </div>

      {/* Ürün Listesi */}
      <div className="space-y-2">
        {filtrelenmisUrunler.map(urun => {
          const durum = stokDurumu(urun)
          const duzenleniyor = duzenlenenId === urun.id

          return (
            <Card
              key={urun.id}
              className={`p-4 border ${
                durum === 'tukendi' ? 'border-red-700 bg-red-950/20' :
                durum === 'kritik' ? 'border-orange-700 bg-orange-950/20' :
                'border-zinc-700 bg-zinc-800'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Badge className={`${durumRenk[durum]} text-white text-xs flex-shrink-0`}>
                    {durumMetin[durum]}
                  </Badge>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{urun.ad}</p>
                    <p className="text-xs text-zinc-400">{urun.kategoriler?.ad} · {urun.fiyat}₺</p>
                  </div>
                </div>

                {duzenleniyor ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex flex-col gap-1">
                      <Input
                        type="number"
                        placeholder="Stok"
                        value={duzenlemeVerisi.stok}
                        onChange={e => setDuzenlemeVerisi(p => ({ ...p, stok: e.target.value }))}
                        className="w-20 h-8 bg-zinc-700 border-zinc-600 text-sm"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Input
                        type="number"
                        placeholder="Kritik"
                        value={duzenlemeVerisi.kritik_stok}
                        onChange={e => setDuzenlemeVerisi(p => ({ ...p, kritik_stok: e.target.value }))}
                        className="w-20 h-8 bg-zinc-700 border-zinc-600 text-sm"
                      />
                    </div>
                    <Input
                      placeholder="Birim"
                      value={duzenlemeVerisi.stok_birimi}
                      onChange={e => setDuzenlemeVerisi(p => ({ ...p, stok_birimi: e.target.value }))}
                      className="w-20 h-8 bg-zinc-700 border-zinc-600 text-sm"
                    />
                    <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700" onClick={() => stokKaydet(urun.id)}>
                      <Save className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="outline" className="h-8 w-8 border-zinc-600" onClick={() => setDuzenlenenId(null)}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {urun.stok !== null ? (
                      <>
                        <div className="flex items-center gap-1">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 border-zinc-600"
                            onClick={() => hizliStokGuncelle(urun.id, -1)}
                          >
                            <span className="text-sm font-bold">-</span>
                          </Button>
                          <span className={`w-16 text-center font-bold text-lg ${
                            durum === 'tukendi' ? 'text-red-400' :
                            durum === 'kritik' ? 'text-orange-400' :
                            'text-green-400'
                          }`}>
                            {urun.stok} {urun.stok_birimi}
                          </span>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 border-zinc-600"
                            onClick={() => hizliStokGuncelle(urun.id, 1)}
                          >
                            <span className="text-sm font-bold">+</span>
                          </Button>
                        </div>
                        <span className="text-xs text-zinc-500">Kritik: {urun.kritik_stok}</span>
                      </>
                    ) : (
                      <span className="text-zinc-500 text-sm">Takip yok</span>
                    )}
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8 border-zinc-600"
                      onClick={() => duzenlemeBaslat(urun)}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {filtrelenmisUrunler.length === 0 && (
        <Card className="p-12 bg-zinc-800 border-zinc-700 text-center text-zinc-400">
          Bu filtrede ürün bulunamadı
        </Card>
      )}

      <p className="text-xs text-zinc-600 mt-6 text-center">
        Stok takibi için ürünlerin yanındaki düzenle butonuna tıklayın. Stok alanını boş bırakırsanız takip devre dışı kalır.
      </p>
    </div>
  )
}
