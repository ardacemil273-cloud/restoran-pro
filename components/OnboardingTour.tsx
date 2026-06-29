'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { X, ChevronRight, CheckCircle2 } from 'lucide-react'

type Step = {
  id: string
  title: string
  description: string
  target?: string
  action: string
}

const ONBOARDING_STEPS: Step[] = [
  {
    id: 'welcome',
    title: '🍽️ Restoran Pro\'ya Hoşgeldin!',
    description: 'Profesyonel restoran yönetimi artık çok kolay. Hadi birlikte başlayalım!',
    action: 'Devam Et'
  },
  {
    id: 'masalar',
    title: '🪑 Masalar Paneli',
    description: 'Burada tüm masalarını görebilir, sürükle-bırak ile sıralayabilirsin. Her masanın durumunu (boş/dolu) anında takip et.',
    target: '/masalar',
    action: 'Masalara Git'
  },
  {
    id: 'siparisler',
    title: '🛒 Siparişler Takibi',
    description: 'Gelen tüm siparişleri durumlarına göre takip et. Hazırlanıyor → Hazır → Teslim edildi.',
    target: '/siparisler',
    action: 'Siparişlere Git'
  },
  {
    id: 'kasa',
    title: '💰 Kasa & Ödeme',
    description: 'Günlük ciro, ödeme işlemleri ve masa kapatma işlemlerini buradan yönet.',
    target: '/kasa',
    action: 'Kasaya Git'
  },
  {
    id: 'rapor',
    title: '📊 Raporlar & Analiz',
    description: 'Haftalık ciro, en çok satan ürünler, saatlik yoğunluk gibi detaylı analizleri gör.',
    target: '/rapor',
    action: 'Raporlara Git'
  },
  {
    id: 'masa-harita',
    title: '🗺️ Masa Haritası',
    description: 'Restoranının fiziksel düzenini oluştur. Masaları sürükle-bırak ile konumlandır.',
    target: '/masa-harita',
    action: 'Haritaya Git'
  },
  {
    id: 'done',
    title: '✅ Hazırsın!',
    description: 'Artık Restoran Pro\'yu tam olarak kullanabilirsin. Başarılar diliyorum!',
    action: 'Başla'
  }
]

export function OnboardingTour() {
  const [currentStep, setCurrentStep] = useState(0)
  const [showTour, setShowTour] = useState(false)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('restoran-pro-onboarding-seen')
    if (!hasSeenTour) {
      setTimeout(() => setShowTour(true), 1000)
    }
  }, [])

  function handleNext() {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  function handleComplete() {
    localStorage.setItem('restoran-pro-onboarding-seen', 'true')
    setShowTour(false)
    setCompleted(true)
  }

  function handleSkip() {
    localStorage.setItem('restoran-pro-onboarding-seen', 'true')
    setShowTour(false)
  }

  const step = ONBOARDING_STEPS[currentStep]
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1

  return (
    <AnimatePresence>
      {showTour && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleSkip}
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-yellow-500/30 rounded-2xl max-w-md w-full p-8 shadow-2xl shadow-yellow-500/20">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-white mb-1">{step.title}</h2>
                  <div className="flex gap-1">
                    {ONBOARDING_STEPS.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1 rounded-full transition-all ${
                          idx <= currentStep ? 'bg-yellow-500 w-6' : 'bg-zinc-700 w-2'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-8"
              >
                <p className="text-zinc-300 text-lg leading-relaxed">{step.description}</p>
              </motion.div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSkip}
                  variant="outline"
                  className="flex-1 border-zinc-600 hover:bg-zinc-800 text-zinc-300"
                >
                  Atla
                </Button>
                <Button
                  onClick={handleNext}
                  className={`flex-1 ${
                    isLastStep
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  } text-white font-bold flex items-center justify-center gap-2`}
                >
                  {isLastStep ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      {step.action}
                    </>
                  ) : (
                    <>
                      {step.action}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Step Counter */}
              <p className="text-center text-xs text-zinc-500 mt-4">
                Adım {currentStep + 1} / {ONBOARDING_STEPS.length}
              </p>
            </div>
          </motion.div>
        </>
      )}

      {/* Completion Toast */}
      {completed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 right-6 bg-green-600 text-white px-6 py-4 rounded-xl font-bold flex items-center gap-2 shadow-lg"
        >
          <CheckCircle2 className="w-5 h-5" />
          Onboarding tamamlandı!
        </motion.div>
      )}
    </AnimatePresence>
  )
}
