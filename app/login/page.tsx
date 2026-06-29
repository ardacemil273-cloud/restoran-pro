'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { UtensilsCrossed, ArrowRight, ShieldCheck, Zap, BarChart3, Star } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('Giriş başarısız: ' + error.message)
      setLoading(false)
    } else {
      toast.success('Giriş başarılı! Yönlendiriliyorsunuz...')
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex bg-background selection:bg-primary/30">
      {/* Sol Panel - Branding & Info */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12 bg-card border-r border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.05),transparent)] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-2xl shadow-primary/20 rotate-3">
              <UtensilsCrossed className="w-7 h-7 text-black" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white uppercase">Restoran <span className="text-primary">Pro</span></h1>
          </div>
          
          <div className="space-y-8">
            <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight">
              Restoranınızı <br />
              <span className="text-primary">Dijitalleştirin.</span>
            </h2>
            <p className="text-xl text-white/50 max-w-md leading-relaxed">
              QR menü, garson paneli, kasa, stok takibi ve yapay zeka analizli tek platformda restoranınızı yönetin.
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-white font-bold mb-1">Hızlı Sipariş</h3>
            <p className="text-xs text-white/40">Saniyeler içinde sipariş al ve mutfağa ilet.</p>
          </div>
          <div className="p-6 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-white font-bold mb-1">AI Analiz</h3>
            <p className="text-xs text-white/40">Satış verilerini yapay zeka ile analiz et.</p>
          </div>
        </div>
      </div>

      {/* Sağ Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left space-y-2">
            <h3 className="text-3xl font-black text-white tracking-tight">Hoş Geldiniz</h3>
            <p className="text-white/50 font-medium">Hesabınıza giriş yapın</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-white/40 uppercase tracking-widest ml-1">E-posta Adresi</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@restoran.com"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-white/40 uppercase tracking-widest">Şifre</label>
                  <Link href="/sifremi-unuttum" className="text-xs font-bold text-primary hover:text-primary/80 transition-colors">Şifremi Unuttum</Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-black font-black py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>

          <div className="text-center">
            <p className="text-white/40 font-medium">
              Hesabınız yok mu? <Link href="/register" className="text-primary font-bold hover:underline">Ücretsiz Kayıt Olun</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
