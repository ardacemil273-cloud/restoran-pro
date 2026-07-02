'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader, Lock } from 'lucide-react'
import { toast } from 'sonner'

interface PersonelLoginProps {
  onBack: () => void
}

export default function PersonelLogin({ onBack }: PersonelLoginProps) {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [restoranId, setRestoranId] = useState('')
  const [step, setStep] = useState<'restoran' | 'pin'>('restoran')
  const router = useRouter()

  // Restoran seçimi
  const handleRestoranSelect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restoranId) {
      toast.error('Restoran ID gerekli')
      return
    }
    setStep('pin')
  }

  // PIN giriş
  const handlePinInput = (num: string) => {
    if (pin.length < 4) {
      setPin(pin + num)
      setError('')
    }
  }

  const handleBackspace = () => {
    setPin(pin.slice(0, -1))
    setError('')
  }

  // PIN doğrulama
  const handlePinSubmit = async () => {
    if (pin.length !== 4) {
      setError('PIN kodu 4 haneli olmalı')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          restoran_id: restoranId,
          pin_kodu: pin
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'PIN doğrulanamadı')
      }

      const data = await response.json()
      
      // Session token'ı localStorage'a kaydet
      localStorage.setItem('pin_session_token', data.session_token)
      localStorage.setItem('pin_restoran_id', restoranId)
      localStorage.setItem('pin_garson', JSON.stringify(data.garson))

      toast.success(`Hoş geldin, ${data.garson.ad}!`)
      router.push('/dashboard')
    } catch (err: any) {
      console.error('PIN hatası:', err)
      setError(err.message || 'PIN yanlış')
      setPin('')
      toast.error('PIN yanlış')
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
        <h2 className="text-3xl font-black text-white">Personel Girişi</h2>
        <p className="text-white/60">4 haneli PIN kodu ile giriş yapın</p>
      </div>

      {/* Restoran Seçimi */}
      {step === 'restoran' && (
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={handleRestoranSelect}
          className="space-y-4"
        >
          <div className="space-y-2">
            <label className="block text-sm font-bold text-white/70">Restoran Kodu</label>
            <input
              type="text"
              value={restoranId}
              onChange={e => setRestoranId(e.target.value)}
              placeholder="Restoran kodunu gir"
              className="w-full px-4 py-3 rounded-xl bg-zinc-800/50 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all"
              required
            />
            <p className="text-xs text-white/50">
              💡 Restoran kodunu yöneticiden al
            </p>
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white font-black rounded-xl transition-all"
          >
            Devam Et
          </motion.button>
        </motion.form>
      )}

      {/* PIN Giriş */}
      {step === 'pin' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* PIN Display */}
          <div className="space-y-4">
            <div className="flex gap-3 justify-center">
              {[0, 1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-white/10 flex items-center justify-center text-2xl font-black text-white"
                  animate={pin.length > i ? { scale: [1, 1.1, 1] } : {}}
                >
                  {pin[i] ? '●' : ''}
                </motion.div>
              ))}
            </div>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-red-400 text-sm font-bold"
              >
                ❌ {error}
              </motion.p>
            )}
          </div>

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
              <motion.button
                key={num}
                onClick={() => handlePinInput(num.toString())}
                disabled={loading || pin.length >= 4}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                className="h-14 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-lg transition-all border border-white/10 hover:border-white/20"
              >
                {num}
              </motion.button>
            ))}
            <motion.button
              onClick={() => handlePinInput('0')}
              disabled={loading || pin.length >= 4}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="col-span-2 h-14 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-lg transition-all border border-white/10 hover:border-white/20"
            >
              0
            </motion.button>
            <motion.button
              onClick={handleBackspace}
              disabled={loading || pin.length === 0}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              className="h-14 rounded-xl bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 text-red-400 font-bold text-lg transition-all border border-red-500/30 hover:border-red-500/50"
            >
              ← Sil
            </motion.button>
          </div>

          {/* Giriş Butonu */}
          <motion.button
            onClick={handlePinSubmit}
            disabled={loading || pin.length !== 4}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="button"
            className="w-full h-14 rounded-xl bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 disabled:opacity-50 text-white font-black text-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Kontrol Ediliyor...
              </>
            ) : (
              'Giriş Yap'
            )}
          </motion.button>

          {/* Geri Butonu */}
          <button
            onClick={() => {
              setStep('restoran')
              setPin('')
              setError('')
            }}
            type="button"
            className="w-full px-4 py-2 text-white/60 hover:text-white font-bold rounded-lg transition-colors"
          >
            ← Restoran Değiştir
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
