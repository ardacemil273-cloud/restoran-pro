'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChefHat, Lock, ArrowRight, LogIn } from 'lucide-react'
import AdminLogin from '@/components/AdminLogin'
import PersonelLogin from '@/components/PersonelLogin'

type LoginMode = 'select' | 'admin' | 'personel'

export default function LoginPage() {
  const [mode, setMode] = useState<LoginMode>('select')

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 flex items-center justify-center p-4">
      {/* Background Decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative w-full max-w-md">
        <AnimatePresence mode="wait">
          {/* Seçici Ekran */}
          {mode === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Logo ve Başlık */}
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 mb-4"
                >
                  <ChefHat className="w-8 h-8 text-white" />
                </motion.div>
                <h1 className="text-3xl font-black text-white mb-2">Restoran Pro</h1>
                <p className="text-white/60">Giriş Türünü Seç</p>
              </div>

              {/* Giriş Seçenekleri */}
              <div className="space-y-4">
                {/* Yönetici Girişi */}
                <motion.button
                  onClick={() => setMode('admin')}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/10 hover:border-primary/50 p-6 transition-all duration-300"
                >
                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/10 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/20 rounded-xl group-hover:bg-primary/30 transition-all">
                        <Lock className="w-6 h-6 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-black text-white text-lg">Yönetici Girişi</h3>
                        <p className="text-sm text-white/60">E-posta ve şifre ile giriş</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.button>

                {/* Personel Girişi */}
                <motion.button
                  onClick={() => setMode('personel')}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-900/20 to-cyan-900/10 border border-cyan-500/30 hover:border-cyan-400/50 p-6 transition-all duration-300"
                >
                  {/* Hover Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-cyan-500/20 rounded-xl group-hover:bg-cyan-500/30 transition-all">
                        <LogIn className="w-6 h-6 text-cyan-400" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-black text-white text-lg">Personel Girişi</h3>
                        <p className="text-sm text-white/60">4 haneli PIN kodu ile giriş</p>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.button>
              </div>

              {/* Footer */}
              <div className="text-center pt-6 border-t border-white/10">
                <p className="text-sm text-white/60">
                  Restoran Pro © 2026 - Tüm Hakları Saklıdır
                </p>
              </div>
            </motion.div>
          )}

          {/* Yönetici Girişi */}
          {mode === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <AdminLogin onBack={() => setMode('select')} />
            </motion.div>
          )}

          {/* Personel Girişi */}
          {mode === 'personel' && (
            <motion.div
              key="personel"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <PersonelLogin onBack={() => setMode('select')} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
