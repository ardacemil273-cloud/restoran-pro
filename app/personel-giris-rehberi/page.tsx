'use client'
import { motion } from 'framer-motion'
import PageHeader from '@/components/PageHeader'
import { HelpCircle, ChevronDown } from 'lucide-react'
import { useState } from 'react'

interface FAQItem {
  q: string
  a: string
}

const faqItems: FAQItem[] = [
  {
    q: 'Restoran Kodu nedir?',
    a: 'Restoran Kodu, yöneticinin her restoranına verilen benzersiz bir koddur. Garsonlar bu kodu kullanarak doğru restorana giriş yapabilirler. Yönetici Ayarlar → Restoran Bilgileri bölümünde bu kodu bulabilir.'
  },
  {
    q: 'PIN Kodu nedir?',
    a: '4 haneli bir sayıdır (örn: 1234). Her garsonun kendine özel bir PIN kodu vardır. Yönetici, Garson Yönetimi sayfasında her garson için farklı bir PIN oluşturur. Garson bu PIN\'i kullanarak giriş yapar.'
  },
  {
    q: 'Restoran Kodunu nereden bulabilirim?',
    a: 'Yönetici panelinde: Ayarlar → Restoran Bilgileri bölümünde kocaman bir "Restoran Kodu" kutusu vardır. "Kopyala" butonuna tıklayarak kodu kopyalayabilir ve garsonlarına gönderebilirsin.'
  },
  {
    q: 'PIN\'i unuttum, ne yapabilirim?',
    a: 'Yönetici panelinde Garson Yönetimi sayfasına git. Garsonunun satırında PIN kodunu görebilir ve değiştirebilirsin. Garson yeniden giriş yaparken yeni PIN\'i kullanmalı.'
  },
  {
    q: 'Birden fazla restoranım var, nasıl yapabilirim?',
    a: 'Her restoran için farklı bir Restoran Kodu vardır. Garsonlar giriş yaparken hangi restorana giriş yapmak istiyorlarsa o restoranın kodunu girmelidirler. Yönetici panelinde restoranlar arasında geçiş yapabilirsin.'
  },
  {
    q: 'Garson işten ayrıldı, PIN\'ini nasıl silerim?',
    a: 'Yönetici panelinde Garson Yönetimi sayfasına git. Garsonun satırında "Sil" butonuna tıkla. Garsonun PIN kodu tamamen silinir ve artık giriş yapamaz.'
  },
  {
    q: 'Garsonun PIN\'ini geçici olarak deaktif etmek istiyorum',
    a: 'Garson Yönetimi sayfasında garsonun satırında "Kalkan" ikonuna tıkla. PIN deaktif olur ve garson giriş yapamaz. Tekrar tıklayarak aktif edebilirsin.'
  },
  {
    q: 'Oturum süresi ne kadar?',
    a: 'Garson PIN ile giriş yaptıktan sonra 30 dakika boyunca oturum açık kalır. 30 dakika inaktivite sonrası oturum otomatik kapanır ve garson yeniden PIN girmesi gerekir.'
  },
  {
    q: 'Garsonun PIN\'ini görebilir miyim?',
    a: 'Evet! Garson Yönetimi sayfasında her garsonun PIN kodu görülür. "Göz" ikonuna tıklayarak PIN\'i gösterebilir/gizleyebilirsin. "Kopyala" butonuyla PIN\'i kopyalayabilirsin.'
  },
  {
    q: 'PIN kodu güvenli midir?',
    a: 'Evet, PIN kodları veritabanında şifreli olarak saklanır. Ayrıca tüm giriş denemeleri kaydedilir. Yönetici, Ayarlar → PIN Giriş Logları bölümünde tüm giriş denemelerini görebilir.'
  }
]

