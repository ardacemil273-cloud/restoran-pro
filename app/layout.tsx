'use client'
import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Toaster } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import PwaInstall from '@/components/PwaInstall'
import BottomNav from '@/components/BottomNav'
import IncomingCallNotification from '@/components/IncomingCallNotification'
import {
  LayoutDashboard, Layers, MapPin, ShoppingCart, ChefHat, Mic, Wallet,
  Package, Truck, CalendarDays, ListChecks, Warehouse, Users, Gamepad2,
  Tag, MessageCircle, BarChart3, Crown, Star, Brain, QrCode, Building2,
  Settings, LogOut, Menu, X, Zap
} from 'lucide-react'
import './globals.css'

// Navbar Item Component
function NavItem({ href, icon: Icon, label, badge, color = 'text-white' }: any) {
  const pathname = usePathname()
  const isActive = pathname === href
  return (
    <a
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
        isActive
          ? 'bg-primary/20 text-primary border border-primary/30'
          : 'text-white/60 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={18} />
      <span className="text-sm font-bold flex-1">{label}</span>
      {badge && <span className={`text-xs font-black px-2 py-1 rounded-lg bg-white/10 ${color}`}>{badge}</span>}
    </a>
  )
}

// Navbar Group Component
function NavGroup({ label, id, children }: any) {
  const [isOpen, setIsOpen] = useState(true)
  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-2 text-white/40 hover:text-white/60 transition-all text-xs font-black uppercase"
      >
        <span className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}>▶</span>
        {label}
      </button>
      {isOpen && <div className="space-y-1 pl-2">{children}</div>}
    </div>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [mobilMenuAcik, setMobilMenuAcik] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Service Worker Kaydı
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(
          (registration) => {
            console.log('SW registered: ', registration);
          },
          (registrationError) => {
            console.log('SW registration failed: ', registrationError);
          }
        );
      });
    }

    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Auth error:', error)
      }
    }
    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const cikisYap = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/' || pathname.startsWith('/menu/') || pathname.startsWith('/qr/')

  if (isAuthPage) {
    return (
      <html lang="tr" className="dark">
        <head>
          <title>Restoran Pro - Yönetim Sistemi</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <link rel="manifest" href="/manifest.json" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <meta name="theme-color" content="#000000" />
        </head>
        <body className="bg-background text-white overflow-x-hidden">
          {children}
          <Toaster position="bottom-center" />
        </body>
      </html>
    )
  }

  return (
    <html lang="tr" className="dark">
      <head>
        <title>Restoran Pro - Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className="bg-background text-white overflow-hidden h-dvh">
        <div className="flex h-dvh bg-background">
          {/* Sidebar (Desktop) */}
          <aside className="hidden lg:flex w-72 flex-col bg-card border-r border-white/5 relative z-40 overflow-y-auto custom-scrollbar">
            <div className="p-6 flex items-center gap-3 border-b border-white/5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                <ChefHat className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white leading-none">Restoran Pro</h1>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Yönetim Paneli</p>
              </div>
            </div>

            <nav className="flex-1 p-4 space-y-6">
              <div className="space-y-1">
                <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem href="/tek-panel" icon={Layers} label="Tek Panel" badge="Yemek+Getir" color="text-orange-400" />
                <NavItem href="/yemeksepeti-siparisler" icon={Package} label="Yemeksepeti" badge="Yeni" color="text-pink-400" />
              </div>

              <NavGroup label="Garson Paneli" id="garson">
                <NavItem href="/masalar" icon={MapPin} label="Masa Haritası" />
                <NavItem href="/siparisler" icon={ShoppingCart} label="Siparişler" />
                <NavItem href="/mutfak-ekrani" icon={ChefHat} label="Mutfak Ekranı" />
                <NavItem href="/ai-sesli-siparis" icon={Mic} label="Sesli Sipariş" badge="AI" color="text-cyan-400" />
                <NavItem href="/kasa" icon={Wallet} label="Kasa / Ödeme" />
              </NavGroup>

              <NavGroup label="Operasyon" id="isletme">
                <NavItem href="/paket-siparis" icon={Package} label="Paket Servis" />
                <NavItem href="/kurye-takip" icon={Truck} label="Kurye Takibi" color="text-blue-400" />
                <NavItem href="/rezervasyon" icon={CalendarDays} label="Rezervasyonlar" />
                <NavItem href="/urunler" icon={ListChecks} label="Ürün Yönetimi" />
                <NavItem href="/stok" icon={Warehouse} label="Stok Takibi" badge="AI" />
              </NavGroup>

              <NavGroup label="Müşteri & Sadakat" id="sadakat">
                <NavItem href="/musteriler" icon={Users} label="Müşteri Rehberi" />
                <NavItem href="/sadakat-oyun" icon={Gamepad2} label="Çarkıfelek" badge="Yeni" color="text-purple-400" />
                <NavItem href="/indirimler" icon={Tag} label="Kampanyalar" />
                <NavItem href="/whatsapp-siparisler" icon={MessageCircle} label="WP Siparişleri" color="text-green-400" />
              </NavGroup>

              <NavGroup label="Yönetim & Analiz" id="analiz">
                <NavItem href="/rapor" icon={BarChart3} label="Satış Raporları" />
                <NavItem href="/patron-merkezi" icon={Crown} label="Patron Merkezi" color="text-yellow-400" />
                <NavItem href="/garson-performans" icon={Star} label="Garson Primleri" />
                <NavItem href="/ai-analiz" icon={Brain} label="AI Tahminleme" badge="AI" />
              </NavGroup>

              <NavGroup label="Sistem" id="ayarlar">
                <NavItem href="/qr-kodlar" icon={QrCode} label="QR Menü Yönetimi" />
                <NavItem href="/subeler" icon={Building2} label="Şube Yönetimi" />
                <NavItem href="/ayarlar" icon={Settings} label="Genel Ayarlar" />
              </NavGroup>
            </nav>

            <div className="p-4 border-t border-white/5">
              <button
                onClick={cikisYap}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:bg-red-500/10 hover:text-red-500 transition-all"
              >
                <LogOut size={18} />
                <span className="text-sm font-bold">Oturumu Kapat</span>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden h-dvh">
            {/* Header (Mobile) */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center justify-between safe-area-inset-top">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <ChefHat size={18} className="text-white" />
                </div>
                <span className="font-black text-white">Restoran Pro</span>
              </div>
              <button
                onClick={() => setMobilMenuAcik(true)}
                className="p-2 hover:bg-white/5 rounded-lg transition-all"
              >
                <Menu size={24} className="text-white" />
              </button>
            </div>

            <main className="flex-1 relative overflow-y-auto pt-16 lg:pt-0 bg-background custom-scrollbar pb-24 lg:pb-0 safe-area-inset-bottom">
              {children}
            </main>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
              {mobilMenuAcik && (
                <motion.div
                  initial={{ opacity: 0, x: -300 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -300 }}
                  transition={{ duration: 0.3 }}
                  className="lg:hidden fixed inset-0 z-[45] bg-card/95 backdrop-blur-xl overflow-y-auto pt-20 pb-40 safe-area-inset-bottom"
                >
                  <div className="p-4 flex flex-col min-h-full">
                    <button
                      onClick={() => setMobilMenuAcik(false)}
                      className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-all z-50 safe-area-inset-top"
                    >
                      <X size={24} className="text-white" />
                    </button>
                    <nav className="space-y-4 flex-1 mt-4">
                      <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                      <NavItem href="/masalar" icon={MapPin} label="Masa Haritası" />
                      <NavItem href="/siparisler" icon={ShoppingCart} label="Siparişler" />
                      <NavItem href="/kasa" icon={Wallet} label="Kasa / Ödeme" />
                      <NavItem href="/ayarlar" icon={Settings} label="Ayarlar" />
                    </nav>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <BottomNav />
        <IncomingCallNotification />
        <Toaster position="bottom-center" />
        <PwaInstall />
      </body>
    </html>
  )
}
