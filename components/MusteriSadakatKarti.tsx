'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Heart, Calendar, User, Phone, Mail, Sparkles, X, CheckCircle, Loader } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type MusteriSadakatKartiProps = {
  restoranId: string
  onKapat: () => void
  onKayitTamamlandi?: (musteri: any) => void
}

export default function MusteriSadakatKarti({
  restoranId,
  onKapat,
  onKayitTamamlandi
}: MusteriSadakatKartiProps) {
  const [step, setStep] = useState<'bilgiler' | 'dogum-gunu' | 'tamamlandi'>('bilgiler')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [formData, setFormData] = useState({
    ad: '',
    telefon: '',
    email: '',
    dogum_tarihi: ''
  })

  async function kayitYap() {
    if (!formData.ad.trim() || !formData.telefon.trim()) {
      toast.error('Ad ve telefon zorunlu')
      return
    }

    setYukleniyor(true)

    try {
      // Müşteri oluştur
      const { data: musteri, error: musteriError } = await supabase
        .from('musteriler')
        .insert({
          restoran_id: restoranId,
          ad: formData.ad,
          telefon: formData.telefon,
          email: formData.email || null,
          dogum_tarihi: formData.dogum_tarihi || null,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (musteriError) throw musteriError

      // Sadakat kaydı oluştur
      const { error: sadakatError } = await supabase
        .from('musteri_sadakat')
        .insert({
          restoran_id: restoranId,
          musteri_id: musteri.id,
          toplam_puan: 0,
          bakiye_puan: 0,
          seviye: 'bronz',
          son_siparis_tarihi: null
        })

      if (sadakatError) throw sadakatError

      setStep('tamamlandi')
      toast.success('Sadakat kartınız oluşturuldu!')

      if (onKayitTamamlandi) {
        onKayitTamamlandi(musteri)
      }

      setTimeout(() => onKapat(), 2000)
    } catch (err: any) {
      toast.error(err.message || 'Hata oluştu')
    } finally {
      setYukleniyor(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        className="bg-gradient-to-br from-cyan-900/30 to-purple-900/30 border border-cyan-500/30 rounded-3xl p-8 max-w-md w-full backdrop-blur-xl"
      >
        {/* Kapat */}
        <button
          onClick={onKapat}
          className="absolute top-4 right-4 w-8 h-8 bg-cyan-500/20 hover:bg-cyan-500/40 rounded-full flex items-center justify-center text-cyan-400 transition"
        >
          <X className="w-4 h-4" />
        </button>

        <AnimatePresence mode="wait">
          {/* Step 1: Bilgiler */}
          {step === 'bilgiler' && (
            <motion.div
              key="bilgiler"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <div className="mb-6 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="inline-block mb-3"
                >
                  <Heart className="w-10 h-10 text-pink-400" />
                </motion.div>
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-1">
                  Sadakat Kartı
                </h2>
                <p className="text-sm text-cyan-300/70">Üyelik bilgilerinizi girin</p>
              </div>

              <div className="space-y-4 mb-6">
                {/* Ad */}
                <div>
                  <label className="flex items-center gap-2 text-xs text-cyan-300 font-bold mb-2">
                    <User className="w-3.5 h-3.5" />
                    Adınız
                  </label>
                  <input
                    type="text"
                    value={formData.ad}
                    onChange={(e) => setFormData({ ...formData, ad: e.target.value })}
                    placeholder="Adınız"
                    className="w-full px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 focus:bg-cyan-500/20 transition"
                  />
                </div>

                {/* Telefon */}
                <div>
                  <label className="flex items-center gap-2 text-xs text-cyan-300 font-bold mb-2">
                    <Phone className="w-3.5 h-3.5" />
                    Telefon
                  </label>
                  <input
                    type="tel"
                    value={formData.telefon}
                    onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
                    placeholder="+90 5XX XXX XX XX"
                    className="w-full px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 focus:bg-cyan-500/20 transition"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-xs text-cyan-300 font-bold mb-2">
                    <Mail className="w-3.5 h-3.5" />
                    E-posta (Opsiyonel)
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 focus:bg-cyan-500/20 transition"
                  />
                </div>

                {/* Doğum Tarihi */}
                <div>
                  <label className="flex items-center gap-2 text-xs text-cyan-300 font-bold mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    Doğum Tarihi (Opsiyonel)
                  </label>
                  <input
                    type="date"
                    value={formData.dogum_tarihi}
                    onChange={(e) => setFormData({ ...formData, dogum_tarihi: e.target.value })}
                    className="w-full px-4 py-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-white placeholder-cyan-300/50 focus:outline-none focus:border-cyan-400 focus:bg-cyan-500/20 transition"
                  />
                </div>
              </div>

              <motion.button
                onClick={() => setStep('dogum-gunu')}
                whileTap={{ scale: 0.95 }}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 transition"
              >
                Devam Et
              </motion.button>
            </motion.div>
          )}

          {/* Step 2: Doğum Günü Onayı */}
          {step === 'dogum-gunu' && (
            <motion.div
              key="dogum-gunu"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="mb-6 text-center">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="inline-block mb-3"
                >
                  <Sparkles className="w-10 h-10 text-yellow-400" />
                </motion.div>
                <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-1">
                  Doğum Günü Sürprizi
                </h2>
                <p className="text-sm text-cyan-300/70">Doğum gününüzde özel indirim alın!</p>
              </div>

              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <p className="text-sm text-yellow-300 text-center">
                  {formData.dogum_tarihi
                    ? `Doğum tarihiniz: ${new Date(formData.dogum_tarihi).toLocaleDateString('tr-TR')}`
                    : 'Doğum tarihi belirtmezseniz, sürpriz indirim alamazsınız'}
                </p>
              </div>

              <div className="space-y-3">
                <motion.button
                  onClick={kayitYap}
                  disabled={yukleniyor}
                  whileTap={{ scale: 0.95 }}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {yukleniyor ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Kartı Oluştur
                    </>
                  )}
                </motion.button>

                <button
                  onClick={() => setStep('bilgiler')}
                  className="w-full py-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold rounded-xl hover:bg-cyan-500/20 transition"
                >
                  Geri
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Tamamlandı */}
          {step === 'tamamlandi' && (
            <motion.div
              key="tamamlandi"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="text-center"
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="inline-block mb-4"
              >
                <CheckCircle className="w-16 h-16 text-green-400" />
              </motion.div>
              <h2 className="text-2xl font-black text-green-400 mb-2">Hoş Geldiniz!</h2>
              <p className="text-cyan-300/70 text-sm mb-4">
                Sadakat kartınız oluşturuldu. Artık her siparişte puan kazanabilirsiniz!
              </p>
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                <p className="text-xs text-green-300">
                  🎉 Hoşgeldin bonusu: +50 puan
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
