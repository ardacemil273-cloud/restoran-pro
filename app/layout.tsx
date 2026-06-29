// app/layout.tsx - Root layout + Sidebar
'use client'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { Hop as Home, ShoppingCart, ChartBar as BarChart3, Settings, LogOut, QrCode, Package, Phone, Users, TrendingDown, Brain, Warehouse, CalendarDays, Tag, UtensilsCrossed, ChefHat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import PwaInstall from '@/components/PwaInstall'
import './globals.css'



export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  // Login, register, menu sayfalarında sidebar gösterme
  const publicPaths = ['/login', '/register', '/menu']
  const isPublic = publicPaths.some(p => pathname.startsWith(p))

  async function cikisYap() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (isPublic) {
    return <html><body>{children}</body></html>
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
      <body className="bg-zinc-900">
        <PwaInstall />
        <div className="flex min-h-screen">
          <aside className="w-64 bg-zinc-950 border-r border-zinc-800 p-4 hidden lg:block">
            <h1 className="text-2xl font-bold text-yellow-500 mb-8">QR Menü</h1>
            <nav className="space-y-2">
              {menuItems.map(item => {
                const Icon = item.icon
                const aktif = pathname === item.path
                return (
                  <Button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    variant={aktif? 'default' : 'ghost'}
                    className={`w-full justify-start ${
                      aktif? 'bg-yellow-500 text-black' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.ad}
                  </Button>
                )
              })}
            </nav>
            <Button
              onClick={cikisYap}
              variant="ghost"
              className="w-full justify-start text-red-400 hover:text-red-300 mt-8"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Çıkış Yap
            </Button>
          </aside>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  )
}
