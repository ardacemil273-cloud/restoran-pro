'use client'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  Home, UtensilsCrossed, Package, Settings, Phone, BarChart3, Users, LogOut, Lock, Link2
} from 'lucide-react'

type NavItem = {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: number
  roles?: ('patron' | 'garson')[]
}

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState<'patron' | 'garson' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userRole = sessionStorage.getItem('userRole') as 'patron' | 'garson' | null
    setRole(userRole)
    setLoading(false)
  }, [])

  // Gizli sayfalar (login, register, gate vb)
  const hiddenPaths = ['/login', '/register', '/sifremi-unuttum', '/sifre-guncelle', '/gate', '/auth']
  if (hiddenPaths.some(path => pathname.startsWith(path))) {
    return null
  }

  // Patron menüsü
  const patronItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <Home className="w-5 h-5" />, href: '/dashboard', roles: ['patron'] },
    { id: 'tek-panel', label: 'Tek Panel', icon: <Package className="w-5 h-5" />, href: '/tek-panel', roles: ['patron'] },
    { id: 'entegrasyon', label: 'Entegrasyon', icon: <Link2 className="w-5 h-5" />, href: '/entegrasyon-merkezi', roles: ['patron'] },
    { id: 'raporlar', label: 'Raporlar', icon: <BarChart3 className="w-5 h-5" />, href: '/raporlar', roles: ['patron'] },
    { id: 'ayarlar', label: 'Ayarlar', icon: <Settings className="w-5 h-5" />, href: '/ayarlar', roles: ['patron'] },
  ]

  // Garson menüsü
  const garsonItems: NavItem[] = [
    { id: 'masalar', label: 'Masalar', icon: <UtensilsCrossed className="w-5 h-5" />, href: '/masalar', roles: ['garson'] },
    { id: 'siparisler', label: 'Siparişler', icon: <Package className="w-5 h-5" />, href: '/siparisler', roles: ['garson'] },
    { id: 'aramalar', label: 'Aramalar', icon: <Phone className="w-5 h-5" />, href: '/aramalar', roles: ['garson'] },
  ]

  // Rol bazlı menü seç
  const navItems = role === 'patron' ? patronItems : garsonItems

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  const handleLogout = () => {
    sessionStorage.removeItem('userRole')
    sessionStorage.removeItem('garsonId')
    router.push('/gate')
  }

  if (loading || !role) {
    return null
  }

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-card border-t border-white/10 z-40 safe-area-inset-bottom"
    >
      <div className="flex items-center justify-around h-20 px-2 max-w-4xl mx-auto pb-2">
        {navItems.map(item => {
          const active = isActive(item.href)
          return (
            <motion.button
              key={item.id}
              onClick={() => router.push(item.href)}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all relative group flex-1"
              whileTap={{ scale: 0.95 }}
            >
              {/* Arka plan */}
              {active && (
                <motion.div
                  layoutId="navBg"
                  className="absolute inset-0 bg-primary/20 rounded-xl"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* İkon */}
              <motion.div
                className={`relative z-10 transition-all ${
                  active ? 'text-primary scale-110' : 'text-white/40 group-hover:text-white/60'
                }`}
                animate={active ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {item.icon}
              </motion.div>

              {/* Label */}
              <span
                className={`text-[10px] font-bold relative z-10 transition-all ${
                  active ? 'text-primary' : 'text-white/40 group-hover:text-white/60'
                }`}
              >
                {item.label}
              </span>

              {/* Badge */}
              {item.badge && item.badge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center"
                >
                  {item.badge > 99 ? '99+' : item.badge}
                </motion.span>
              )}
            </motion.button>
          )
        })}

        {/* Çıkış Butonu */}
        <motion.button
          onClick={handleLogout}
          className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all relative group flex-1 text-red-400 hover:text-red-300"
          whileTap={{ scale: 0.95 }}
          title="Çıkış Yap"
        >
          <motion.div
            className="relative z-10 transition-all"
            whileHover={{ scale: 1.1 }}
          >
            <LogOut className="w-5 h-5" />
          </motion.div>
          <span className="text-[10px] font-bold relative z-10">Çıkış</span>
        </motion.button>
      </div>
    </motion.nav>
  )
}
