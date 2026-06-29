'use client'
import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function PwaInstall() {
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault()
      setInstallPrompt(e)
      
      // 3 saniye sonra göster
      setTimeout(() => {
        setIsVisible(true)
      }, 3000)
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

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md"
        >
          <div className="bg-zinc-900 border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center justify-between gap-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <Download className="w-5 h-5 text-black" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Uygulamayı İndir</h3>
                <p className="text-xs text-white/50">Daha hızlı ve kolay erişim için ana ekrana ekle.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstall}
                className="bg-primary text-black text-xs font-bold px-4 py-2 rounded-lg hover:scale-105 transition-all"
              >
                İndir
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="p-2 text-white/30 hover:text-white transition-all"
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
