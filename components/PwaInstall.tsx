'use client'
import { useEffect, useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'
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
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [showManualFallback, setShowManualFallback] = useState(false)

  useEffect(() => {
    // iOS kontrolü
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOSDevice)

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
    const thirtyDays = 30 * 24 * 60 * 60 * 1000
    const isExpired = lastShownTime && (Date.now() - parseInt(lastShownTime) > thirtyDays)

    const resetPwaFlag = () => {
      localStorage.removeItem('pwa_shown')
      localStorage.removeItem('pwa_shown_time')
    }

    if (isExpired) resetPwaFlag()
    
    // beforeinstallprompt event'ini yakala
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const event = e as BeforeInstallPromptEvent
      setDeferredPrompt(event)
      
      // Hemen göster
      if (!wasShown || isExpired) {
        setShowPrompt(true)
        localStorage.setItem('pwa_shown', 'true')
        localStorage.setItem('pwa_shown_time', Date.now().toString())
      }
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // App yükleme başarılı oldu mu
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setShowManualFallback(false)
      setIsInstalling(false)
      setDeferredPrompt(null)
      localStorage.setItem('pwa_installed', 'true')
      localStorage.removeItem('pwa_shown')
      toast.success('✅ Uygulama başarıyla yüklendi!')
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    // Fallback: eğer 3 saniye sonra prompt gelmezse manual göster
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt && !isStandalone && (!wasShown || isExpired)) {
        setShowManualFallback(true)
        localStorage.setItem('pwa_shown', 'true')
        localStorage.setItem('pwa_shown_time', Date.now().toString())
      }
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      clearTimeout(fallbackTimer)
    }
  }, [deferredPrompt])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    setIsInstalling(true)
    
    try {
      // Timeout ekle - 10 saniye sonra hata ver
      const installPromise = new Promise<void>(async (resolve, reject) => {
        try {
          await deferredPrompt.prompt()
          const { outcome } = await deferredPrompt.userChoice

          if (outcome === 'accepted') {
            resolve()
          } else {
            reject(new Error('User dismissed the install prompt'))
          }
        } catch (err) {
          reject(err)
        }
      })

      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => reject(new Error('Install prompt timeout')), 10000)
      })

      await Promise.race([installPromise, timeoutPromise])
      
      toast.success('✅ Uygulama yükleniyor...')
      setDeferredPrompt(null)
      setShowPrompt(false)
      localStorage.setItem('pwa_installed', 'true')
    } catch (err) {
      console.error('Install error:', err)
      toast.error('Yükleme başarısız oldu. Lütfen tekrar deneyin.')
      setIsInstalling(false)
    }
  }

  if (isInstalled) return null

  // iOS için özel talimat
  if (isIOS && (showPrompt || showManualFallback)) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-6 left-4 right-4 z-[9999]"
        >
          <div className="bg-zinc-900/95 border border-white/10 p-5 rounded-3xl shadow-2xl backdrop-blur-2xl">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
                  <Smartphone className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white uppercase">iOS Uygulaması</h3>
                  <p className="text-xs text-white/50 mt-1">Uygulamayı ana ekrana eklemek için:</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowPrompt(false)
                  setShowManualFallback(false)
                }}
                className="p-1 text-white/30 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>
            <div className="text-xs text-white/60 space-y-1 mb-3">
              <p>1️⃣ Paylaş butonuna (↗️) tıkla</p>
              <p>2️⃣ "Ana Ekrana Ekle" seçeneğini seç</p>
            </div>
            <button
              onClick={() => {
                setShowPrompt(false)
                setShowManualFallback(false)
              }}
              className="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-black font-black rounded-xl transition-all text-sm"
            >
              Anladım
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Android ve diğer tarayıcılar
  if (!isIOS && (showPrompt || showManualFallback) && !isInstalled) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 z-[9999]"
        >
          <div className="relative overflow-hidden bg-zinc-900/95 border border-white/10 p-5 rounded-3xl shadow-2xl backdrop-blur-2xl">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 rotate-3">
                <Smartphone className="w-6 h-6 text-black" />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white tracking-tight uppercase">Restoran Pro</h3>
                  <div className="bg-primary/20 text-primary text-[8px] font-black px-1.5 py-0.5 rounded border border-primary/20 uppercase">
                    Hızlı Erişim
                  </div>
                </div>
                <p className="text-xs text-white/50 leading-relaxed">
                  Uygulamayı ana ekranına ekleyerek saniyeler içinde sipariş al ve masaları yönet.
                </p>
                
                <div className="flex items-center gap-3 pt-3">
                  <button
                    onClick={handleInstall}
                    disabled={isInstalling || !deferredPrompt}
                    className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-black text-xs font-black py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10 active:scale-95"
                  >
                    {isInstalling ? (
                      <>
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                          <Download className="w-3.5 h-3.5" />
                        </motion.div>
                        YÜKLENIYOR
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        ŞİMDİ YÜKLE
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setShowPrompt(false)
                      setShowManualFallback(false)
                    }}
                    disabled={isInstalling}
                    className="px-3 py-2.5 text-white/30 hover:text-white transition-all text-xs font-bold disabled:opacity-50"
                  >
                    DAHA SONRA
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setShowPrompt(false)
                  setShowManualFallback(false)
                }}
                disabled={isInstalling}
                className="absolute top-2 right-2 p-1 text-white/20 hover:text-white transition-all disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  return null
}
