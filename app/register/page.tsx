'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { ChefHat, Eye, EyeOff, ArrowRight, Loader2, Check, Copy, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [sifre, setSifre] = useState('')
  const [restoranAd, setRestoranAd] = useState('')
  const [patronSifre, setPatronSifre] = useState('')
  const [loading, setLoading] = useState(false)
  const [goster, setGoster] = useState(false)
  const [gosterPatronSifre, setGosterPatronSifre] = useState(false)
  const [kayitTamamlandi, setKayitTamamlandi] = useState(false)
  const [restoranKodu, setRestoranKodu] = useState('')
  const [copied, setCopied] = useState(false)
  const router = useRouter()

  const generateRestoranKodu = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let kod = ''
    for (let i = 0; i < 6; i++) {
      kod += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return kod
  }

  const handleRegister = async () => {
    if (!email || !sifre || !restoranAd) {
      toast.error('E-posta, şifre ve restoran adını doldurunuz')
      return
    }
    if (sifre.length < 6) {
      toast.error('Şifre en az 6 karakter olmalıdır')
      return
    }
    
    // Patron şifresi varsayılan olarak "1234" - kullanıcı sonra değiştirebilir
    const finalPatronSifre = patronSifre || '1234'

    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({ email, password: sifre })
      if (error) {
        toast.error('Kayıt hatası: ' + error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        const kod = generateRestoranKodu()
        
        const { error: restoranError } = await supabase.from('restoranlar').insert([{
          ad: restoranAd,
          user_id: data.user.id,
          sahibi_id: data.user.id,
          patron_sifre: finalPatronSifre,
          restoran_kodu: kod, // Otomatik oluşturulan kod
          slug: restoranAd.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        }])

        if (restoranError) {
          console.error('Restoran oluşturma hatası:', restoranError)
          toast.error('Restoran oluşturulamadı: ' + restoranError.message)
          setLoading(false)
          return
        }

        setRestoranKodu(kod)
        setKayitTamamlandi(true)
        toast.success('Hesap başarıyla oluşturuldu!')
      }
    } catch (error) {
      console.error('Kayıt hatası:', error)
      toast.error('Kayıt sırasında bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(restoranKodu)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDevamEt = () => {
    router.push('/gate')
  }

  // Başarılı Kayıt Ekranı
  if (kayitTamamlandi) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: 'hsl(224,71%,4%)' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
            >
              <CheckCircle className="w-12 h-12 text-white" />
            </motion.div>
            <h1 className="text-3xl font-black text-white mb-2">Hoş Geldiniz!</h1>
            <p className="text-zinc-400">Restoranınız başarıyla oluşturuldu</p>
          </div>

          <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-6 mb-6 space-y-4">
            <div>
              <p className="text-xs text-zinc-400 font-bold mb-2">RESTORAN ADI</p>
              <p className="text-lg font-bold text-white">{restoranAd}</p>
            </div>
            <div className="border-t border-zinc-700 pt-4">
              <p className="text-xs text-zinc-400 font-bold mb-2">RESTORAN KODU (Garsonlar İçin)</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-zinc-700 rounded-lg px-4 py-3 font-mono text-xl font-black text-yellow-400 text-center">
                  {restoranKodu}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="p-3 bg-zinc-700 hover:bg-zinc-600 rounded-lg transition-all"
                  title="Kopyala"
                >
                  {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-zinc-300" />}
                </button>
              </div>
              <p className="text-xs text-zinc-400 mt-2">
                💡 Bu kodu garsonlarınıza verin. Onlar bu kodla sisteme giriş yapabilecekler.
              </p>
            </div>
          </div>

          <div className="bg-blue-950/50 border border-blue-600/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-200">
              <strong>İpucu:</strong> Restoran kodunuzu daha sonra ayarlardan değiştirebilirsiniz. Garsonlarınız bu kod + adı + şifresi ile giriş yapacaklar.
            </p>
          </div>

          <button
            onClick={handleDevamEt}
            className="w-full py-3 rounded-xl font-black text-black transition-all flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}
          >
            <Check className="w-5 h-5" />
            Panele Git
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-zinc-400 text-xs mt-4">
            Restoran kodunuzu not alın. Daha sonra ihtiyacınız olabilir.
          </p>
        </motion.div>
      </div>
    )
  }

  // Kayıt Formu
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'hsl(224,71%,4%)' }}>
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12" style={{ background: 'linear-gradient(135deg, hsl(220,14%,6%) 0%, hsl(224,71%,8%) 100%)' }}>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #f59e0b, transparent)' }} />
          <div className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full opacity-20" style={{ background: 'radial-gradient(circle, #f97316, transparent)' }} />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)' }}>
              <ChefHat className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-black text-white">Restoran Pro</span>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-black text-white mb-4">
                Restoranınızı<br />
                <span style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Dijitalleştirin
                </span>
              </h2>
              <p className="text-white/60 text-lg">
                QR menü, garson paneli, mutfak ekranı, kasa ve stok takibi — hepsi tek platformda.
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: '📱', text: 'Garsonlar kendi telefonlarından sipariş alır' },
                { icon: '👨‍🍳', text: 'Mutfak ekranında siparişler anında görülür' },
                { icon: '📊', text: 'Gelişmiş raporlama ve analiz' },
                { icon: '💰', text: 'Entegre kasa ve ödeme sistemi' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-white/80">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative z-10 mt-12 pt-8 border-t border-white/10">
            <p className="text-white/60 text-sm">
              ✨ <strong>14 gün ücretsiz deneyin</strong> — Kredi kartı gerekli değil
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">Hesap Oluştur</h1>
            <p className="text-white/60">Restoranınızı yönetmeye başlayın</p>
          </div>

          <div className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-bold text-white/70 mb-2">E-posta</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ornek@restoran.com"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              />
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-sm font-bold text-white/70 mb-2">Şifre (En az 6 karakter)</label>
              <div className="relative">
                <input
                  type={goster ? 'text' : 'password'}
                  value={sifre}
                  onChange={(e) => setSifre(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
                <button
                  onClick={() => setGoster(!goster)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  {goster ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Restoran Adı */}
            <div>
              <label className="block text-sm font-bold text-white/70 mb-2">Restoran Adı</label>
              <input
                type="text"
                value={restoranAd}
                onChange={(e) => setRestoranAd(e.target.value)}
                placeholder="Örn: Leziz Kebap"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
              />
            </div>

            {/* Patron Şifresi */}
            <div>
              <label className="block text-sm font-bold text-white/70 mb-2">Patron Şifresi (En az 4 karakter)</label>
              <div className="relative">
                <input
                  type={gosterPatronSifre ? 'text' : 'password'}
                  value={patronSifre}
                  onChange={(e) => setPatronSifre(e.target.value)}
                  placeholder="••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                />
                <button
                  onClick={() => setGosterPatronSifre(!gosterPatronSifre)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  {gosterPatronSifre ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-white/50 mt-1">
                💡 Bu şifre ile panele giriş yapacaksınız
              </p>
            </div>

            {/* Kayıt Butonu */}
            <button
              onClick={handleRegister}
              disabled={loading}
              className="w-full py-3 rounded-xl font-black text-black transition-all flex items-center justify-center gap-2 mt-6"
              style={{ background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #f59e0b, #f97316)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Kayıt Yapılıyor...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Hesap Oluştur
                </>
              )}
            </button>

            {/* Giriş Linki */}
            <p className="text-center text-white/60 text-sm">
              Zaten hesabınız var mı?{' '}
              <Link href="/login" className="text-orange-400 hover:text-orange-300 font-bold transition-colors">
                Giriş Yap
              </Link>
            </p>
          </div>

          {/* Şartlar */}
          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-white/50 text-center">
              Kayıt yaparak{' '}
              <a href="#" className="text-orange-400 hover:underline">
                Hizmet Şartları
              </a>
              {'ni ve '}
              <a href="#" className="text-orange-400 hover:underline">
                Gizlilik Politikası
              </a>
              {'nı kabul etmiş olursunuz.'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
