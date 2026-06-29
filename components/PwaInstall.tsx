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
  const [showIOSPrompt, setShowIOSPrompt] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [dismissCount, setDismissCount] = useState(0)

  useEffect(() => {
    // iOS kontrolü
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent)
    setIsIOS(isIOSDevice)

    // Standalone mode kontrolü
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://')
    
    if (isStandalone) {
      setIsInstalled(true)
      return
    }

    // localStorage'dan dismiss count'u oku
    const savedDismissCount = localStorage.getItem('pwa_dismiss_count')
    setDismissCount(savedDismissCount ? parseInt(savedDismissCount) : 0)

    // beforeinstallprompt event'ini yakala
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const event = e as BeforeInstallPromptEvent
      setDeferredPrompt(event)
      
      // 3 saniye sonra göster
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 3000)

      return () => clearTimeout(timer)
    }

    // iOS için alternatif
    if (isIOSDevice) {
      const iosTimer = setTimeout(() => {
        setShowIOSPrompt(true)
      }, 3000)
      return () => clearTimeout(iosTimer)
    }

    // Event listener'ı ekle
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt, { capture: true })

    // App yükleme başarılı oldu mu
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setShowPrompt(false)
      setShowIOSPrompt(false)
      setIsInstalling(false)
      setDeferredPrompt(null)
      localStorage.removeItem('pwa_dismiss_count')
      toast.success('✅ Uygulama başarıyla yüklendi!')
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt, true)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) {
      toast.error('Tarayıcı henüz hazır değil. Lütfen sayfayı yenileyin.')
      return
    }

    setIsInstalling(true)
    
    try {
      // Prompt'u göster
      await deferredPrompt.prompt()
      
      // Kullanıcı seçimini bekle
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === 'accepted') {
        toast.success('✅ Uygulama yükleniyor...')
        setDeferredPrompt(null)
        setShowPrompt(false)
        localStorage.removeItem('pwa_dismiss_count')
      } else {
        toast.info('Yükleme iptal edildi')
        setIsInstalling(false)
      }
    } catch (err: any) {
      console.error('Install error:', err)
      toast.error('Yükleme başarısız: ' + (err?.message || 'Bilinmeyen hata'))
      setIsInstalling(false)
    }
  }

  const handleDismiss = () => {
    const newCount = dismissCount + 1
    setDismissCount(newCount)
    localStorage.setItem('pwa_dismiss_count', newCount.toString())
    setShowPrompt(false)
    
    // 3 sayfa geçişinden sonra tekrar göster
    if (newCount < 3) {
      const timer = setTimeout(() => {
        setShowPrompt(true)
      }, 30000) // 30 saniye sonra tekrar göster
      return () => clearTimeout(timer)
    }
  }

  if (isInstalled) return null

  // iOS için özel talimat
  if (isIOS && showIOSPrompt) {
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
                onClick={() => setShowIOSPrompt(false)}
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
              onClick={() => setShowIOSPrompt(false)}
              className="w-full px-4 py-2.5 bg-primary hover:bg-primary/90 text-black font-black rounded-xl transition-all text-sm"
            >
              Anladım
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    )
  }

  // Android ve diğer tarayıcılar için - Kalıcı ve tekrar görünen
  if (!isIOS && showPrompt && dismissCount < 3) {
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
                    className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-black text-xs font-black py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10 active:scale-95"
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
                    onClick={handleDismiss}
                    disabled={isInstalling}
                    className="px-3 py-2.5 text-white/30 hover:text-white transition-all text-xs font-bold disabled:opacity-50"
                  >
                    DAHA SONRA
                  </button>
                </div>

                {/* Dismiss Counter */}
                {dismissCount > 0 && (
                  <p className="text-[10px] text-white/30 text-center mt-2">
                    ({3 - dismissCount} hatırlatma kaldı)
                  </p>
                )}
              </div>
              
              <button
                onClick={handleDismiss}
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
