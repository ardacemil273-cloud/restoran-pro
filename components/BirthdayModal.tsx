'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Cake, Gift } from 'lucide-react'

interface BirthdayModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (birthDate: string) => void
}

export default function BirthdayModal({ isOpen, onClose, onSubmit }: BirthdayModalProps) {
  const [birthDate, setBirthDate] = useState('')

  const handleSubmit = () => {
    if (birthDate) {
      onSubmit(birthDate)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-card border border-white/10 rounded-3xl p-8 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Cake className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-2xl font-black text-white">Doğum Günün Nedir?</h2>
              </div>
              <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-all">
                <X size={20} className="text-white/50" />
              </button>
            </div>

            <p className="text-white/60 mb-6">Doğum gününü paylaş, özel indirimler kazan!</p>

            <div className="space-y-4">
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
              />

              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                <Gift size={20} className="text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-bold text-sm">Doğum Günü Hediyesi</p>
                  <p className="text-white/60 text-xs">Doğum gününde %20 indirim kazanacaksın!</p>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!birthDate}
                className="w-full px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-black font-black rounded-xl transition-all"
              >
                Kaydet
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
