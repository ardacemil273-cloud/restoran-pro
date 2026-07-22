'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, X, MessageSquare, User } from 'lucide-react'
import { toast } from 'sonner'

interface IncomingCall {
  id: string
  arayan_numara: string
  musteri_id: string | null
  musteri_ad?: string
  arama_tarihi: string
  call_id?: string
}

export default function IncomingCallNotification() {
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null)
  const [ringing, setRinging] = useState(false)

  useEffect(() => {
    // Supabase Realtime'ı dinle - yeni arama kaydı geldiğinde
    const subscription = supabase
      .channel('arama_kayitlari')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'arama_kayitlari',
          filter: 'durum=eq.ringing'
        },
        (payload: any) => {
          const newCall = payload.new
          setIncomingCall({
            id: newCall.id,
            arayan_numara: newCall.arayan_numara,
            musteri_id: newCall.musteri_id,
            arama_tarihi: newCall.arama_tarihi,
            call_id: newCall.call_id
          })
          setRinging(true)

          // Ses çal (opsiyonel - tarayıcı izin verirse)
          playRingtone()

          // 30 saniye sonra otomatik kapat
          const timeout = setTimeout(() => {
            setIncomingCall(null)
            setRinging(false)
          }, 30000)

          return () => clearTimeout(timeout)
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const playRingtone = () => {
    try {
      // Web Audio API ile basit bir ringtone sesi oluştur
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800 // Frekans
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.5)
    } catch (err) {
      console.log('Ses çalınamadı:', err)
    }
  }

  const handleAnswer = () => {
    if (incomingCall) {
      toast.success(`${incomingCall.arayan_numara} numaralı araması yanıtlandı`)
      // Burada gerçek telefon sistemi entegrasyonu yapılabilir
      setIncomingCall(null)
      setRinging(false)
    }
  }

  const handleReject = () => {
    if (incomingCall) {
      toast.info('Arama reddedildi')
      setIncomingCall(null)
      setRinging(false)
    }
  }

  const handleSendMessage = () => {
    if (incomingCall) {
      toast.success('SMS gönderme penceresini aç')
      // SMS gönderme modalı açılabilir
    }
  }

  return (
    <AnimatePresence>
      {incomingCall && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 left-4 right-4 z-50 max-w-sm mx-auto"
        >
          <motion.div
            className={`rounded-2xl p-6 border-2 shadow-2xl ${
              ringing
                ? 'bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-500/50 shadow-green-500/20'
                : 'bg-gradient-to-br from-blue-900/50 to-cyan-900/50 border-blue-500/50 shadow-blue-500/20'
            }`}
            animate={ringing ? { scale: [1, 1.02, 1] } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            {/* Başlık */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={ringing ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="p-2 bg-green-500/20 rounded-full"
                >
                  <Phone className="w-5 h-5 text-green-400" />
                </motion.div>
                <span className="font-black text-white">
                  {ringing ? 'Gelen Arama' : 'Arama Geliyor'}
                </span>
              </div>
              <button
                onClick={handleReject}
                className="p-1 hover:bg-white/10 rounded-lg transition-all text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Numara ve Müşteri Bilgisi */}
            <div className="text-center mb-6">
              <div className="text-3xl font-black text-white mb-2">
                {incomingCall.arayan_numara}
              </div>
              {incomingCall.musteri_id && (
                <div className="flex items-center justify-center gap-2 text-sm text-green-200">
                  <User className="w-4 h-4" />
                  <span>Kayıtlı Müşteri</span>
                </div>
              )}
              <div className="text-xs text-white/60 mt-2">
                {new Date(incomingCall.arama_tarihi).toLocaleTimeString('tr-TR')}
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex gap-3">
              {/* Reddet */}
              <motion.button
                onClick={handleReject}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-xl font-bold transition-all"
              >
                Reddet
              </motion.button>

              {/* SMS */}
              <motion.button
                onClick={handleSendMessage}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/50 text-blue-300 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                SMS
              </motion.button>

              {/* Yanıtla */}
              <motion.button
                onClick={handleAnswer}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex-1 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 text-green-300 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Yanıtla
              </motion.button>
            </div>

            {/* Bilgi */}
            <div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <p className="text-xs text-white/60 leading-relaxed">
                💡 <strong>İpucu:</strong> Numarayı tıklayarak müşteri kaydını açabilir, SMS gönderebilir veya aramayı yanıtlayabilirsiniz.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
