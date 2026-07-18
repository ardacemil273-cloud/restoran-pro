'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Building2, ArrowRight, Loader, Check } from 'lucide-react'
import { motion } from 'framer-motion'

export default function RestoranKurulumuPage() {
  const [restoranAd, setRestoranAd] = useState('')
  const [loading, setLoading] = useState(false)
  const [tamamlandi, setTamamlandi] = useState(false)
  const [restoranKodu, setRestoranKodu] = useState('')
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Oturum açmanız gerekiyor')
        router.push('/login')
      }
    }
    checkAuth()
  }, [router])

  const generateRestoranKodu = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let kod = ''
    for (let i = 0; i < 6; i++) {
      kod += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return kod
  }

  const handleKurul = async () => {
    if (!restoranAd.trim()) {
      toast.error('Restoran adını girin')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Oturum açmanız gerekiyor')
        router.push('/login')
        return
      }

      const kod = generateRestoranKodu()

      const { error } = await supabase.from('restoranlar').insert([{
        ad: restoranAd,
        user_id: user.id,
        sahibi_id: user.id,
        patron_sifre: '1234', // Varsayılan şifre
        restoran_kodu: kod,
        slug: restoranAd.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }])

      if (error) {
        toast.error('Restoran oluşturulamadı: ' + error.message)
        setLoading(false)
        return
      }

      setRestoranKodu(kod)
      setTamamlandi(true)
      toast.success('Restoran başarıyla oluşturuldu!')
    } catch (error: any) {
      toast.error('Hata: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (tamamlandi) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass rounded-2xl p-8 max-w-md w-full border border-slate-700/50 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <Check className="w-8 h-8 text-white" />
          </motion.div>

          <h2 className="text-3xl font-black text-white mb-2">Tamamlandı!</h2>
          <p className="text-slate-300 mb-6">Restoranınız başarıyla kuruldu.</p>

          <div className="glass rounded-xl p-4 mb-6 border border-slate-700/50">
            <p className="text-xs text-slate-400 mb-2">Restoran Kodu</p>
            <p className="text-2xl font-black text-white tracking-widest">{restoranKodu}</p>
            <p className="text-xs text-slate-400 mt-3">Bu kodu garsonlarınıza verin</p>
          </div>

          <div className="space-y-3 mb-6 text-left">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Patron Şifresi: 1234</p>
                <p className="text-xs text-slate-400">Ayarlardan değiştirebilirsin</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Garson Yönetimi</p>
                <p className="text-xs text-slate-400">Garsonları ekle ve yönet</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="font-bold text-white text-sm">Masaları Oluştur</p>
                <p className="text-xs text-slate-400">Masaları ve QR kodlarını ayarla</p>
              </div>
            </div>
          </div>

          <button
            onClick={() => router.push('/gate')}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            Panele Git
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-2xl p-8 max-w-md w-full border border-slate-700/50"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1 }}
            className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
          >
            <Building2 className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-2">Restoran Kurulumu</h1>
          <p className="text-slate-400">Restoranınızı hemen başlatalım</p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-3">Restoran Adı</label>
            <input
              type="text"
              value={restoranAd}
              onChange={(e) => setRestoranAd(e.target.value)}
              placeholder="Örn: Lezzet Restoran"
              className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="glass rounded-lg p-4 border border-slate-700/50">
            <p className="text-xs text-slate-400 mb-2">✨ Otomatik Ayarlar</p>
            <ul className="space-y-2 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Patron Şifresi: <strong>1234</strong>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Restoran Kodu: Otomatik oluşturulacak
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                Garson Yönetimi: Aktif
              </li>
            </ul>
          </div>

          <button
            onClick={handleKurul}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Oluşturuluyor...
              </>
            ) : (
              <>
                Restoran Oluştur
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-500 text-center mt-6">
          💡 Restoran oluşturduktan sonra garsonlarınızı ekleyebilirsiniz
        </p>
      </motion.div>
    </div>
  )
}
