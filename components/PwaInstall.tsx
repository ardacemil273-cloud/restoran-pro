'use client'
import { useEffect, useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Zaten yüklü mü?
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // iOS kontrolü
    const ua = navigator.userAgent
    const ios = /iphone|ipad|ipod/i.test(ua)
    const safari = /safari/i.test(ua) && !/chrome/i.test(ua)

    if (ios && safari) {
      setIsIos(true)
      const dismissed = localStorage.getItem('pwa-ios-dismissed')
      if (!dismissed) {
        setShowBanner(true)
        setTimeout(() => setIsVisible(true), 100)
      }
      return
    }

    // Android/Chrome için beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      const dismissed = localStorage.getItem('pwa-dismissed')
      if (!dismissed) {
        setShowBanner(true)
        setTimeout(() => setIsVisible(true), 100)
      }
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const yukle = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setIsVisible(false)
      setTimeout(() => setShowBanner(false), 300)
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  const kapat = () => {
    setIsVisible(false)
    setTimeout(() => setShowBanner(false), 300)
    localStorage.setItem(isIos ? 'pwa-ios-dismissed' : 'pwa-dismissed', '1')
  }

  if (!showBanner || isInstalled) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto"
        >
          <div className="bg-gradient-to-r from-cyan-500/10 to-purple-500/10 border border-cyan-500/50 backdrop-blur-xl rounded-2xl p-4 shadow-2xl shadow-cyan-500/20">
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0"
              >
                <Smartphone className="w-6 h-6 text-white" />
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm">Restoran Pro'yu Yükle</p>
                {isIos ? (
                  <p className="text-xs text-cyan-300/70 mt-0.5">
                    Safari'de <strong className="text-white">Paylaş</strong> butonuna bas, ardından <strong className="text-white">"Ana Ekrana Ekle"</strong> seç
                  </p>
                ) : (
                  <p className="text-xs text-cyan-300/70 mt-0.5">
                    Hızlı erişim için ana ekrana ekle — offline çalışır!
                  </p>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={kapat}
                className="text-cyan-400 hover:text-cyan-300 flex-shrink-0 transition"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {!isIos && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={yukle}
                className="mt-3 w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
              >
                <Download className="w-4 h-4" />
                Uygulamayı Yükle
              </motion.button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
