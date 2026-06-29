'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  ChefHat, QrCode, BarChart3, Smartphone, Shield, Zap,
  Check, Star, ArrowRight, Menu, X, Users, Package,
  TrendingUp, Clock, CreditCard, Bell
} from 'lucide-react'

export default function LandingPage() {
  const [menuAcik, setMenuAcik] = useState(false)
  const [yukleniyor, setYukleniyor] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        router.push('/masalar')
      } else {
        setYukleniyor(false)
      }
    }
    checkSession()
  }, [router])

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500" />
      </div>
    )
  }

  const ozellikler = [
    {
      icon: <QrCode className="w-8 h-8 text-yellow-500" />,
      baslik: 'QR Menü Sistemi',
      aciklama: 'Müşterileriniz QR kodu okutarak menüye anında ulaşır. Güncel fiyatlar, görseller ve kategoriler.'
    },
    {
      icon: <ChefHat className="w-8 h-8 text-orange-500" />,
      baslik: 'Mutfak Ekranı (KDS)',
      aciklama: 'Siparişler anında mutfağa iletilir. Gerçek zamanlı durum takibi, ses bildirimi.'
    },
    {
      icon: <BarChart3 className="w-8 h-8 text-blue-500" />,
      baslik: 'Gelişmiş Raporlama',
      aciklama: 'Günlük, haftalık, aylık ciro raporları. En çok satan ürünler, saatlik yoğunluk analizi.'
    },
    {
      icon: <Smartphone className="w-8 h-8 text-green-500" />,
      baslik: 'Garson Paneli',
      aciklama: 'Garsonlar kendi telefonlarından sipariş alır. Masa durumu, sipariş geçmişi.'
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-purple-500" />,
      baslik: 'AI Satış Analizi',
      aciklama: 'Yapay zeka destekli satış önerileri. Hangi ürünü ne zaman öne çıkaracağınızı öğrenin.'
    },
    {
      icon: <Package className="w-8 h-8 text-red-500" />,
      baslik: 'Stok Takibi',
      aciklama: 'Kritik stok uyarıları, otomatik stok düşümü. Hiç stok tükenmesin.'
    },
    {
      icon: <CreditCard className="w-8 h-8 text-cyan-500" />,
      baslik: 'Kasa & Ödeme',
      aciklama: 'Hızlı satış, fiş yazdırma, günlük kasa raporu. PayTR ile güvenli ödeme.'
    },
    {
      icon: <Users className="w-8 h-8 text-pink-500" />,
      baslik: 'Müşteri Yönetimi',
      aciklama: 'Müşteri kaydı, sipariş geçmişi, adres defteri. Paket siparişlerde hızlı arama.'
    },
    {
      icon: <Bell className="w-8 h-8 text-yellow-400" />,
      baslik: 'Rezervasyon Sistemi',
      aciklama: 'Online rezervasyon alın, masa planlaması yapın, hatırlatma gönderin.'
    }
  ]

  const paketler = [
    {
      ad: 'Basit',
      fiyat: 'Ücretsiz',
      renk: 'border-zinc-600',
      ozellikler: [
        '5 Masa',
        '20 Ürün',
        'Garson Paneli',
        'Temel Sipariş Yönetimi',
      ],
      eksik: ['Kasa', 'QR Menü', 'Raporlama', 'AI Analiz'],
      buton: 'Ücretsiz Başla',
      href: '/register',
      vurgulu: false
    },
    {
      ad: 'Big',
      fiyat: '199₺/ay',
      renk: 'border-yellow-500',
      ozellikler: [
        'Sınırsız Masa',
        'Sınırsız Ürün',
        'Garson Paneli',
        'Kasa & Fiş Yazdırma',
        'QR Menü',
        'Stok Takibi',
        'Müşteri Yönetimi',
        'Rezervasyon',
        'Gider Takibi',
      ],
      eksik: ['AI Analiz', 'Gelişmiş Raporlama'],
      buton: 'Big Pakete Geç',
      href: '/register?paket=big',
      vurgulu: true
    },
    {
      ad: 'Pro',
      fiyat: '399₺/ay',
      renk: 'border-purple-500',
      ozellikler: [
        'Sınırsız Masa',
        'Sınırsız Ürün',
        'Garson Paneli',
        'Kasa & Fiş Yazdırma',
        'QR Menü',
        'Stok Takibi',
        'Müşteri Yönetimi',
        'Rezervasyon',
        'Gider Takibi',
        'Gelişmiş Raporlama',
        'AI Satış Analizi',
      ],
      eksik: [],
      buton: 'Pro Pakete Geç',
      href: '/register?paket=pro',
      vurgulu: false
    }
  ]

  const yorumlar = [
    {
      ad: 'Mehmet Yılmaz',
      restoran: 'Yılmaz Kebap Salonu',
      yorum: 'QR menü sistemini devreye aldıktan sonra garson iş yükü %40 azaldı. Müşteriler çok memnun.',
      puan: 5
    },
    {
      ad: 'Ayşe Demir',
      restoran: 'Cafe Demir',
      yorum: 'Mutfak ekranı sayesinde siparişler artık karışmıyor. Personel memnuniyeti arttı.',
      puan: 5
    },
    {
      ad: 'Hasan Kaya',
      restoran: 'Kaya Pide & Lahmacun',
      yorum: 'AI analiz özelliği gerçekten işe yarıyor. Hangi saatte ne satacağımı artık biliyorum.',
      puan: 5
    }
  ]

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-zinc-900/95 backdrop-blur border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-yellow-500" />
            <span className="text-xl font-bold text-yellow-500">Restoran Pro</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#ozellikler" className="text-zinc-400 hover:text-white transition">Özellikler</a>
            <a href="#paketler" className="text-zinc-400 hover:text-white transition">Fiyatlar</a>
            <a href="#yorumlar" className="text-zinc-400 hover:text-white transition">Yorumlar</a>
            <Link href="/login" className="text-zinc-400 hover:text-white transition">Giriş Yap</Link>
            <Link
              href="/register"
              className="bg-yellow-500 text-black font-bold px-5 py-2 rounded-lg hover:bg-yellow-400 transition"
            >
              Ücretsiz Dene
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-zinc-400"
            onClick={() => setMenuAcik(!menuAcik)}
          >
            {menuAcik ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuAcik && (
          <div className="md:hidden bg-zinc-800 border-t border-zinc-700 px-4 py-4 space-y-3">
            <a href="#ozellikler" className="block text-zinc-300 hover:text-white" onClick={() => setMenuAcik(false)}>Özellikler</a>
            <a href="#paketler" className="block text-zinc-300 hover:text-white" onClick={() => setMenuAcik(false)}>Fiyatlar</a>
            <a href="#yorumlar" className="block text-zinc-300 hover:text-white" onClick={() => setMenuAcik(false)}>Yorumlar</a>
            <Link href="/login" className="block text-zinc-300 hover:text-white">Giriş Yap</Link>
            <Link
              href="/register"
              className="block bg-yellow-500 text-black font-bold px-5 py-2 rounded-lg text-center hover:bg-yellow-400 transition"
            >
              Ücretsiz Dene
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 via-transparent to-orange-500/5 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 py-20 md:py-32 text-center">
          <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-2 mb-6 text-sm text-yellow-400">
            <Zap className="w-4 h-4" />
            Türkiye&apos;nin En Kapsamlı Restoran Yönetim Sistemi
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Restoranınızı{' '}
            <span className="text-yellow-500">Dijitalleştirin</span>,<br />
            Kazancınızı Artırın
          </h1>
          <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            QR menü, garson paneli, mutfak ekranı, kasa, stok takibi ve AI analiz —
            hepsi tek platformda. Kurulum 5 dakika, sonuçlar anında.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-yellow-500 text-black font-bold px-8 py-4 rounded-xl text-lg hover:bg-yellow-400 transition flex items-center justify-center gap-2"
            >
              Ücretsiz Başla
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#ozellikler"
              className="border border-zinc-600 text-zinc-300 font-bold px-8 py-4 rounded-xl text-lg hover:bg-zinc-800 transition"
            >
              Özellikleri Gör
            </a>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            Kredi kartı gerekmez • Ücretsiz plan sonsuza kadar ücretsiz
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
            <div>
              <p className="text-3xl font-black text-yellow-500">500+</p>
              <p className="text-sm text-zinc-400">Aktif Restoran</p>
            </div>
            <div>
              <p className="text-3xl font-black text-yellow-500">2M+</p>
              <p className="text-sm text-zinc-400">İşlenen Sipariş</p>
            </div>
            <div>
              <p className="text-3xl font-black text-yellow-500">%99.9</p>
              <p className="text-sm text-zinc-400">Uptime</p>
            </div>
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section id="ozellikler" className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              İhtiyacınız Olan Her Şey
            </h2>
            <p className="text-zinc-400 text-lg max-w-xl mx-auto">
              Küçük kafeden büyük restorana, her işletme için eksiksiz çözüm
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {ozellikler.map((o, i) => (
              <div
                key={i}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-600 transition"
              >
                <div className="mb-4">{o.icon}</div>
                <h3 className="text-lg font-bold mb-2">{o.baslik}</h3>
                <p className="text-zinc-400 text-sm">{o.aciklama}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Paketler */}
      <section id="paketler" className="py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Şeffaf Fiyatlandırma
            </h2>
            <p className="text-zinc-400 text-lg">
              Gizli ücret yok. İstediğiniz zaman iptal edin.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 items-center">
            {paketler.map((paket, i) => (
              <div
                key={i}
                className={`relative bg-zinc-800 border-2 ${paket.renk} rounded-xl p-6 ${paket.vurgulu ? 'md:scale-105 shadow-2xl shadow-yellow-500/20' : ''}`}
              >
                {paket.vurgulu && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-black px-4 py-1 rounded-full">
                    EN POPÜLER
                  </div>
                )}
                <h3 className="text-2xl font-black mb-1">{paket.ad}</h3>
                <p className="text-3xl font-black text-yellow-500 mb-6">{paket.fiyat}</p>
                <div className="space-y-2 mb-6">
                  {paket.ozellikler.map((o, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 shrink-0" />
                      <span>{o}</span>
                    </div>
                  ))}
                  {paket.eksik.map((o, j) => (
                    <div key={j} className="flex items-center gap-2 text-sm text-zinc-500">
                      <X className="w-4 h-4 shrink-0" />
                      <span>{o}</span>
                    </div>
                  ))}
                </div>
                <Link
                  href={paket.href}
                  className={`block w-full text-center font-bold py-3 rounded-lg transition ${
                    paket.vurgulu
                      ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                      : 'border border-zinc-600 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {paket.buton}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Yorumlar */}
      <section id="yorumlar" className="py-20 bg-zinc-950">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Müşterilerimiz Ne Diyor?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {yorumlar.map((y, i) => (
              <div key={i} className="bg-zinc-800 border border-zinc-700 rounded-xl p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: y.puan }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                </div>
                <p className="text-zinc-300 mb-4 italic">&ldquo;{y.yorum}&rdquo;</p>
                <div>
                  <p className="font-bold">{y.ad}</p>
                  <p className="text-sm text-zinc-400">{y.restoran}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/10 border border-yellow-500/30 rounded-2xl p-12">
            <h2 className="text-3xl md:text-4xl font-black mb-4">
              Bugün Başlayın
            </h2>
            <p className="text-zinc-400 mb-8 text-lg">
              5 dakikada kurulum yapın, aynı gün siparişlerinizi dijital alın.
              Ücretsiz plan ile başlayın, büyüdükçe yükseltin.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-yellow-500 text-black font-black px-10 py-4 rounded-xl text-lg hover:bg-yellow-400 transition"
            >
              Ücretsiz Hesap Aç
              <ArrowRight className="w-5 h-5" />
            </Link>
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-zinc-400">
              <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> SSL Güvenli</span>
              <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> 7/24 Destek</span>
              <span className="flex items-center gap-1"><Zap className="w-4 h-4" /> Anında Kurulum</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-yellow-500" />
            <span className="font-bold text-yellow-500">Restoran Pro</span>
          </div>
          <p className="text-zinc-500 text-sm">
            © 2026 Restoran Pro. Tüm hakları saklıdır.
          </p>
          <div className="flex gap-6 text-sm text-zinc-400">
            <Link href="/login" className="hover:text-white">Giriş Yap</Link>
            <Link href="/register" className="hover:text-white">Kayıt Ol</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
