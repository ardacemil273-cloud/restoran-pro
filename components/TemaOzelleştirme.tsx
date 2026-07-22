'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Palette, X, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

const TEMA_RENKLERI = [
  { ad: 'Cyber Blue (Varsayılan)', primary: '#00d9ff', secondary: '#7c3aed', bg: '#0a0e27' },
  { ad: 'Neon Pink', primary: '#ff006e', secondary: '#8338ec', bg: '#0a0a15' },
  { ad: 'Sunset Orange', primary: '#ff6b35', secondary: '#f7931e', bg: '#1a0f0a' },
  { ad: 'Mint Green', primary: '#00d084', secondary: '#00b4a6', bg: '#0a1515' },
  { ad: 'Deep Purple', primary: '#9d4edd', secondary: '#5a189a', bg: '#0f0a15' },
  { ad: 'Ocean Blue', primary: '#0096ff', secondary: '#0077be', bg: '#0a0f1a' },
]

export default function TemaOzelleştirme() {
  const [goster, setGoster] = useState(false)
  const [seciliTema, setSeciliTema] = useState(0)
  const [kopyalandi, setKopyalandi] = useState(false)

  useEffect(() => {
    // Kaydedilmiş temayı yükle
    const saved = localStorage.getItem('tema-index')
    if (saved) {
      setSeciliTema(parseInt(saved))
      applyTema(parseInt(saved))
    }
  }, [])

  function applyTema(index: number) {
    const tema = TEMA_RENKLERI[index]
    document.documentElement.style.setProperty('--tema', tema.primary)
    document.documentElement.style.setProperty('--tema-secondary', tema.secondary)
    document.documentElement.style.setProperty('--tema-bg', tema.bg)
    localStorage.setItem('tema-index', index.toString())
  }

  function handleTemaDegis(index: number) {
    setSeciliTema(index)
    applyTema(index)
    toast.success(`Tema değiştirildi: ${TEMA_RENKLERI[index].ad}`)
  }

  function copyTemaKodu() {
    const tema = TEMA_RENKLERI[seciliTema]
    const kod = `--tema: ${tema.primary}; --tema-secondary: ${tema.secondary};`
    navigator.clipboard.writeText(kod)
    setKopyalandi(true)
    setTimeout(() => setKopyalandi(false), 2000)
    toast.success('Tema kodu kopyalandı!')
  }

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setGoster(!goster)}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/70 transition z-40"
      >
        <motion.div animate={{ rotate: goster ? 180 : 0 }} transition={{ duration: 0.3 }}>
          <Palette className="w-6 h-6" />
        </motion.div>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {goster && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-40 right-4 z-50 bg-gradient-to-br from-cyan-900/30 to-purple-900/30 border border-cyan-500/30 rounded-2xl p-6 backdrop-blur-xl max-w-sm w-full shadow-lg shadow-cyan-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-black text-white text-lg">🎨 Tema Seç</h3>
              <button
                onClick={() => setGoster(false)}
                className="w-8 h-8 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg flex items-center justify-center text-cyan-400 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tema Seçenekleri */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {TEMA_RENKLERI.map((tema, idx) => (
                <motion.button
                  key={idx}
                  onClick={() => handleTemaDegis(idx)}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    seciliTema === idx
                      ? 'border-cyan-400 bg-cyan-500/20'
                      : 'border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg shadow-lg"
                      style={{
                        background: `linear-gradient(135deg, ${tema.primary}, ${tema.secondary})`
                      }}
                    />
                    <span className="text-xs font-bold text-cyan-300">{tema.ad}</span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Kodu Kopyala */}
            <motion.button
              onClick={copyTemaKodu}
              whileTap={{ scale: 0.95 }}
              className="w-full py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-lg text-cyan-300 font-bold text-xs transition flex items-center justify-center gap-2"
            >
              {kopyalandi ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Kopyalandı!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Tema Kodunu Kopyala
                </>
              )}
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
