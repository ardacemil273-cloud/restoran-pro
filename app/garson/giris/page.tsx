'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { UtensilsCrossed, Eye, EyeOff, Lock, Smartphone, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

type GirisYontemi = 'email' | 'pin' | 'ad-sifre'

export default function GarsonGirisPage() {
  const [girisYontemi, setGirisYontemi] = useState<GirisYontemi>('email')
  
  // Email + Şifre
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [sifreGoster, setSifreGoster] = useState(false)
  
  // PIN
  const [pin, setPin] = useState('')
  
  // Garson Adı + Şifre
  const [garsonAd, setGarsonAd] = useState('')
  const [garsonSifre, setGarsonSifre] = useState('')
  const [garsonSifreGoster, setGarsonSifreGoster] = useState(false)
  
  const [yukleniyor, setYukleniyor] = useState(false)
  const router = useRouter()

  // Email + Şifre ile Giriş (Supabase Auth)
  const girisYapEmail = async (e: React.FormEvent) => {
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

  // PIN ile Giriş
  const girisYapPin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin || pin.length !== 4) return toast.error('4 haneli PIN girin')

    setYukleniyor(true)
    try {
      const response = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify', pin })
      })

      const data = await response.json()
      if (!response.ok) {
        toast.error(data.error || 'PIN doğrulaması başarısız')
        setYukleniyor(false)
        return
      }

      toast.success('Hoş geldin!')
      sessionStorage.setItem('pin_session', data.sessionToken)
      sessionStorage.setItem('garson_id', data.garsonId)
      router.push('/garson')
    } catch (err: any) {
      toast.error('Hata: ' + err.message)
      setYukleniyor(false)
    }
  }

  // Garson Adı + Şifre ile Giriş
  const girisYapAdSifre = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!garsonAd || !garsonSifre) return toast.error('Garson adı ve şifre gerekli')

    setYukleniyor(true)
    try {
      // Garsonlar tablosundan ara
      const { data: garson, error: garsonError } = await supabase
        .from('garsonlar')
        .select('id, ad, sifre, sifre_aktif, restoran_id')
        .ilike('ad', garsonAd)
        .maybeSingle()

      if (garsonError || !garson) {
        toast.error('Garson bulunamadı')
        setYukleniyor(false)
        return
      }

      if (!garson.sifre_aktif) {
        toast.error('Bu garson için şifre girişi aktif değil')
        setYukleniyor(false)
        return
      }

      // Şifre doğrulaması
      if (garson.sifre !== garsonSifre) {
        toast.error('Şifre yanlış')
        setYukleniyor(false)
        return
      }

      // Giriş başarılı - session oluştur
      sessionStorage.setItem('garson_id', garson.id)
      sessionStorage.setItem('garson_ad', garson.ad)
      sessionStorage.setItem('restoran_id', garson.restoran_id)
      
      // Giriş logla
      await supabase.from('garson_sifre_giris_loglari').insert({
        garson_id: garson.id,
        restoran_id: garson.restoran_id,
        basarili: true,
        ip_adresi: 'web',
        user_agent: navigator.userAgent
      })

      toast.success('Hoş geldin!')
      router.push('/garson')
    } catch (err: any) {
      toast.error('Hata: ' + err.message)
      setYukleniyor(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    if (girisYontemi === 'email') girisYapEmail(e)
    else if (girisYontemi === 'pin') girisYapPin(e)
    else if (girisYontemi === 'ad-sifre') girisYapAdSifre(e)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-yellow-500/30">
            <UtensilsCrossed className="w-8 h-8 text-black" />
          </div>
          <h1 className="text-3xl font-black text-white">Garson Girişi</h1>
          <p className="text-zinc-400 text-sm mt-1">Restoran Pro</p>
        </div>

        <Card className="p-6 bg-gradient-to-br from-zinc-800 to-zinc-900 border border-zinc-700/50 shadow-2xl">
          {/* Giriş Yöntemi Seçimi */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <button
              onClick={() => setGirisYontemi('email')}
              className={`py-2 px-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-1 ${
                girisYontemi === 'email'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              <Lock className="w-4 h-4" />
              Email
            </button>
            <button
              onClick={() => setGirisYontemi('pin')}
              className={`py-2 px-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-1 ${
                girisYontemi === 'pin'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              PIN
            </button>
            <button
              onClick={() => setGirisYontemi('ad-sifre')}
              className={`py-2 px-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-1 ${
                girisYontemi === 'ad-sifre'
                  ? 'bg-yellow-500 text-black shadow-lg shadow-yellow-500/30'
                  : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              Ad+Şifre
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email + Şifre Yöntemi */}
            {girisYontemi === 'email' && (
              <>
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                    >
                      {sifreGoster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* PIN Yöntemi */}
            {girisYontemi === 'pin' && (
              <div>
                <Label className="text-zinc-300 mb-2 block">PIN Kodu</Label>
                <Input
                  type="text"
                  placeholder="0000"
                  value={pin}
                  onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  maxLength={4}
                  className="bg-zinc-700 border-zinc-600 text-white text-center text-3xl font-mono tracking-widest"
                />
                <p className="text-xs text-zinc-400 mt-2">4 haneli PIN kodunuzu girin</p>
              </div>
            )}

            {/* Garson Adı + Şifre Yöntemi */}
            {girisYontemi === 'ad-sifre' && (
              <>
                <div>
                  <Label className="text-zinc-300 mb-2 block">Garson Adı</Label>
                  <Input
                    type="text"
                    placeholder="Garson adınız"
                    value={garsonAd}
                    onChange={e => setGarsonAd(e.target.value)}
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-zinc-300 mb-2 block">Şifre</Label>
                  <div className="relative">
                    <Input
                      type={garsonSifreGoster ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={garsonSifre}
                      onChange={e => setGarsonSifre(e.target.value)}
                      className="bg-zinc-700 border-zinc-600 text-white pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setGarsonSifreGoster(!garsonSifreGoster)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200"
                    >
                      {garsonSifreGoster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </>
            )}

            <Button
              type="submit"
              disabled={yukleniyor}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-black hover:from-yellow-400 hover:to-orange-400 font-black h-12 text-base shadow-lg shadow-yellow-500/30 transition-all"
            >
              {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </Button>
          </form>
        </Card>

        <p className="text-center text-zinc-500 text-xs mt-4">
          Hesabın yoksa yöneticiden oluşturmasını iste
        </p>
      </div>
    </div>
  )
}
