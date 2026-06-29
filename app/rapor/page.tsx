'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { TrendingUp, Package, Clock, LayoutDashboard, DollarSign, BarChart3 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { Badge } from '@/components/ui/badge'

type CiroGun = { tarih: string; ciro: number }
type UrunSatis = { ad: string; adet: number; ciro: number }
type Saatlik = { saat: string; siparis: number }

export default function RaporPage() {
  const [restoran, setRestoran] = useState<any>(null)
  const [haftalikCiro, setHaftalikCiro] = useState<CiroGun[]>([])
  const [enCokSatan, setEnCokSatan] = useState<UrunSatis[]>([])
  const [saatlikYogunluk, setSaatlikYogunluk] = useState<Saatlik[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
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

    await Promise.all([
      getHaftalikCiro(restoranData.id),
      getEnCokSatan(restoranData.id),
      getSaatlikYogunluk(restoranData.id)
    ])

    setYukleniyor(false)
  }

  async function getHaftalikCiro(restoranId: string) {
    const yediGunOnce = new Date()
    yediGunOnce.setDate(yediGunOnce.getDate() - 7)

    const { data } = await supabase
     .from('siparisler')
     .select('toplam_tutar, created_at')
     .eq('restoran_id', restoranId)
     .eq('durum', 'odendi')
     .gte('created_at', yediGunOnce.toISOString())

    if (!data) return

    const gunMap: Record<string, number> = {}
    data.forEach(s => {
      const gun = new Date(s.created_at).toLocaleDateString('tr-TR', { weekday: 'short' })
      gunMap[gun] = (gunMap[gun] || 0) + Number(s.toplam_tutar)
    })

    const gunler = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
    const sonuc = gunler.map(gun => ({
      tarih: gun,
      ciro: gunMap[gun] || 0
    }))

    setHaftalikCiro(sonuc)
  }

  async function getEnCokSatan(restoranId: string) {
    const otuzGunOnce = new Date()
    otuzGunOnce.setDate(otuzGunOnce.getDate() - 30)

    const { data } = await supabase
     .from('siparis_urunleri')
     .select(`
        adet,
        birim_fiyat,
        urunler (ad),
        siparisler!inner (restoran_id, durum, created_at)
      `)
     .eq('siparisler.restoran_id', restoranId)
     .eq('siparisler.durum', 'odendi')
     .gte('siparisler.created_at', otuzGunOnce.toISOString())

    if (!data) return

    const urunMap: Record<string, UrunSatis> = {}
    data.forEach((item: any) => {
      const ad = item.urunler.ad
      if (!urunMap[ad]) {
        urunMap[ad] = { ad, adet: 0, ciro: 0 }
      }
      urunMap[ad].adet += item.adet
      urunMap[ad].ciro += item.adet * item.birim_fiyat
    })

    const sirali = Object.values(urunMap)
     .sort((a, b) => b.adet - a.adet)
     .slice(0, 10)

    setEnCokSatan(sirali)
  }

  async function getSaatlikYogunluk(restoranId: string) {
    const bugun = new Date()
    bugun.setHours(0, 0, 0, 0)

    const { data } = await supabase
     .from('siparisler')
     .select('created_at')
     .eq('restoran_id', restoranId)
     .gte('created_at', bugun.toISOString())

    if (!data) return

    const saatMap: Record<string, number> = {}
    data.forEach(s => {
      const saat = new Date(s.created_at).getHours()
      const saatStr = `${saat}:00`
      saatMap[saatStr] = (saatMap[saatStr] || 0) + 1
    })

    const sonuc: Saatlik[] = []
    for (let i = 8; i <= 23; i++) {
      const saatStr = `${i}:00`
      sonuc.push({ saat: saatStr, siparis: saatMap[saatStr] || 0 })
    }

    setSaatlikYogunluk(sonuc)
  }

  if (yukleniyor) {
    return <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
      Raporlar yükleniyor...
    </div>
  }

  const toplamCiro = haftalikCiro.reduce((sum, g) => sum + g.ciro, 0)
  const RENKLER = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899']

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-green-500" />
            Raporlar
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push('/dashboard')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <LayoutDashboard className="w-4 h-4 mr-1.5" />
            Dashboard
          </Button>
          <Button onClick={() => router.push('/kasa')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <DollarSign className="w-4 h-4 mr-1.5" />
            Kasa
          </Button>
          <Button onClick={() => router.push('/giderler')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <TrendingUp className="w-4 h-4 mr-1.5" />
            Giderler
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-6 bg-gradient-to-br from-green-900/50 to-zinc-800 border-green-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">7 Günlük Ciro</p>
              <p className="text-3xl font-bold text-green-400">{toplamCiro.toFixed(2)}₺</p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-900/50 to-zinc-800 border-blue-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">En Çok Satan</p>
              <p className="text-xl font-bold text-blue-400">{enCokSatan[0]?.ad || '-'}</p>
            </div>
            <Package className="w-12 h-12 text-blue-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-900/50 to-zinc-800 border-orange-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-400">Yoğun Saat</p>
              <p className="text-xl font-bold text-orange-400">
                {saatlikYogunluk.reduce((max, s) => s.siparis > max.siparis? s : max, saatlikYogunluk[0])?.saat || '-'}
              </p>
            </div>
            <Clock className="w-12 h-12 text-orange-500 opacity-50" />
          </div>
        </Card>
      </div>

      <Tabs defaultValue="ciro" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
          <TabsTrigger value="ciro" className="data-[state=active]:bg-green-600">
            <TrendingUp className="w-4 h-4 mr-2" />
            Haftalık Ciro
          </TabsTrigger>
          <TabsTrigger value="urunler" className="data-[state=active]:bg-blue-600">
            <Package className="w-4 h-4 mr-2" />
            En Çok Satan
          </TabsTrigger>
          <TabsTrigger value="saatlik" className="data-[state=active]:bg-orange-600">
            <Clock className="w-4 h-4 mr-2" />
            Saatlik Yoğunluk
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ciro" className="mt-6">
          <Card className="p-6 bg-zinc-800 border-zinc-700">
            <h3 className="text-xl font-bold mb-4">Son 7 Gün Ciro Grafiği</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={haftalikCiro}>
                <XAxis dataKey="tarih" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
                  formatter={(value: any) => `${Number(value).toFixed(2)}₺`}
                />
                <Bar dataKey="ciro" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>

        <TabsContent value="urunler" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6 bg-zinc-800 border-zinc-700">
              <h3 className="text-xl font-bold mb-4">Top 10 Ürün</h3>
              <div className="space-y-3">
                {enCokSatan.map((urun, i) => (
                  <div key={urun.ad} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-zinc-700">{i + 1}</Badge>
                      <div>
                        <p className="font-medium">{urun.ad}</p>
                        <p className="text-sm text-zinc-400">{urun.adet} adet</p>
                      </div>
                    </div>
                    <p className="font-bold text-yellow-500">{urun.ciro.toFixed(2)}₺</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-zinc-800 border-zinc-700">
              <h3 className="text-xl font-bold mb-4">Ciro Dağılımı</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={enCokSatan.slice(0, 6)}
                    dataKey="ciro"
                    nameKey="ad"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {enCokSatan.slice(0, 6).map((_, i) => (
                      <Cell key={i} fill={RENKLER[i % RENKLER.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
                    formatter={(value: any) => `${Number(value).toFixed(2)}₺`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="saatlik" className="mt-6">
          <Card className="p-6 bg-zinc-800 border-zinc-700">
            <h3 className="text-xl font-bold mb-4">Bugün Saatlik Sipariş Yoğunluğu</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={saatlikYogunluk}>
                <XAxis dataKey="saat" stroke="#71717a" />
                <YAxis stroke="#71717a" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
                  formatter={(value: any) => `${value} sipariş`}
                />
                <Bar dataKey="siparis" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
