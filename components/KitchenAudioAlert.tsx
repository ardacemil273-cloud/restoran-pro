'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Volume2, VolumeX } from 'lucide-react'

interface KitchenAudioAlertProps {
  restoranId: string
  enabled?: boolean
}

export default function KitchenAudioAlert({ restoranId, enabled = true }: KitchenAudioAlertProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [lastAlertTime, setLastAlertTime] = useState<number>(0)

  useEffect(() => {
    if (!enabled || !restoranId) return

    // Yeni siparişleri dinle
    const channel = supabase
      .channel(`kitchen-alerts-${restoranId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'siparisler',
          filter: `restoran_id=eq.${restoranId}`
        },
        (payload) => {
          playAlert()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restoranId, enabled])

  const playAlert = () => {
    if (isMuted || !audioRef.current) return

    // Aynı saniyede birden fazla uyarı çalmasını önle
    const now = Date.now()
    if (now - lastAlertTime < 500) return
    setLastAlertTime(now)

    try {
      // Ses dosyasını oynat
      audioRef.current.currentTime = 0
      audioRef.current.play().catch(err => {
        console.log('Ses çalınamadı:', err)
        // Tarayıcı izni yoksa sessiz kalır
      })

      // Ayrıca titreşim geri bildirimi (vibration API)
      if ('vibrate' in navigator) {
        navigator.vibrate([200, 100, 200])
      }
    } catch (err) {
      console.error('Ses oynatma hatası:', err)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  return (
    <>
      {/* Ses Dosyası */}
      <audio
        ref={audioRef}
        preload="auto"
      >
        <source src="data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==" type="audio/wav" />
      </audio>

      {/* Sesli Uyarı Kontrolü (Mutfak Ekranında Göster) */}
      <button
        onClick={toggleMute}
        className={`fixed bottom-4 right-4 z-50 p-3 rounded-full transition-all ${
          isMuted
            ? 'bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30'
            : 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'
        }`}
        title={isMuted ? 'Sesli Uyarı Kapalı' : 'Sesli Uyarı Açık'}
      >
        {isMuted ? (
          <VolumeX className="w-6 h-6" />
        ) : (
          <Volume2 className="w-6 h-6 animate-pulse" />
        )}
      </button>
    </>
  )
}

// Alternatif: Daha güçlü bir ses için Web Audio API kullanarak
export function playKitchenAlert() {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)

    // Ses frekansı (Do notası)
    oscillator.frequency.value = 800
    oscillator.type = 'sine'

    // Ses şiddeti
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)

    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)

    // Titreşim
    if ('vibrate' in navigator) {
      navigator.vibrate([200, 100, 200])
    }
  } catch (err) {
    console.error('Ses oluşturma hatası:', err)
  }
}
