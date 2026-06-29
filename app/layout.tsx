// app/layout.tsx - Root layout + Premium Sidebar
'use client'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, ShoppingCart, BarChart3, Settings, LogOut, QrCode, Package, Phone, Users,
  TrendingDown, Brain, Warehouse, CalendarDays, Tag, UtensilsCrossed, ChefHat, Menu, X,
  DollarSign, ChevronDown, ChevronRight, Layers, MapPin, Award, MessageCircle, Mic, Sparkles,
  Crown, Building2, Shield, FileText, Zap
} from 'lucide-react'
import PwaInstall from '@/components/PwaInstall'
import StokUyari from '@/components/StokUyari'
import { OnboardingTour } from '@/components/OnboardingTour'
import { PremiumUX } from '@/components/PremiumUX'
import ThemeProvider from '@/components/ThemeProvider'
import { Toaster } from '@/components/ui/sonner'
import { useMobileMenu } from '@/hooks/useMobileMenu'
import './globals.css'
import './globals-mobile.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mobilMenuAcik, setMobilMenuAcik] = useState(false)
  const [menuGrupAcik, setMenuGrupAcik] = useState<Record<string, boolean>>({
    garson: true,
    isletme: true,
    yonetim: false,
    musteri: false,
    analiz: false,
    guvenlik: false,
    ayarlar: true
  })

  useMobileMenu(mobilMenuAcik)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const publicPaths = ['/', '/login', '/register', '/menu', '/garson', '/sifremi-unuttum', '/sifre-guncelle']
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))

  async function cikisYap() {
    await supabase.auth.signOut()
    router.push('/')
    setMobilMenuAcik(false)
  }

  if (isPublic) {
    return (
      <html lang="tr" className="dark">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#f59e0b" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Restoran Pro" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
          <meta name="description" content="Türkiye'nin en kapsamlı restoran yönetim sistemi. QR menü, garson paneli, mutfak ekranı, kasa, stok takibi ve AI analiz." />
          <title>Restoran Pro - Dijital Restoran Yönetim Sistemi</title>
        </head>
        <body>
          <PwaInstall />
          <Toaster richColors position="top-right" />
          {children}
        </body>
      </html>
    )
  }

  const menuGruplari = [
    {
      id: 'garson',
      baslik: 'Garson & Mutfak',
      icon: ChefHat,
      items: [
        { ad: 'Garson Paneli', path: '/garson', icon: UtensilsCrossed },
        { ad: 'Mutfak Ekranı (KDS)', path: '/garson/mutfak', icon: ChefHat },
      ]
    },
    {
      id: 'isletme',
      baslik: 'İşletme',
      icon: LayoutDashboard,
      items: [
        { ad: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { ad: 'Masalar', path: '/masalar', icon: ChefHat },
        { ad: 'Masa Haritası', path: '/masa-harita', icon: MapPin },
        { ad: 'Siparişler', path: '/siparisler', icon: ShoppingCart },
        { ad: 'WhatsApp Siparişler', path: '/whatsapp-siparisler', icon: MessageCircle },
        { ad: 'AI Sesli Sipariş', path: '/ai-sesli-siparis', icon: Mic },
        { ad: 'Tek Panel', path: '/tek-panel', icon: Layers },
        { ad: 'Kasa', path: '/kasa', icon: DollarSign },
        { ad: 'Gelen Aramalar', path: '/aramalar', icon: Phone },
      ]
    },
    {
      id: 'yonetim',
      baslik: 'Yönetim',
      icon: Package,
      items: [
        { ad: 'Ürünler', path: '/urunler', icon: Package },
        { ad: 'Kategoriler', path: '/kategoriler', icon: Layers },
        { ad: 'Stok Takibi', path: '/stok', icon: Warehouse },
        { ad: 'Otomatik Tedarik', path: '/otomatik-tedarik', icon: Zap },
        { ad: 'Gider Takibi', path: '/giderler', icon: TrendingDown },
        { ad: 'E-Faturalar', path: '/faturalar', icon: FileText },
        { ad: 'İndirimler', path: '/indirimler', icon: Tag },
        { ad: 'QR Kodlar', path: '/qr-kodlar', icon: QrCode },
      ]
    },
    {
      id: 'musteri',
      baslik: 'Müşteri',
      icon: Users,
      items: [
        { ad: 'Müşteriler', path: '/musteriler', icon: Users },
        { ad: 'Sadakat & Oyun', path: '/sadakat-oyun', icon: Sparkles },
        { ad: 'Rezervasyon', path: '/rezervasyon', icon: CalendarDays },
        { ad: 'Garsonlar', path: '/garsonlar', icon: UtensilsCrossed },
        { ad: 'Şubeler', path: '/subeler', icon: Building2 },
      ]
    },
    {
      id: 'analiz',
      baslik: 'Analiz & Raporlar',
      icon: BarChart3,
      items: [
        { ad: 'Patron Merkezi', path: '/patron-merkezi', icon: Crown },
        { ad: 'AI Müşteri Analitikleri', path: '/ai-musteri-analitikleri', icon: Brain },
        { ad: 'Raporlar', path: '/rapor', icon: BarChart3 },
        { ad: 'Garson Performans', path: '/garson-performans', icon: Award },
        { ad: 'AI Stok Tahmin', path: '/stok-tahmin', icon: Brain },
        { ad: 'Finansal Dashboard', path: '/finansal-dashboard', icon: DollarSign },
        { ad: 'AI Analiz', path: '/ai-analiz', icon: Brain },
      ]
    },
    {
      id: 'guvenlik',
      baslik: 'Güvenlik',
      icon: Shield,
      items: [
        { ad: 'Audit Logs', path: '/audit-logs', icon: Shield },
      ]
    },
    {
      id: 'ayarlar',
      baslik: 'Ayarlar',
      icon: Settings,
      items: [
        { ad: 'Ayarlar', path: '/ayarlar', icon: Settings },
        { ad: 'Paket & Fiyatlar', path: '/ayarlar/paket', icon: Crown },
      ]
    }
  ]

  const toggleGrup = (id: string) => {
    setMenuGrupAcik(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-3 py-4 mb-2">
        <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
          <ChefHat className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-base font-black text-white leading-none">Restoran Pro</h1>
          <p className="text-[10px] text-amber-400/70 font-medium mt-0.5">Yönetim Paneli</p>
        </div>
      </div>

      <div className="h-px bg-white/5 mx-3 mb-3" />

      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5 pb-4">
        {menuGruplari.map(grup => {
          const GrupIcon = grup.icon
          const grupAktif = grup.items.some(item => pathname === item.path)
          return (
            <div key={grup.id} className="mb-1">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  toggleGrup(grup.id)
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 text-[11px] font-semibold uppercase tracking-wider rounded-lg transition-all outline-none ${
                  grupAktif
                    ? 'text-amber-400 bg-amber-500/10'
                    : 'text-white/30 hover:text-white/60 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2">
                  <GrupIcon className="w-3.5 h-3.5" />
                  <span>{grup.baslik}</span>
                </div>
                {menuGrupAcik[grup.id]
                  ? <ChevronDown className="w-3 h-3" />
                  : <ChevronRight className="w-3 h-3" />
                }
              </button>
              {menuGrupAcik[grup.id] && (
                <div className="mt-0.5 space-y-0.5 ml-1">
                  {grup.items.map(item => {
                    const Icon = item.icon
                    const aktif = pathname === item.path
                    return (
                      <button
                        key={item.path}
                        type="button"
                        onClick={() => { router.push(item.path); setMobilMenuAcik(false) }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all outline-none ${
                          aktif
                            ? 'bg-amber-500 text-black font-bold shadow-md shadow-amber-500/20'
                            : 'text-white/50 hover:text-white hover:bg-white/8'
                        }`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${aktif ? 'text-black' : ''}`} />
                        <span className="truncate">{item.ad}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-white/8 pt-3 px-2 pb-2 mt-auto">
        <button
          type="button"
          onClick={cikisYap}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-400/80 hover:text-red-300 hover:bg-red-500/10 transition-all outline-none"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Çıkış Yap</span>
        </button>
      </div>
    </div>
  )

  return (
    <html lang="tr" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f59e0b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Restoran Pro" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <title>Restoran Pro</title>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').catch(function() {});
            });
          }
        ` }} />
      </head>
      <body style={{backgroundColor: 'hsl(224,71%,4%)', color: 'white'}}>
        <PwaInstall />
        <ThemeProvider />
        <Toaster richColors position="top-right" />

        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 border-b px-4 h-14 flex items-center justify-between" style={{backgroundColor: 'hsl(220,14%,5%)', borderColor: 'rgba(255,255,255,0.08)'}}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)'}}>
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-amber-400 text-base">Restoran Pro</span>
          </div>
          <button
            type="button"
            onClick={() => setMobilMenuAcik(!mobilMenuAcik)}
            className="w-9 h-9 flex items-center justify-center rounded-lg transition-all"
            style={{color: 'rgba(255,255,255,0.6)'}}
          >
            {mobilMenuAcik ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobilMenuAcik && (
          <div
            className="lg:hidden fixed inset-0 z-40"
            style={{backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)'}}
            onClick={() => setMobilMenuAcik(false)}
          />
        )}

        <aside
          className={`lg:hidden fixed top-0 left-0 h-full w-72 z-50 border-r transform transition-transform duration-300 ease-in-out ${mobilMenuAcik ? 'translate-x-0' : '-translate-x-full'}`}
          style={{backgroundColor: 'hsl(220,14%,5%)', borderColor: 'rgba(255,255,255,0.08)'}}
        >
          <SidebarContent />
        </aside>

        <div className="flex min-h-screen">
          <aside
            className="w-60 hidden lg:block fixed top-0 left-0 h-full overflow-hidden border-r"
            style={{backgroundColor: 'hsl(220,14%,5%)', borderColor: 'rgba(255,255,255,0.08)'}}
          >
            <SidebarContent />
          </aside>

          <main className="flex-1 pt-14 lg:pt-0 lg:ml-60 min-h-screen overflow-auto" style={{backgroundColor: 'hsl(224,71%,4%)'}}>
            {user && <StokUyari />}
            {user && <OnboardingTour />}
            {user && <PremiumUX />}
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
