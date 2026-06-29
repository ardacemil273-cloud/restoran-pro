'use client'
import { useState, useEffect, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useRouter, useSearchParams } from 'next/navigation'
import { ChefHat, Lock, CheckCircle, Eye, EyeOff } from 'lucide-react'

function SifreGuncelleIcerik() {
  const [sifre, setSifre] = useState('')
  const [sifreTekrar, setSifreTekrar] = useState('')
  const [loading, setLoading] = useState(false)
  const [basarili, setBasarili] = useState(false)
  const [hata, setHata] = useState('')
  const [goster, setGoster] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Supabase auth hash'i işle
    const hashParams = new URLSearchParams(window.location.hash.substring(1))
    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    if (accessToken && refreshToken) {
      supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
    }
  }, [])

  const handleSubmit = async () => {
    if (!sifre || sifre.length < 6) {
      setHata('Şifre en az 6 karakter olmalıdır')
      return
    }
    if (sifre !== sifreTekrar) {
      setHata('Şifreler eşleşmiyor')
      return
    }
    setLoading(true)
    setHata('')
    const { error } = await supabase.auth.updateUser({ password: sifre })
    if (error) {
      setHata('Hata: ' + error.message)
      setLoading(false)
      return
    }
    setBasarili(true)
    setTimeout(() => router.push('/masalar'), 2000)
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
          {basarili ? (
            <div className="text-center py-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">Şifre Güncellendi!</h2>
              <p className="text-zinc-400 text-sm">Yönlendiriliyorsunuz...</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-yellow-500/10 p-2 rounded-lg">
                  <Lock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Yeni Şifre Belirle</h1>
                  <p className="text-zinc-400 text-sm">En az 6 karakter kullanın</p>
                </div>
              </div>
              {hata && (
                <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">
                  {hata}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Yeni Şifre</label>
                  <div className="relative">
                    <Input
                      type={goster ? 'text' : 'password'}
                      placeholder="En az 6 karakter"
                      value={sifre}
                      onChange={e => setSifre(e.target.value)}
                      className="bg-zinc-700 text-white border-zinc-600 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setGoster(!goster)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400"
                    >
                      {goster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-zinc-400 mb-1 block">Şifre Tekrar</label>
                  <Input
                    type="password"
                    placeholder="Şifreyi tekrar girin"
                    value={sifreTekrar}
                    onChange={e => setSifreTekrar(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    className="bg-zinc-700 text-white border-zinc-600"
                  />
                </div>
                <Button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-yellow-500 text-black font-bold hover:bg-yellow-400"
                >
                  {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

export default function SifreGuncellePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
      </div>
    }>
      <SifreGuncelleIcerik />
    </Suspense>
  )
}
