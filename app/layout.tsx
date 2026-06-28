// app/layout.tsx - Root layout + Sidebar
'use client'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import { Hop as Home, ShoppingCart, ChartBar as BarChart3, Settings, LogOut, QrCode, Package, Phone, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
    { ad: 'Rapor', path: '/rapor', icon: BarChart3 },
    { ad: 'QR Kodlar', path: '/qr', icon: QrCode },
    { ad: 'Ayarlar', path: '/ayarlar', icon: Settings },
  ]

  return (
    <html>
      <body className="bg-zinc-900">
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