export default function PersonelGirisRehberiPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Personel Girişi Rehberi"
        subtitle="Garsonlarının giriş yapması için gereken tüm bilgiler"
        icon={<HelpCircle className="w-6 h-6" />}
      />

      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8">
        {/* Hızlı Başlangıç */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 p-6"
        >
          <h2 className="text-2xl font-black text-white mb-4">🚀 Hızlı Başlangıç</h2>
          <div className="space-y-3">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 font-black text-cyan-400">
                1
              </div>
              <div>
                <p className="font-bold text-white mb-1">Restoran Kodunu Kopyala</p>
                <p className="text-sm text-white/70">
                  Ayarlar → Restoran Bilgileri → "Kopyala" butonuna tıkla
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 font-black text-cyan-400">
                2
              </div>
              <div>
                <p className="font-bold text-white mb-1">Garson Ekle</p>
                <p className="text-sm text-white/70">
                  Garson Yönetimi → "Yeni Garson Ekle" → Ad, Telefon, PIN gir
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 font-black text-cyan-400">
                3
              </div>
              <div>
                <p className="font-bold text-white mb-1">Garsonuna Talimat Ver</p>
                <p className="text-sm text-white/70">
                  Restoran Kodu ve PIN'i garsonuna gönder (WhatsApp, SMS vb.)
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 font-black text-cyan-400">
                4
              </div>
              <div>
                <p className="font-bold text-white mb-1">Garson Giriş Yapar</p>
                <p className="text-sm text-white/70">
                  Garson: Uygulamayı aç → Personel Girişi → Kod ve PIN gir
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Garsonlara Gönderilecek Mesaj Şablonu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-zinc-800/50 border border-white/10 p-6"
        >
          <h2 className="text-2xl font-black text-white mb-4">💬 Garsonlara Gönderilecek Mesaj</h2>
          <div className="p-4 rounded-xl bg-zinc-900/50 border border-white/10 font-mono text-sm text-white/80 space-y-2">
            <p>Merhaba! 👋</p>
            <p>Restoran Pro uygulamasına giriş yapman için aşağıdaki bilgileri kullan:</p>
            <p className="mt-4 font-bold text-primary">
              📱 Restoran Kodu: [RESTORAN_KODU]
            </p>
            <p className="font-bold text-primary">
              🔐 PIN Kodu: [PIN_KODU]
            </p>
            <p className="mt-4">Adımlar:</p>
            <p>1. Uygulamayı aç</p>
            <p>2. "Personel Girişi" seç</p>
            <p>3. Restoran Kodunu yapıştır</p>
            <p>4. PIN'i gir</p>
            <p>5. "Giriş Yap" butonuna tıkla</p>
            <p className="mt-4">Sorularınız varsa bana ulaşın! 😊</p>
          </div>
          <p className="text-xs text-white/50 mt-3">
            💡 İpucu: Yukarıdaki metni kopyalayıp garsonlarına gönderebilirsin
          </p>
        </motion.div>

        {/* SSS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-black text-white mb-6">❓ Sık Sorulan Sorular</h2>
          {faqItems.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="rounded-2xl bg-zinc-800/50 border border-white/10 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-all"
              >
                <span className="font-bold text-white text-left">{item.q}</span>
                <ChevronDown
                  className={`w-5 h-5 text-white/60 transition-transform ${
                    openIndex === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === idx && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="px-6 py-4 border-t border-white/10 bg-white/5"
                >
                  <p className="text-white/70">{item.a}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Sorun Giderme */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-red-500/10 to-red-500/5 border border-red-500/20 p-6"
        >
          <h2 className="text-2xl font-black text-white mb-4">🔧 Sorun Giderme</h2>
          <div className="space-y-4">
            <div>
              <p className="font-bold text-white mb-2">❌ "PIN kodu yanlış" hatası</p>
              <p className="text-sm text-white/70">
                PIN'i kontrol et. Garson Yönetimi sayfasında doğru PIN'i görebilirsin. Harf/sayı karışıklığı olabilir.
              </p>
            </div>
            <div>
              <p className="font-bold text-white mb-2">❌ "Restoran bulunamadı" hatası</p>
              <p className="text-sm text-white/70">
                Restoran Kodu'nu kontrol et. Ayarlar → Restoran Bilgileri'nde doğru kodu kopyala.
              </p>
            </div>
            <div>
              <p className="font-bold text-white mb-2">❌ Oturum kapanıyor</p>
              <p className="text-sm text-white/70">
                30 dakika inaktivite sonrası oturum otomatik kapanır. Garson yeniden PIN girmesi gerekir.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
