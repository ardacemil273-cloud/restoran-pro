// app/layout.tsx - Root layout + Sidebar
'use client'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import {
  Hop as Home, ShoppingCart, ChartBar as BarChart3, Settings, LogOut, QrCode, Package, Phone, Users,
  TrendingDown, Brain, Warehouse, CalendarDays, Tag, UtensilsCrossed, ChefHat, Menu, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import PwaInstall from '@/components/PwaInstall'
import StokUyari from '@/components/StokUyari'
import { Toaster } from '@/components/ui/sonner'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mobilMenuAcik, setMobilMenuAcik] = useState(false)

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

  const menuItems = [
    { ad: 'Masalar', path: '/masalar', icon: Home },
    { ad: 'Siparişler', path: '/siparisler', icon: ShoppingCart },
    { ad: 'Gelen Aramalar', path: '/aramalar', icon: Phone },
    { ad: 'Müşteriler', path: '/musteriler', icon: Users },
    { ad: 'Kasa', path: '/kasa', icon: Package },
    { ad: 'Stok Takibi', path: '/stok', icon: Warehouse },
    { ad: 'Gider Takibi', path: '/giderler', icon: TrendingDown },
    { ad: 'AI Analiz', path: '/ai-analiz', icon: Brain },
    { ad: 'Rezervasyon', path: '/rezervasyon', icon: CalendarDays },
    { ad: 'İndirimler', path: '/indirimler', icon: Tag },
    { ad: 'Garsonlar', path: '/garsonlar', icon: UtensilsCrossed },
    { ad: 'Rapor', path: '/rapor', icon: BarChart3 },
    { ad: 'QR Kodlar', path: '/qr-kodlar', icon: QrCode },
    { ad: 'Ayarlar', path: '/ayarlar', icon: Settings },
  ]

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2 mb-8">
        <ChefHat className="w-7 h-7 text-yellow-500" />
        <h1 className="text-xl font-bold text-yellow-500">Restoran Pro</h1>
      </div>
      <nav className="space-y-1">
        {menuItems.map(item => {
          const Icon = item.icon
          const aktif = pathname === item.path
          return (
            <Button
              key={item.path}
              onClick={() => { router.push(item.path); setMobilMenuAcik(false) }}
              variant={aktif ? 'default' : 'ghost'}
              className={`w-full justify-start text-sm ${
                aktif ? 'bg-yellow-500 text-black font-bold' : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4 mr-3 shrink-0" />
              {item.ad}
            </Button>
          )
        })}
      </nav>
      <div className="mt-auto pt-4 border-t border-zinc-800">
        <Button
          onClick={cikisYap}
          variant="ghost"
          className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut className="w-4 h-4 mr-3" />
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
            <ChefHat className="w-6 h-6 text-yellow-500" />
            <span className="font-bold text-yellow-500">Restoran Pro</span>
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
          <aside className="w-64 bg-zinc-950 border-r border-zinc-800 p-4 hidden lg:flex flex-col">
            <SidebarContent />
          </aside>

          {/* Main Content */}
          <main className="flex-1 pt-14 lg:pt-0 overflow-auto">
            {user && <StokUyari />}
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
