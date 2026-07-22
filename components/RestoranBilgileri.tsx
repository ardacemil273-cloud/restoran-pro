'use client'
import { motion } from 'framer-motion'
import { Copy, Check, QrCode } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface RestoranBilgileriProps {
  restoran: any
}

export default function RestoranBilgileri({ restoran }: RestoranBilgileriProps) {
  const [copied, setCopied] = useState(false)

  const copyRestoran = () => {
    navigator.clipboard.writeText(restoran.id)
    setCopied(true)
    toast.success('Restoran kodu kopyalandı!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-6"
    >
      <div className="space-y-6">
        {/* Başlık */}
        <div>
          <h2 className="text-2xl font-black text-white mb-2">🏪 Restoran Bilgileri</h2>
          <p className="text-white/60">Garsonlarına bu kodu ver, PIN ile giriş yapabilsinler</p>
        </div>

        {/* Restoran Kodu */}
        <div className="space-y-3">
          <label className="block text-sm font-bold text-white/70">Restoran Kodu</label>
          <div className="flex gap-3">
            <div className="flex-1 px-4 py-4 rounded-xl bg-zinc-800/50 border-2 border-primary/30 flex items-center justify-center">
              <code className="text-2xl font-black text-primary tracking-widest">
                {restoran.id.substring(0, 8).toUpperCase()}
              </code>
            </div>
            <motion.button
              onClick={copyRestoran}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-6 py-4 bg-primary hover:bg-primary/90 text-white font-black rounded-xl transition-all flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  Kopyalandı
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  Kopyala
                </>
              )}
            </motion.button>
          </div>
          <p className="text-xs text-white/50">
            💡 <strong>İpucu:</strong> Bu kodu garsonlarına WhatsApp, SMS veya yazılı olarak gönder. Personel girişi yaparken bu kodu girmesi gerekecek.
          </p>
        </div>

        {/* Talimatlar */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
          <h3 className="font-bold text-white mb-3">📋 Garsonlara Nasıl Talimat Ver?</h3>
          <ol className="space-y-2 text-sm text-white/70">
            <li>
              <strong className="text-white">1.</strong> Garsonuna bu Restoran Kodunu gönder
            </li>
            <li>
              <strong className="text-white">2.</strong> Uygulamayı aç → "Personel Girişi" seç
            </li>
            <li>
              <strong className="text-white">3.</strong> Restoran Kodunu yapıştır
            </li>
            <li>
              <strong className="text-white">4.</strong> 4 haneli PIN'i gir (Garson Yönetimi'nde belirttiğin PIN)
            </li>
            <li>
              <strong className="text-white">5.</strong> "Giriş Yap" butonuna tıkla
            </li>
          </ol>
        </div>

        {/* Garson Sayısı */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-white/60 text-sm mb-1">Aktif Garsonlar</p>
            <p className="text-3xl font-black text-primary">
              {restoran.garson_sayisi || 0}
            </p>
          </div>
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-white/60 text-sm mb-1">Restoran ID</p>
            <p className="text-sm font-mono text-white/70 truncate">
              {restoran.id}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
