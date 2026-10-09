'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  ArrowRight, BarChart3, Bell, Check, ChefHat, ChevronDown, Clock3,
  Gauge, Menu, Package, QrCode, ShieldCheck, Sparkles,
  Users, WalletCards, X, Zap,
} from 'lucide-react'

const modules = [
  { icon: QrCode, tag: 'MÜŞTERİ DENEYİMİ', title: 'QR menüden masaya', text: 'Müşteri menüyü açar, siparişini verir; garson ve mutfak aynı akışta ilerler.', color: '#f59e0b', href: '/qr' },
  { icon: ChefHat, tag: 'OPERASYON', title: 'Servis hiç durmasın', text: 'Siparişler mutfağa anında düşer. Hazırlanıyor, hazır ve teslim edildi durumları tek ekranda.', color: '#fb7185', href: '/mutfak-ekrani' },
  { icon: BarChart3, tag: 'KÂRLILIK', title: 'Rakamlar konuşsun', text: 'Ciro, ürün performansı, yoğun saatler ve giderler tek bir bakışta görünür.', color: '#7dd3b0', href: '/rapor' },
  { icon: Package, tag: 'KONTROL', title: 'Stok bitmeden haberiniz olsun', text: 'Kritik stok uyarıları ve otomatik düşüm ile sürpriz tedarik krizlerini önleyin.', color: '#a78bfa', href: '/stok' },
]

const plans = [
  { name: 'Başlangıç', price: '0', note: 'Küçük işletmeler için', features: ['5 masa', '20 ürün', 'Temel sipariş yönetimi', 'Garson paneli'], cta: 'Ücretsiz başla' },
  { name: 'Profesyonel', price: '499', note: 'Büyüyen restoranlar için', popular: true, features: ['Sınırsız masa ve ürün', 'QR menü + mutfak ekranı', 'Kasa ve gelişmiş raporlar', 'Stok ve müşteri yönetimi'], cta: '14 gün ücretsiz dene' },
  { name: 'Elite', price: '999', note: 'Çok şubeli yapılar için', features: ['Profesyonel plandaki her şey', 'AI analiz ve tahmin', 'Çoklu şube yönetimi', 'WhatsApp ve sadakat sistemi'], cta: 'Satış görüşmesi planla' },
]

