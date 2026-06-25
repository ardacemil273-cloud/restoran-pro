'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: sifre
    })
    
    if (error) {
      alert('Giriş hatası: ' + error.message)
      setLoading(false)
      return
    }
    
    router.push('/masalar')
    setLoading(false)
  }

  return (
    <div className="h-screen flex items-center justify-center bg-zinc-900">
      <Card className="p-6 w-96 bg-zinc-800 border-zinc-700">
        <h1 className="text-2xl font-bold mb-4 text-white text-center">Giriş Yap</h1>
        
        <Input 
          type="email" 
          placeholder="Email" 
          value={email}
          onChange={e => setEmail(e.target.value)}
          className="mb-2 bg-zinc-700 text-white border-zinc-600"
        />
        <Input 
          type="password" 
          placeholder="Şifre" 
          value={sifre}
          onChange={e => setSifre(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          className="mb-4 bg-zinc-700 text-white border-zinc-600"
        />
        
        <Button 
          onClick={handleLogin} 
          disabled={loading} 
          className="w-full mb-4"
        >
          {loading? 'Giriş yapılıyor...' : 'Giriş Yap'}
        </Button>

        <div className="text-center text-sm text-zinc-400">
          Hesabın yok mu?{' '}
          <Link href="/register" className="text-yellow-500 hover:text-yellow-400 font-bold">
            Kayıt Ol
          </Link>
        </div>
      </Card>
    </div>
  )
}
