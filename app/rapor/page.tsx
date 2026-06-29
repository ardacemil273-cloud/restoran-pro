'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { TrendingUp, Package, Clock, LayoutDashboard, DollarSign, BarChart3, RefreshCw, Calendar, Target } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid } from 'recharts'
import { Badge } from '@/components/ui/badge'

type CiroGun = { tarih: string; ciro: number }
type UrunSatis = { ad: string; adet: number; ciro: number }
type Saatlik = { saat: string; siparis: number }
type AylikCiro = { ay: string; ciro: number; siparisSayisi: number }

function RaporSkeleton() {
  return (
    <div className="p-6 bg-zinc-900 min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-8 bg-zinc-700 rounded-lg animate-pulse" />
        <div className="h-7 w-28 bg-zinc-700 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1,2,3].map(i => <div key={i} className="h-28 bg-zinc-800 rounded-xl animate-pulse" />)}
      </div>
      <div className="h-10 bg-zinc-800 rounded-xl animate-pulse mb-6" />
      <div className="h-80 bg-zinc-800 rounded-xl animate-pulse" />
    </div>
  )
}

export default function RaporPage() {
  const [restoran, setRestoran] = useState<any>(null)
  const [haftalikCiro, setHaftalikCiro] = useState<CiroGun[]>([])
  const [aylikCiro, setAylikCiro] = useState<AylikCiro[]>([])
  const [enCokSatan, setEnCokSatan] = useState<UrunSatis[]>([])
  const [saatlikYogunluk, setSaatlikYogunluk] = useState<Saatlik[]>([])
  const [bugunCiro, setBugunCiro] = useState(0)
  const [bugunSiparisSayisi, setBugunSiparisSayisi] = useState(0)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [yenileniyor, setYenileniyor] = useState(false)
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData(silent = false) {
    if (!silent) setYukleniyor(true)
    else setYenileniyor(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar').select('*').eq('sahibi_id', user.id).single()

    if (!restoranData) { toast.error('Restoran bulunamadı'); return }
    setRestoran(restoranData)

    await Promise.all([
      getHaftalikCiro(restoranData.id),
      getAylikCiro(restoranData.id),
      getEnCokSatan(restoranData.id),
      getSaatlikYogunluk(restoranData.id),
      getBugunStats(restoranData.id)
    ])

    setYukleniyor(false)
    setYenileniyor(false)
  }

  async function getBugunStats(restoranId: string) {
    const bugun = new Date()
    bugun.setHours(0, 0, 0, 0)
    const { data } = await supabase
      .from('siparisler').select('toplam_tutar, durum')
      .eq('restoran_id', restoranId)
      .gte('created_at', bugun.toISOString())
    if (!data) return
    const tamamlanan = data.filter(s => s.durum === 'tamamlandi' || s.durum === 'odendi')
    setBugunCiro(tamamlanan.reduce((sum, s) => sum + Number(s.toplam_tutar), 0))
    setBugunSiparisSayisi(data.length)
  }

  async function getHaftalikCiro(restoranId: string) {
    const yediGunOnce = new Date()
    yediGunOnce.setDate(yediGunOnce.getDate() - 7)
    const { data } = await supabase
      .from('siparisler').select('toplam_tutar, created_at')
      .eq('restoran_id', restoranId)
      .in('durum', ['tamamlandi', 'odendi'])
      .gte('created_at', yediGunOnce.toISOString())
    if (!data) return
    const gunMap: Record<string, number> = {}
    data.forEach(s => {
      const gun = new Date(s.created_at).toLocaleDateString('tr-TR', { weekday: 'short' })
      gunMap[gun] = (gunMap[gun] || 0) + Number(s.toplam_tutar)
    })
    const gunler = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
    setHaftalikCiro(gunler.map(gun => ({ tarih: gun, ciro: gunMap[gun] || 0 })))
  }

  async function getAylikCiro(restoranId: string) {
    const altiAyOnce = new Date()
    altiAyOnce.setMonth(altiAyOnce.getMonth() - 6)
    const { data } = await supabase
      .from('siparisler').select('toplam_tutar, created_at, durum')
      .eq('restoran_id', restoranId)
      .in('durum', ['tamamlandi', 'odendi'])
      .gte('created_at', altiAyOnce.toISOString())
    if (!data) return
    const ayMap: Record<string, { ciro: number; siparisSayisi: number }> = {}
    data.forEach(s => {
      const ay = new Date(s.created_at).toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' })
      if (!ayMap[ay]) ayMap[ay] = { ciro: 0, siparisSayisi: 0 }
      ayMap[ay].ciro += Number(s.toplam_tutar)
      ayMap[ay].siparisSayisi++
    })
    const sonuc = Object.entries(ayMap).map(([ay, v]) => ({ ay, ...v }))
    setAylikCiro(sonuc)
  }

  async function getEnCokSatan(restoranId: string) {
    const otuzGunOnce = new Date()
    otuzGunOnce.setDate(otuzGunOnce.getDate() - 30)
    const { data } = await supabase
      .from('siparis_urunleri')
      .select('adet, birim_fiyat, urunler (ad), siparisler!inner (restoran_id, durum, created_at)')
      .eq('siparisler.restoran_id', restoranId)
      .in('siparisler.durum', ['tamamlandi', 'odendi'])
      .gte('siparisler.created_at', otuzGunOnce.toISOString())
    if (!data) return
    const urunMap: Record<string, UrunSatis> = {}
    data.forEach((item: any) => {
      const ad = item.urunler.ad
      if (!urunMap[ad]) urunMap[ad] = { ad, adet: 0, ciro: 0 }
      urunMap[ad].adet += item.adet
      urunMap[ad].ciro += item.adet * item.birim_fiyat
    })
    setEnCokSatan(Object.values(urunMap).sort((a, b) => b.adet - a.adet).slice(0, 10))
  }

  async function getSaatlikYogunluk(restoranId: string) {
    const bugun = new Date()
    bugun.setHours(0, 0, 0, 0)
    const { data } = await supabase
      .from('siparisler').select('created_at')
      .eq('restoran_id', restoranId)
      .gte('created_at', bugun.toISOString())
    if (!data) return
    const saatMap: Record<string, number> = {}
    data.forEach(s => {
      const saatStr = `${new Date(s.created_at).getHours()}:00`
      saatMap[saatStr] = (saatMap[saatStr] || 0) + 1
    })
    const sonuc: Saatlik[] = []
    for (let i = 8; i <= 23; i++) {
      const saatStr = `${i}:00`
      sonuc.push({ saat: saatStr, siparis: saatMap[saatStr] || 0 })
    }
    setSaatlikYogunluk(sonuc)
  }

  if (yukleniyor) return <RaporSkeleton />

  const toplamCiro = haftalikCiro.reduce((sum, g) => sum + g.ciro, 0)
  const RENKLER = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899']
  const yogunSaat = saatlikYogunluk.length > 0
    ? saatlikYogunluk.reduce((max, s) => s.siparis > max.siparis ? s : max, saatlikYogunluk[0])
    : null

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4 md:p-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <BarChart3 className="w-7 h-7 text-green-500" />
            Raporlar & Analiz
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad} — Son 30 gün analizi</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push('/dashboard')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <LayoutDashboard className="w-4 h-4 mr-1.5" />Dashboard
          </Button>
          <Button onClick={() => router.push('/kasa')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <DollarSign className="w-4 h-4 mr-1.5" />Kasa
          </Button>
          <Button onClick={() => loadData(true)} variant="outline" size="sm" className="border-zinc-600 hover:bg-zinc-800" disabled={yenileniyor}>
            <RefreshCw className={`w-4 h-4 ${yenileniyor ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </motion.div>

      {/* Özet Kartlar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <Card className="p-5 bg-gradient-to-br from-green-900/50 to-zinc-800 border-green-700">
          <p className="text-xs text-zinc-400 mb-1">Bugünkü Ciro</p>
          <p className="text-2xl font-black text-green-400">{bugunCiro.toFixed(2)}₺</p>
          <p className="text-xs text-zinc-500 mt-1">{bugunSiparisSayisi} sipariş</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-yellow-900/50 to-zinc-800 border-yellow-700">
          <p className="text-xs text-zinc-400 mb-1">7 Günlük Ciro</p>
          <p className="text-2xl font-black text-yellow-400">{toplamCiro.toFixed(2)}₺</p>
          <p className="text-xs text-zinc-500 mt-1">son 7 gün</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-blue-900/50 to-zinc-800 border-blue-700">
          <p className="text-xs text-zinc-400 mb-1">En Çok Satan</p>
          <p className="text-lg font-black text-blue-400 truncate">{enCokSatan[0]?.ad || '-'}</p>
          <p className="text-xs text-zinc-500 mt-1">{enCokSatan[0]?.adet || 0} adet</p>
        </Card>
        <Card className="p-5 bg-gradient-to-br from-orange-900/50 to-zinc-800 border-orange-700">
          <p className="text-xs text-zinc-400 mb-1">Yoğun Saat</p>
          <p className="text-2xl font-black text-orange-400">{yogunSaat?.saat || '-'}</p>
          <p className="text-xs text-zinc-500 mt-1">{yogunSaat?.siparis || 0} sipariş</p>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Tabs defaultValue="ciro" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-zinc-800 mb-2">
            <TabsTrigger value="ciro" className="data-[state=active]:bg-green-600 text-xs sm:text-sm">
              <TrendingUp className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Haftalık</span> Ciro
            </TabsTrigger>
            <TabsTrigger value="aylik" className="data-[state=active]:bg-yellow-600 text-xs sm:text-sm">
              <Calendar className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Aylık</span> Trend
            </TabsTrigger>
            <TabsTrigger value="urunler" className="data-[state=active]:bg-blue-600 text-xs sm:text-sm">
              <Package className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">En Çok</span> Satan
            </TabsTrigger>
            <TabsTrigger value="saatlik" className="data-[state=active]:bg-orange-600 text-xs sm:text-sm">
              <Clock className="w-4 h-4 mr-1 sm:mr-2" />
              Saatlik
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ciro" className="mt-4">
            <Card className="p-6 bg-zinc-800 border-zinc-700">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />Son 7 Gün Ciro Grafiği
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={haftalikCiro}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="tarih" stroke="#71717a" />
                  <YAxis stroke="#71717a" tickFormatter={(v) => `${v}₺`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                    formatter={(value: any) => [`${Number(value).toFixed(2)}₺`, 'Ciro']}
                  />
                  <Bar dataKey="ciro" fill="#10b981" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>

          <TabsContent value="aylik" className="mt-4">
            <Card className="p-6 bg-zinc-800 border-zinc-700">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-yellow-400" />Son 6 Ay Ciro Trendi
              </h3>
              {aylikCiro.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Henüz yeterli aylık veri yok</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={aylikCiro}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                    <XAxis dataKey="ay" stroke="#71717a" />
                    <YAxis stroke="#71717a" tickFormatter={(v) => `${v}₺`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                      formatter={(value: any, name: any) => [
                        name === 'ciro' ? `${Number(value).toFixed(2)}₺` : `${value} sipariş`,
                        name === 'ciro' ? 'Ciro' : 'Sipariş'
                      ]}
                    />
                    <Line type="monotone" dataKey="ciro" stroke="#f59e0b" strokeWidth={3} dot={{ fill: '#f59e0b', r: 5 }} />
                    <Line type="monotone" dataKey="siparisSayisi" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="urunler" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 bg-zinc-800 border-zinc-700">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-400" />Top 10 Ürün (30 Gün)
                </h3>
                {enCokSatan.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">
                    <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>Henüz satış verisi yok</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {enCokSatan.map((urun, i) => (
                      <motion.div
                        key={urun.ad}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Badge className={`shrink-0 ${i === 0 ? 'bg-yellow-600' : i === 1 ? 'bg-zinc-500' : i === 2 ? 'bg-orange-700' : 'bg-zinc-700'}`}>
                            {i + 1}
                          </Badge>
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{urun.ad}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <div className="h-1.5 bg-zinc-700 rounded-full flex-1 max-w-24">
                                <div
                                  className="h-1.5 bg-blue-500 rounded-full"
                                  style={{ width: `${(urun.adet / (enCokSatan[0]?.adet || 1)) * 100}%` }}
                                />
                              </div>
                              <p className="text-xs text-zinc-400 shrink-0">{urun.adet} adet</p>
                            </div>
                          </div>
                        </div>
                        <p className="font-bold text-yellow-500 text-sm shrink-0 ml-2">{urun.ciro.toFixed(2)}₺</p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </Card>
              <Card className="p-6 bg-zinc-800 border-zinc-700">
                <h3 className="text-lg font-bold mb-4">Ciro Dağılımı</h3>
                {enCokSatan.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500">Veri yok</div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={enCokSatan.slice(0, 6)} dataKey="ciro" nameKey="ad" cx="50%" cy="50%" outerRadius={100}
                        label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      >
                        {enCokSatan.slice(0, 6).map((_, i) => (
                          <Cell key={i} fill={RENKLER[i % RENKLER.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                        formatter={(value: any) => `${Number(value).toFixed(2)}₺`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="saatlik" className="mt-4">
            <Card className="p-6 bg-zinc-800 border-zinc-700">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />Bugün Saatlik Sipariş Yoğunluğu
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={saatlikYogunluk}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
                  <XAxis dataKey="saat" stroke="#71717a" />
                  <YAxis stroke="#71717a" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '8px' }}
                    formatter={(value: any) => [`${value} sipariş`, 'Sipariş']}
                  />
                  <Bar dataKey="siparis" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  )
}
