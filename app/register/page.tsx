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
        sahibi_id: data.user.id,
        slug: restoranAd.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        patron_sifre: '1234',
      }])
      if (restoranError) console.error('Restoran oluşturma hatası:', restoranError)
    }
    toast.success('Kayıt başarılı! Giriş yapılıyor...')
    router.push('/masalar')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex" style={{backgroundColor: 'hsl(224,71%,4%)'}}>
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
          <h2 className="text-4xl font-black text-white leading-tight">14 Gün Ücretsiz Deneyin</h2>
          <div className="space-y-3">
            {['Sınırsız masa ve sipariş', 'QR menü ve garson paneli', 'Gerçek zamanlı raporlar'].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <Check className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-white/70">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-5">
            <input type="text" placeholder="Restoran Adı" value={restoranAd} onChange={e => setRestoranAd(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
            <input type="email" placeholder="E-posta" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
            <input type={goster ? 'text' : 'password'} placeholder="Şifre" value={sifre} onChange={e => setSifre(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white" />
            <button onClick={handleRegister} disabled={loading} className="w-full py-4 rounded-xl font-bold bg-primary text-black">
              {loading ? 'Oluşturuluyor...' : 'Ücretsiz Hesap Oluştur'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
