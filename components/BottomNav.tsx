'use client'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Home, UtensilsCrossed, Package, Settings, Phone, BarChart3, Users
} from 'lucide-react'

type NavItem = {
  id: string
  label: string
  icon: React.ReactNode
  href: string
  badge?: number
}

export default function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()

  // Gizli sayfalar (login, register vb)
  const hiddenPaths = ['/login', '/register', '/sifremi-unuttum', '/sifre-guncelle']
  if (hiddenPaths.some(path => pathname.startsWith(path))) {
    return null
  }

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Ana Sayfa', icon: <Home className="w-5 h-5" />, href: '/dashboard' },
    { id: 'siparisler', label: 'Siparişler', icon: <Package className="w-5 h-5" />, href: '/siparisler' },
    { id: 'masalar', label: 'Masalar', icon: <UtensilsCrossed className="w-5 h-5" />, href: '/masalar' },
    { id: 'aramalar', label: 'Aramalar', icon: <Phone className="w-5 h-5" />, href: '/aramalar' },
    { id: 'ayarlar', label: 'Ayarlar', icon: <Settings className="w-5 h-5" />, href: '/ayarlar' },
  ]

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-40 safe-area-inset-bottom"
    >
      <div className="flex items-center justify-around h-16 px-2 max-w-4xl mx-auto">
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
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              {/* İkon */}
              <motion.div
                className={`relative z-10 transition-all ${
                  active ? 'text-primary scale-110' : 'text-zinc-400 group-hover:text-zinc-300'
                }`}
                animate={active ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {item.icon}
              </motion.div>

              {/* Label */}
              <span
                className={`text-xs font-bold relative z-10 transition-all ${
                  active ? 'text-primary' : 'text-zinc-500 group-hover:text-zinc-400'
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
      </div>
    </motion.nav>
  )
}
