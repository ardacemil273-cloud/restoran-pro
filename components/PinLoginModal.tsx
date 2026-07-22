'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, X, Loader } from 'lucide-react'
import { toast } from 'sonner'

interface PinLoginModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (sessionToken: string, garson: any) => void
  restoranId: string
}

export default function PinLoginModal({
  isOpen,
  onClose,
  onSuccess,
  restoranId
}: PinLoginModalProps) {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Modalı açtığında PIN'i temizle
    if (isOpen) {
      setPin('')
      setError('')
    }
  }, [isOpen])

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

  const handleSubmit = async () => {
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
      toast.success(`Hoş geldin, ${data.garson.ad}!`)
      onSuccess(data.session_token, data.garson)
      onClose()
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-sm mx-4 rounded-3xl bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-8 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/20 rounded-xl">
                  <Lock className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-black text-white">PIN Kodu</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/60 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PIN Display */}
            <div className="mb-8">
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
                  className="text-center text-red-400 text-sm font-bold mt-4"
                >
                  ❌ {error}
                </motion.p>
              )}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <motion.button
                  key={num}
                  onClick={() => handlePinInput(num.toString())}
                  disabled={loading || pin.length >= 4}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
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
                className="col-span-2 h-14 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-white font-bold text-lg transition-all border border-white/10 hover:border-white/20"
              >
                0
              </motion.button>
              <motion.button
                onClick={handleBackspace}
                disabled={loading || pin.length === 0}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="h-14 rounded-xl bg-red-500/20 hover:bg-red-500/30 disabled:opacity-50 text-red-400 font-bold text-lg transition-all border border-red-500/30 hover:border-red-500/50"
              >
                ← Sil
              </motion.button>
            </div>

            {/* Submit Button */}
            <motion.button
              onClick={handleSubmit}
              disabled={loading || pin.length !== 4}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full h-14 rounded-xl bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:opacity-50 text-white font-black text-lg transition-all flex items-center justify-center gap-2"
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

            {/* Footer */}
            <p className="text-center text-white/40 text-xs mt-6">
              4 haneli PIN kodunu gir
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
