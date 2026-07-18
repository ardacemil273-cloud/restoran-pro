'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { usePatronOnly } from '@/hooks/useRoleCheck'
import {
  ShoppingCart, Users, Package, ChefHat, QrCode, BarChart3,
  CalendarDays, Tag, Warehouse, TrendingDown, Brain, UtensilsCrossed,
  Phone, DollarSign, Zap, Flame, AlertTriangle, CheckCircle,
  Clock, ArrowRight, TrendingUp, Activity, MapPin, MessageCircle,
  Mic, Sparkles, Crown, Building2, Shield, FileText, Award, RefreshCw, Link2
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
  const router = useRouter()
  const { role, loading: roleLoading } = usePatronOnly()
  const [stats, setStats] = useState<Stats>({
    aktifSiparis: 0, bugunCiro: 0, toplamMasa: 0, doluMasa: 0,
    kritikStok: 0, bugunRezervasyonlar: 0, toplamMusteri: 0, bekleyenSiparis: 0
  })
  const [restoran, setRestoran] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sonSiparisler, setSonSiparisler] = useState<any[]>([])
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!roleLoading && role === 'patron') {
      loadData()
      const interval = setInterval(loadData, 30000)
      return () => clearInterval(interval)
    }
  }, [role, roleLoading])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    
    // Önce user_id ile ara (yeni kayıtlar için)
    let restoranData = null
    const { data: restoranByUserId, error: err1 } = await supabase.from('restoranlar').select('*').eq('user_id', user.id).maybeSingle()
    
    if (restoranByUserId) {
      restoranData = restoranByUserId
    } else {
      // Eğer user_id ile bulunamadıysa, sahibi_id ile ara (eski kayıtlar için)
      const { data: restoranBySahibiId, error: err2 } = await supabase.from('restoranlar').select('*').eq('sahibi_id', user.id).maybeSingle()
      restoranData = restoranBySahibiId
      
      // Schema hatası kontrolü
      if (!restoranData && (err1?.message?.includes('schema') || err2?.message?.includes('schema'))) {
        const { data: retry } = await supabase.from('restoranlar').select('*').eq('user_id', user.id).maybeSingle()
        restoranData = retry
      }
    }
    if (!restoranData) { setLoading(false); return }
    setRestoran(restoranData)
    const bugun = new Date(); bugun.setHours(0, 0, 0, 0)
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
    setStats({
      aktifSiparis: siparisler.filter((s: any) => s.durum !== 'tamamlandi' && s.durum !== 'iptal').length,
      bugunCiro: siparisler.filter((s: any) => s.durum === 'tamamlandi' || s.durum === 'odendi').reduce((sum: number, s: any) => sum + (s.toplam_tutar || 0), 0),
      toplamMasa: masalar.length,
      doluMasa: masalar.filter((m: any) => m.durum === 'dolu').length,
      kritikStok: urunler.filter((u: any) => u.stok !== null && u.stok <= u.kritik_stok).length,
      bugunRezervasyonlar: (rezervasyonRes.data || []).length,
      toplamMusteri: musteriRes.count || 0,
      bekleyenSiparis: siparisler.filter((s: any) => s.durum === 'hazir').length
    })
    setSonSiparisler(sonSiparisRes.data || [])
    setLoading(false)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const hizliErisim = [
    { ad: 'Masalar', path: '/masalar', icon: ChefHat, renk: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { ad: 'Siparişler', path: '/siparisler', icon: ShoppingCart, renk: '#f97316', bg: 'rgba(249,115,22,0.12)' },
    { ad: 'Kasa', path: '/kasa', icon: DollarSign, renk: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    { ad: 'QR Kodlar', path: '/qr-kodlar', icon: QrCode, renk: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    { ad: 'Ürünler', path: '/urunler', icon: Package, renk: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
    { ad: 'Kategoriler', path: '/kategoriler', icon: Tag, renk: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
    { ad: 'Garsonlar', path: '/garsonlar', icon: UtensilsCrossed, renk: '#06b6d4', bg: 'rgba(6,182,212,0.12)' },
    { ad: 'Müşteriler', path: '/musteriler', icon: Users, renk: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    { ad: 'Rezervasyon', path: '/rezervasyon', icon: CalendarDays, renk: '#14b8a6', bg: 'rgba(20,184,166,0.12)' },
    { ad: 'Stok Takibi', path: '/stok', icon: Warehouse, renk: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    { ad: 'Gider Takibi', path: '/giderler', icon: TrendingDown, renk: '#f43f5e', bg: 'rgba(244,63,94,0.12)' },
    { ad: 'Raporlar', path: '/rapor', icon: BarChart3, renk: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    { ad: 'AI Analiz', path: '/ai-analiz', icon: Brain, renk: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    { ad: 'İndirimler', path: '/indirimler', icon: Tag, renk: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { ad: 'Aramalar', path: '/aramalar', icon: Phone, renk: '#84cc16', bg: 'rgba(132,204,22,0.12)' },
    { ad: 'Entegrasyon', path: '/entegrasyon-merkezi', icon: Link2, renk: '#0ea5e9', bg: 'rgba(14,165,233,0.12)' },
    { ad: 'Ayarlar', path: '/ayarlar', icon: Activity, renk: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
  ]

  const statKartlari = [
    {
      baslik: 'Aktif Sipariş',
      deger: stats.aktifSiparis,
      icon: ShoppingCart,
      renk: '#f97316',
      bg: 'rgba(249,115,22,0.12)',
      path: '/siparisler',
      extra: stats.bekleyenSiparis > 0 ? `${stats.bekleyenSiparis} hazır bekliyor` : null,
      extraRenk: '#f59e0b',
      pulse: stats.aktifSiparis > 0,
    },
    {
      baslik: 'Bugünkü Ciro',
      deger: `${stats.bugunCiro.toLocaleString('tr-TR')}₺`,
      icon: DollarSign,
      renk: '#22c55e',
      bg: 'rgba(34,197,94,0.12)',
      path: '/kasa',
      extra: null,
      pulse: false,
    },
    {
      baslik: 'Dolu Masa',
      deger: `${stats.doluMasa}/${stats.toplamMasa}`,
      icon: ChefHat,
      renk: '#3b82f6',
      bg: 'rgba(59,130,246,0.12)',
      path: '/masalar',
      extra: stats.toplamMasa > 0 ? `%${Math.round(stats.doluMasa / stats.toplamMasa * 100)} doluluk` : null,
      extraRenk: '#3b82f6',
      pulse: false,
    },
    {
      baslik: 'Kritik Stok',
      deger: stats.kritikStok,
      icon: AlertTriangle,
      renk: stats.kritikStok > 0 ? '#ef4444' : '#22c55e',
      bg: stats.kritikStok > 0 ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
      path: '/stok',
      extra: stats.kritikStok > 0 ? 'Acil kontrol gerekli' : 'Stok durumu iyi',
      extraRenk: stats.kritikStok > 0 ? '#ef4444' : '#22c55e',
      pulse: stats.kritikStok > 0,
    },
  ]

  const getSiparisRenk = (durum: string) => {
    switch(durum) {
      case 'tamamlandi': case 'odendi': return { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'Tamamlandı' }
      case 'hazirlaniyor': return { color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'Hazırlanıyor' }
      case 'hazir': return { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Hazır' }
      case 'iptal': return { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'İptal' }
      default: return { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Bekliyor' }
    }
  }

  if (roleLoading || loading) {
    return (
      <div className="p-6 space-y-6" style={{backgroundColor: 'hsl(224,71%,4%)'}}>
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl skeleton" />
          <div className="space-y-2">
            <div className="h-8 w-48 rounded-lg skeleton" />
            <div className="h-4 w-32 rounded skeleton" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 rounded-2xl skeleton" />)}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-20 rounded-xl skeleton" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 space-y-6" style={{backgroundColor: 'hsl(224,71%,4%)', minHeight: '100vh'}}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 4px 16px rgba(245,158,11,0.3)'}}>
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">
              Hoş geldin, {restoran?.ad || 'Restoran'}! 👋
            </h1>
            <p className="text-sm mt-0.5" style={{color: 'rgba(255,255,255,0.4)'}}>
              {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)'}}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Yenile</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statKartlari.map((kart, i) => {
          const Icon = kart.icon
          return (
            <div
              key={i}
              onClick={() => router.push(kart.path)}
              className="p-5 rounded-2xl cursor-pointer transition-all group relative overflow-hidden"
              style={{background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)'}}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = kart.renk + '40'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{background: kart.bg}}>
                  <Icon className="w-5 h-5" style={{color: kart.renk}} />
                </div>
                {kart.pulse && (
                  <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{backgroundColor: kart.renk}} />
                )}
              </div>
              <p className="text-3xl font-black text-white mb-1">{kart.deger}</p>
              <p className="text-sm" style={{color: 'rgba(255,255,255,0.4)'}}>{kart.baslik}</p>
              {kart.extra && (
                <p className="text-xs mt-2 font-semibold" style={{color: kart.extraRenk}}>
                  {kart.extra}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Quick Access + Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Access */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Hızlı Erişim</h2>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {hizliErisim.map((item, i) => {
              const Icon = item.icon
              return (
                <button
                  key={i}
                  onClick={() => router.push(item.path)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all group"
                  style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = item.bg; (e.currentTarget as HTMLElement).style.borderColor = item.renk + '30' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)' }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{background: item.bg}}>
                    <Icon className="w-4 h-4" style={{color: item.renk}} />
                  </div>
                  <span className="text-xs font-medium text-center leading-tight" style={{color: 'rgba(255,255,255,0.6)'}}>{item.ad}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white">Son Siparişler</h2>
            <button onClick={() => router.push('/siparisler')} className="text-xs font-semibold flex items-center gap-1" style={{color: '#f59e0b'}}>
              Tümü <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-2">
            {sonSiparisler.length === 0 ? (
              <div className="text-center py-8 rounded-xl" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                <ShoppingCart className="w-8 h-8 mx-auto mb-2" style={{color: 'rgba(255,255,255,0.2)'}} />
                <p className="text-sm" style={{color: 'rgba(255,255,255,0.3)'}}>Henüz sipariş yok</p>
              </div>
            ) : (
              sonSiparisler.map((siparis: any, i) => {
                const renk = getSiparisRenk(siparis.durum)
                return (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                    <div>
                      <p className="text-sm font-semibold text-white">{siparis.masalar?.ad || 'Masa'}</p>
                      <p className="text-xs mt-0.5" style={{color: 'rgba(255,255,255,0.4)'}}>
                        {new Date(siparis.created_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-white">{siparis.toplam_tutar?.toLocaleString('tr-TR')}₺</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{background: renk.bg, color: renk.color}}>
                        {renk.label}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(stats.kritikStok > 0 || stats.bugunRezervasyonlar > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {stats.kritikStok > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)'}}>
              <AlertTriangle className="w-5 h-5 flex-shrink-0" style={{color: '#ef4444'}} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{color: '#ef4444'}}>{stats.kritikStok} ürün kritik stok seviyesinde</p>
                <p className="text-xs mt-0.5" style={{color: 'rgba(239,68,68,0.7)'}}>Hemen kontrol edin</p>
              </div>
              <button onClick={() => router.push('/stok')} className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{background: 'rgba(239,68,68,0.2)', color: '#ef4444'}}>
                Görüntüle
              </button>
            </div>
          )}
          {stats.bugunRezervasyonlar > 0 && (
            <div className="flex items-center gap-3 p-4 rounded-xl" style={{background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)'}}>
              <CalendarDays className="w-5 h-5 flex-shrink-0" style={{color: '#3b82f6'}} />
              <div className="flex-1">
                <p className="text-sm font-semibold" style={{color: '#3b82f6'}}>{stats.bugunRezervasyonlar} rezervasyon bugün bekliyor</p>
                <p className="text-xs mt-0.5" style={{color: 'rgba(59,130,246,0.7)'}}>Onay bekliyor</p>
              </div>
              <button onClick={() => router.push('/rezervasyon')} className="text-xs font-bold px-3 py-1.5 rounded-lg" style={{background: 'rgba(59,130,246,0.2)', color: '#3b82f6'}}>
                Görüntüle
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
