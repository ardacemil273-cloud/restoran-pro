'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import {
  ShoppingCart, Users, TrendingUp, Package, ChefHat,
  QrCode, BarChart3, CalendarDays, Tag, Warehouse,
  TrendingDown, Brain, UtensilsCrossed, Phone, ArrowRight,
  Clock, CheckCircle, AlertTriangle, DollarSign, Activity
} from 'lucide-react'

type Stats = {
  aktifSiparis: number
  bugunCiro: number
  toplamMasa: number
  doluMasa: number
  kritikStok: number
  bugunRezervasyonlar: number
  toplamMusteri: number
  bekleyenSiparis: number
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({
    aktifSiparis: 0,
    bugunCiro: 0,
    toplamMasa: 0,
    doluMasa: 0,
    kritikStok: 0,
    bugunRezervasyonlar: 0,
    toplamMusteri: 0,
    bekleyenSiparis: 0
  })
  const [restoran, setRestoran] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sonSiparisler, setSonSiparisler] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    loadData()
    const interval = setInterval(loadData, 30000) // 30 saniyede bir güncelle
    return () => clearInterval(interval)
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
      setLoading(false)
      return
    }

    setRestoran(restoranData)

    const bugun = new Date()
    bugun.setHours(0, 0, 0, 0)
    const bugunStr = bugun.toISOString()

    // Paralel sorgular
    const [masaRes, siparisRes, stokRes, musteriRes, rezervasyonRes, sonSiparisRes] = await Promise.all([
      supabase.from('masalar').select('id, durum').eq('restoran_id', restoranData.id),
      supabase.from('siparisler').select('id, toplam_tutar, durum, created_at').eq('restoran_id', restoranData.id).gte('created_at', bugunStr),
      supabase.from('urunler').select('id, stok, kritik_stok').eq('restoran_id', restoranData.id).not('stok', 'is', null),
      supabase.from('musteriler').select('id', { count: 'exact', head: true }).eq('restoran_id', restoranData.id),
      supabase.from('rezervasyonlar').select('id').eq('restoran_id', restoranData.id).gte('tarih', bugunStr.split('T')[0]).eq('durum', 'bekliyor'),
      supabase.from('siparisler').select('id, toplam_tutar, durum, created_at, masalar(ad)').eq('restoran_id', restoranData.id).order('created_at', { ascending: false }).limit(5)
    ])

    const masalar = masaRes.data || []
    const siparisler = siparisRes.data || []
    const urunler = stokRes.data || []

    const aktifSiparis = siparisler.filter(s => s.durum === 'hazirlaniyor').length
    const bekleyenSiparis = siparisler.filter(s => s.durum === 'hazir').length
    const bugunCiro = siparisler.filter(s => s.durum === 'tamamlandi').reduce((sum, s) => sum + (s.toplam_tutar || 0), 0)
    const doluMasa = masalar.filter(m => m.durum === 'dolu').length
    const kritikStok = urunler.filter(u => u.stok !== null && u.stok <= (u.kritik_stok || 5)).length

    setStats({
      aktifSiparis,
      bugunCiro,
      toplamMasa: masalar.length,
      doluMasa,
      kritikStok,
      bugunRezervasyonlar: rezervasyonRes.data?.length || 0,
      toplamMusteri: musteriRes.count || 0,
      bekleyenSiparis
    })

    setSonSiparisler(sonSiparisRes.data || [])
    setLoading(false)
  }

  const hizliErisim = [
    { ad: 'Masalar', path: '/masalar', icon: ChefHat, renk: 'bg-yellow-500', aciklama: 'Masa durumları' },
    { ad: 'Siparişler', path: '/siparisler', icon: ShoppingCart, renk: 'bg-orange-500', aciklama: 'Aktif siparişler' },
    { ad: 'Kasa', path: '/kasa', icon: DollarSign, renk: 'bg-green-500', aciklama: 'Hızlı satış' },
    { ad: 'QR Kodlar', path: '/qr-kodlar', icon: QrCode, renk: 'bg-blue-500', aciklama: 'QR yönetimi' },
    { ad: 'Ürünler', path: '/urunler', icon: Package, renk: 'bg-purple-500', aciklama: 'Menü yönetimi' },
    { ad: 'Kategoriler', path: '/kategoriler', icon: Tag, renk: 'bg-pink-500', aciklama: 'Kategori yönetimi' },
    { ad: 'Garsonlar', path: '/garsonlar', icon: UtensilsCrossed, renk: 'bg-cyan-500', aciklama: 'Personel yönetimi' },
    { ad: 'Müşteriler', path: '/musteriler', icon: Users, renk: 'bg-indigo-500', aciklama: 'CRM' },
    { ad: 'Rezervasyon', path: '/rezervasyon', icon: CalendarDays, renk: 'bg-teal-500', aciklama: 'Masa rezervasyonu' },
    { ad: 'Stok Takibi', path: '/stok', icon: Warehouse, renk: 'bg-red-500', aciklama: 'Stok yönetimi' },
    { ad: 'Gider Takibi', path: '/giderler', icon: TrendingDown, renk: 'bg-rose-500', aciklama: 'Gider analizi' },
    { ad: 'Raporlar', path: '/rapor', icon: BarChart3, renk: 'bg-violet-500', aciklama: 'Satış raporları' },
    { ad: 'AI Analiz', path: '/ai-analiz', icon: Brain, renk: 'bg-emerald-500', aciklama: 'Yapay zeka analizi' },
    { ad: 'İndirimler', path: '/indirimler', icon: Tag, renk: 'bg-amber-500', aciklama: 'Kupon yönetimi' },
    { ad: 'Aramalar', path: '/aramalar', icon: Phone, renk: 'bg-lime-500', aciklama: 'Paket siparişi' },
    { ad: 'Ayarlar', path: '/ayarlar', icon: Activity, renk: 'bg-zinc-500', aciklama: 'Restoran ayarları' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4" />
          <p className="text-zinc-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-zinc-900 min-h-screen">
      {/* Başlık */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">
              Hoş geldin, {restoran?.ad || 'Restoran'}! 👋
            </h1>
            <p className="text-zinc-400 text-sm">
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card
          className="p-4 bg-zinc-800 border-zinc-700 cursor-pointer hover:border-orange-500 transition"
          onClick={() => router.push('/siparisler')}
        >
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-5 h-5 text-orange-400" />
            {stats.aktifSiparis > 0 && (
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            )}
          </div>
          <p className="text-3xl font-black text-white">{stats.aktifSiparis}</p>
          <p className="text-xs text-zinc-400 mt-1">Aktif Sipariş</p>
          {stats.bekleyenSiparis > 0 && (
            <p className="text-xs text-yellow-500 mt-1">{stats.bekleyenSiparis} hazır bekliyor</p>
          )}
        </Card>

        <Card
          className="p-4 bg-zinc-800 border-zinc-700 cursor-pointer hover:border-green-500 transition"
          onClick={() => router.push('/kasa')}
        >
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="w-5 h-5 text-green-400" />
          </div>
          <p className="text-3xl font-black text-white">
            {stats.bugunCiro.toLocaleString('tr-TR')}₺
          </p>
          <p className="text-xs text-zinc-400 mt-1">Bugünkü Ciro</p>
        </Card>

        <Card
          className="p-4 bg-zinc-800 border-zinc-700 cursor-pointer hover:border-blue-500 transition"
          onClick={() => router.push('/masalar')}
        >
          <div className="flex items-center justify-between mb-2">
            <ChefHat className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-black text-white">
            {stats.doluMasa}/{stats.toplamMasa}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Dolu/Toplam Masa</p>
          {stats.toplamMasa > 0 && (
            <div className="mt-2 bg-zinc-700 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all"
                style={{ width: `${(stats.doluMasa / stats.toplamMasa) * 100}%` }}
              />
            </div>
          )}
        </Card>

        <Card
          className={`p-4 border-zinc-700 cursor-pointer transition ${
            stats.kritikStok > 0
              ? 'bg-red-900/30 border-red-700 hover:border-red-500'
              : 'bg-zinc-800 hover:border-zinc-500'
          }`}
          onClick={() => router.push('/stok')}
        >
          <div className="flex items-center justify-between mb-2">
            <Warehouse className={`w-5 h-5 ${stats.kritikStok > 0 ? 'text-red-400' : 'text-zinc-400'}`} />
            {stats.kritikStok > 0 && (
              <AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" />
            )}
          </div>
          <p className={`text-3xl font-black ${stats.kritikStok > 0 ? 'text-red-400' : 'text-white'}`}>
            {stats.kritikStok}
          </p>
          <p className="text-xs text-zinc-400 mt-1">Kritik Stok</p>
          {stats.kritikStok > 0 && (
            <p className="text-xs text-red-400 mt-1">Dikkat gerekiyor!</p>
          )}
        </Card>
      </div>

      {/* İkinci Satır İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card
          className="p-4 bg-zinc-800 border-zinc-700 cursor-pointer hover:border-teal-500 transition"
          onClick={() => router.push('/rezervasyon')}
        >
          <CalendarDays className="w-5 h-5 text-teal-400 mb-2" />
          <p className="text-3xl font-black text-white">{stats.bugunRezervasyonlar}</p>
          <p className="text-xs text-zinc-400 mt-1">Bugün Rezervasyon</p>
        </Card>

        <Card
          className="p-4 bg-zinc-800 border-zinc-700 cursor-pointer hover:border-indigo-500 transition"
          onClick={() => router.push('/musteriler')}
        >
          <Users className="w-5 h-5 text-indigo-400 mb-2" />
          <p className="text-3xl font-black text-white">{stats.toplamMusteri}</p>
          <p className="text-xs text-zinc-400 mt-1">Toplam Müşteri</p>
        </Card>

        <Card
          className="p-4 bg-zinc-800 border-zinc-700 cursor-pointer hover:border-purple-500 transition"
          onClick={() => router.push('/rapor')}
        >
          <BarChart3 className="w-5 h-5 text-purple-400 mb-2" />
          <p className="text-sm font-bold text-white">Raporlar</p>
          <p className="text-xs text-zinc-400 mt-1">Satış analizleri</p>
          <ArrowRight className="w-4 h-4 text-zinc-500 mt-2" />
        </Card>

        <Card
          className="p-4 bg-zinc-800 border-zinc-700 cursor-pointer hover:border-emerald-500 transition"
          onClick={() => router.push('/ai-analiz')}
        >
          <Brain className="w-5 h-5 text-emerald-400 mb-2" />
          <p className="text-sm font-bold text-white">AI Analiz</p>
          <p className="text-xs text-zinc-400 mt-1">Yapay zeka önerileri</p>
          <ArrowRight className="w-4 h-4 text-zinc-500 mt-2" />
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Son Siparişler */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Son Siparişler</h2>
            <Button
              size="sm"
              onClick={() => router.push('/siparisler')}
              className="bg-zinc-700 hover:bg-zinc-600 text-xs"
            >
              Tümünü Gör
            </Button>
          </div>
          <div className="space-y-3">
            {sonSiparisler.length === 0 ? (
              <Card className="p-6 bg-zinc-800 border-zinc-700 text-center">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                <p className="text-zinc-500 text-sm">Henüz sipariş yok</p>
              </Card>
            ) : (
              sonSiparisler.map(siparis => (
                <Card key={siparis.id} className="p-3 bg-zinc-800 border-zinc-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm text-white">
                        {(siparis.masalar as any)?.ad || 'Paket Sipariş'}
                      </p>
                      <p className="text-xs text-zinc-400">
                        {new Date(siparis.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-500 text-sm">{siparis.toplam_tutar}₺</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        siparis.durum === 'hazirlaniyor' ? 'bg-orange-900/50 text-orange-300' :
                        siparis.durum === 'hazir' ? 'bg-blue-900/50 text-blue-300' :
                        siparis.durum === 'tamamlandi' ? 'bg-green-900/50 text-green-300' :
                        'bg-zinc-700 text-zinc-400'
                      }`}>
                        {siparis.durum === 'hazirlaniyor' ? 'Hazırlanıyor' :
                         siparis.durum === 'hazir' ? 'Hazır' :
                         siparis.durum === 'tamamlandi' ? 'Tamamlandı' : siparis.durum}
                      </span>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Hızlı Erişim */}
        <div className="lg:col-span-2">
          <h2 className="text-lg font-bold text-white mb-4">Hızlı Erişim</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {hizliErisim.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className="p-4 bg-zinc-800 border border-zinc-700 rounded-xl hover:border-zinc-500 hover:bg-zinc-750 transition text-left group"
                >
                  <div className={`w-10 h-10 ${item.renk} rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-bold text-sm text-white">{item.ad}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">{item.aciklama}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
