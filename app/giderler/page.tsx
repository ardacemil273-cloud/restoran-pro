'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  TrendingUp, TrendingDown, DollarSign, Plus, Trash2,
  Home, Zap, Users, ShoppingCart, MoreHorizontal, RefreshCw,
  LayoutDashboard, BarChart3
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

type Gider = {
  id: string
  kategori: string
  aciklama: string
  tutar: number
  tarih: string
  tekrar: string
  created_at: string
}

const KATEGORILER = [
  { value: 'kira', label: 'Kira', icon: Home },
  { value: 'fatura', label: 'Fatura / Elektrik / Su', icon: Zap },
  { value: 'personel', label: 'Personel Maaşı', icon: Users },
  { value: 'malzeme', label: 'Malzeme / Hammadde', icon: ShoppingCart },
  { value: 'diger', label: 'Diğer', icon: MoreHorizontal },
]

const TEKRAR_TIPLERI = [
  { value: 'tek_seferlik', label: 'Tek Seferlik' },
  { value: 'aylik', label: 'Aylık' },
  { value: 'haftalik', label: 'Haftalık' },
]

const KATEGORI_RENK: Record<string, string> = {
  kira: '#ef4444',
  fatura: '#f59e0b',
  personel: '#8b5cf6',
  malzeme: '#3b82f6',
  diger: '#6b7280',
}

