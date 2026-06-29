'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, X } from 'lucide-react'

interface CartNotificationProps {
  isVisible: boolean
  onClose: () => void
  itemName: string
  itemCount: number
}

export default function CartNotification({ isVisible, onClose, itemName, itemCount }: CartNotificationProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 max-w-sm"
        >
          <div className="bg-gradient-to-r from-green-500/20 to-green-500/10 border border-green-500/30 rounded-2xl p-4 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="text-white font-black text-sm">Sepete Eklendi</p>
                  <p className="text-green-400 text-xs font-bold">{itemCount}x {itemName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
              >
                <X size={16} className="text-white/50" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
