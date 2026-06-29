'use client'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, ShoppingCart, Settings, BarChart3, Menu, LogOut } from 'lucide-react'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

type NavItem = {
  icon: React.ReactNode
  label: string
  href: string
  color: string
}

const NAV_ITEMS: NavItem[] = [
  { icon: <Home className="w-5 h-5" />, label: 'Ana Sayfa', href: '/dashboard', color: 'cyan' },
  { icon: <ShoppingCart className="w-5 h-5" />, label: 'Siparişler', href: '/siparisler', color: 'purple' },
  { icon: <BarChart3 className="w-5 h-5" />, label: 'Analiz', href: '/analiz', color: 'green' },
  { icon: <Settings className="w-5 h-5" />, label: 'Ayarlar', href: '/ayarlar', color: 'orange' },
]

export default function MobileBottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [menuAcik, setMenuAcik] = useState(false)

  async function logout() {
    await supabase.auth.signOut()
    toast.success('Çıkış yapıldı')
    router.push('/login')
  }

  // Desktop'ta gizle
  if (typeof window !== 'undefined' && window.innerWidth > 768) {
    return null
  }

  return (
    <>
      {/* Bottom Navigation */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-cyan-900/40 to-transparent backdrop-blur-xl border-t border-cyan-500/30"
      >
        <div className="flex items-center justify-around px-2 py-3">
          {NAV_ITEMS.map((item, idx) => {
            const isActive = pathname?.includes(item.href.split('/')[1])
            return (
              <motion.button
                key={idx}
                onClick={() => router.push(item.href)}
                whileTap={{ scale: 0.9 }}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all ${
                  isActive
                    ? `bg-${item.color}-500/20 text-${item.color}-400`
                    : 'text-cyan-300/50 hover:text-cyan-300'
                }`}
              >
                {item.icon}
                <span className="text-xs font-bold">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className={`h-1 w-6 bg-${item.color}-500 rounded-full`}
                  />
                )}
              </motion.button>
            )
          })}

          {/* Menu Butonu */}
          <motion.button
            onClick={() => setMenuAcik(!menuAcik)}
            whileTap={{ scale: 0.9 }}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-cyan-300/50 hover:text-cyan-300 transition-all"
          >
            <Menu className="w-5 h-5" />
            <span className="text-xs font-bold">Daha</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Dropdown Menu */}
      {menuAcik && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="fixed bottom-20 right-4 z-50 bg-cyan-900/30 border border-cyan-500/30 rounded-2xl backdrop-blur-xl p-2 space-y-1"
        >
          <button
            onClick={() => {
              router.push('/profil')
              setMenuAcik(false)
            }}
            className="w-full text-left px-4 py-2 text-cyan-300 hover:bg-cyan-500/10 rounded-lg text-sm font-bold transition"
          >
            👤 Profil
          </button>
          <button
            onClick={() => {
              router.push('/bildirimler')
              setMenuAcik(false)
            }}
            className="w-full text-left px-4 py-2 text-cyan-300 hover:bg-cyan-500/10 rounded-lg text-sm font-bold transition"
          >
            🔔 Bildirimler
          </button>
          <button
            onClick={() => {
              router.push('/yardim')
              setMenuAcik(false)
            }}
            className="w-full text-left px-4 py-2 text-cyan-300 hover:bg-cyan-500/10 rounded-lg text-sm font-bold transition"
          >
            ❓ Yardım
          </button>
          <button
            onClick={logout}
            className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg text-sm font-bold transition flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Çıkış Yap
          </button>
        </motion.div>
      )}

      {/* Overlay */}
      {menuAcik && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuAcik(false)}
        />
      )}
    </>
  )
}