export default function GiderlerPage() {
  const [giderler, setGiderler] = useState<Gider[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [donem, setDonem] = useState<'bu_ay' | 'gecen_ay' | 'bu_yil'>('bu_ay')
  const [yeniGider, setYeniGider] = useState({
    kategori: 'kira',
    aciklama: '',
    tutar: '',
    tarih: new Date().toISOString().split('T')[0],
    tekrar: 'tek_seferlik'
  })
  const [ekleniyor, setEkleniyor] = useState(false)
  const [ciro, setCiro] = useState(0)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [donem])

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

    const { baslangic, bitis } = donemAralik()

    // Giderler
    const { data: giderData } = await supabase
      .from('giderler')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .gte('tarih', baslangic)
      .lte('tarih', bitis)
      .order('tarih', { ascending: false })

    setGiderler(giderData || [])

    // Ciro (aynı dönem)
    const { data: ciroData } = await supabase
      .from('siparisler')
      .select('toplam_tutar')
      .eq('restoran_id', restoranData.id)
      .in('durum', ['tamamlandi', 'odendi'])
      .gte('created_at', `${baslangic}T00:00:00`)
      .lte('created_at', `${bitis}T23:59:59`)

    const toplamCiro = ciroData?.reduce((sum, s) => sum + Number(s.toplam_tutar), 0) || 0
    setCiro(toplamCiro)

    setYukleniyor(false)
  }

  const donemAralik = () => {
    const simdi = new Date()
    if (donem === 'bu_ay') {
      const baslangic = new Date(simdi.getFullYear(), simdi.getMonth(), 1).toISOString().split('T')[0]
      const bitis = new Date(simdi.getFullYear(), simdi.getMonth() + 1, 0).toISOString().split('T')[0]
      return { baslangic, bitis }
    } else if (donem === 'gecen_ay') {
      const baslangic = new Date(simdi.getFullYear(), simdi.getMonth() - 1, 1).toISOString().split('T')[0]
      const bitis = new Date(simdi.getFullYear(), simdi.getMonth(), 0).toISOString().split('T')[0]
      return { baslangic, bitis }
    } else {
      const baslangic = `${simdi.getFullYear()}-01-01`
      const bitis = `${simdi.getFullYear()}-12-31`
      return { baslangic, bitis }
    }
  }

  const giderEkle = async () => {
    if (!yeniGider.aciklama || !yeniGider.tutar) {
      toast.error('Açıklama ve tutar zorunlu')
      return
    }

    setEkleniyor(true)
    const { error } = await supabase.from('giderler').insert({
      restoran_id: restoran.id,
      kategori: yeniGider.kategori,
      aciklama: yeniGider.aciklama,
      tutar: parseFloat(yeniGider.tutar),
      tarih: yeniGider.tarih,
      tekrar: yeniGider.tekrar
    })

    if (error) {
      toast.error('Gider eklenemedi: ' + error.message)
      setEkleniyor(false)
      return
    }

    toast.success('Gider eklendi')
    setYeniGider({ kategori: 'kira', aciklama: '', tutar: '', tarih: new Date().toISOString().split('T')[0], tekrar: 'tek_seferlik' })
    setEkleniyor(false)
    loadData()
  }

  const giderSil = async (id: string) => {
    if (!confirm('Bu gideri silmek istediğine emin misin?')) return
    await supabase.from('giderler').delete().eq('id', id)
    toast.success('Gider silindi')
    loadData()
  }

  const toplamGider = giderler.reduce((sum, g) => sum + Number(g.tutar), 0)
  const netKar = ciro - toplamGider
  const karMarji = ciro > 0 ? (netKar / ciro) * 100 : 0

  // Kategori bazlı gider dağılımı
  const kategoriDagilimi = KATEGORILER.map(kat => ({
    ad: kat.label,
    tutar: giderler.filter(g => g.kategori === kat.value).reduce((sum, g) => sum + Number(g.tutar), 0),
    renk: KATEGORI_RENK[kat.value]
  })).filter(k => k.tutar > 0)

  const donemMetin = {
    bu_ay: 'Bu Ay',
    gecen_ay: 'Geçen Ay',
    bu_yil: 'Bu Yıl'
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin mr-2" />
        Giderler yükleniyor...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <TrendingDown className="w-7 h-7 text-red-400" />
            Gider Takibi
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push('/dashboard')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <LayoutDashboard className="w-4 h-4 mr-1.5" />
            Dashboard
          </Button>
          <Button onClick={() => router.push('/rapor')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <BarChart3 className="w-4 h-4 mr-1.5" />
            Raporlar
          </Button>
          {(['bu_ay', 'gecen_ay', 'bu_yil'] as const).map(d => (
            <Button
              key={d}
              onClick={() => setDonem(d)}
              size="sm"
              variant={donem === d ? 'default' : 'outline'}
              className={donem === d ? 'bg-yellow-500 text-black' : 'border-zinc-600 text-zinc-400'}
            >
              {donemMetin[d]}
            </Button>
          ))}
        </div>
      </div>

      {/* Net Kar Özeti */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-5 bg-green-950/40 border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-400 mb-1">Toplam Ciro</p>
              <p className="text-2xl font-bold text-green-400">{ciro.toFixed(2)}₺</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500 opacity-60" />
          </div>
        </Card>

        <Card className="p-5 bg-red-950/40 border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-400 mb-1">Toplam Gider</p>
              <p className="text-2xl font-bold text-red-400">{toplamGider.toFixed(2)}₺</p>
            </div>
            <TrendingDown className="w-8 h-8 text-red-500 opacity-60" />
          </div>
        </Card>

        <Card className={`p-5 border-2 ${netKar >= 0 ? 'bg-emerald-950/40 border-emerald-700' : 'bg-red-950/40 border-red-700'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-xs mb-1 ${netKar >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>Net Kar</p>
              <p className={`text-2xl font-bold ${netKar >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {netKar >= 0 ? '+' : ''}{netKar.toFixed(2)}₺
              </p>
            </div>
            <DollarSign className={`w-8 h-8 opacity-60 ${netKar >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
          </div>
        </Card>

        <Card className="p-5 bg-zinc-800 border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 mb-1">Kar Marjı</p>
              <p className={`text-2xl font-bold ${karMarji >= 20 ? 'text-green-400' : karMarji >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                %{karMarji.toFixed(1)}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xs font-bold ${
              karMarji >= 20 ? 'bg-green-900 text-green-400' :
              karMarji >= 0 ? 'bg-yellow-900 text-yellow-400' :
              'bg-red-900 text-red-400'
            }`}>
              {karMarji >= 20 ? '✓' : karMarji >= 0 ? '~' : '!'}
            </div>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="liste" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-800 mb-6">
          <TabsTrigger value="liste" className="data-[state=active]:bg-red-700">Gider Listesi</TabsTrigger>
          <TabsTrigger value="ekle" className="data-[state=active]:bg-yellow-600">Gider Ekle</TabsTrigger>
          <TabsTrigger value="grafik" className="data-[state=active]:bg-blue-700">Grafik</TabsTrigger>
        </TabsList>

        {/* Gider Listesi */}
        <TabsContent value="liste">
          {giderler.length === 0 ? (
            <Card className="p-12 bg-zinc-800 border-zinc-700 text-center text-zinc-400">
              <TrendingDown className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Bu dönemde gider kaydı yok</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {giderler.map(gider => {
                const kat = KATEGORILER.find(k => k.value === gider.kategori)
                const Icon = kat?.icon || MoreHorizontal
                return (
                  <Card key={gider.id} className="p-4 bg-zinc-800 border-zinc-700">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: KATEGORI_RENK[gider.kategori] + '30', color: KATEGORI_RENK[gider.kategori] }}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{gider.aciklama}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge
                              className="text-xs"
                              style={{ backgroundColor: KATEGORI_RENK[gider.kategori] + '30', color: KATEGORI_RENK[gider.kategori], border: 'none' }}
                            >
                              {kat?.label}
                            </Badge>
                            <span className="text-xs text-zinc-500">
                              {new Date(gider.tarih).toLocaleDateString('tr-TR')}
                            </span>
                            {gider.tekrar !== 'tek_seferlik' && (
                              <Badge className="text-xs bg-zinc-700 text-zinc-300">
                                {gider.tekrar === 'aylik' ? 'Aylık' : 'Haftalık'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-red-400 font-bold text-lg">-{Number(gider.tutar).toFixed(2)}₺</span>
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-8 w-8"
                          onClick={() => giderSil(gider.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Gider Ekle */}
        <TabsContent value="ekle">
          <Card className="p-6 bg-zinc-800 border-zinc-700 max-w-lg">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-yellow-500" />
              Yeni Gider Ekle
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300 mb-2 block">Kategori</Label>
                <Select value={yeniGider.kategori} onValueChange={v => setYeniGider(p => ({ ...p, kategori: v }))}>
                  <SelectTrigger className="bg-zinc-700 border-zinc-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {KATEGORILER.map(kat => (
                      <SelectItem key={kat.value} value={kat.value} className="text-white">
                        {kat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-zinc-300 mb-2 block">Açıklama</Label>
                <Input
                  placeholder="Örn: Ocak ayı kira ödemesi"
                  value={yeniGider.aciklama}
                  onChange={e => setYeniGider(p => ({ ...p, aciklama: e.target.value }))}
                  className="bg-zinc-700 border-zinc-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-zinc-300 mb-2 block">Tutar (₺)</Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={yeniGider.tutar}
                    onChange={e => setYeniGider(p => ({ ...p, tutar: e.target.value }))}
                    className="bg-zinc-700 border-zinc-600"
                  />
                </div>
                <div>
                  <Label className="text-zinc-300 mb-2 block">Tarih</Label>
                  <Input
                    type="date"
                    value={yeniGider.tarih}
                    onChange={e => setYeniGider(p => ({ ...p, tarih: e.target.value }))}
                    className="bg-zinc-700 border-zinc-600"
                  />
                </div>
              </div>

              <div>
                <Label className="text-zinc-300 mb-2 block">Tekrar</Label>
                <Select value={yeniGider.tekrar} onValueChange={v => setYeniGider(p => ({ ...p, tekrar: v }))}>
                  <SelectTrigger className="bg-zinc-700 border-zinc-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {TEKRAR_TIPLERI.map(t => (
                      <SelectItem key={t.value} value={t.value} className="text-white">
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={giderEkle}
                disabled={ekleniyor}
                className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-bold"
              >
                {ekleniyor ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Gider Kaydet
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* Grafik */}
        <TabsContent value="grafik">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-zinc-800 border-zinc-700">
              <h3 className="font-bold mb-4">Kategoriye Göre Gider Dağılımı</h3>
              {kategoriDagilimi.length === 0 ? (
                <p className="text-zinc-500 text-center py-8">Veri yok</p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={kategoriDagilimi} layout="vertical">
                    <XAxis type="number" stroke="#71717a" tickFormatter={v => `${v}₺`} />
                    <YAxis type="category" dataKey="ad" stroke="#71717a" width={100} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
                      formatter={(value: any) => `${Number(value).toFixed(2)}₺`}
                    />
                    <Bar dataKey="tutar" radius={[0, 6, 6, 0]}>
                      {kategoriDagilimi.map((entry, i) => (
                        <Cell key={i} fill={entry.renk} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>

            <Card className="p-6 bg-zinc-800 border-zinc-700">
              <h3 className="font-bold mb-4">Ciro vs Gider Karşılaştırması</h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={[
                  { ad: 'Ciro', tutar: ciro, renk: '#10b981' },
                  { ad: 'Gider', tutar: toplamGider, renk: '#ef4444' },
                  { ad: 'Net Kar', tutar: Math.abs(netKar), renk: netKar >= 0 ? '#3b82f6' : '#f59e0b' }
                ]}>
                  <XAxis dataKey="ad" stroke="#71717a" />
                  <YAxis stroke="#71717a" tickFormatter={v => `${v}₺`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
                    formatter={(value: any) => `${Number(value).toFixed(2)}₺`}
                  />
                  <Bar dataKey="tutar" radius={[8, 8, 0, 0]}>
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                    <Cell fill={netKar >= 0 ? '#3b82f6' : '#f59e0b'} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className={`mt-4 p-3 rounded-lg text-center font-bold ${
                netKar >= 0 ? 'bg-green-950/50 text-green-400' : 'bg-red-950/50 text-red-400'
              }`}>
                {donemMetin[donem]} Net Kar: {netKar >= 0 ? '+' : ''}{netKar.toFixed(2)}₺
                {' '}(Kar Marjı: %{karMarji.toFixed(1)})
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
