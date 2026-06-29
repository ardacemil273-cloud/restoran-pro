'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Command, Search, X, Zap } from 'lucide-react'
import { Input } from '@/components/ui/input'

const KEYBOARD_SHORTCUTS = [
  { key: 'Cmd/Ctrl + K', action: 'Genel arama aç' },
  { key: 'Esc', action: 'Arama kapat' },
  { key: 'Cmd/Ctrl + /', action: 'Kısayolları göster' },
]

export function PremiumUX() {
  const [searchOpen, setSearchOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Arama aç
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(!searchOpen)
      }
      // Esc: Kapat
      if (e.key === 'Escape') {
        setSearchOpen(false)
        setShortcutsOpen(false)
      }
      // Cmd/Ctrl + /: Kısayolları göster
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault()
        setShortcutsOpen(!shortcutsOpen)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [searchOpen, shortcutsOpen])

  return (
    <>
      {/* Keyboard Shortcuts Modal */}
      <AnimatePresence>
        {shortcutsOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShortcutsOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 bg-zinc-800 border-2 border-zinc-700 rounded-2xl p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Command className="w-6 h-6 text-yellow-500" />
                  Klavye Kısayolları
                </h2>
                <button
                  onClick={() => setShortcutsOpen(false)}
                  className="text-zinc-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="space-y-3">
                {KEYBOARD_SHORTCUTS.map((shortcut, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg border border-zinc-700 hover:border-yellow-500/30 transition-all"
                  >
                    <span className="text-white font-medium">{shortcut.action}</span>
                    <kbd className="px-2 py-1 bg-zinc-700 text-zinc-200 rounded text-xs font-bold">
                      {shortcut.key}
                    </kbd>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Search Button */}
      {!searchOpen && (
        <motion.button
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => setSearchOpen(true)}
          className="fixed bottom-6 right-6 z-30 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all group"
          title="Arama aç (Cmd+K)"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full bg-yellow-400/20 group-hover:bg-yellow-400/30 transition-all"
          />
          <Search className="w-6 h-6 relative z-10" />
        </motion.button>
      )}

      {/* Search Modal */}
      <AnimatePresence>
        {searchOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSearchOpen(false)}
              className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              className="fixed top-1/3 left-1/2 transform -translate-x-1/2 z-50 bg-zinc-800 border-2 border-yellow-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl shadow-yellow-500/20"
            >
              <div className="flex items-center gap-3 mb-4">
                <Zap className="w-5 h-5 text-yellow-500" />
                <Input
                  autoFocus
                  placeholder="Sayfaları, özelikleri ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-yellow-500"
                />
              </div>
              <p className="text-xs text-zinc-400">Yakında: Genel arama özelliği eklenecek</p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
