'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PAKETLER } from '@/lib/paketler'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [restoranAd, setRestoranAd] = useState('')
  const [paketTuru, setPaketTuru] = useState<'basit' | 'big' | 'pro'>('basit')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
        data: {
          restoran_ad: restoranAd
        }
      }
    })

    if (authError) {
      setLoading(false)
      console.error('AUTH ERROR:', authError)
      if (authError.message.includes('already registered')) {
        return toast.error('Bu email zaten kayıtlı. Giriş yap.')
      }
      return toast.error('Kayıt hatası: ' + authError.message)
    }

    if (!authData.user) {
      setLoading(false)
      return toast.error('Kullanıcı oluşturulamadı')
    }

    console.log('USER ID:', authData.user.id)

    // 2. Session kontrol et - email doğrulama kapalıysa session gelir
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      setLoading(false)
      return toast.error('Email doğrulaması açık. Supabase ayarlarından kapat.')
    }

    // 3. Paket bitiş tarihi
    const bitisTarihi = paketTuru === 'basit' 
      ? null 
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    // 4. Restoran oluştur - sahibi_id kullan
    const { data: restoran, error: restoranError } = await supabase
.from('restoranlar')
.insert({
        ad: restoranAd,
        sahibi_id: authData.user.id, // user_id değil sahibi_id
        slug: slugOlustur(restoranAd),
        paket_turu: paketTuru,
        paket_bitis_tarihi: bitisTarihi
      })
.select()
.single()

    if (restoranError) {
      setLoading(false)
      console.error('RESTORAN ERROR:', restoranError)
      return toast.error('Restoran hatası: ' + restoranError.message)
    }

    console.log('OLUŞTURULAN RESTORAN:', restoran)

    // 5. Kullanıcı-restoran ilişkisi
    const { error: iliskiError } = await supabase.from('kullanici_restoran').insert({
      user_id: authData.user.id,
      restoran_id: restoran.id
    })

    if (iliskiError) {
      console.log('İlişki hatası:', iliskiError)
    }

    setLoading(false)
    
    if (paketTuru !== 'basit') {
      toast.success(`${PAKETLER[paketTuru].ad} paket 30 gün ücretsiz! Yönlendiriliyor...`)
    } else {
      toast.success('Kayıt başarılı! Yönlendiriliyor...')
    }
    
    window.location.href = '/masalar'
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6 flex items-center justify-center">
      <Card className="p-6 bg-zinc-800 border-zinc-700 w-full max-w-2xl">
        <h1 className="text-2xl font-bold mb-6 text-center">Restoran Kaydı</h1>
        
        <div className="space-y-4 mb-6">
          <Input
            type="text"
            placeholder="Restoran Adı"
            value={restoranAd}
            onChange={(e) => setRestoranAd(e.target.value)}
            className="bg-zinc-700"
          />
          <Input
            type="email"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-zinc-700"
          />
          <Input
            type="password"
            placeholder="Şifre - min 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-zinc-700"
          />
        </div>

        <div className="mb-6">
          <p className="font-bold mb-3 text-center">Paket Seç</p>
          <div className="grid md:grid-cols-3 gap-3">
            {Object.entries(PAKETLER).map(([key, paket]) => (
              <Card 
                key={key}
                onClick={() => setPaketTuru(key as any)}
                className={`p-4 cursor-pointer border-2 transition ${
                  paketTuru === key 
                    ? 'bg-yellow-500/20 border-yellow-500' 
                    : 'bg-zinc-700 border-zinc-600 hover:border-zinc-500'
                }`}
              >
                <div className="text-center">
                  <h3 className="font-bold text-lg">{paket.ad}</h3>
                  <p className="text-2xl font-bold my-2">
                    {paket.fiyat === 0 ? 'Ücretsiz' : `${paket.fiyat}₺/ay`}
                  </p>
                  {key !== 'basit' && (
                    <p className="text-xs text-green-400">30 gün ücretsiz dene</p>
                  )}
                </div>
                <div className="mt-4 space-y-1 text-xs">
                  <p>{paket.ozellikler.garson_panel ? '✅' : '❌'} Garson Paneli</p>
                  <p>{paket.ozellikler.kasa ? '✅' : '❌'} Kasa / Hızlı Satış</p>
                  <p>{paket.ozellikler.qr_menu ? '✅' : '❌'} QR Menü</p>
                  <p>{paket.ozellikler.rapor ? '✅' : '❌'} Raporlama</p>
                  <p className="pt-2 border-t border-zinc-600 mt-2">
                    {paket.limit.masa === 999 ? 'Sınırsız' : paket.limit.masa} Masa<br/>
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
          className="w-full bg-yellow-500 text-black font-bold"
        >
          {loading ? 'Kaydediliyor...' : `${PAKETLER[paketTuru].ad} Paket ile Başla`}
        </Button>

        <p className="text-center text-sm text-zinc-400 mt-4">
          Zaten hesabın var mı?{' '}
          <Link href="/login" className="text-yellow-500 hover:underline">
            Giriş Yap
          </Link>
        </p>
      </Card>
    </div>
  )
}
