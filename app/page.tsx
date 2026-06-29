'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import {
  ChefHat, QrCode, BarChart3, Smartphone, Shield, Zap,
  Check, Star, ArrowRight, Menu, X, Users, Package,
  TrendingUp, Clock, CreditCard, Bell, Crown, Brain,
  Warehouse, MessageCircle, Mic, Award, ChevronRight
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
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: 'hsl(224,71%,4%)'}}>
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto" style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)'}}>
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  const ozellikler = [
    { icon: QrCode, renk: '#f59e0b', baslik: 'QR Menü Sistemi', aciklama: 'Müşterileriniz QR kodu okutarak menüye anında ulaşır. Güncel fiyatlar, görseller ve kategoriler.' },
    { icon: ChefHat, renk: '#f97316', baslik: 'Mutfak Ekranı (KDS)', aciklama: 'Siparişler anında mutfağa iletilir. Gerçek zamanlı durum takibi, ses bildirimi.' },
    { icon: BarChart3, renk: '#3b82f6', baslik: 'Gelişmiş Raporlama', aciklama: 'Günlük, haftalık, aylık ciro raporları. En çok satan ürünler, saatlik yoğunluk analizi.' },
    { icon: Smartphone, renk: '#22c55e', baslik: 'Garson Paneli', aciklama: 'Garsonlar kendi telefonlarından sipariş alır. Masa durumu, sipariş geçmişi.' },
    { icon: Brain, renk: '#a855f7', baslik: 'AI Satış Analizi', aciklama: 'Yapay zeka destekli satış önerileri. Hangi ürünü ne zaman öne çıkaracağınızı öğrenin.' },
    { icon: Warehouse, renk: '#ef4444', baslik: 'Stok Takibi', aciklama: 'Kritik stok uyarıları, otomatik stok düşümü. Hiç stok tükenmesin.' },
    { icon: CreditCard, renk: '#06b6d4', baslik: 'Kasa & Ödeme', aciklama: 'Hızlı satış, fiş yazdırma, günlük kasa raporu. PayTR ile güvenli ödeme.' },
    { icon: Users, renk: '#ec4899', baslik: 'Müşteri Yönetimi', aciklama: 'Müşteri kaydı, sipariş geçmişi, adres defteri. Paket siparişlerde hızlı arama.' },
    { icon: Bell, renk: '#eab308', baslik: 'Rezervasyon Sistemi', aciklama: 'Online rezervasyon alın, masa planlaması yapın, hatırlatma gönderin.' },
    { icon: Mic, renk: '#8b5cf6', baslik: 'AI Sesli Sipariş', aciklama: 'Sesle sipariş alın, AI otomatik analiz eder ve mutfağa iletir.' },
    { icon: MessageCircle, renk: '#10b981', baslik: 'WhatsApp Siparişler', aciklama: 'WhatsApp üzerinden gelen siparişleri takip edin ve yönetin.' },
    { icon: Award, renk: '#f59e0b', baslik: 'Sadakat Sistemi', aciklama: 'Puan sistemi, çark çevirme, doğum günü indirimleri ile müşteri bağlılığı.' },
  ]

  const paketler = [
    {
      ad: 'Başlangıç',
      fiyat: 'Ücretsiz',
      periyot: '',
      renk: '#6b7280',
      aciklama: 'Küçük işletmeler için',
      ozellikler: ['5 Masa', '20 Ürün', 'Garson Paneli', 'Temel Sipariş Yönetimi'],
      eksik: ['Kasa', 'QR Menü', 'Raporlama', 'AI Analiz'],
      buton: 'Ücretsiz Başla',
      href: '/register',
      vurgulu: false,
    },
    {
      ad: 'Profesyonel',
      fiyat: '₺499',
      periyot: '/ay',
      renk: '#f59e0b',
      aciklama: 'Büyüyen restoranlar için',
      ozellikler: ['Sınırsız Masa', 'Sınırsız Ürün', 'QR Menü', 'Kasa & Ödeme', 'Raporlama', 'Stok Takibi', 'Müşteri Yönetimi', 'Rezervasyon'],
      eksik: ['AI Analiz', 'Çoklu Şube'],
      buton: '14 Gün Ücretsiz Dene',
      href: '/register',
      vurgulu: true,
    },
    {
      ad: 'Elite Premium',
      fiyat: '₺999',
      periyot: '/ay',
      renk: '#a855f7',
      aciklama: 'Zincir restoranlar için',
      ozellikler: ['Her şey dahil', 'AI Analiz & Tahmin', 'Çoklu Şube', 'AI Sesli Sipariş', 'WhatsApp Entegrasyonu', 'Sadakat Sistemi', 'Patron Merkezi', 'Öncelikli Destek'],
      eksik: [],
      buton: 'Hemen Başla',
      href: '/register',
      vurgulu: false,
    },
  ]

  return (
    <div className="min-h-screen" style={{backgroundColor: 'hsl(224,71%,4%)', color: 'white'}}>
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{backgroundColor: 'rgba(10,14,39,0.9)', backdropFilter: 'blur(12px)', borderColor: 'rgba(255,255,255,0.06)'}}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)'}}>
                <ChefHat className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-black text-white">Restoran Pro</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {['Özellikler', 'Fiyatlar', 'Hakkımızda'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium transition-colors" style={{color: 'rgba(255,255,255,0.6)'}}>
                  {item}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login" className="text-sm font-semibold px-4 py-2 rounded-lg transition-all" style={{color: 'rgba(255,255,255,0.7)'}}>
                Giriş Yap
              </Link>
              <Link href="/register" className="text-sm font-bold px-5 py-2.5 rounded-xl text-black transition-all" style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 4px 12px rgba(245,158,11,0.3)'}}>
                Ücretsiz Başla
              </Link>
            </div>

            <button className="md:hidden p-2 rounded-lg" style={{color: 'rgba(255,255,255,0.7)'}} onClick={() => setMenuAcik(!menuAcik)}>
              {menuAcik ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {menuAcik && (
          <div className="md:hidden border-t p-4 space-y-3" style={{backgroundColor: 'hsl(224,71%,4%)', borderColor: 'rgba(255,255,255,0.06)'}}>
            <Link href="/login" className="block text-center py-3 rounded-xl font-semibold" style={{color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)'}}>
              Giriş Yap
            </Link>
            <Link href="/register" className="block text-center py-3 rounded-xl font-bold text-black" style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)'}}>
              Ücretsiz Başla
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full opacity-8" style={{background: 'radial-gradient(circle, rgba(245,158,11,0.15), transparent)'}} />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full opacity-8" style={{background: 'radial-gradient(circle, rgba(249,115,22,0.15), transparent)'}} />
        </div>

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 text-sm font-semibold" style={{background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b'}}>
            <Zap className="w-4 h-4" />
            <span>Türkiye'nin #1 Restoran Yönetim Sistemi</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6">
            Restoranınızı<br />
            <span style={{background: 'linear-gradient(135deg, #f59e0b, #f97316, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
              Akıllıca Yönetin
            </span>
          </h1>

          <p className="text-xl max-w-2xl mx-auto mb-10 leading-relaxed" style={{color: 'rgba(255,255,255,0.5)'}}>
            QR menü, garson paneli, mutfak ekranı, kasa, stok takibi ve yapay zeka analizi — hepsi tek platformda.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-black text-lg transition-all" style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 8px 24px rgba(245,158,11,0.3)'}}>
              <span>14 Gün Ücretsiz Dene</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/login" className="flex items-center gap-2 px-8 py-4 rounded-2xl font-semibold text-lg transition-all" style={{color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.1)'}}>
              <span>Giriş Yap</span>
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 mt-12">
            {[
              { value: '500+', label: 'Aktif Restoran' },
              { value: '1M+', label: 'İşlenen Sipariş' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="text-2xl font-black" style={{color: '#f59e0b'}}>{stat.value}</p>
                <p className="text-xs mt-1" style={{color: 'rgba(255,255,255,0.4)'}}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="özellikler" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              İhtiyacınız Olan Her Şey,{' '}
              <span style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                Tek Yerde
              </span>
            </h2>
            <p className="text-lg max-w-2xl mx-auto" style={{color: 'rgba(255,255,255,0.4)'}}>
              12 farklı modül ile restoranınızın tüm operasyonlarını dijitalleştirin.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {ozellikler.map((ozellik, i) => {
              const Icon = ozellik.icon
              return (
                <div key={i} className="p-5 rounded-2xl transition-all group" style={{background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)'}}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{background: `${ozellik.renk}20`, border: `1px solid ${ozellik.renk}30`}}>
                    <Icon className="w-5 h-5" style={{color: ozellik.renk}} />
                  </div>
                  <h3 className="font-bold text-white mb-2 text-sm">{ozellik.baslik}</h3>
                  <p className="text-xs leading-relaxed" style={{color: 'rgba(255,255,255,0.4)'}}>{ozellik.aciklama}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="fiyatlar" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Şeffaf{' '}
              <span style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>
                Fiyatlandırma
              </span>
            </h2>
            <p className="text-lg" style={{color: 'rgba(255,255,255,0.4)'}}>Gizli ücret yok. İstediğiniz zaman iptal edin.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {paketler.map((paket, i) => (
              <div
                key={i}
                className="p-6 rounded-2xl relative transition-all"
                style={{
                  background: paket.vurgulu ? `linear-gradient(135deg, rgba(245,158,11,0.1), rgba(249,115,22,0.1))` : 'rgba(255,255,255,0.03)',
                  border: paket.vurgulu ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(255,255,255,0.08)',
                  transform: paket.vurgulu ? 'scale(1.02)' : 'scale(1)',
                }}
              >
                {paket.vurgulu && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-black" style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)'}}>
                    En Popüler
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-sm font-semibold mb-1" style={{color: paket.renk}}>{paket.ad}</p>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-4xl font-black text-white">{paket.fiyat}</span>
                    {paket.periyot && <span className="text-sm mb-1" style={{color: 'rgba(255,255,255,0.4)'}}>{paket.periyot}</span>}
                  </div>
                  <p className="text-sm" style={{color: 'rgba(255,255,255,0.4)'}}>{paket.aciklama}</p>
                </div>

                <div className="space-y-2.5 mb-6">
                  {paket.ozellikler.map((oz, j) => (
                    <div key={j} className="flex items-center gap-2.5">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{background: `${paket.renk}20`}}>
                        <Check className="w-2.5 h-2.5" style={{color: paket.renk}} />
                      </div>
                      <span className="text-sm" style={{color: 'rgba(255,255,255,0.7)'}}>{oz}</span>
                    </div>
                  ))}
                  {paket.eksik.map((oz, j) => (
                    <div key={j} className="flex items-center gap-2.5 opacity-40">
                      <div className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{background: 'rgba(255,255,255,0.05)'}}>
                        <X className="w-2.5 h-2.5 text-white" />
                      </div>
                      <span className="text-sm line-through" style={{color: 'rgba(255,255,255,0.4)'}}>{oz}</span>
                    </div>
                  ))}
                </div>

                <Link
                  href={paket.href}
                  className="block text-center py-3 rounded-xl font-bold text-sm transition-all"
                  style={paket.vurgulu
                    ? {background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: 'black', boxShadow: '0 4px 12px rgba(245,158,11,0.3)'}
                    : {background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.8)', border: '1px solid rgba(255,255,255,0.1)'}
                  }
                >
                  {paket.buton}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 rounded-3xl relative overflow-hidden" style={{background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(249,115,22,0.1))', border: '1px solid rgba(245,158,11,0.2)'}}>
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10" style={{background: 'radial-gradient(circle, #f59e0b, transparent)'}} />
            </div>
            <div className="relative z-10">
              <Crown className="w-12 h-12 mx-auto mb-4" style={{color: '#f59e0b'}} />
              <h2 className="text-3xl font-black mb-4">Hemen Başlayın</h2>
              <p className="text-lg mb-8" style={{color: 'rgba(255,255,255,0.5)'}}>
                14 gün ücretsiz deneyin. Kredi kartı gerekmez.
              </p>
              <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-bold text-black text-lg" style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 8px 24px rgba(245,158,11,0.3)'}}>
                <span>Ücretsiz Hesap Oluştur</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4" style={{borderColor: 'rgba(255,255,255,0.06)'}}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)'}}>
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-white">Restoran Pro</span>
          </div>
          <p className="text-sm" style={{color: 'rgba(255,255,255,0.3)'}}>© 2026 Restoran Pro. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm hover:underline" style={{color: 'rgba(255,255,255,0.4)'}}>Giriş</Link>
            <Link href="/register" className="text-sm hover:underline" style={{color: 'rgba(255,255,255,0.4)'}}>Kayıt</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
