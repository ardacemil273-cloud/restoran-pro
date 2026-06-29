// app/layout.tsx - Root layout + Sidebar
'use client'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, ShoppingCart, ChartBar as BarChart3, Settings, LogOut, QrCode, Package, Phone, Users,
  TrendingDown, Brain, Warehouse, CalendarDays, Tag, UtensilsCrossed, ChefHat, Menu, X,
  DollarSign, ChevronDown, ChevronRight, Layers, MapPin, Award, MessageCircle, Mic, Sparkles
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import PwaInstall from '@/components/PwaInstall'
import StokUyari from '@/components/StokUyari'
import { OnboardingTour } from '@/components/OnboardingTour'
import { PremiumUX } from '@/components/PremiumUX'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mobilMenuAcik, setMobilMenuAcik] = useState(false)
  const [menuGrupAcik, setMenuGrupAcik] = useState<Record<string, boolean>>({
    isletme: true,
    yonetim: true,
    analiz: true,
    sistem: true
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Public sayfalar - sidebar gösterilmez
  const publicPaths = ['/', '/login', '/register', '/menu', '/garson', '/sifremi-unuttum', '/sifre-guncelle']
  const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))

  async function cikisYap() {
    await supabase.auth.signOut()
    router.push('/')
    setMobilMenuAcik(false)
  }

  if (isPublic) {
    return (
      <html lang="tr">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#eab308" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="Restoran Pro" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
          <meta name="description" content="Türkiye'nin en kapsamlı restoran yönetim sistemi. QR menü, garson paneli, mutfak ekranı, kasa, stok takibi ve AI analiz." />
          <title>Restoran Pro - Dijital Restoran Yönetim Sistemi</title>
        </head>
        <body className="bg-zinc-900">
          <PwaInstall />
          <Toaster richColors position="top-right" />
          {children}
        </body>
      </html>
    )
  }

  const menuGruplari = [
    {
      id: 'isletme',
      baslik: 'İşletme',
      items: [
        { ad: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { ad: 'Masalar', path: '/masalar', icon: ChefHat },
        { ad: 'Masa Haritası', path: '/masa-harita', icon: MapPin },
        { ad: 'Siparişler', path: '/siparisler', icon: ShoppingCart },
        { ad: 'WhatsApp Siparişler', path: '/whatsapp-siparisler', icon: MessageCircle },
        { ad: 'AI Sesli Sipariş', path: '/ai-sesli-siparis', icon: Mic },
        { ad: 'Mutfak Ekranı', path: '/mutfak-ekrani', icon: UtensilsCrossed },
        { ad: 'Tek Panel', path: '/tek-panel', icon: Layers },
        { ad: 'Kasa', path: '/kasa', icon: DollarSign },
        { ad: 'Gelen Aramalar', path: '/aramalar', icon: Phone },
      ]
    },
    {
      id: 'yonetim',
      baslik: 'Yönetim',
      items: [
        { ad: 'Ürünler', path: '/urunler', icon: Package },
        { ad: 'Kategoriler', path: '/kategoriler', icon: Layers },
        { ad: 'Stok Takibi', path: '/stok', icon: Warehouse },
        { ad: 'Gider Takibi', path: '/giderler', icon: TrendingDown },
        { ad: 'İndirimler', path: '/indirimler', icon: Tag },
        { ad: 'QR Kodlar', path: '/qr-kodlar', icon: QrCode },
      ]
    },
    {
      id: 'musteri',
      baslik: 'Müşteri',
      items: [
        { ad: 'Müşteriler', path: '/musteriler', icon: Users },
        { ad: 'Sadakat & Oyun', path: '/sadakat-oyun', icon: Sparkles },
        { ad: 'Rezervasyon', path: '/rezervasyon', icon: CalendarDays },
        { ad: 'Garsonlar', path: '/garsonlar', icon: UtensilsCrossed },
      ]
    },
    {
      id: 'analiz',
      baslik: 'Analiz',
      items: [
        { ad: 'Raporlar', path: '/rapor', icon: BarChart3 },
        { ad: 'Garson Performans', path: '/garson-performans', icon: Award },
        { ad: 'AI Stok Tahmin', path: '/stok-tahmin', icon: Brain },
        { ad: 'Finansal Dashboard', path: '/finansal-dashboard', icon: DollarSign },
        { ad: 'AI Analiz', path: '/ai-analiz', icon: Brain },
      ]
    },
    {
      id: 'sistem',
      baslik: 'Sistem',
      items: [
        { ad: 'Ayarlar', path: '/ayarlar', icon: Settings },
      ]
    }
  ]

  const toggleGrup = (id: string) => {
    setMenuGrupAcik(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2 mb-6 px-2">
        <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
          <ChefHat className="w-5 h-5 text-black" />
        </div>
        <h1 className="text-lg font-black text-yellow-500">Restoran Pro</h1>
      </div>

      <nav className="space-y-1 flex-1 overflow-y-auto">
        {menuGruplari.map(grup => (
          <div key={grup.id} className="mb-2">
            <button
              onClick={() => toggleGrup(grup.id)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider hover:text-zinc-400 transition"
            >
              <span>{grup.baslik}</span>
              {menuGrupAcik[grup.id]
                ? <ChevronDown className="w-3 h-3" />
                : <ChevronRight className="w-3 h-3" />
              }
            </button>

            {menuGrupAcik[grup.id] && (
              <div className="space-y-0.5">
                {grup.items.map(item => {
                  const Icon = item.icon
                  const aktif = pathname === item.path
                  return (
                    <Button
                      key={item.path}
                      onClick={() => { router.push(item.path); setMobilMenuAcik(false) }}
                      variant={aktif ? 'default' : 'ghost'}
                      className={`w-full justify-start text-sm h-9 ${
                        aktif
                          ? 'bg-yellow-500 text-black font-bold hover:bg-yellow-400'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2.5 shrink-0" />
                      {item.ad}
                    </Button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t border-zinc-800">
        <Button
          onClick={cikisYap}
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20 text-sm"
        >
          <LogOut className="w-4 h-4 mr-2.5" />
          Çıkış Yap
        </Button>
      </div>
    </>
  )

  return (
    <html lang="tr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#eab308" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Restoran Pro" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <title>Restoran Pro</title>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              navigator.serviceWorker.register('/sw.js').then(function(reg) {
                console.log('SW registered:', reg.scope);
              }).catch(function(err) {
                console.log('SW registration failed:', err);
              });
            });
          }
        ` }} />
      </head>
      <body className="bg-zinc-900 text-white">
        <PwaInstall />
        <Toaster richColors position="top-right" />

        {/* Mobil Header */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-zinc-950 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-yellow-500 rounded-lg flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-black" />
            </div>
            <span className="font-black text-yellow-500">Restoran Pro</span>
          </div>
          <button
            onClick={() => setMobilMenuAcik(!mobilMenuAcik)}
            className="text-zinc-400 hover:text-white p-1"
          >
            {mobilMenuAcik ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobil Menu Overlay */}
        {mobilMenuAcik && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60"
            onClick={() => setMobilMenuAcik(false)}
          />
        )}

        {/* Mobil Sidebar */}
        <aside className={`lg:hidden fixed top-0 left-0 h-full w-72 z-50 bg-zinc-950 border-r border-zinc-800 p-4 flex flex-col transform transition-transform duration-300 ${mobilMenuAcik ? 'translate-x-0' : '-translate-x-full'}`}>
          <SidebarContent />
        </aside>

        <div className="flex min-h-screen">
          {/* Desktop Sidebar */}
          <aside className="w-60 bg-zinc-950 border-r border-zinc-800 p-4 hidden lg:flex flex-col fixed top-0 left-0 h-full overflow-y-auto">
            <SidebarContent />
          </aside>

          {/* Main Content */}
          <main className="flex-1 pt-14 lg:pt-0 lg:ml-60 overflow-auto min-h-screen">
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
