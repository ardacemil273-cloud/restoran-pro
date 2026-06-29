'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ChefHat, Eye, EyeOff } from 'lucide-react'

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: sifre
    })
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
    toast.success('Giriş başarılı!')
    router.push('/masalar')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <ChefHat className="w-8 h-8 text-yellow-500" />
          <span className="text-2xl font-bold text-yellow-500">Restoran Pro</span>
        </div>
        <Card className="p-6 bg-zinc-800 border-zinc-700">
          <h1 className="text-2xl font-bold mb-6 text-white text-center">Giriş Yap</h1>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">E-posta</label>
              <Input
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-zinc-700 text-white border-zinc-600"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Şifre</label>
              <div className="relative">
                <Input
                  type={goster ? 'text' : 'password'}
                  placeholder="Şifreniz"
                  value={sifre}
                  onChange={e => setSifre(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="bg-zinc-700 text-white border-zinc-600 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setGoster(!goster)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {goster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link
                href="/sifremi-unuttum"
                className="text-sm text-yellow-500 hover:text-yellow-400"
              >
                Şifremi Unuttum
              </Link>
            </div>
            <Button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-yellow-500 text-black font-bold hover:bg-yellow-400"
            >
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </div>
          <div className="mt-4 text-center text-sm text-zinc-400">
            Hesabın yok mu?{' '}
            <Link href="/register" className="text-yellow-500 hover:text-yellow-400 font-bold">
              Kayıt Ol
            </Link>
          </div>
          <div className="mt-2 text-center">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-400">
              Ana Sayfaya Dön
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
