'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Mic, MicOff, Send, Loader, CheckCircle, AlertCircle, Volume2, X } from 'lucide-react'

type SesliSiparisProps = {
  restoranId: string
  masaId?: string
  garsonId?: string
  tip: 'musteri' | 'garson'
  onKapat: () => void
  onSiparisKayit?: (transcribedText: string) => void
}

export default function SesliSiparis({
  restoranId,
  masaId,
  garsonId,
  tip,
  onKapat,
  onSiparisKayit
}: SesliSiparisProps) {
  const [kaydediyor, setKaydediyor] = useState(false)
  const [isliyor, setIsliyor] = useState(false)
  const [transcribedText, setTranscribedText] = useState('')
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [sesYuksekligi, setSesYuksekligi] = useState(0)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  async function kayitBas() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      // Ses analiz cihazı kur
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const analyzer = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyzer)

      analyzerRef.current = analyzer
      const dataArray = new Uint8Array(analyzer.frequencyBinCount)

      const updateVolume = () => {
        if (analyzerRef.current) {
          analyzerRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          setSesYuksekligi(Math.min(100, average / 2))
          animationFrameRef.current = requestAnimationFrame(updateVolume)
        }
      }
      updateVolume()

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(audioBlob)
        setAudioUrl(url)

        // Supabase'e yükle
        const fileName = `sesli-siparis-${Date.now()}.webm`
        const { data, error } = await (window as any).supabase.storage
          .from('sesli-siparisler')
          .upload(fileName, audioBlob)

        if (error) {
          toast.error('Ses yüklenemedi')
          return
        }

        const { data: publicUrl } = (window as any).supabase.storage
          .from('sesli-siparisler')
          .getPublicUrl(fileName)

        // API'ye gönder
        setIsliyor(true)
        const res = await fetch('/api/sesli-siparis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            restoran_id: restoranId,
            masa_id: masaId || null,
            garson_id: garsonId || null,
            audio_url: publicUrl.publicUrl,
            tip,
            durum: 'beklemede'
          })
        })

        const result = await res.json()
        setIsliyor(false)

        if (res.ok) {
          setTranscribedText(result.transcribed_text || 'Ses kaydedildi')
          toast.success('Siparişiniz kaydedildi!')
          if (onSiparisKayit) {
            onSiparisKayit(result.transcribed_text)
          }
        } else {
          toast.error(result.error || 'Hata oluştu')
        }
      }

      mediaRecorder.start()
      setKaydediyor(true)
      toast.success('Konuşmaya başlayın...')
    } catch (err: any) {
      toast.error('Mikrofon erişimi reddedildi')
    }
  }

  function kayitBit() {
    if (mediaRecorderRef.current && kaydediyor) {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setKaydediyor(false)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }

  async function gonder() {
    if (!transcribedText.trim()) {
      toast.error('Lütfen bir şey söyleyin')
      return
    }

    setIsliyor(true)
    try {
      const res = await fetch('/api/sesli-siparis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restoran_id: restoranId,
          masa_id: masaId || null,
          garson_id: garsonId || null,
          transcribed_text: transcribedText,
          tip,
          durum: 'isleniyor'
        })
      })

      if (res.ok) {
        toast.success('Sipariş gönderildi!')
        setTimeout(() => onKapat(), 1500)
      } else {
        toast.error('Gönderme başarısız')
      }
    } catch (err) {
      toast.error('Hata oluştu')
    } finally {
      setIsliyor(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-gradient-to-br from-cyan-900/30 to-purple-900/30 border border-cyan-500/30 rounded-3xl p-8 max-w-md w-full text-center backdrop-blur-xl"
      >
        {/* Kapat Butonu */}
        <button
          onClick={onKapat}
          className="absolute top-4 right-4 w-8 h-8 bg-cyan-500/20 hover:bg-cyan-500/40 rounded-full flex items-center justify-center text-cyan-400 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Başlık */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-1">
            🎤 Sesli Sipariş
          </h2>
          <p className="text-sm text-cyan-300/70">
            {tip === 'garson' ? 'Garson Paneli' : 'Müşteri Menüsü'}
          </p>
        </div>

        {/* Ses Seviyesi Göstergesi */}
        {kaydediyor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6 p-4 bg-cyan-500/10 rounded-xl border border-cyan-500/30"
          >
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-4 h-4 text-cyan-400" />
              <span className="text-xs text-cyan-300 font-bold">Ses Seviyesi</span>
            </div>
            <div className="w-full h-2 bg-cyan-900/30 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${sesYuksekligi}%` }}
                className="h-full bg-gradient-to-r from-cyan-500 to-purple-500"
              />
            </div>
          </motion.div>
        )}

        {/* Mikrofon Butonu */}
        <motion.button
          onClick={kaydediyor ? kayitBit : kayitBas}
          whileTap={{ scale: 0.95 }}
          className={`w-full mb-4 py-6 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
            kaydediyor
              ? 'bg-red-500/30 border-2 border-red-500 text-red-400 hover:bg-red-500/40'
              : 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:shadow-lg hover:shadow-cyan-500/50'
          }`}
        >
          {kaydediyor ? (
            <>
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
                <MicOff className="w-5 h-5" />
              </motion.div>
              Kaydı Bitir
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              Kaydı Başlat
            </>
          )}
        </motion.button>

        {/* Transcribed Text */}
        <AnimatePresence>
          {transcribedText && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl"
            >
              <div className="flex items-start gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-cyan-300 font-bold">Kaydedilen Metin</p>
              </div>
              <p className="text-sm text-cyan-100 text-left break-words">{transcribedText}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gönder Butonu */}
        {transcribedText && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={gonder}
            disabled={isliyor}
            className="w-full py-3 bg-green-500/30 border-2 border-green-500 text-green-400 font-bold rounded-xl hover:bg-green-500/40 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isliyor ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Siparişi Gönder
              </>
            )}
          </motion.button>
        )}

        {/* Bilgi */}
        <p className="text-xs text-cyan-300/50 mt-4">
          {kaydediyor
            ? 'Konuşmaya başlayın, kaydı bitirmek için butona tekrar tıklayın'
            : 'Siparişinizi sesle vermek için mikrofon butonuna tıklayın'}
        </p>
      </motion.div>
    </div>
  )
}
