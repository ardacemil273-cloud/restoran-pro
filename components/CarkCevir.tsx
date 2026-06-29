'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { RotateCw, Gift, Copy, CheckCircle, Sparkles, X, Clock } from 'lucide-react'

type CarkProps = {
  restoranId: string
  masaId?: string
  onKapat: () => void
  onOdulKazanildi?: (odul: { tipi: string; deger: number; aciklama: string; kupon_kodu: string }) => void
}

const CARK_DILIMLERI = [
  { renk: '#f59e0b', etiket: '%10 İndirim', emoji: '🎯' },
  { renk: '#8b5cf6', etiket: '50 Puan', emoji: '⭐' },
  { renk: '#10b981', etiket: '%15 İndirim', emoji: '🎁' },
  { renk: '#3b82f6', etiket: '100 Puan', emoji: '💎' },
  { renk: '#ef4444', etiket: '%20 İndirim', emoji: '🔥' },
  { renk: '#f97316', etiket: 'Bedava İçecek', emoji: '🥤' },
  { renk: '#ec4899', etiket: '%25 İndirim', emoji: '👑' },
  { renk: '#14b8a6', etiket: 'Ücretsiz Tatlı', emoji: '🍰' },
]

export default function CarkCevir({ restoranId, masaId, onKapat, onOdulKazanildi }: CarkProps) {
  const [ceviriyor, setCeviriyor] = useState(false)
  const [kazanilanOdul, setKazanilanOdul] = useState<any>(null)
  const [rotasyon, setRotasyon] = useState(0)
  const [kuponKopyalandi, setKuponKopyalandi] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    cizCark()
  }, [])

  function cizCark() {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const r = cx - 10
    const dilimSayisi = CARK_DILIMLERI.length
    const dilimAcisi = (2 * Math.PI) / dilimSayisi

    CARK_DILIMLERI.forEach((dilim, i) => {
      const baslangic = i * dilimAcisi - Math.PI / 2
      const bitis = baslangic + dilimAcisi

      // Dilim
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, baslangic, bitis)
      ctx.closePath()
      ctx.fillStyle = dilim.renk
      ctx.fill()
      ctx.strokeStyle = '#1a1a2e'
      ctx.lineWidth = 2
      ctx.stroke()

      // Emoji
      ctx.save()
      ctx.translate(cx, cy)
      ctx.rotate(baslangic + dilimAcisi / 2)
      ctx.textAlign = 'right'
      ctx.font = '20px Arial'
      ctx.fillText(dilim.emoji, r - 20, 6)
      ctx.restore()
    })

    // Merkez daire
    ctx.beginPath()
    ctx.arc(cx, cy, 20, 0, 2 * Math.PI)
    ctx.fillStyle = '#1a1a2e'
    ctx.fill()
    ctx.strokeStyle = '#f59e0b'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  async function cevir() {
    if (ceviriyor || kazanilanOdul) return
    setCeviriyor(true)
    setHata(null)

    try {
      const res = await fetch('/api/cark-cevir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restoran_id: restoranId, masa_id: masaId })
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 429) {
          setHata('Bu masa bugün zaten çark çevirdi! Yarın tekrar deneyin.')
        } else {
          setHata(data.error || 'Bir hata oluştu')
        }
        setCeviriyor(false)
        return
      }

      // Animasyon: 3-5 tam tur + rastgele açı
      const turSayisi = 5 + Math.floor(Math.random() * 3)
      const hedefRotasyon = rotasyon + turSayisi * 360 + Math.floor(Math.random() * 360)
      setRotasyon(hedefRotasyon)

      // Animasyon bitmesini bekle
      await new Promise(resolve => setTimeout(resolve, 4000))

      setKazanilanOdul(data.odul)
      setCeviriyor(false)

      if (onOdulKazanildi) {
        onOdulKazanildi(data.odul)
      }

      toast.success(`🎉 ${data.odul.aciklama} kazandınız!`)
    } catch {
      setHata('Bağlantı hatası. Tekrar deneyin.')
      setCeviriyor(false)
    }
  }

  function kuponKopyala() {
    if (!kazanilanOdul?.kupon_kodu) return
    navigator.clipboard.writeText(kazanilanOdul.kupon_kodu)
    setKuponKopyalandi(true)
    setTimeout(() => setKuponKopyalandi(false), 2000)
    toast.success('Kupon kodu kopyalandı!')
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700 rounded-3xl p-6 max-w-sm w-full text-center relative overflow-hidden"
      >
        {/* Arka plan efekti */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-yellow-900/10 pointer-events-none" />

        {/* Kapat */}
        <button
          onClick={onKapat}
          className="absolute top-4 right-4 w-8 h-8 bg-zinc-700 hover:bg-zinc-600 rounded-full flex items-center justify-center text-zinc-400 hover:text-white transition z-10"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Başlık */}
        <div className="relative z-10 mb-4">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-yellow-400" />
            <h2 className="text-xl font-black text-white">Şansını Dene!</h2>
            <Sparkles className="w-5 h-5 text-yellow-400" />
          </div>
          <p className="text-zinc-400 text-xs">Çarkı çevir, ödülünü kazan</p>
        </div>

        {/* Çark */}
        <div className="relative z-10 flex justify-center mb-4">
          {/* Ok işareti */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[20px] border-l-transparent border-r-transparent border-t-yellow-400 drop-shadow-lg" />
          </div>

          <motion.canvas
            ref={canvasRef}
            width={220}
            height={220}
            className="rounded-full shadow-2xl shadow-purple-900/50"
            animate={{ rotate: rotasyon }}
            transition={{
              duration: ceviriyor ? 4 : 0,
              ease: ceviriyor ? [0.2, 0.8, 0.4, 1] : 'linear',
            }}
          />
        </div>

        {/* Hata Mesajı */}
        <AnimatePresence>
          {hata && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-4 p-3 bg-red-900/30 border border-red-700/50 rounded-xl flex items-center gap-2 text-red-300 text-sm"
            >
              <Clock className="w-4 h-4 flex-shrink-0" />
              {hata}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ödül Gösterimi */}
        <AnimatePresence>
          {kazanilanOdul && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="mb-4 p-4 bg-gradient-to-r from-yellow-900/40 to-green-900/40 border-2 border-yellow-500/50 rounded-2xl"
            >
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-yellow-400 font-black text-xl mb-1">{kazanilanOdul.aciklama}</p>
              <p className="text-zinc-400 text-xs mb-3">Kupon kodunuzu kasada gösterin</p>

              <div className="flex items-center gap-2 bg-zinc-800 rounded-xl p-3 border border-zinc-600">
                <span className="flex-1 font-mono font-black text-white tracking-widest text-lg">
                  {kazanilanOdul.kupon_kodu}
                </span>
                <button
                  onClick={kuponKopyala}
                  className="p-2 bg-yellow-500 hover:bg-yellow-400 rounded-lg transition"
                >
                  {kuponKopyalandi ? (
                    <CheckCircle className="w-4 h-4 text-black" />
                  ) : (
                    <Copy className="w-4 h-4 text-black" />
                  )}
                </button>
              </div>

              <p className="text-zinc-500 text-xs mt-2 flex items-center justify-center gap-1">
                <Clock className="w-3 h-3" />
                24 saat geçerli
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Çevir Butonu */}
        {!kazanilanOdul && !hata && (
          <motion.button
            onClick={cevir}
            disabled={ceviriyor}
            whileTap={{ scale: 0.95 }}
            className="w-full py-4 bg-gradient-to-r from-purple-600 to-yellow-500 hover:from-purple-500 hover:to-yellow-400 text-white font-black text-lg rounded-2xl transition disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg"
          >
            <RotateCw className={`w-5 h-5 ${ceviriyor ? 'animate-spin' : ''}`} />
            {ceviriyor ? 'Çevriliyor...' : 'Çarkı Çevir!'}
          </motion.button>
        )}

        {(kazanilanOdul || hata) && (
          <button
            onClick={onKapat}
            className="w-full py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-2xl transition text-sm"
          >
            {kazanilanOdul ? 'Harika! Kapat' : 'Kapat'}
          </button>
        )}
      </motion.div>
    </div>
  )
}
