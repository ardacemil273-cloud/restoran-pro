'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, Zap, Lock } from 'lucide-react'
import { toast } from 'sonner'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // PWA yükleme uyarısını dinle
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowPrompt(true)
    }

    // Uygulama zaten yüklü mü kontrol et
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      toast.success('✅ Restoran Pro başarıyla yüklendi!')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Display mode kontrol et (standalone = yüklü)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        toast.success('✅ Uygulama yükleniyor...')
      }

      setDeferredPrompt(null)
      setShowPrompt(false)
    } catch (err) {
      console.error('Yükleme hatası:', err)
      toast.error('Yükleme başarısız')
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDeferredPrompt(null)
  }

  return (
    <AnimatePresence>
      {showPrompt && !isInstalled && deferredPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-4 right-4 z-40 w-full max-w-sm"
        >
          <motion.div
            className="rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30 backdrop-blur-xl p-4 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/30 rounded-lg">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-black text-white text-sm">Restoran Pro</h3>
                  <p className="text-xs text-white/60">Uygulamayı yükle</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-white/10 rounded-lg transition-all text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Açıklama */}
            <p className="text-xs text-white/70 mb-4">
              Uygulamayı telefonuna yükle ve çevrimdışı da kullan
            </p>

            {/* Özellikler */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Zap className="w-3 h-3 text-primary" />
                <span>Hızlı açılış</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Lock className="w-3 h-3 text-primary" />
                <span>Güvenli ve şifreli</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-white/60">
                <Download className="w-3 h-3 text-primary" />
                <span>Çevrimdışı çalışma</span>
              </div>
            </div>

            {/* Butonlar */}
            <div className="flex gap-2">
              <button
                onClick={handleDismiss}
                className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-all"
              >
                Sonra
              </button>
              <button
                onClick={handleInstall}
                className="flex-1 px-3 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1"
              >
                <Download className="w-3 h-3" />
                Yükle
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
