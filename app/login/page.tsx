'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ChefHat, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [loading, setLoading] = useState(false)
  const [goster, setGoster] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    if (!email || !sifre) {
      toast.error('E-posta ve şifre gereklidir')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: sifre })
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('E-posta veya şifre hatalı')
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('E-posta adresinizi doğrulamanız gerekiyor')
      } else {
        toast.error('Giriş hatası: ' + error.message)
      }
      setLoading(false)
      return
    }
    toast.success('Giriş başarılı! Yönlendiriliyorsunuz...')
    router.push('/masalar')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{backgroundColor: 'hsl(224,71%,4%)'}}>
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12" style={{background: 'linear-gradient(135deg, hsl(220,14%,6%) 0%, hsl(224,71%,8%) 100%)'}}>
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10" style={{background: 'radial-gradient(circle, #f59e0b, transparent)'}} />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10" style={{background: 'radial-gradient(circle, #f97316, transparent)'}} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-5" style={{background: 'radial-gradient(circle, #f59e0b, transparent)'}} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl" style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)'}}>
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Restoran Pro</h1>
            <p className="text-xs font-medium" style={{color: 'rgba(245,158,11,0.7)'}}>Yönetim Sistemi</p>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Restoranınızı<br />
              <span style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                Dijitalleştirin
              </span>
            </h2>
            <p className="text-lg" style={{color: 'rgba(255,255,255,0.5)'}}>
              QR menü, garson paneli, kasa, stok takibi ve yapay zeka analizi tek platformda.
            </p>
          </div>

          <div className="space-y-4">
            {[
              { icon: '🍽️', text: 'Masa & Sipariş Yönetimi' },
              { icon: '📊', text: 'Gerçek Zamanlı Raporlar' },
              { icon: '🤖', text: 'AI Destekli Analiz' },
              { icon: '📱', text: 'Mobil Uyumlu Garson Paneli' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-medium" style={{color: 'rgba(255,255,255,0.7)'}}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: '500+', label: 'Aktif Restoran' },
            { value: '99.9%', label: 'Uptime' },
            { value: '7/24', label: 'Destek' },
          ].map((stat, i) => (
            <div key={i} className="text-center p-3 rounded-xl" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)'}}>
              <p className="text-xl font-black" style={{color: '#f59e0b'}}>{stat.value}</p>
              <p className="text-xs mt-0.5" style={{color: 'rgba(255,255,255,0.4)'}}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)'}}>
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-white">Restoran Pro</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-white mb-2">Hoş Geldiniz</h2>
            <p style={{color: 'rgba(255,255,255,0.4)'}}>Hesabınıza giriş yapın</p>
          </div>

          <div className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-semibold mb-2" style={{color: 'rgba(255,255,255,0.7)'}}>
                E-posta Adresi
              </label>
              <input
                type="email"
                placeholder="ornek@restoran.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none transition-all text-sm"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  border: '1.5px solid rgba(255,255,255,0.1)',
                }}
                onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold" style={{color: 'rgba(255,255,255,0.7)'}}>
                  Şifre
                </label>
                <Link href="/sifremi-unuttum" className="text-xs font-medium hover:underline" style={{color: '#f59e0b'}}>
                  Şifremi Unuttum
                </Link>
              </div>
              <div className="relative">
                <input
                  type={goster ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={sifre}
                  onChange={e => setSifre(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="w-full px-4 py-3 pr-12 rounded-xl text-white placeholder-white/30 outline-none transition-all text-sm"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setGoster(!goster)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{color: 'rgba(255,255,255,0.3)'}}
                >
                  {goster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-black text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                background: loading ? 'rgba(245,158,11,0.7)' : 'linear-gradient(135deg, #f59e0b, #f97316)',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(245,158,11,0.3)',
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Giriş yapılıyor...</span>
                </>
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{color: 'rgba(255,255,255,0.4)'}}>
              Hesabınız yok mu?{' '}
              <Link href="/register" className="font-bold hover:underline" style={{color: '#f59e0b'}}>
                Ücretsiz Kayıt Olun
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/" className="text-xs hover:underline" style={{color: 'rgba(255,255,255,0.25)'}}>
              Ana Sayfaya Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
