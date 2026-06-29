'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UtensilsCrossed, Eye, EyeOff, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export default function GarsonGirisPage() {
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [sifreGoster, setSifreGoster] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(false)
  const router = useRouter()

  const girisYap = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !sifre) return toast.error('Email ve şifre gerekli')

    setYukleniyor(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password: sifre })

    if (error) {
      toast.error('Giriş başarısız: ' + error.message)
      setYukleniyor(false)
      return
    }

    toast.success('Hoş geldin!')
    router.push('/garson')
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-2xl font-bold text-white">Garson Girişi</h1>
          <p className="text-zinc-400 text-sm mt-1">Restoran Pro</p>
        </div>

        <Card className="p-6 bg-zinc-800 border-zinc-700">
          <form onSubmit={girisYap} className="space-y-4">
            <div>
              <Label className="text-zinc-300 mb-2 block">E-posta</Label>
              <Input
                type="email"
                placeholder="garson@restoran.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="bg-zinc-700 border-zinc-600 text-white"
                autoComplete="email"
              />
            </div>

            <div>
              <Label className="text-zinc-300 mb-2 block">Şifre</Label>
              <div className="relative">
                <Input
                  type={sifreGoster ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={sifre}
                  onChange={e => setSifre(e.target.value)}
                  className="bg-zinc-700 border-zinc-600 text-white pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setSifreGoster(!sifreGoster)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                >
                  {sifreGoster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={yukleniyor}
              className="w-full bg-yellow-500 text-black hover:bg-yellow-400 font-bold h-12 text-base"
            >
              {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>
        </Card>

        <p className="text-center text-zinc-500 text-xs mt-4">
          Hesabın yoksa yöneticinden oluşturmasını iste
        </p>
      </div>
    </div>
  )
}
