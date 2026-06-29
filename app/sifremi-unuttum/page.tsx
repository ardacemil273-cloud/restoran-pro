'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { ChefHat, ArrowLeft, Mail, CheckCircle } from 'lucide-react'

export default function SifremiUnuttumPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [gonderildi, setGonderildi] = useState(false)
  const [hata, setHata] = useState('')

  const handleSubmit = async () => {
    if (!email) {
      setHata('E-posta adresi gereklidir')
      return
    }
    setLoading(true)
    setHata('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/sifre-guncelle`
    })
    if (error) {
      setHata('Bir hata oluştu: ' + error.message)
      setLoading(false)
      return
    }
    setGonderildi(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <ChefHat className="w-8 h-8 text-yellow-500" />
          <span className="text-2xl font-bold text-yellow-500">Restoran Pro</span>
        </div>
        <Card className="p-6 bg-zinc-800 border-zinc-700">
          {gonderildi ? (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">E-posta Gönderildi!</h2>
              <p className="text-zinc-400 text-sm mb-6">
                <strong className="text-white">{email}</strong> adresine şifre sıfırlama bağlantısı gönderdik.
                Gelen kutunuzu kontrol edin.
              </p>
              <Link
                href="/login"
                className="text-yellow-500 hover:text-yellow-400 text-sm font-bold flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Giriş sayfasına dön
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-yellow-500/10 p-2 rounded-lg">
                  <Mail className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Şifremi Unuttum</h1>
                  <p className="text-zinc-400 text-sm">E-postanıza sıfırlama bağlantısı göndereceğiz</p>
                </div>
              </div>
              {hata && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">
                  {hata}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">E-posta Adresi</label>
                  <Input
                    type="email"
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="bg-zinc-700 text-white border-zinc-600"
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-yellow-500 text-black font-bold hover:bg-yellow-400"
                >
                  {loading ? 'Gönderiliyor...' : 'Sıfırlama Bağlantısı Gönder'}
                </Button>
              </div>
              <div className="mt-4 text-center">
                <Link
                  href="/login"
                  className="text-zinc-400 hover:text-white text-sm flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Giriş sayfasına dön
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
