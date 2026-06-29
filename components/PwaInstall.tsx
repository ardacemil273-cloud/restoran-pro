'use client'
import { useEffect, useState } from 'react'
import { Download, X, Smartphone, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // PWA yüklü mü kontrol et
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
      
      // 5 saniye sonra göster
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 5000)
      
      return () => clearTimeout(timer)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    
    if (outcome === 'accepted') {
      setInstallPrompt(null)
      setIsVisible(false)
    }
  }

  if (isInstalled) return null

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-4 right-4 lg:left-auto lg:right-6 lg:w-96 z-[9999]"
        >
          <div className="relative overflow-hidden bg-zinc-900/90 border border-white/10 p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
            {/* Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-[50px] rounded-full pointer-events-none" />
            
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 shrink-0 rotate-3">
                <Smartphone className="w-6 h-6 text-black" />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white tracking-tight uppercase">Restoran Pro Uygulaması</h3>
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
                    className="flex-1 bg-primary hover:bg-primary/90 text-black text-xs font-black py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/10"
                  >
                    <Download className="w-3.5 h-3.5" />
                    ŞİMDİ YÜKLE
                  </button>
                  <button
                    onClick={() => setIsVisible(false)}
                    className="px-3 py-2.5 text-white/30 hover:text-white transition-all text-xs font-bold"
                  >
                    DAHA SONRA
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => setIsVisible(false)}
                className="absolute top-2 right-2 p-1 text-white/20 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