function MiniDashboard() {
  return (
    <div className="relative mx-auto w-full max-w-[520px] rotate-[1.5deg] rounded-[28px] border border-white/10 bg-[#111821] p-3 shadow-[0_30px_90px_rgba(0,0,0,.45)] transition-transform duration-500 hover:rotate-0">
      <div className="rounded-[21px] border border-white/8 bg-[#0c1219] p-4 sm:p-5">
        <div className="mb-5 flex items-center justify-between">
          <div><p className="text-[10px] font-bold uppercase tracking-[.22em] text-amber-400">Bugün · 09 Ekim</p><h3 className="mt-1 text-lg font-bold text-white">İyi akşamlar, Ayşe</h3></div>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300"><Bell size={17} /></div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[['₺24.680', 'Günlük ciro', '#f59e0b'], ['186', 'Sipariş', '#7dd3b0'], ['₺132,7', 'Ort. sepet', '#a78bfa']].map(([value, label, color]) => <div key={label} className="rounded-2xl border border-white/7 bg-white/[.035] p-3"><p className="text-sm font-black" style={{ color }}>{value}</p><p className="mt-1 text-[9px] uppercase tracking-wider text-white/35">{label}</p></div>)}
        </div>
        <div className="mt-3 rounded-2xl border border-white/7 bg-white/[.035] p-4">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-bold text-white">Satış performansı</p><p className="text-[10px] text-white/35">Son 7 gün · demo verisi</p></div><span className="flex items-center gap-1 text-xs font-bold text-emerald-300"><Zap size={12} /> +18,4%</span></div>
          <div className="flex h-24 items-end gap-2 px-1">{[38, 51, 42, 68, 58, 78, 92].map((height, index) => <div key={index} className="flex flex-1 flex-col items-center gap-2"><div className={`w-full rounded-t-md ${index === 6 ? 'bg-amber-400' : 'bg-amber-400/25'}`} style={{ height: `${height}%` }} /><span className="text-[9px] text-white/25">{['P', 'S', 'Ç', 'P', 'C', 'C', 'P'][index]}</span></div>)}</div>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-rose-300/15 bg-rose-300/5 p-3"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-300/15 text-rose-300"><Clock3 size={15} /></div><div><p className="text-xs font-bold text-white">Mutfakta 4 yeni sipariş</p><p className="text-[10px] text-white/40">Ortalama hazırlık süresi 12 dk</p></div><ArrowRight className="ml-auto text-white/30" size={15} /></div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [mobileMenu, setMobileMenu] = useState(false)
  const [tables, setTables] = useState(12)
  const [ticket, setTicket] = useState(220)
  const [guests, setGuests] = useState(80)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/masalar')
      else setLoading(false)
    })
  }, [router])

  const impact = useMemo(() => Math.round(tables * ticket * guests * 0.018), [tables, ticket, guests])
  const faqs = [
    ['Kurulum için teknik ekip gerekir mi?', 'Hayır. Hesabınızı açtıktan sonra restoran bilgilerinizi, masalarınızı ve menünüzü ekleyerek başlayabilirsiniz. İsterseniz ekibimiz kurulumda size eşlik eder.'],
    ['Ücretsiz planda süre sınırı var mı?', 'Başlangıç planı temel kullanım için ücretsizdir. Profesyonel planın tüm özelliklerini ise 14 gün boyunca ücretsiz deneyebilirsiniz.'],
    ['Mevcut sipariş kanallarımla çalışır mı?', 'Restoran Pro; QR menü, garson paneli, paket siparişi ve entegrasyon merkezi modülleriyle farklı sipariş akışlarını tek operasyon ekranında toplamak için tasarlanmıştır.'],
  ]

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-[#0d1117]"><div className="h-9 w-9 animate-spin rounded-full border-2 border-amber-400 border-t-transparent" /></div>

  return (
    <main className="min-h-screen overflow-hidden bg-[#0d1117] text-white selection:bg-amber-400 selection:text-black">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-white/[.07] bg-[#0d1117]/85 backdrop-blur-xl"><div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <Link href="/" className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400 text-[#0d1117] shadow-[0_0_20px_rgba(245,158,11,.25)]"><ChefHat size={19} strokeWidth={2.5} /></span><span className="text-[15px] font-black tracking-tight">restoran<span className="text-amber-400">pro</span></span></Link>
        <div className="hidden items-center gap-8 text-[13px] font-medium text-white/55 md:flex"><a href="#cozum">Çözüm</a><a href="#fiyatlar">Fiyatlar</a><a href="#hesapla">Etkiyi hesapla</a><a href="#sss">SSS</a></div>
        <div className="hidden items-center gap-3 md:flex"><Link href="/login" className="px-3 py-2 text-sm font-semibold text-white/65">Giriş yap</Link><Link href="/register" className="rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-extrabold text-[#0d1117] shadow-[0_8px_24px_rgba(245,158,11,.18)]">Ücretsiz başla</Link></div>
        <button aria-label="Menüyü aç" onClick={() => setMobileMenu(!mobileMenu)} className="rounded-lg p-2 text-white/70 md:hidden">{mobileMenu ? <X size={20} /> : <Menu size={20} />}</button>
      </div>{mobileMenu && <div className="border-t border-white/10 bg-[#0d1117] px-5 pb-5 pt-3 md:hidden"><div className="flex flex-col gap-2 text-sm text-white/70"><a href="#cozum" onClick={() => setMobileMenu(false)} className="py-3">Çözüm</a><a href="#fiyatlar" onClick={() => setMobileMenu(false)} className="py-3">Fiyatlar</a><Link href="/login" className="mt-2 rounded-xl border border-white/10 py-3 text-center">Giriş yap</Link><Link href="/register" className="rounded-xl bg-amber-400 py-3 text-center font-bold text-black">Ücretsiz başla</Link></div></div>}</nav>

      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pb-24 pt-36 lg:grid-cols-[1fr_.94fr] lg:px-8 lg:pb-32 lg:pt-48"><div className="pointer-events-none absolute -left-32 top-28 h-96 w-96 rounded-full bg-amber-400/10 blur-[120px]" /><div className="relative"><p className="mb-6 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.22em] text-amber-400"><span className="h-px w-8 bg-amber-400" /> RESTORAN OPERASYON KOKPİTİ</p><h1 className="max-w-2xl text-[clamp(2.8rem,6vw,5.5rem)] font-black leading-[.94] tracking-[-.06em]">Yoğun serviste<br /><span className="text-amber-400">kontrol sizde.</span></h1><p className="mt-7 max-w-xl text-[17px] leading-8 text-white/55">Siparişten mutfağa, stoktan kasaya kadar restoranınızın tüm akışını tek ve anlaşılır bir panelden yönetin.</p><div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/register" className="group flex items-center justify-center gap-3 rounded-xl bg-amber-400 px-6 py-4 text-sm font-extrabold text-[#0d1117] transition hover:bg-amber-300">14 gün ücretsiz dene <ArrowRight size={17} className="transition group-hover:translate-x-1" /></Link><a href="#cozum" className="flex items-center justify-center gap-2 rounded-xl border border-white/12 px-6 py-4 text-sm font-bold text-white/75 transition hover:border-white/25 hover:text-white">Nasıl çalışır? <ChevronDown size={16} /></a></div><div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 text-[11px] font-semibold text-white/42"><span className="flex items-center gap-2"><ShieldCheck size={15} className="text-emerald-300" /> Verileriniz size ait</span><span className="flex items-center gap-2"><Zap size={15} className="text-amber-400" /> Dakikalar içinde kurulum</span><span className="flex items-center gap-2"><Users size={15} className="text-violet-300" /> Ekip kullanımı</span></div></div><div className="relative lg:pl-4"><div className="absolute -inset-10 rounded-full bg-amber-400/5 blur-3xl" /><MiniDashboard /><div className="absolute -bottom-7 -left-3 hidden items-center gap-3 rounded-2xl border border-white/10 bg-[#18212b] px-4 py-3 shadow-xl sm:flex"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-300/15 text-emerald-300"><Gauge size={16} /></div><div><p className="text-xs font-bold">Operasyon görünür</p><p className="text-[10px] text-white/40">Tek ekranda, gerçek zamanlı</p></div></div></div></section>

      <section className="border-y border-white/[.07] bg-white/[.018]"><div className="mx-auto grid max-w-7xl grid-cols-2 px-5 py-7 sm:grid-cols-4 lg:px-8">{[['01', 'Sipariş akışı'], ['02', 'Mutfak kontrolü'], ['03', 'Stok görünürlüğü'], ['04', 'Kârlılık odağı']].map(([num, text]) => <div key={num} className="flex items-center gap-3 border-white/10 px-3 py-2 first:pl-0 sm:border-r last:border-0"><span className="font-mono text-xs text-amber-400">{num}</span><span className="text-xs font-bold text-white/55">{text}</span></div>)}</div></section>

      <section id="cozum" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32"><div className="mb-14 flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[.2em] text-amber-400">/ TEK PANELDE</p><h2 className="max-w-xl text-4xl font-black tracking-[-.04em] sm:text-5xl">İşletmenizin her<br /><span className="text-white/40">hareketini görün.</span></h2></div><p className="max-w-sm text-sm leading-6 text-white/45">Dağınık araçlar yerine, servis ekibinin gerçekten kullanabileceği sade bir operasyon merkezi.</p></div><div className="grid gap-4 md:grid-cols-2">{modules.map(({ icon: Icon, tag, title, text, color, href }, index) => <Link key={title} href={href} className={`group relative overflow-hidden rounded-3xl border border-white/[.08] bg-white/[.025] p-7 transition duration-300 hover:-translate-y-1 hover:border-white/20 ${index === 0 ? 'md:row-span-2 md:flex md:flex-col md:justify-end md:min-h-[390px]' : 'min-h-[185px]'}`}><div className="absolute right-0 top-0 h-36 w-36 rounded-full opacity-[.08] blur-2xl" style={{ backgroundColor: color }} /><div className="relative"><span className="mb-8 inline-flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: `${color}18`, color }}><Icon size={21} /></span><p className="mb-2 font-mono text-[10px] font-bold tracking-[.16em]" style={{ color }}>{tag}</p><h3 className="text-xl font-black tracking-tight">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-white/45">{text}</p><span className="mt-6 flex items-center gap-2 text-xs font-bold text-white/55 group-hover:text-white">Modülü keşfet <ArrowRight size={14} className="transition group-hover:translate-x-1" /></span></div></Link>)}</div></section>

      <section id="hesapla" className="border-y border-white/[.07] bg-[#111821] px-5 py-24 lg:px-8"><div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.85fr_1.15fr]"><div><p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[.2em] text-emerald-300">/ ETKİYİ HESAPLA</p><h2 className="text-4xl font-black tracking-[-.04em] sm:text-5xl">Daha düzenli servis,<br /><span className="text-emerald-300">daha güçlü kasa.</span></h2><p className="mt-5 max-w-md text-sm leading-7 text-white/50">İşletmenizin kabaca ne kadar ek ciro potansiyeli taşıdığını görün. Bu hesaplama demo tahminidir; gerçek sonuçlar işletmenize göre değişir.</p><div className="mt-8 flex items-center gap-3 text-xs text-white/45"><Sparkles size={15} className="text-emerald-300" /> Kaçan siparişleri görünür kılma varsayımı</div></div><div className="rounded-3xl border border-white/10 bg-[#0d1117] p-6 sm:p-8"><div className="space-y-7">{[['Masa sayısı', tables, 5, 80, setTables], ['Ortalama hesap (₺)', ticket, 80, 800, setTicket], ['Günlük müşteri', guests, 10, 300, setGuests]].map(([label, value, min, max, setter]) => <label key={label as string} className="block"><div className="mb-3 flex items-center justify-between text-sm"><span className="font-semibold text-white/65">{label as string}</span><span className="font-mono font-bold text-amber-400">{value as number}</span></div><input aria-label={label as string} type="range" min={min as number} max={max as number} value={value as number} onChange={(event) => (setter as (value: number) => void)(Number(event.target.value))} className="h-1.5 w-full cursor-pointer accent-amber-400" /></label>)}</div><div className="mt-9 border-t border-white/10 pt-6"><div className="flex items-end justify-between gap-5"><div><p className="text-xs font-bold text-white/45">Tahmini aylık ek ciro potansiyeli</p><p className="mt-2 text-4xl font-black tracking-tight text-emerald-300">₺{impact.toLocaleString('tr-TR')}</p></div><WalletCards className="text-emerald-300/60" size={30} /></div><Link href="/register" className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-emerald-300 py-3.5 text-sm font-extrabold text-[#0d1117]">Kendi verilerimle dene <ArrowRight size={16} /></Link></div></div></div></section>

      <section id="fiyatlar" className="mx-auto max-w-7xl px-5 py-24 lg:px-8 lg:py-32"><div className="mb-14 text-center"><p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[.2em] text-amber-400">/ SADE VE ŞEFFAF</p><h2 className="text-4xl font-black tracking-[-.04em] sm:text-5xl">İşletmeniz büyüdükçe<br /><span className="text-white/40">paketiniz de büyür.</span></h2></div><div className="grid gap-4 lg:grid-cols-3">{plans.map((plan) => <div key={plan.name} className={`relative rounded-3xl border p-7 ${plan.popular ? 'border-amber-400/50 bg-amber-400/[.07]' : 'border-white/[.08] bg-white/[.025]'}`}>{plan.popular && <span className="absolute -top-3 left-7 rounded-full bg-amber-400 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-black">En çok tercih edilen</span>}<p className="text-sm font-bold text-amber-400">{plan.name}</p><p className="mt-2 text-sm text-white/40">{plan.note}</p><div className="mt-6 flex items-end gap-1"><span className="text-5xl font-black tracking-[-.06em]">₺{plan.price}</span><span className="mb-2 text-xs text-white/40">/ ay</span></div><div className="my-7 space-y-3 border-y border-white/10 py-6">{plan.features.map((feature) => <p key={feature} className="flex items-center gap-2.5 text-sm text-white/65"><Check size={15} className="text-emerald-300" />{feature}</p>)}</div><Link href="/register" className={`flex items-center justify-center rounded-xl py-3.5 text-sm font-extrabold ${plan.popular ? 'bg-amber-400 text-black' : 'border border-white/15 text-white'}`}>{plan.cta}</Link></div>)}</div></section>

      <section id="sss" className="border-t border-white/[.07] bg-white/[.018] px-5 py-24 lg:px-8"><div className="mx-auto grid max-w-5xl gap-12 md:grid-cols-[.75fr_1.25fr]"><div><p className="mb-4 font-mono text-[10px] font-bold uppercase tracking-[.2em] text-amber-400">/ AKLINIZDAKİLER</p><h2 className="text-4xl font-black tracking-[-.04em]">Sık sorulan<br /><span className="text-white/40">sorular.</span></h2></div><div className="divide-y divide-white/10">{faqs.map(([question, answer], index) => <div key={question}><button className="flex w-full items-center justify-between gap-5 py-5 text-left text-sm font-bold" onClick={() => setOpenFaq(openFaq === index ? null : index)}>{question}<ChevronDown size={17} className={`shrink-0 text-white/45 transition ${openFaq === index ? 'rotate-180 text-amber-400' : ''}`} /></button>{openFaq === index && <p className="max-w-xl pb-5 text-sm leading-7 text-white/45">{answer}</p>}</div>)}</div></div></section>

      <section className="mx-5 my-20 overflow-hidden rounded-[28px] bg-amber-400 px-6 py-14 text-center text-[#0d1117] sm:px-10"><div className="relative mx-auto max-w-3xl"><p className="mb-4 font-mono text-[10px] font-black uppercase tracking-[.2em] opacity-60">/ İLK ADIMI ATIN</p><h2 className="text-4xl font-black tracking-[-.05em] sm:text-6xl">Restoranınızı<br />daha akıllı yönetin.</h2><p className="mx-auto mt-5 max-w-md text-sm font-medium leading-6 opacity-70">Kurulum için kredi kartı gerekmez. Menüden rapora kadar tüm operasyonu tek panelde deneyin.</p><Link href="/register" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[#0d1117] px-6 py-4 text-sm font-extrabold text-white">Ücretsiz hesabımı aç <ArrowRight size={17} /></Link></div></section>

      <footer className="mx-auto flex max-w-7xl flex-col gap-5 border-t border-white/[.07] px-5 py-8 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between lg:px-8"><div className="flex items-center gap-2 font-bold text-white/55"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-400 text-[#0d1117]"><ChefHat size={13} /></span> restoranpro</div><p>Restoran operasyonunun sade hali.</p><div className="flex gap-5"><Link href="/login">Giriş yap</Link><Link href="/register">Kayıt ol</Link></div></footer>
    </main>
  )
}
