'use client'
import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Mic, Square, Send, Loader, Volume2, Trash2 } from 'lucide-react'

export default function SesliSiparisPage() {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [recordings, setRecordings] = useState<any[]>([])
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const router = useRouter()

  useEffect(() => {
    loadRecordings()
  }, [])

  async function loadRecordings() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data } = await supabase
        .from('sesli_siparisler')
        .select('*')
        .eq('restoran_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      setRecordings(data || [])
    } catch (err: any) {
      toast.error('Kayıtlar yüklenemedi')
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        await processAudio(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      toast.success('Kaydediliyor... Konuşmaya başlayın!')
    } catch (err: any) {
      toast.error('Mikrofon erişimi reddedildi')
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  async function processAudio(audioBlob: Blob) {
    setIsProcessing(true)
    try {
      // Simüle edilmiş transkripsiyon (gerçek uygulamada OpenAI Whisper veya benzer kullanılır)
      const mockTranscripts = [
        'Lahmacun acısız iki tane',
        'Dört tane iskender yoğurtlu',
        'Bir kola, bir ayran ve bir çay',
        'Adana kebap iki, şiş kebap bir',
        'Pide sucuklu ve peynirli birer tane'
      ]
      const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)]
      setTranscript(randomTranscript)
      toast.success('Ses başarıyla işlendi!')
    } catch (err: any) {
      toast.error('Ses işleme başarısız oldu')
    } finally {
      setIsProcessing(false)
    }
  }

  async function submitOrder() {
    if (!transcript.trim()) {
      toast.error('Lütfen bir sipariş söyleyin')
      return
    }

    setIsProcessing(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch('/api/sesli-siparis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restoran_id: user.id,
          transcribed_text: transcript,
          tip: 'garson',
          durum: 'beklemede'
        })
      })

      if (response.ok) {
        toast.success('Sipariş kaydedildi!')
        setTranscript('')
        loadRecordings()
      } else {
        toast.error('Sipariş kaydedilemedi')
      }
    } catch (err: any) {
      toast.error('Hata: ' + err.message)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight mb-2">Sesli Sipariş Sistemi</h1>
          <p className="text-white/50 font-medium">Konuşarak siparişlerinizi kaydedin</p>
        </div>
      </motion.div>

      {/* Kayıt Alanı */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 backdrop-blur-sm"
      >
        <div className="flex flex-col items-center gap-6">
          {/* Mikrofon Butonu */}
          <button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
            className={`w-24 h-24 rounded-full flex items-center justify-center font-black text-xl transition-all transform hover:scale-105 active:scale-95 ${
              isRecording
                ? 'bg-red-500 text-white shadow-2xl shadow-red-500/50 animate-pulse'
                : 'bg-primary text-black shadow-2xl shadow-primary/50'
            } disabled:opacity-50`}
          >
            {isRecording ? <Square size={40} /> : <Mic size={40} />}
          </button>

          <div className="text-center">
            <p className="text-white font-bold mb-2">
              {isRecording ? 'Kaydediliyor...' : isProcessing ? 'İşleniyor...' : 'Başlamak için tıklayın'}
            </p>
            <p className="text-white/40 text-sm">Konuşmaya başlayın, sistem otomatik olarak kaydedecek</p>
          </div>
        </div>

        {/* Transkripsiyon Gösterimi */}
        {transcript && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10"
          >
            <p className="text-white/50 text-sm font-bold mb-2 uppercase">Algılanan Sipariş:</p>
            <p className="text-2xl font-black text-white mb-4">{transcript}</p>
            <div className="flex gap-3">
              <button
                onClick={submitOrder}
                disabled={isProcessing}
                className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-black font-black rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? <Loader size={18} className="animate-spin" /> : <Send size={18} />}
                Siparişi Kaydet
              </button>
              <button
                onClick={() => setTranscript('')}
                className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Geçmiş Kayıtlar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <h2 className="text-2xl font-black text-white">Son Siparişler</h2>
        <div className="space-y-3">
          {recordings.length > 0 ? (
            recordings.map((rec, i) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 rounded-xl bg-card border border-white/5 hover:border-primary/20 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-white font-bold">{rec.transcribed_text}</p>
                    <p className="text-white/40 text-sm mt-1">
                      {new Date(rec.created_at).toLocaleString('tr-TR')}
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    rec.durum === 'tamamlandi' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {rec.durum === 'tamamlandi' ? '✓ Tamamlandı' : '⏳ Bekleniyor'}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-8 rounded-xl bg-white/5 border border-white/5 text-center">
              <Volume2 size={32} className="text-white/20 mx-auto mb-2" />
              <p className="text-white/40">Henüz kayıt yok</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
