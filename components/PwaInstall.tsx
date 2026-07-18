'use client'
import { useEffect, useState } from 'react'
import { Download, X, Smartphone, Apple, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // Cihaz tipi kontrolü
    const userAgent = navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent)
    const isAndroidDevice = /android/.test(userAgent)
    
    setIsIOS(isIOSDevice)
    setIsAndroid(isAndroidDevice)

    // Standalone mode kontrolü
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true
    
    if (isStandalone) {
      setIsInstalled(true)
      localStorage.setItem('pwa_installed', 'true')
      return
    }

    // localStorage'dan kontrol et
    const wasShown = localStorage.getItem('pwa_shown')
    const lastShownTime = localStorage.getItem('pwa_shown_time')
    const threeDays = 3 * 24 * 60 * 60 * 1000 // 3 gün (7'den 3'e düşürdük)
    const isExpired = lastShownTime && (Date.now() - parseInt(lastShownTime) > threeDays)

    const resetPwaFlag = () => {
      localStorage.removeItem('pwa_shown')
      localStorage.removeItem('pwa_shown_time')
    }

    if (isExpired) resetPwaFlag()
    
    // beforeinstallprompt event'ini yakala (Android Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const event = e as BeforeInstallPromptEvent
      setDeferredPrompt(event)
      console.log('[PWA] beforeinstallprompt event received')
      
      // Hemen göster (agresif gösterim - her zaman)
      setShowPrompt(true)
      localStorage.setItem('pwa_shown', 'true')
      localStorage.setItem('pwa_shown_time', Date.now().toString())
    }

    // App yükleme başarılı oldu mu
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully')
      setIsInstalled(true)
      setShowPrompt(false)
      setIsInstalling(false)
      setDeferredPrompt(null)
      localStorage.setItem('pwa_installed', 'true')
      localStorage.removeItem('pwa_shown')
      toast.success('✅ Uygulama başarıyla yüklendi!')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Fallback: eğer prompt gelmezse ve mobil ise HEMEN manual göster (agresif)
    const fallbackTimer = setTimeout(() => {
      if (!isInstalled && (isIOSDevice || isAndroidDevice)) {
        console.log('[PWA] Showing fallback prompt (no beforeinstallprompt received)')
        setShowPrompt(true)
        localStorage.setItem('pwa_shown', 'true')
        localStorage.setItem('pwa_shown_time', Date.now().toString())
      }
    }, 2000) // 5000ms'den 2000ms'ye düşürdük - daha hızlı göster

    return () => {
      clearTimeout(fallbackTimer)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.error('Kurulum seçeneği şu anda kullanılamıyor')
      return
    }

    setIsInstalling(true)
    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        toast.success('✅ Uygulama kurulumu başlatıldı!')
      } else {
        toast.info('Kurulum iptal edildi')
      }
      
      setDeferredPrompt(null)
    } catch (error) {
      toast.error('Kurulum sırasında hata oluştu')
      console.error('Install error:', error)
    } finally {
      setIsInstalling(false)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  // Eğer zaten yüklü ise gösterme
  if (isInstalled) return null

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div className="glass rounded-2xl p-6 border border-slate-700/50 shadow-2xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                  <Smartphone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-white text-lg">Restoran Pro</h3>
                  <p className="text-xs text-slate-400">Uygulama Olarak Yükle</p>
                </div>
              </div>
              <button
                onClick={handleDismiss}
                className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <p className="text-sm text-slate-300 mb-4">
              {isIOS
                ? '📱 Safari\'dan "Paylaş" → "Ana Ekrana Ekle" ile kurabilirsin'
                : 'Uygulamayı telefonuna indir ve hızlı erişim sağla'}
            </p>

            {/* Features */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Çevrimdışı çalışma
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Hızlı açılış
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Bildirimler
              </div>
            </div>

            {/* Buttons */}
            {isIOS ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-400 mb-3">
                  <strong>iOS Kurulum Adımları:</strong><br/>
                  1. Safarideki Paylaş butonuna bas<br/>
                  2. "Ana Ekrana Ekle" seçeneğini seç<br/>
                  3. Adı onayla ve ekle
                </p>
                <button
                  onClick={handleDismiss}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg transition-all"
                >
                  Anladım
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleDismiss}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded-lg transition-all"
                >
                  Sonra
                </button>
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {isInstalling ? 'Yükleniyor...' : 'Yükle'}
                </button>
              </div>
            )}

            {/* Bottom Info */}
            <p className="text-xs text-slate-500 mt-3 text-center">
              💡 Uygulama tarayıcıdan bağımsız çalışır
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
