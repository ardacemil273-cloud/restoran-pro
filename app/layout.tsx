'use client'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard, ShoppingCart, BarChart3, Settings, LogOut, QrCode, Package, Phone, Users,
  TrendingDown, Brain, Warehouse, CalendarDays, Tag, UtensilsCrossed, ChefHat, Menu, X,
  DollarSign, ChevronDown, ChevronRight, Layers, MapPin, Award, MessageCircle, Mic, Sparkles,
  Crown, Building2, Shield, FileText, Zap, Truck, Gamepad2, Gift, History, Wallet, Search,
  Headphones, ListChecks, Bell, Star
} from 'lucide-react'
import PwaInstall from '@/components/PwaInstall'
import { Toaster } from 'sonner'
import './globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [mobilMenuAcik, setMobilMenuAcik] = useState(false)
  const [menuGrupAcik, setMenuGrupAcik] = useState<Record<string, boolean>>({
    garson: true,
    isletme: true,
    yonetim: true,
    analiz: true,
    ayarlar: true,
    sadakat: true
  })

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
    router.push('/login')
  }

  const toggleGrup = (grup: string) => {
    setMenuGrupAcik(prev => ({ ...prev, [grup]: !prev[grup] }))
  }

  const NavItem = ({ href, icon: Icon, label, badge, color }: any) => {
    const active = pathname === href
    return (
      <button
        onClick={() => {
          router.push(href)
          setMobilMenuAcik(false)
        }}
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group ${
          active 
            ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5' 
            : 'text-white/50 hover:bg-white/5 hover:text-white'
        }`}
      >
        <div className="flex items-center gap-3">
          <Icon className={`w-[18px] h-[18px] transition-colors ${active ? 'text-primary' : color || 'group-hover:text-white'}`} />
          <span className="text-sm font-medium tracking-tight">{label}</span>
        </div>
        {badge && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border uppercase tracking-tighter ${
            badge === 'AI' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/20' : 'bg-primary/20 text-primary border-primary/20'
          }`}>
            {badge}
          </span>
        )}
      </button>
    )
  }

  const NavGroup = ({ label, id, children }: any) => (
    <div className="space-y-1">
      <button 
        onClick={() => toggleGrup(id)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] hover:text-white/50 transition-colors"
      >
        {label}
        {menuGrupAcik[id] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {menuGrupAcik[id] && <div className="space-y-1 animate-fadeIn">{children}</div>}
    </div>
  )

  if (isPublic) {
    return (
      <html lang="tr" className="dark">
        <head>
          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#f59e0b" />
          <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        </head>
        <body className="bg-background text-foreground selection:bg-primary/30 antialiased">
          <PwaInstall />
          <Toaster richColors position="bottom-center" />
          {children}
        </body>
      </html>
    )
  }

  return (
    <html lang="tr" className="dark">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#f59e0b" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="bg-background text-foreground selection:bg-primary/30 antialiased overflow-hidden">
        <PwaInstall />
        <Toaster richColors position="bottom-center" />
        
        <div className="flex h-screen overflow-hidden">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:flex w-72 flex-col bg-card border-r border-white/5 relative z-40">
            {/* Sidebar Header */}
            <div className="p-6">
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3">
                  <UtensilsCrossed className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tighter text-white">RESTORAN <span className="text-primary">PRO</span></h1>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Premium Plan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 space-y-6 custom-scrollbar pb-6">
              <div className="space-y-1">
                <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem href="/tek-panel" icon={Layers} label="Tek Panel" badge="Yemek+Getir" color="text-orange-400" />
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

            {/* Sidebar Footer */}
            <div className="p-4 mt-auto border-t border-white/5">
              <button 
                onClick={cikisYap}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/40 hover:bg-red-500/10 hover:text-red-500 transition-all duration-200"
              >
                <LogOut size={18} />
                <span className="text-sm font-bold">Oturumu Kapat</span>
              </button>
            </div>
          </aside>

          {/* Mobile Header */}
          <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
                <UtensilsCrossed className="w-5 h-5 text-black" />
              </div>
              <h1 className="text-base font-black tracking-tighter text-white uppercase">Restoran <span className="text-primary">Pro</span></h1>
            </div>
            <button 
              onClick={() => setMobilMenuAcik(!mobilMenuAcik)}
              className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white"
            >
              {mobilMenuAcik ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* Main Content */}
          <main className="flex-1 relative overflow-y-auto pt-16 lg:pt-0 bg-background custom-scrollbar">
            {children}
          </main>
        </div>

        {/* Mobile Menu Overlay */}
        {mobilMenuAcik && (
          <div className="lg:hidden fixed inset-0 z-[60] bg-background animate-fadeIn overflow-y-auto pb-10">
            <div className="p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                    <UtensilsCrossed className="w-6 h-6 text-black" />
                  </div>
                  <h1 className="text-xl font-black tracking-tighter text-white">RESTORAN <span className="text-primary">PRO</span></h1>
                </div>
                <button onClick={() => setMobilMenuAcik(false)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
                  <X size={20} />
                </button>
              </div>
              
              <nav className="space-y-6">
                <NavItem href="/dashboard" icon={LayoutDashboard} label="Dashboard" />
                <NavItem href="/tek-panel" icon={Layers} label="Tek Panel" badge="Yemek+Getir" />
                
                <NavGroup label="Garson Paneli" id="garson">
                  <NavItem href="/masalar" icon={MapPin} label="Masalar" />
                  <NavItem href="/siparisler" icon={ShoppingCart} label="Siparişler" />
                  <NavItem href="/ai-sesli-siparis" icon={Mic} label="Sesli Sipariş" />
                </NavGroup>

                <NavGroup label="İşletme" id="isletme">
                  <NavItem href="/paket-siparis" icon={Package} label="Paket Servis" />
                  <NavItem href="/urunler" icon={ListChecks} label="Ürünler" />
                  <NavItem href="/stok" icon={Warehouse} label="Stok" />
                </NavGroup>

                <NavGroup label="Yönetim" id="analiz">
                  <NavItem href="/rapor" icon={BarChart3} label="Raporlar" />
                  <NavItem href="/patron-merkezi" icon={Crown} label="Patron Merkezi" />
                </NavGroup>

                <div className="pt-6 border-t border-white/5">
                  <button onClick={cikisYap} className="w-full flex items-center gap-3 px-3 py-2.5 text-red-500 font-bold">
                    <LogOut size={18} /> Oturumu Kapat
                  </button>
                </div>
              </nav>
            </div>
          </div>
        )}
      </body>
    </html>
  )
}
