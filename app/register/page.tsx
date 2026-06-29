'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ChefHat, Eye, EyeOff, ArrowRight, Loader2, Check } from 'lucide-react'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [restoranAd, setRestoranAd] = useState('')
  const [loading, setLoading] = useState(false)
  const [goster, setGoster] = useState(false)
  const router = useRouter()

  const handleRegister = async () => {
    if (!email || !sifre || !restoranAd) {
      toast.error('Tüm alanları doldurunuz')
      return
    }
    if (sifre.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({ email, password: sifre })
    if (error) {
      toast.error('Kayıt hatası: ' + error.message)
      setLoading(false)
      return
    }
    if (data.user) {
      const { error: restoranError } = await supabase.from('restoranlar').insert([{
        ad: restoranAd,
        user_id: data.user.id,
        slug: restoranAd.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }])
      if (restoranError) console.error('Restoran oluşturma hatası:', restoranError)
    }
    toast.success('Kayıt başarılı! Giriş yapılıyor...')
    router.push('/masalar')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{backgroundColor: 'hsl(224,71%,4%)'}}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12" style={{background: 'linear-gradient(135deg, hsl(220,14%,6%) 0%, hsl(224,71%,8%) 100%)'}}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-10" style={{background: 'radial-gradient(circle, #f59e0b, transparent)'}} />
          <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-10" style={{background: 'radial-gradient(circle, #f97316, transparent)'}} />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-xl" style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)'}}>
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white">Restoran Pro</h1>
            <p className="text-xs font-medium" style={{color: 'rgba(245,158,11,0.7)'}}>Yönetim Sistemi</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              14 Gün<br />
              <span style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                Ücretsiz Deneyin
              </span>
            </h2>
            <p className="text-lg" style={{color: 'rgba(255,255,255,0.5)'}}>
              Kredi kartı gerekmez. İstediğiniz zaman iptal edin.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Sınırsız masa ve sipariş',
              'QR menü ve garson paneli',
              'Gerçek zamanlı raporlar',
              'AI destekli analiz',
              '7/24 teknik destek',
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{background: 'rgba(245,158,11,0.2)', border: '1px solid rgba(245,158,11,0.4)'}}>
                  <Check className="w-3 h-3" style={{color: '#f59e0b'}} />
                </div>
                <span className="text-sm font-medium" style={{color: 'rgba(255,255,255,0.7)'}}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 p-4 rounded-2xl" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)'}}>
          <p className="text-sm italic" style={{color: 'rgba(255,255,255,0.6)'}}>
            "Restoran Pro sayesinde siparişlerimizi %40 daha hızlı alıyoruz. Mutfak ekranı harika!"
          </p>
          <p className="text-xs mt-2 font-semibold" style={{color: '#f59e0b'}}>— Ahmet K., İstanbul</p>
        </div>
      </div>

      {/* Right Panel - Register Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)'}}>
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-black text-white">Restoran Pro</h1>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-black text-white mb-2">Hesap Oluşturun</h2>
            <p style={{color: 'rgba(255,255,255,0.4)'}}>14 gün ücretsiz, kredi kartı gerekmez</p>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-2" style={{color: 'rgba(255,255,255,0.7)'}}>
                Restoran Adı
              </label>
              <input
                type="text"
                placeholder="Örn: Lezzet Durağı"
                value={restoranAd}
                onChange={e => setRestoranAd(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none transition-all text-sm"
                style={{backgroundColor: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)'}}
                onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{color: 'rgba(255,255,255,0.7)'}}>
                E-posta Adresi
              </label>
              <input
                type="email"
                placeholder="ornek@restoran.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none transition-all text-sm"
                style={{backgroundColor: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)'}}
                onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)' }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2" style={{color: 'rgba(255,255,255,0.7)'}}>
                Şifre
              </label>
              <div className="relative">
                <input
                  type={goster ? 'text' : 'password'}
                  placeholder="En az 6 karakter"
                  value={sifre}
                  onChange={e => setSifre(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  className="w-full px-4 py-3 pr-12 rounded-xl text-white placeholder-white/30 outline-none transition-all text-sm"
                  style={{backgroundColor: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.1)'}}
                  onFocus={e => { e.target.style.borderColor = '#f59e0b'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  type="button"
                  onClick={() => setGoster(!goster)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{color: 'rgba(255,255,255,0.3)'}}
                >
                  {goster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRegister}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-black text-sm transition-all disabled:opacity-60"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
              }}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span>Hesap oluşturuluyor...</span></>
              ) : (
                <><span>Ücretsiz Hesap Oluştur</span><ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm" style={{color: 'rgba(255,255,255,0.4)'}}>
              Zaten hesabınız var mı?{' '}
              <Link href="/login" className="font-bold hover:underline" style={{color: '#f59e0b'}}>
                Giriş Yapın
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
