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
  Clock, CheckCircle, AlertTriangle, DollarSign, Activity,
  Zap, Flame, Target
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
    const interval = setInterval(loadData, 30000)
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
    const rezervasyonlar = rezervasyonRes.data || []

    const doluMasaSayisi = masalar.filter((m: any) => m.durum === 'dolu').length
    const aktifSiparisSayisi = siparisler.filter((s: any) => s.durum !== 'tamamlandi' && s.durum !== 'iptal').length
    const bugunCiroToplam = siparisler.filter((s: any) => s.durum === 'tamamlandi' || s.durum === 'odendi').reduce((sum: number, s: any) => sum + (s.toplam_tutar || 0), 0)
    const kritikStokSayisi = urunler.filter((u: any) => u.stok !== null && u.stok <= u.kritik_stok).length
    const bekleyenSiparisSayisi = siparisler.filter((s: any) => s.durum === 'hazir').length

    setStats({
      aktifSiparis: aktifSiparisSayisi,
      bugunCiro: bugunCiroToplam,
      toplamMasa: masalar.length,
      doluMasa: doluMasaSayisi,
      kritikStok: kritikStokSayisi,
      bugunRezervasyonlar: rezervasyonlar.length,
      toplamMusteri: musteriRes.count || 0,
      bekleyenSiparis: bekleyenSiparisSayisi
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
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
        <div className="text-center fade-in">
          <div className="w-16 h-16 mx-auto mb-4 shimmer rounded-full border-4 border-yellow-500/30" />
          <p className="text-zinc-300 font-semibold">Restoran Pro yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 p-6 space-y-8">
      {/* Başlık Bölümü */}
      <div className="fade-in">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
            <ChefHat className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white">
              Hoş geldin, {restoran?.ad || 'Restoran'}! 👋
            </h1>
            <p className="text-zinc-400 text-sm mt-1">
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* Ana İstatistikler - Premium Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 fade-in">
        {/* Aktif Siparişler */}
        <div 
          onClick={() => router.push('/siparisler')}
          className="glass-card-hover p-6 cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
              <ShoppingCart className="w-6 h-6 text-orange-400" />
            </div>
            {stats.aktifSiparis > 0 && (
              <span className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
            )}
          </div>
          <p className="text-4xl font-black text-white">{stats.aktifSiparis}</p>
          <p className="text-zinc-400 text-sm mt-2">Aktif Sipariş</p>
          {stats.bekleyenSiparis > 0 && (
            <p className="text-xs text-yellow-400 mt-2 font-semibold">⚡ {stats.bekleyenSiparis} hazır bekliyor</p>
          )}
        </div>

        {/* Günlük Ciro */}
        <div 
          onClick={() => router.push('/kasa')}
          className="glass-card-hover p-6 cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
              <DollarSign className="w-6 h-6 text-green-400" />
            </div>
            <Flame className="w-5 h-5 text-red-400 opacity-60" />
          </div>
          <p className="text-3xl font-black text-white">
            {stats.bugunCiro.toLocaleString('tr-TR')}₺
          </p>
          <p className="text-zinc-400 text-sm mt-2">Bugünkü Ciro</p>
        </div>

        {/* Masa Doluluk */}
        <div 
          onClick={() => router.push('/masalar')}
          className="glass-card-hover p-6 cursor-pointer group"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition">
              <ChefHat className="w-6 h-6 text-blue-400" />
            </div>
            <Target className="w-5 h-5 text-blue-400 opacity-60" />
          </div>
          <p className="text-4xl font-black text-white">
            {stats.doluMasa}/{stats.toplamMasa}
          </p>
          <p className="text-zinc-400 text-sm mt-2">Dolu/Toplam Masa</p>
          {stats.toplamMasa > 0 && (
            <div className="mt-3 bg-white/5 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(stats.doluMasa / stats.toplamMasa) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Kritik Stok */}
        <div 
          onClick={() => router.push('/stok')}
          className={`glass-card-hover p-6 cursor-pointer group ${
            stats.kritikStok > 0 ? 'border-red-500/50 bg-red-500/5' : ''
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition ${
              stats.kritikStok > 0 ? 'bg-red-500/20' : 'bg-zinc-500/20'
            }`}>
              <Warehouse className={`w-6 h-6 ${stats.kritikStok > 0 ? 'text-red-400' : 'text-zinc-400'}`} />
            </div>
            {stats.kritikStok > 0 && (
              <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            )}
          </div>
          <p className={`text-4xl font-black ${stats.kritikStok > 0 ? 'text-red-400' : 'text-white'}`}>
            {stats.kritikStok}
          </p>
          <p className="text-zinc-400 text-sm mt-2">Kritik Stok</p>
          {stats.kritikStok > 0 && (
            <p className="text-xs text-red-400 mt-2 font-semibold">⚠️ Dikkat gerekiyor!</p>
          )}
        </div>
      </div>

      {/* İkinci Satır İstatistikler */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 fade-in">
        {/* Rezervasyon */}
        <div 
          onClick={() => router.push('/rezervasyon')}
          className="glass-card-hover p-6 cursor-pointer group"
        >
          <div className="w-12 h-12 bg-teal-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <CalendarDays className="w-6 h-6 text-teal-400" />
          </div>
          <p className="text-4xl font-black text-white">{stats.bugunRezervasyonlar}</p>
          <p className="text-zinc-400 text-sm mt-2">Bugün Rezervasyon</p>
        </div>

        {/* Müşteri */}
        <div 
          onClick={() => router.push('/musteriler')}
          className="glass-card-hover p-6 cursor-pointer group"
        >
          <div className="w-12 h-12 bg-indigo-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Users className="w-6 h-6 text-indigo-400" />
          </div>
          <p className="text-4xl font-black text-white">{stats.toplamMusteri}</p>
          <p className="text-zinc-400 text-sm mt-2">Toplam Müşteri</p>
        </div>

        {/* Raporlar */}
        <div 
          onClick={() => router.push('/rapor')}
          className="glass-card-hover p-6 cursor-pointer group"
        >
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <BarChart3 className="w-6 h-6 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">Analiz</p>
          <p className="text-zinc-400 text-sm mt-2">Satış raporları</p>
        </div>

        {/* AI Analiz */}
        <div 
          onClick={() => router.push('/ai-analiz')}
          className="glass-card-hover p-6 cursor-pointer group"
        >
          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
            <Brain className="w-6 h-6 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">AI</p>
          <p className="text-zinc-400 text-sm mt-2">Yapay zeka önerileri</p>
        </div>
      </div>

      {/* Son Siparişler & Hızlı Erişim */}
      <div className="grid lg:grid-cols-3 gap-6 fade-in">
        {/* Son Siparişler */}
        <div className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-yellow-400" />
              Son Siparişler
            </h2>
            <Button
              size="sm"
              onClick={() => router.push('/siparisler')}
              className="btn-premium-secondary text-xs"
            >
              Tümünü Gör
            </Button>
          </div>
          <div className="space-y-3">
            {sonSiparisler.length === 0 ? (
              <div className="glass-card p-6 text-center">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                <p className="text-zinc-500 text-sm">Henüz sipariş yok</p>
              </div>
            ) : (
              sonSiparisler.map((siparis, idx) => (
                <div key={siparis.id} className="glass-card p-4 hover:bg-white/10 transition slide-in-left" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-white">
                        {(siparis.masalar as any)?.ad || 'Paket Sipariş'}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {new Date(siparis.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-yellow-400 text-sm">{siparis.toplam_tutar}₺</p>
                      <span className={`text-xs px-2 py-1 rounded-lg inline-block mt-1 ${
                        siparis.durum === 'hazirlaniyor' ? 'badge-warning' :
                        siparis.durum === 'hazir' ? 'badge-info' :
                        siparis.durum === 'tamamlandi' ? 'badge-success' :
                        'bg-zinc-700/50 text-zinc-300'
                      }`}>
                        {siparis.durum === 'hazirlaniyor' ? '⏳ Hazırlanıyor' :
                         siparis.durum === 'hazir' ? '✓ Hazır' :
                         siparis.durum === 'tamamlandi' ? '✓ Tamamlandı' : siparis.durum}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Hızlı Erişim */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-black text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Hızlı Erişim
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {hizliErisim.map((item, idx) => {
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className="glass-card p-4 hover:bg-white/15 transition group text-left slide-in-left"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className={`w-10 h-10 ${item.renk} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition shadow-lg shadow-${item.renk.split('-')[1]}-500/30`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-bold text-sm text-white">{item.ad}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{item.aciklama}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
