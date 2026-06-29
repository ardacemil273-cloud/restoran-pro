'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Download, X, Smartphone, Check } from 'lucide-react'

export default function PwaPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // Zaten yüklü mü kontrol et
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // iOS kontrolü
    const ua = navigator.userAgent
    const isIOSDevice = /iphone|ipad|ipod/i.test(ua)
    const isSafari = /safari/i.test(ua) && !/chrome/i.test(ua)

    if (isIOSDevice && isSafari) {
      setIsIos(true)
      // iOS için her zaman göster (daha az intrusive)
      const dismissed = localStorage.getItem('pwa-ios-prompt-dismissed')
      const dismissedTime = dismissed ? parseInt(dismissed) : 0
      const daysSince = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      if (daysSince > 7) {
        setShowPrompt(true)
      }
      return
    }

    // Android/Chrome için beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      
      // Daha önce kapatılmış mı kontrol et
      const dismissed = localStorage.getItem('pwa-prompt-dismissed')
      const dismissedTime = dismissed ? parseInt(dismissed) : 0
      const daysSince = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24)
      
      // 3 gün geçtiyse tekrar göster
      if (daysSince > 3) {
        setShowPrompt(true)
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    setIsInstalling(true)
    deferredPrompt.prompt()
    
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPrompt(false)
      setIsInstalled(true)
      localStorage.removeItem('pwa-prompt-dismissed')
    } else {
      // Kullanıcı reddettiyse 3 gün gösterme
      localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
    }

    setDeferredPrompt(null)
    setIsInstalling(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    if (isIos) {
      localStorage.setItem('pwa-ios-prompt-dismissed', Date.now().toString())
    } else {
      localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())
    }
  }

  if (!showPrompt || isInstalled) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
      >
        <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-2xl p-4 backdrop-blur-xl shadow-2xl shadow-yellow-500/30">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center flex-shrink-0"
            >
              <Smartphone className="w-6 h-6 text-white" />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-sm">Restoran Pro'yu Yükle</p>
              {isIos ? (
                <p className="text-xs text-yellow-200/80 mt-0.5">
                  Safari'de <strong>Paylaş</strong> → <strong>"Ana Ekrana Ekle"</strong> seç
                </p>
              ) : (
                <p className="text-xs text-yellow-200/80 mt-0.5">
                  Hızlı erişim için ana ekrana ekle — offline çalışır!
                </p>
              )}
            </div>

            {/* Close Button */}
            <button
              onClick={handleDismiss}
              className="text-yellow-400/60 hover:text-yellow-400 flex-shrink-0 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Install Button (Android/Chrome only) */}
          {!isIos && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleInstall}
              disabled={isInstalling}
              className="mt-3 w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50 text-black font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-all"
            >
              {isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Uygulamayı Yükle
                </>
              )}
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
