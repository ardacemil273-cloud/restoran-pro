'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { motion } from 'framer-motion'
import { Lock, User, ChefHat, Crown, Eye, EyeOff, Loader } from 'lucide-react'

export default function GatePage() {
  const router = useRouter()
  const [role, setRole] = useState<'patron' | 'garson' | 'garson-sifre' | null>(null)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [restoranId, setRestoranId] = useState('')
  const [showRestoranInput, setShowRestoranInput] = useState(false)
  const [garsonAdi, setGarsonAdi] = useState('')
  const [garsonSifresi, setGarsonSifresi] = useState('')
  const [showGarsonSifresi, setShowGarsonSifresi] = useState(false)
  const [garsonRestoranId, setGarsonRestoranId] = useState('')

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

  const handleRoleSelect = (selectedRole: 'patron' | 'garson' | 'garson-sifre') => {
    setRole(selectedRole)
    setPassword('')
    setRestoranId('')
    setGarsonAdi('')
    setGarsonSifresi('')
    setGarsonRestoranId('')
    setShowRestoranInput(selectedRole === 'garson')
  }

  const handleLogin = async () => {
    if (!role) {
      toast.error('Lütfen giriş türünü seçin')
      return
    }

    if (role === 'patron' && !password) {
      toast.error('Lütfen patron şifresini girin')
      return
    }

    if (role === 'garson' && (!restoranId || !password)) {
      toast.error('Lütfen restoran kodunu ve PIN kodunu girin')
      return
    }

    if (role === 'garson-sifre' && (!garsonRestoranId || !garsonAdi || !garsonSifresi)) {
      toast.error('Lütfen restoran kodunu, garson adını ve şifresini girin')
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

      if (role === 'garson') {
        const { data: garsonData, error: garsonError } = await supabase
          .from('garsonlar')
          .select('id, ad, rol, pin_kodu, pin_aktif, aktif')
          .eq('restoran_id', restoranId)
          .eq('pin_kodu', password)
          .eq('pin_aktif', true)
          .eq('aktif', true)
          .single()

        if (garsonError || !garsonData) {
          toast.error('Geçersiz restoran kodu veya PIN')
          setLoading(false)
          return
        }

        sessionStorage.setItem('userRole', 'garson')
        sessionStorage.setItem('garsonId', garsonData.id)
        sessionStorage.setItem('restoranId', restoranId)
        toast.success(`Hoş geldiniz, ${garsonData.ad}!`)
        router.push('/masalar')
      } else if (role === 'garson-sifre') {
        const { data: garsonData, error: garsonError } = await supabase
          .from('garsonlar')
          .select('id, ad, rol, restoran_id, sifre, sifre_aktif, aktif')
          .eq('restoran_id', garsonRestoranId)
          .eq('ad', garsonAdi)
          .eq('sifre', garsonSifresi)
          .eq('sifre_aktif', true)
          .eq('aktif', true)
          .single()

        if (garsonError || !garsonData) {
          toast.error('Geçersiz restoran kodu, garson adı veya şifre')
          setLoading(false)
          return
        }

        sessionStorage.setItem('userRole', 'garson')
        sessionStorage.setItem('garsonId', garsonData.id)
        sessionStorage.setItem('restoranId', garsonData.restoran_id)
        toast.success(`Hoş geldiniz, ${garsonData.ad}!`)
        router.push('/masalar')
      } else {
        // Patron için şifre doğrulama
        // Önce user_id ile ara, sonra sahibi_id ile
        let restoranData = null

        const { data: restoranByUserId, error: userIdError } = await supabase
          .from('restoranlar')
          .select('id, patron_sifre, user_id, sahibi_id')
          .eq('user_id', user.id)
          .maybeSingle()

        if (restoranByUserId) {
          restoranData = restoranByUserId
        } else {
          const { data: restoranBySahibiId, error: sahibiIdError } = await supabase
            .from('restoranlar')
            .select('id, patron_sifre, user_id, sahibi_id')
            .eq('sahibi_id', user.id)
            .maybeSingle()

          restoranData = restoranBySahibiId
          
          // Eğer schema cache hatası ise tüm sütunları sor
          if (!restoranData && (userIdError?.message?.includes('schema') || sahibiIdError?.message?.includes('schema'))) {
            console.log('[Gate] Schema cache error detected, retrying with all columns...')
            const { data: retryData } = await supabase
              .from('restoranlar')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle()
            
            if (retryData) {
              restoranData = retryData
            } else {
              const { data: retryData2 } = await supabase
                .from('restoranlar')
                .select('*')
                .eq('sahibi_id', user.id)
                .maybeSingle()
              restoranData = retryData2
            }
          }
        }

        if (!restoranData) {
          // Restoran yoksa otomatik oluştur
          toast.info('Restoran kaydı oluşturuluyor...')
          
          const generateKod = () => {
            const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
            let kod = ''
            for (let i = 0; i < 6; i++) {
              kod += chars.charAt(Math.floor(Math.random() * chars.length))
            }
            return kod
          }

          const emailPrefix = user.email?.split('@')[0] || 'restoran'
          const restoranAd = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1) + ' Restoran'
          const slug = emailPrefix.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 9000 + 1000)
          const kod = generateKod()

          const { data: newRestoran, error: insertError } = await supabase
            .from('restoranlar')
            .insert([{
              ad: restoranAd,
              user_id: user.id,
              sahibi_id: user.id,
              patron_sifre: '1234',
              restoran_kodu: kod,
              slug: slug,
            }])
            .select('id, patron_sifre')
            .single()

          if (insertError || !newRestoran) {
            toast.error('Restoran oluşturulamadı. Lütfen kurulum sayfasına gidin.')
            setLoading(false)
            router.push('/restoran-kurulumu')
            return
          }

          restoranData = newRestoran
          toast.success(`Restoranınız oluşturuldu! Varsayılan şifre: 1234`)
        }

        // Varsayılan şifre kontrolü: Eğer patron_sifre boş ise "1234" kabul et
        const expectedPassword = restoranData.patron_sifre || '1234'
        if (expectedPassword !== password) {
          toast.error('Geçersiz patron şifresi')
          setLoading(false)
          return
        }

        sessionStorage.setItem('userRole', 'patron')
        sessionStorage.setItem('restoranId', restoranData.id)
        toast.success('Patron paneline hoş geldiniz!')
        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Giriş hatası:', err)
      toast.error('Giriş başarısız oldu: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="inline-block mb-4"
          >
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30">
              <Lock className="w-8 h-8 text-black" />
            </div>
          </motion.div>
          <h1 className="text-4xl font-black text-white mb-2">Restoran Pro</h1>
          <p className="text-white/40 text-sm">Güvenli Giriş Sistemi</p>
        </div>

        {/* Role Selection */}
        {!role ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <p className="text-center text-white/60 font-bold mb-6">Lütfen rolünüzü seçin:</p>

            {/* Patron Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect('patron')}
              className="w-full p-6 bg-gradient-to-br from-purple-600/20 to-purple-600/5 border-2 border-purple-500/30 hover:border-purple-500/60 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-all">
                  <Crown className="w-7 h-7 text-purple-400" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-black text-white">Patron</p>
                  <p className="text-xs text-white/40">Tüm yetkilere erişim</p>
                </div>
              </div>
            </motion.button>

            {/* Garson PIN Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect('garson')}
              className="w-full p-6 bg-gradient-to-br from-orange-600/20 to-orange-600/5 border-2 border-orange-500/30 hover:border-orange-500/60 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center group-hover:bg-orange-500/30 transition-all">
                  <ChefHat className="w-7 h-7 text-orange-400" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-black text-white">Garson (PIN)</p>
                  <p className="text-xs text-white/40">Restoran kodu + PIN ile giriş</p>
                </div>
              </div>
            </motion.button>

            {/* Garson Şifre Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleRoleSelect('garson-sifre')}
              className="w-full p-6 bg-gradient-to-br from-cyan-600/20 to-cyan-600/5 border-2 border-cyan-500/30 hover:border-cyan-500/60 rounded-2xl transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-cyan-500/20 rounded-xl flex items-center justify-center group-hover:bg-cyan-500/30 transition-all">
                  <User className="w-7 h-7 text-cyan-400" />
                </div>
                <div className="text-left">
                  <p className="text-lg font-black text-white">Garson (Şifre)</p>
                  <p className="text-xs text-white/40">Restoran kodu + isim + şifre ile giriş</p>
                </div>
              </div>
            </motion.button>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl">
              <p className="text-xs text-white/50 text-center">
                Her giriş için rol seçimi ve kimlik bilgileri gereklidir. Bu sistem restoranınızın güvenliğini sağlar.
              </p>
            </div>
          </motion.div>
        ) : (
          /* Login Form */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Role Display */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                {role === 'patron' ? (
                  <>
                    <Crown className="w-5 h-5 text-purple-400" />
                    <span className="font-bold text-white">Patron Girişi</span>
                  </>
                ) : role === 'garson' ? (
                  <>
                    <ChefHat className="w-5 h-5 text-orange-400" />
                    <span className="font-bold text-white">Garson (PIN) Girişi</span>
                  </>
                ) : (
                  <>
                    <User className="w-5 h-5 text-cyan-400" />
                    <span className="font-bold text-white">Garson (Şifre) Girişi</span>
                  </>
                )}
              </div>
              <button
                onClick={() => setRole(null)}
                className="text-xs font-bold text-white/40 hover:text-white/60 transition-colors"
              >
                Değiştir
              </button>
            </div>

            {/* Restoran ID Input (Garson PIN için) */}
            {role === 'garson' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="block text-sm font-bold text-white/60 mb-3 uppercase tracking-wider">
                  Restoran Kodu
                </label>
                <input
                  type="text"
                  value={restoranId}
                  onChange={(e) => setRestoranId(e.target.value)}
                  placeholder="Restoran kodunu girin..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/20 focus:border-primary/50 outline-none transition-all text-center text-lg tracking-wider"
                />
                <p className="text-xs text-white/40 mt-2">
                  Yöneticinizden aldığınız restoran kodunu girin.
                </p>
              </motion.div>
            )}

            {/* Restoran Kodu Input (Garson Şifre için) */}
            {role === 'garson-sifre' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="block text-sm font-bold text-white/60 mb-3 uppercase tracking-wider">
                  Restoran Kodu
                </label>
                <input
                  type="text"
                  value={garsonRestoranId}
                  onChange={(e) => setGarsonRestoranId(e.target.value)}
                  placeholder="Restoran kodunu girin..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/20 focus:border-cyan-500/50 outline-none transition-all text-center text-lg tracking-wider"
                />
                <p className="text-xs text-white/40 mt-2">
                  Yöneticinizden aldığınız restoran kodunu girin.
                </p>
              </motion.div>
            )}

            {/* Garson Adı Input (Garson Şifre için) */}
            {role === 'garson-sifre' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="block text-sm font-bold text-white/60 mb-3 uppercase tracking-wider">
                  Garson Adı
                </label>
                <input
                  type="text"
                  value={garsonAdi}
                  onChange={(e) => setGarsonAdi(e.target.value)}
                  placeholder="Garson adınızı girin..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/20 focus:border-cyan-500/50 outline-none transition-all text-center"
                />
                <p className="text-xs text-white/40 mt-2">
                  Örn: Ayşe Yılmaz
                </p>
              </motion.div>
            )}

            {/* Garson Şifresi Input (Garson Şifre için) */}
            {role === 'garson-sifre' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="block text-sm font-bold text-white/60 mb-3 uppercase tracking-wider">
                  Garson Şifresi
                </label>
                <div className="relative">
                  <input
                    type={showGarsonSifresi ? 'text' : 'password'}
                    value={garsonSifresi}
                    onChange={(e) => setGarsonSifresi(e.target.value)}
                    placeholder="Şifrenizi girin..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 pr-12 text-white placeholder:text-white/20 focus:border-cyan-500/50 outline-none transition-all text-center"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGarsonSifresi(!showGarsonSifresi)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showGarsonSifresi ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Patron Şifre Input */}
            {role === 'patron' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="block text-sm font-bold text-white/60 mb-3 uppercase tracking-wider">
                  Patron Şifresi
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Şifrenizi girin..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 pr-12 text-white placeholder:text-white/20 focus:border-purple-500/50 outline-none transition-all text-center text-2xl tracking-widest"
                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-white/40 mt-2 text-center">
                  Varsayılan şifre: <strong className="text-white/60">1234</strong>
                </p>
              </motion.div>
            )}

            {/* Garson PIN Input */}
            {role === 'garson' && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <label className="block text-sm font-bold text-white/60 mb-3 uppercase tracking-wider">
                  PIN Kodu
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="PIN kodunu girin..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder:text-white/20 focus:border-orange-500/50 outline-none transition-all text-center text-2xl tracking-widest"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </motion.div>
            )}

            {/* Login Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleLogin}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-3 ${
                role === 'patron'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg shadow-purple-500/30'
                  : role === 'garson'
                  ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white shadow-lg shadow-cyan-500/30'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Giriş yapılıyor...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  Giriş Yap
                </>
              )}
            </motion.button>

            {/* Back Button */}
            <button
              onClick={() => setRole(null)}
              className="w-full py-3 text-white/40 hover:text-white/60 transition-colors text-sm font-bold"
            >
              ← Geri Dön
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}
