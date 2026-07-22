'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone } from 'lucide-react'

export default function SmartInstallBanner() {
  const [goster, setGoster] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    // PWA install prompt'unu yakala
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setGoster(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setDeferredPrompt(null)
      setGoster(false)
    }
  }

  function handleDismiss() {
    // 7 gün boyunca gösterme
    localStorage.setItem('install-banner-dismissed', Date.now().toString())
    setGoster(false)
  }

  // Daha önce kapatıldıysa gösterme
  useEffect(() => {
    const dismissed = localStorage.getItem('install-banner-dismissed')
    if (dismissed) {
      const daysSince = (Date.now() - parseInt(dismissed)) / (1000 * 60 * 60 * 24)
      if (daysSince < 7) {
        setGoster(false)
      }
    }
  }, [])

  return (
    <AnimatePresence>
      {goster && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-0 left-0 right-0 z-40 p-4"
        >
          <div className="mx-auto max-w-lg bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border border-cyan-500/50 rounded-2xl p-4 backdrop-blur-xl shadow-lg shadow-cyan-500/30">
            <div className="flex items-center gap-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center flex-shrink-0"
              >
                <Smartphone className="w-6 h-6 text-white" />
              </motion.div>

              <div className="flex-1">
                <p className="font-black text-white text-sm">Restoran Pro'yu Yükle</p>
                <p className="text-xs text-cyan-300/70 mt-0.5">Hızlı erişim için ana ekrana ekle</p>
              </div>

              <div className="flex items-center gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleInstall}
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold text-xs rounded-lg hover:shadow-lg hover:shadow-cyan-500/50 transition"
                >
                  <Download className="w-3.5 h-3.5 inline mr-1" />
                  Yükle
                </motion.button>

                <button
                  onClick={handleDismiss}
                  className="w-8 h-8 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
