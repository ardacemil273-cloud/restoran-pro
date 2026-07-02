'use client'
import { motion } from 'framer-motion'
import PageHeader from '@/components/PageHeader'
import { Download, Smartphone, Apple, Chrome, RefreshCw } from 'lucide-react'

export default function PWAYonetimiPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Uygulamayı Yükle (PWA)"
        subtitle="Restoran Pro'yu telefonuna gerçek bir uygulama olarak kur"
        icon={<Download className="w-6 h-6" />}
      />

      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8">
        {/* Nedir PWA? */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-6"
        >
          <h2 className="text-2xl font-black text-white mb-4">📱 PWA Nedir?</h2>
          <p className="text-white/70 mb-4">
            <strong>PWA (Progressive Web App)</strong>, web uygulamasını gerçek bir mobil uygulamaya dönüştüren teknoloji. Restoran Pro'yu telefonuna yükleyebilir ve çevrimdışı da kullanabilirsin.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <Zap className="w-6 h-6 text-primary mb-2" />
              <p className="font-bold text-white mb-1">⚡ Hızlı</p>
              <p className="text-xs text-white/60">Anında açılır, hiç bekleme</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <Lock className="w-6 h-6 text-primary mb-2" />
              <p className="font-bold text-white mb-1">🔒 Güvenli</p>
              <p className="text-xs text-white/60">HTTPS şifreli bağlantı</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <Wifi className="w-6 h-6 text-primary mb-2" />
              <p className="font-bold text-white mb-1">📡 Çevrimdışı</p>
              <p className="text-xs text-white/60">İnternet olmadan da çalış</p>
            </div>
          </div>
        </motion.div>

        {/* Android Kurulum */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-zinc-800/50 border border-white/10 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <Chrome className="w-6 h-6 text-green-400" />
            </div>
            <h2 className="text-2xl font-black text-white">Android Kurulum</h2>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-black text-primary">
                1
              </div>
              <div>
                <p className="font-bold text-white mb-1">Uygulamayı Aç</p>
                <p className="text-sm text-white/70">
                  Restoran Pro'yu Chrome veya başka bir tarayıcıda aç
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-black text-primary">
                2
              </div>
              <div>
                <p className="font-bold text-white mb-1">Menüyü Aç</p>
                <p className="text-sm text-white/70">
                  Sağ üstteki 3 nokta (⋮) menüsüne tıkla
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-black text-primary">
                3
              </div>
              <div>
                <p className="font-bold text-white mb-1">"Uygulamayı Yükle" Seç</p>
                <p className="text-sm text-white/70">
                  Veya "Ana ekrana ekle" seçeneğini kullan
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-black text-primary">
                4
              </div>
              <div>
                <p className="font-bold text-white mb-1">Yüklemeyi Tamamla</p>
                <p className="text-sm text-white/70">
                  "Yükle" butonuna tıkla ve uygulama yüklenir
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-black text-primary">
                5
              </div>
              <div>
                <p className="font-bold text-white mb-1">Kullan</p>
                <p className="text-sm text-white/70">
                  Ana ekranda Restoran Pro ikonunu görebilirsin. Tıkla ve kullan!
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* iOS Kurulum */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-zinc-800/50 border border-white/10 p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gray-500/20 rounded-xl">
              <Apple className="w-6 h-6 text-gray-300" />
            </div>
            <h2 className="text-2xl font-black text-white">iOS (iPhone/iPad) Kurulum</h2>
          </div>

          <div className="space-y-4">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-black text-primary">
                1
              </div>
              <div>
                <p className="font-bold text-white mb-1">Safari'de Aç</p>
                <p className="text-sm text-white/70">
                  Restoran Pro'yu Safari tarayıcısında aç (Chrome değil)
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-black text-primary">
                2
              </div>
              <div>
                <p className="font-bold text-white mb-1">Paylaş Butonuna Tıkla</p>
                <p className="text-sm text-white/70">
                  Ekranın altında paylaş ikonuna tıkla (↑ kutusu)
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-black text-primary">
                3
              </div>
              <div>
                <p className="font-bold text-white mb-1">"Ana Ekrana Ekle" Seç</p>
                <p className="text-sm text-white/70">
                  Aşağı kaydırarak "Ana Ekrana Ekle" seçeneğini bul
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-black text-primary">
                4
              </div>
              <div>
                <p className="font-bold text-white mb-1">Adı Onayla</p>
                <p className="text-sm text-white/70">
                  Uygulama adını kontrol et ve "Ekle" butonuna tıkla
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 font-black text-primary">
                5
              </div>
              <div>
                <p className="font-bold text-white mb-1">Kullan</p>
                <p className="text-sm text-white/70">
                  Ana ekranda Restoran Pro ikonunu görebilirsin!
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Özellikler */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 border border-cyan-500/20 p-6"
        >
          <h2 className="text-2xl font-black text-white mb-6">✨ PWA Özellikleri</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="font-bold text-white mb-2">📲 Gerçek Uygulama Gibi</p>
              <p className="text-sm text-white/70">
                Tarayıcı arayüzü olmadan tam ekran çalışır
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="font-bold text-white mb-2">⚡ Hızlı Açılış</p>
              <p className="text-sm text-white/70">
                Uygulama cache'den yüklenir, çok hızlı açılır
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="font-bold text-white mb-2">📡 Çevrimdışı Mod</p>
              <p className="text-sm text-white/70">
                İnternet olmadan da siparişleri görebilir, notlar alabilirsin
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="font-bold text-white mb-2">🔔 Bildirimler</p>
              <p className="text-sm text-white/70">
                Yeni siparişler için push bildirimleri al
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="font-bold text-white mb-2">💾 Otomatik Güncelleme</p>
              <p className="text-sm text-white/70">
                Yeni sürümler otomatik indirilir ve yüklenir
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="font-bold text-white mb-2">🔒 Güvenli</p>
              <p className="text-sm text-white/70">
                HTTPS şifreli bağlantı, tüm veriler güvenli
              </p>
            </div>
          </div>
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
              <p className="font-bold text-white mb-2">❌ "Uygulamayı Yükle" seçeneği görünmüyor</p>
              <p className="text-sm text-white/70">
                Tarayıcıda HTTPS kullanıldığından emin ol. Bazı tarayıcılar bu seçeneği göstermeyebilir, "Ana ekrana ekle" kullan.
              </p>
            </div>
            <div>
              <p className="font-bold text-white mb-2">❌ Uygulama yüklendikten sonra açılmıyor</p>
              <p className="text-sm text-white/70">
                Tarayıcı cache'ini temizle: Ayarlar → Uygulama Bilgileri → Depolama → Verileri Sil
              </p>
            </div>
            <div>
              <p className="font-bold text-white mb-2">❌ Çevrimdışı çalışmıyor</p>
              <p className="text-sm text-white/70">
                Service Worker'ın yüklü olduğundan emin ol. Ayarlar → Uygulama Bilgileri → İzinler kontrol et.
              </p>
            </div>
            <div>
              <p className="font-bold text-white mb-2">❌ Bildirimler gelmiyor</p>
              <p className="text-sm text-white/70">
                Uygulamanın bildirim izni olduğundan emin ol. Ayarlar → Uygulamalar → Restoran Pro → Bildirimler
              </p>
            </div>
          </div>
        </motion.div>

        {/* İpuçları */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border border-yellow-500/20 p-6"
        >
          <h2 className="text-2xl font-black text-white mb-4">💡 İpuçları</h2>
          <ul className="space-y-2 text-sm text-white/70">
            <li>✅ Uygulamayı düzenli olarak güncelle (otomatik yapılır)</li>
            <li>✅ Bildirim izinlerini ver, böylece yeni siparişleri hemen öğrenirsin</li>
            <li>✅ Uygulama ikonunu ana ekranda sabit tut, hızlı erişim için</li>
            <li>✅ Çevrimdışı modda bile siparişleri görebilir ve notlar alabilirsin</li>
            <li>✅ Uygulamayı sildikten sonra yeniden yükleyebilirsin</li>
          </ul>
        </motion.div>
      </div>
    </div>
  )
}

// İkonlar için import
import { Zap, Lock, Wifi } from 'lucide-react'
