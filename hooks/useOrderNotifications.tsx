'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export function useOrderNotifications(restoranId: string) {
  const playSound = () => {
    try {
      const ctx = new AudioContext()
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.frequency.setValueAtTime(800, ctx.currentTime)
      oscillator.frequency.setValueAtTime(600, ctx.currentTime + 0.1)
      oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.2)
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.5)
    } catch (e) {}
  }

  useEffect(() => {
    if (!restoranId) return

    const channel = supabase
      .channel('yeni-siparisler')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'siparisler',
          filter: `restoran_id=eq.${restoranId}`,
        },
        (payload: any) => {
          playSound()
          toast.custom(
            (t) => (
              <div className={`${t.visible ? 'opacity-100' : 'opacity-0'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex items-center gap-3 p-4 border border-gray-100`}>
                <span className="text-2xl">🔔</span>
                <div>
                  <p className="font-bold text-gray-900">Yeni Siparis!</p>
                  <p className="text-sm text-gray-500">
                    Masa: {payload.new?.masa_adi || payload.new?.masa_id || 'Bilinmiyor'}
                  </p>
                </div>
              </div>
            ),
            { duration: 5000 }
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restoranId])
}