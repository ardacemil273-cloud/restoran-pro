'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Loader, Lock, Mail } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface AdminLoginProps {
  onBack: () => void
}

export default function AdminLogin({ onBack }: AdminLoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        toast.error('Giriş başarısız: ' + error.message)
      } else {
        toast.success('Giriş başarılı! Yönlendiriliyorsunuz...')
        router.push('/dashboard')
      }
    } catch (err: any) {
      toast.error('Bir hata oluştu: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Başlık */}
      <div className="space-y-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          Geri Dön
        </button>
        <h2 className="text-3xl font-black text-white">Yönetici Girişi</h2>
        <p className="text-white/60">E-posta ve şifre ile giriş yapın</p>
      </div>

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        {/* E-posta */}
        <div className="space-y-2">
          <label className="block text-sm font-bold text-white/70">E-posta Adresi</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ornek@restoran.com"
              disabled={loading}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-800/50 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 transition-all"
              required
            />
          </div>
        </div>

        {/* Şifre */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="block text-sm font-bold text-white/70">Şifre</label>
            <Link
              href="/sifremi-unuttum"
              className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
            >
              Şifremi Unuttum?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-zinc-800/50 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary disabled:opacity-50 transition-all"
              required
            />
          </div>
        </div>

        {/* Giriş Butonu */}
        <motion.button
          type="submit"
          disabled={loading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:opacity-50 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Giriş Yapılıyor...
            </>
          ) : (
            <>
              Giriş Yap
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </form>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-white/10">
        <p className="text-sm text-white/60">
          Hesabınız yok mu?{' '}
          <Link href="/register" className="text-primary font-bold hover:text-primary/80 transition-colors">
            Ücretsiz Kayıt Olun
          </Link>
        </p>
      </div>
    </motion.div>
  )
}
