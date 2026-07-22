'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Mic, Heart, Gift } from 'lucide-react'
import dynamic from 'next/dynamic'

const SesliSiparis = dynamic(() => import('@/components/SesliSiparis'), { ssr: false })
const MusteriSadakatKarti = dynamic(() => import('@/components/MusteriSadakatKarti'), { ssr: false })

type MenuFeaturesProps = {
  restoranId: string
  masaId?: string
  sesliSiparisAktif: boolean
  dogumGunuIndirimAktif: boolean
}

export default function MenuWithFeatures({
  restoranId,
  masaId,
  sesliSiparisAktif,
  dogumGunuIndirimAktif
}: MenuFeaturesProps) {
  const [sesliSiparisGoster, setSesliSiparisGoster] = useState(false)
  const [sadakatKartiGoster, setSadakatKartiGoster] = useState(false)
  const [musteriKayitli, setMusteriKayitli] = useState(false)

  // Müşteri sadakat kartı kaydı yapıldıysa göster
  useEffect(() => {
    const kayitlimi = localStorage.getItem(`musteri-kayitli-${restoranId}`)
    setMusteriKayitli(!!kayitlimi)
  }, [restoranId])

  return (
    <>
      {/* Sesli Sipariş Butonu - Menü altında */}
      {sesliSiparisAktif && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setSesliSiparisGoster(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-cyan-500/50 hover:shadow-cyan-500/70 transition z-40"
        >
          <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <Mic className="w-6 h-6" />
          </motion.div>
        </motion.button>
      )}

      {/* Sadakat Kartı Butonu - İlk ziyarette */}
      {dogumGunuIndirimAktif && !musteriKayitli && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setSadakatKartiGoster(true)}
          className="fixed bottom-32 right-4 w-14 h-14 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-pink-500/50 hover:shadow-pink-500/70 transition z-40"
        >
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>
            <Heart className="w-6 h-6" />
          </motion.div>
        </motion.button>
      )}

      {/* Sesli Sipariş Modal */}
      <AnimatePresence>
        {sesliSiparisGoster && (
          <SesliSiparis
            restoranId={restoranId}
            masaId={masaId}
            tip="musteri"
            onKapat={() => setSesliSiparisGoster(false)}
            onSiparisKayit={(text) => {
              toast.success('Siparişiniz kaydedildi!')
            }}
          />
        )}
      </AnimatePresence>

      {/* Sadakat Kartı Modal */}
      <AnimatePresence>
        {sadakatKartiGoster && (
          <MusteriSadakatKarti
            restoranId={restoranId}
            onKapat={() => setSadakatKartiGoster(false)}
            onKayitTamamlandi={(musteri) => {
              localStorage.setItem(`musteri-kayitli-${restoranId}`, musteri.id)
              setMusteriKayitli(true)
            }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
