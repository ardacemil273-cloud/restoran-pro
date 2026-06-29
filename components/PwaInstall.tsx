'use client'
import { useEffect, useState } from 'react'
import { Download, X, Smartphone } from 'lucide-react'

export default function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIos, setIsIos] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

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
      if (!dismissed) setShowBanner(true)
      return
    }

    // Android/Chrome için beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      const dismissed = localStorage.getItem('pwa-dismissed')
      if (!dismissed) setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const yukle = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
      setIsInstalled(true)
    }
    setDeferredPrompt(null)
  }

  const kapat = () => {
    setShowBanner(false)
    localStorage.setItem(isIos ? 'pwa-ios-dismissed' : 'pwa-dismissed', '1')
  }

  if (!showBanner || isInstalled) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
      <div className="bg-zinc-800 border border-yellow-500/50 rounded-2xl p-4 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <Smartphone className="w-6 h-6 text-black" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm">Uygulamayı Yükle</p>
            {isIos ? (
              <p className="text-xs text-zinc-400 mt-0.5">
                Safari'de <strong className="text-white">Paylaş</strong> butonuna bas, ardından <strong className="text-white">"Ana Ekrana Ekle"</strong> seç
              </p>
            ) : (
              <p className="text-xs text-zinc-400 mt-0.5">
                Android, iOS ve PC'ye uygulama olarak yükle — offline çalışır!
              </p>
            )}
          </div>
          <button onClick={kapat} className="text-zinc-500 hover:text-white flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isIos && (
          <button
            onClick={yukle}
            className="mt-3 w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            Uygulamayı Yükle
          </button>
        )}
      </div>
    </div>
  )
}
