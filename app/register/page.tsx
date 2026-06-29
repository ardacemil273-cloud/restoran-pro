'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { PAKETLER } from '@/lib/paketler'
import Link from 'next/link'
import { ChefHat, Eye, EyeOff, Check } from 'lucide-react'

function RegisterIcerik() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [restoranAd, setRestoranAd] = useState('')
  const [paketTuru, setPaketTuru] = useState<'basit' | 'big' | 'pro'>('basit')
  const [loading, setLoading] = useState(false)
  const [goster, setGoster] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const paket = searchParams.get('paket')
    if (paket === 'big' || paket === 'pro') {
      setPaketTuru(paket)
    }
  }, [searchParams])

  const slugOlustur = (ad: string) => {
    const slug = ad
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    return `${slug}-${Math.floor(Math.random() * 9000) + 1000}`
  }

  const handleRegister = async () => {
    if (!email || !password || !restoranAd) return toast.error('Tüm alanları doldur')
    if (password.length < 6) return toast.error('Şifre en az 6 karakter olmalı')
    setLoading(true)

    // 1. Kullanıcı oluştur
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { restoran_ad: restoranAd }
      }
    })

    if (authError) {
      setLoading(false)
      if (authError.message.includes('already registered')) {
        return toast.error('Bu email zaten kayıtlı. Giriş yap.')
      }
      return toast.error('Kayıt hatası: ' + authError.message)
    }

    if (!authData.user) {
      setLoading(false)
      return toast.error('Kullanıcı oluşturulamadı')
    }

    // 2. Session kontrol et
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setLoading(false)
      return toast.error('E-posta doğrulaması gerekiyor. Lütfen e-postanızı kontrol edin.')
    }

    // 3. Paket bitiş tarihi
    const bitisTarihi = paketTuru === 'basit'
      ? null
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // 4. Restoran oluştur
    const { data: restoran, error: restoranError } = await supabase
      .from('restoranlar')
      .insert({
        ad: restoranAd,
        sahibi_id: authData.user.id,
        slug: slugOlustur(restoranAd),
        paket_turu: paketTuru,
        paket_bitis_tarihi: bitisTarihi
      })
      .select()
      .single()

    if (restoranError) {
      setLoading(false)
      return toast.error('Restoran hatası: ' + restoranError.message)
    }

    // 5. Kullanıcı-restoran ilişkisi
    await supabase.from('kullanici_restoran').insert({
      user_id: authData.user.id,
      restoran_id: restoran.id
    })

    setLoading(false)
    if (paketTuru !== 'basit') {
      toast.success(`${PAKETLER[paketTuru].ad} paket 30 gün ücretsiz! Hoş geldiniz!`)
    } else {
      toast.success('Kayıt başarılı! Hoş geldiniz!')
    }
    window.location.href = '/masalar'
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-center gap-2 mb-8">
          <ChefHat className="w-8 h-8 text-yellow-500" />
          <span className="text-2xl font-bold text-yellow-500">Restoran Pro</span>
        </div>
        <Card className="p-6 bg-zinc-800 border-zinc-700">
          <h1 className="text-2xl font-bold mb-6 text-center">Ücretsiz Hesap Oluştur</h1>

          <div className="space-y-4 mb-6">
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Restoran Adı</label>
              <Input
                type="text"
                placeholder="Örn: Usta Döner"
                value={restoranAd}
                onChange={(e) => setRestoranAd(e.target.value)}
                className="bg-zinc-700 border-zinc-600"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">E-posta</label>
              <Input
                type="email"
                placeholder="ornek@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-zinc-700 border-zinc-600"
              />
            </div>
            <div>
              <label className="text-sm text-zinc-400 mb-1 block">Şifre</label>
              <div className="relative">
                <Input
                  type={goster ? 'text' : 'password'}
                  placeholder="En az 6 karakter"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-zinc-700 border-zinc-600 pr-10"
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
          </div>

          <div className="mb-6">
            <p className="font-bold mb-3 text-center text-sm text-zinc-300">Paket Seç</p>
            <div className="grid md:grid-cols-3 gap-3">
              {Object.entries(PAKETLER).map(([key, paket]) => (
                <Card
                  key={key}
                  onClick={() => setPaketTuru(key as 'basit' | 'big' | 'pro')}
                  className={`p-4 cursor-pointer border-2 transition ${
                    paketTuru === key
                      ? 'bg-yellow-500/20 border-yellow-500'
                      : 'bg-zinc-700 border-zinc-600 hover:border-zinc-500'
                  }`}
                >
                  <div className="text-center">
                    {paketTuru === key && (
                      <div className="flex justify-center mb-1">
                        <Check className="w-4 h-4 text-yellow-500" />
                      </div>
                    )}
                    <h3 className="font-bold text-lg">{paket.ad}</h3>
                    <p className="text-2xl font-bold my-2 text-yellow-500">
                      {paket.fiyat === 0 ? 'Ücretsiz' : `${paket.fiyat}₺/ay`}
                    </p>
                    {key !== 'basit' && (
                      <p className="text-xs text-green-400 font-bold">30 gün ücretsiz dene</p>
                    )}
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-zinc-300">
                    <p>{paket.ozellikler.garson_panel ? '✅' : '❌'} Garson Paneli</p>
                    <p>{paket.ozellikler.kasa ? '✅' : '❌'} Kasa</p>
                    <p>{paket.ozellikler.qr_menu ? '✅' : '❌'} QR Menü</p>
                    <p>{paket.ozellikler.rapor ? '✅' : '❌'} Raporlama</p>
                    <p className="pt-2 border-t border-zinc-600 mt-2 text-zinc-400">
                      {paket.limit.masa === 999 ? 'Sınırsız' : paket.limit.masa} Masa •{' '}
                      {paket.limit.urun === 999 ? 'Sınırsız' : paket.limit.urun} Ürün
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <Button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-yellow-500 text-black font-bold hover:bg-yellow-400 text-base py-6"
          >
            {loading ? 'Kaydediliyor...' : `${PAKETLER[paketTuru].ad} Paket ile Başla`}
          </Button>

          <p className="text-center text-xs text-zinc-500 mt-3">
            Kayıt olarak{' '}
            <span className="text-zinc-400">Kullanım Koşulları</span>
            {' '}ve{' '}
            <span className="text-zinc-400">Gizlilik Politikası</span>
            &apos;nı kabul etmiş olursunuz.
          </p>

          <p className="text-center text-sm text-zinc-400 mt-4">
            Zaten hesabın var mı?{' '}
            <Link href="/login" className="text-yellow-500 hover:text-yellow-400 font-bold">
              Giriş Yap
            </Link>
          </p>
          <div className="text-center mt-2">
            <Link href="/" className="text-xs text-zinc-500 hover:text-zinc-400">
              Ana Sayfaya Dön
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
      </div>
    }>
      <RegisterIcerik />
    </Suspense>
  )
}
