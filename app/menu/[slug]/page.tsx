'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useParams, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { ShoppingCart, Plus, Minus, X, Gift, Sparkles, Tag, CheckCircle, RotateCw } from 'lucide-react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'

const CarkCevir = dynamic(() => import('@/components/CarkCevir'), { ssr: false })

type SepetItem = {
  id: string
  ad: string
  fiyat: number
  adet: number
  resim_url?: string | null
}

function MenuPageInner() {
  const { slug } = useParams()
  const searchParams = useSearchParams()
  const masaAd = searchParams.get('masa')

  const [restoran, setRestoran] = useState<any>(null)
  const [kategoriler, setKategoriler] = useState<any[]>([])
  const [urunler, setUrunler] = useState<any[]>([])
  const [aktifKategori, setAktifKategori] = useState<string | null>(null)
  const [sepet, setSepet] = useState<SepetItem[]>([])
  const [sepetAcik, setSepetAcik] = useState(false)
  const [masa, setMasa] = useState<any>(null)
  const [tumMasalar, setTumMasalar] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [siparisGonderiliyor, setSiparisGonderiliyor] = useState(false)
  const [odemeYontemi, setOdemeYontemi] = useState('nakit')

  // Feature Flags
  const [carkAktif, setCarkAktif] = useState(false)
  const [qrKuponAktif, setQrKuponAktif] = useState(false)
  const [carkGoster, setCarkGoster] = useState(false)
  const [kazanilanOdul, setKazanilanOdul] = useState<any>(null)
  const [kuponKodu, setKuponKodu] = useState('')
  const [kuponUygulandiMi, setKuponUygulandiMi] = useState(false)
  const [kuponIndirim, setKuponIndirim] = useState(0)
  const [surprizGosterildi, setSurprizGosterildi] = useState(false)
  const [surprizBanner, setSurprizBanner] = useState(false)

  useEffect(() => {
    loadMenu()
  }, [slug, masaAd])

  useEffect(() => {
    if (restoran?.tema_renk) {
      const renk = restoran.tema_renk.replace(/'/g, '')
      document.documentElement.style.setProperty('--tema', renk)
    }
  }, [restoran])

  // Sürpriz banner'ı 2 saniye sonra göster
  useEffect(() => {
    if ((carkAktif || qrKuponAktif) && !surprizGosterildi && masa) {
      const timer = setTimeout(() => {
        setSurprizBanner(true)
        setSurprizGosterildi(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [carkAktif, qrKuponAktif, surprizGosterildi, masa])

  async function loadMenu() {
    setLoading(true)

    const { data: restoranData, error: restoranError } = await supabase
      .from('restoranlar')
      .select('*')
      .eq('slug', slug)
      .single()

    if (restoranError || !restoranData) {
      toast.error('Restoran bulunamadı')
      setLoading(false)
      return
    }

    setRestoran(restoranData)

    // Feature flags kontrol
    const ozellikler = restoranData.ozellik_ayarlari || {}
    setCarkAktif(ozellikler.cark_cevirme?.aktif === true)
    setQrKuponAktif(ozellikler.qr_kupon?.aktif === true)

    // Masaları çek
    const { data: tumMasaData } = await supabase
      .from('masalar')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .order('ad')

    setTumMasalar(tumMasaData || [])

    if (masaAd) {
      const masaAdiNormalize = masaAd.replace(/[-_]/g, ' ').trim()
      let { data: masaData } = await supabase
        .from('masalar')
        .select('*')
        .eq('restoran_id', restoranData.id)
        .eq('ad', masaAdiNormalize)
        .maybeSingle()

      if (!masaData) {
        const { data } = await supabase
          .from('masalar')
          .select('*')
          .eq('restoran_id', restoranData.id)
          .ilike('ad', `%${masaAdiNormalize}%`)
          .maybeSingle()
        masaData = data
      }

      if (masaData) {
        setMasa(masaData)
      } else {
        toast.error(`Masa bulunamadı: ${masaAd}. Lütfen listeden seçin.`)
      }
    }

    const { data: kategorilerData } = await supabase
      .from('kategoriler')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .order('sira')

    setKategoriler(kategorilerData || [])
    if (kategorilerData && kategorilerData.length > 0) {
      setAktifKategori(kategorilerData[0].id)
    }

    const { data: urunlerData } = await supabase
      .from('urunler')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .eq('aktif', true)
      .order('ad')

    setUrunler(urunlerData || [])
    setLoading(false)
  }

  function sepeteEkle(urun: any) {
    setSepet(prev => {
      const varMi = prev.find(item => item.id === urun.id)
      if (varMi) {
        return prev.map(item => item.id === urun.id ? { ...item, adet: item.adet + 1 } : item)
      }
      return [...prev, { id: urun.id, ad: urun.ad, fiyat: urun.fiyat, adet: 1, resim_url: urun.resim_url }]
    })
    toast.success(`${urun.ad} sepete eklendi`)
  }

  function adetAzalt(urunId: string) {
    setSepet(prev => prev.map(item => item.id === urunId ? { ...item, adet: Math.max(0, item.adet - 1) } : item).filter(item => item.adet > 0))
  }

  function adetArttir(urunId: string) {
    setSepet(prev => prev.map(item => item.id === urunId ? { ...item, adet: item.adet + 1 } : item))
  }

  function sepettenSil(urunId: string) {
    setSepet(prev => prev.filter(item => item.id !== urunId))
  }

  async function kuponUygula() {
    if (!kuponKodu.trim()) { toast.error('Kupon kodu girin'); return }
    if (!restoran?.id) return

    const res = await fetch(`/api/cark-cevir?kupon=${encodeURIComponent(kuponKodu.trim())}&restoran_id=${restoran.id}`)
    const data = await res.json()

    if (!data.gecerli) {
      toast.error(data.hata || 'Geçersiz kupon')
      return
    }

    const toplamTutar = sepet.reduce((sum, item) => sum + item.fiyat * item.adet, 0)
    let indirim = 0

    if (data.odul.tipi === 'indirim') {
      indirim = (toplamTutar * data.odul.deger) / 100
    }

    setKuponIndirim(indirim)
    setKuponUygulandiMi(true)
    toast.success(`${data.odul.aciklama} uygulandı! ${indirim > 0 ? `-${indirim.toFixed(0)}₺` : ''}`)
  }

  async function siparisVer() {
    if (!masa) { toast.error('Masa seçilmedi. QR kodu tekrar okutun veya listeden seçin'); return }
    if (sepet.length === 0) { toast.error('Sepet boş'); return }
    if (!restoran) { toast.error('Restoran bilgisi yok'); return }

    setSiparisGonderiliyor(true)

    try {
      const toplamHam = sepet.reduce((sum, item) => sum + item.fiyat * item.adet, 0)
      const toplam = Math.max(0, toplamHam - kuponIndirim)

      const payload = {
        restoran_id: restoran.id,
        masa_id: masa.id,
        toplam_tutar: toplam,
        durum: 'hazirlaniyor',
        odeme_yontemi: odemeYontemi,
        ...(kuponUygulandiMi && kuponKodu ? { kupon_kodu: kuponKodu, indirim_tutari: kuponIndirim } : {})
      }

      const { data: siparis, error: siparisError } = await supabase
        .from('siparisler')
        .insert(payload)
        .select()
        .single()

      if (siparisError) throw new Error('Sipariş: ' + siparisError.message)
      if (!siparis) throw new Error('Sipariş oluşturulamadı')

      const siparisUrunleri = sepet.map(item => ({
        siparis_id: siparis.id,
        urun_id: item.id,
        adet: item.adet,
        birim_fiyat: item.fiyat
      }))

      const { error: urunError } = await supabase
        .from('siparis_urunleri')
        .insert(siparisUrunleri)

      if (urunError) throw new Error('Ürünler: ' + urunError.message)

      await supabase.from('masalar').update({ durum: 'dolu' }).eq('id', masa.id)

      toast.success('Siparişiniz alındı! Hazırlanıyor...', { duration: 5000 })
      setSepet([])
      setSepetAcik(false)
      setKuponUygulandiMi(false)
      setKuponIndirim(0)
      setKuponKodu('')
    } catch (err: any) {
      toast.error('Hata: ' + err.message)
    } finally {
      setSiparisGonderiliyor(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500 mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Menü yükleniyor...</p>
        </div>
      </div>
    )
  }

  if (!restoran) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p>Restoran bulunamadı</p>
      </div>
    )
  }

  const temaRenk = restoran?.tema_renk?.replace(/'/g, '') || '#f59e0b'
  const filtrelenmisUrunler = aktifKategori ? urunler.filter(u => u.kategori_id === aktifKategori) : urunler
  const toplamHam = sepet.reduce((sum, item) => sum + item.fiyat * item.adet, 0)
  const toplamTutar = Math.max(0, toplamHam - kuponIndirim)
  const toplamAdet = sepet.reduce((sum, item) => sum + item.adet, 0)

  return (
    <div className="min-h-screen bg-zinc-900 text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 p-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 style={{ color: temaRenk }} className="text-2xl font-bold">{restoran.ad}</h1>
            {masa ? (
              <p style={{ color: temaRenk }} className="text-sm mt-0.5 font-bold">📍 {masa.ad}</p>
            ) : (
              <div className="mt-2">
                <p className="text-sm text-red-400 font-bold mb-2">⚠ Masa seçilmedi</p>
                <select
                  onChange={(e) => {
                    const secilen = tumMasalar.find(m => m.id === e.target.value)
                    if (secilen) { setMasa(secilen); toast.success(`${secilen.ad} seçildi`) }
                  }}
                  className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1 text-sm text-white"
                  defaultValue=""
                >
                  <option value="" disabled>Masa seç</option>
                  {tumMasalar.map(m => (
                    <option key={m.id} value={m.id}>{m.ad}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Sürpriz Butonu - Çark veya Kupon aktifse */}
          {(carkAktif || qrKuponAktif) && masa && (
            <motion.button
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { setCarkGoster(true); setSurprizBanner(false) }}
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold text-white shadow-lg"
              style={{ background: `linear-gradient(135deg, ${temaRenk}, #8b5cf6)` }}
            >
              <Gift className="w-4 h-4" />
              Sürpriz!
              <motion.span
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
              />
            </motion.button>
          )}
        </div>
      </div>

      {/* Sürpriz Banner - İlk girişte göster */}
      <AnimatePresence>
        {surprizBanner && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 mt-3 p-3 rounded-xl border flex items-center gap-3 cursor-pointer"
            style={{ background: `${temaRenk}20`, borderColor: `${temaRenk}50` }}
            onClick={() => { setCarkGoster(true); setSurprizBanner(false) }}
          >
            <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: temaRenk }} />
            <div className="flex-1">
              <p className="font-bold text-sm text-white">
                {carkAktif ? '🎡 Çark Çevir, Ödül Kazan!' : '🎁 Özel Kuponunuz Var!'}
              </p>
              <p className="text-xs text-zinc-400">Siparişinizde indirim fırsatı sizi bekliyor</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); setSurprizBanner(false) }}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Kategori Seçimi */}
      <div className="sticky top-[73px] bg-zinc-900 border-b border-zinc-800 p-2 z-10 overflow-x-auto">
        <div className="flex gap-2">
          {kategoriler.map(kat => (
            <button
              key={kat.id}
              onClick={() => setAktifKategori(kat.id)}
              style={{ backgroundColor: aktifKategori === kat.id ? temaRenk : undefined }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
                aktifKategori === kat.id ? 'text-white' : 'bg-zinc-800 text-zinc-300'
              }`}
            >
              {kat.ad}
            </button>
          ))}
        </div>
      </div>

      {/* Ürün Listesi */}
      <div className="p-4 space-y-3">
        {filtrelenmisUrunler.length === 0 ? (
          <p className="text-center text-zinc-500 py-12">Bu kategoride ürün yok</p>
        ) : (
          filtrelenmisUrunler.map(urun => (
            <motion.div
              key={urun.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-0 bg-zinc-800 border-zinc-700 overflow-hidden hover:border-zinc-600 transition">
                <div className="flex gap-3 p-4">
                  {urun.resim_url ? (
                    <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden">
                      <Image src={urun.resim_url} alt={urun.ad} fill sizes="96px" className="object-cover" priority />
                    </div>
                  ) : (
                    <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-zinc-700 flex items-center justify-center text-zinc-500 text-xs">
                      Resim Yok
                    </div>
                  )}
                  <div className="flex-1 flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">{urun.ad}</h3>
                      {urun.aciklama && (
                        <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{urun.aciklama}</p>
                      )}
                      <p style={{ color: temaRenk }} className="text-xl font-bold mt-2">{urun.fiyat}₺</p>
                    </div>
                    <Button
                      onClick={() => sepeteEkle(urun)}
                      style={{ backgroundColor: temaRenk }}
                      className="text-white hover:opacity-80 h-10 w-10 p-0 flex-shrink-0 rounded-xl"
                    >
                      <Plus size={20} />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Sepet Butonu */}
      {sepet.length > 0 && (
        <motion.button
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          onClick={() => setSepetAcik(true)}
          style={{ backgroundColor: temaRenk }}
          className="fixed bottom-4 left-4 right-4 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 z-20"
        >
          <ShoppingCart size={20} />
          Sepeti Görüntüle ({toplamAdet} ürün) - {toplamTutar.toFixed(0)}₺
          {kuponUygulandiMi && (
            <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full">
              -{kuponIndirim.toFixed(0)}₺ indirim
            </span>
          )}
        </motion.button>
      )}

      {/* Sepet Modal */}
      <AnimatePresence>
        {sepetAcik && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-30 flex items-end"
            onClick={() => setSepetAcik(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-zinc-900 w-full max-h-[85vh] rounded-t-2xl overflow-hidden flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                <h2 style={{ color: temaRenk }} className="text-xl font-bold">Sepetim</h2>
                <button onClick={() => setSepetAcik(false)} className="text-zinc-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {sepet.map(item => (
                  <div key={item.id} className="flex gap-3 bg-zinc-800 p-3 rounded-xl">
                    {item.resim_url ? (
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image src={item.resim_url} alt={item.ad} fill sizes="64px" className="object-cover" />
                      </div>
                    ) : null}
                    <div className="flex-1 flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium">{item.ad}</p>
                        <p className="text-sm text-zinc-400">{item.fiyat}₺</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => adetAzalt(item.id)} className="bg-zinc-700 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-600 transition">
                          <Minus size={16} />
                        </button>
                        <span className="w-8 text-center font-bold">{item.adet}</span>
                        <button onClick={() => adetArttir(item.id)} className="bg-zinc-700 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-zinc-600 transition">
                          <Plus size={16} />
                        </button>
                        <button onClick={() => sepettenSil(item.id)} className="text-red-500 ml-2 hover:text-red-400 transition">
                          <X size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-zinc-800 bg-zinc-900 space-y-4">
                {/* Kupon Alanı - Çark veya QR Kupon aktifse */}
                {(carkAktif || qrKuponAktif) && (
                  <div>
                    {!kuponUygulandiMi ? (
                      <div className="flex gap-2">
                        <div className="flex-1 relative">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                          <input
                            value={kuponKodu}
                            onChange={e => setKuponKodu(e.target.value.toUpperCase())}
                            placeholder="Kupon kodunu girin"
                            className="w-full bg-zinc-700 border border-zinc-600 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm focus:border-yellow-500 focus:outline-none font-mono"
                          />
                        </div>
                        <button
                          onClick={kuponUygula}
                          className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-sm transition"
                        >
                          Uygula
                        </button>
                      </div>
                    ) : (
                      <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-2 p-3 bg-green-900/30 border border-green-700/50 rounded-xl"
                      >
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        <span className="text-green-400 text-sm font-bold flex-1">
                          Kupon uygulandı! -{kuponIndirim.toFixed(0)}₺
                        </span>
                        <button
                          onClick={() => { setKuponUygulandiMi(false); setKuponIndirim(0); setKuponKodu('') }}
                          className="text-zinc-500 hover:text-zinc-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    )}

                    {carkAktif && !kazanilanOdul && (
                      <button
                        onClick={() => { setSepetAcik(false); setCarkGoster(true) }}
                        className="w-full mt-2 py-2 text-xs text-purple-400 hover:text-purple-300 flex items-center justify-center gap-1.5 transition"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        Çark çevir, indirim kazan!
                      </button>
                    )}
                  </div>
                )}

                {/* Ödeme Yöntemi */}
                <div>
                  <Label className="text-zinc-200 mb-2 block text-sm">Ödeme Yöntemi</Label>
                  <select
                    value={odemeYontemi}
                    onChange={(e) => setOdemeYontemi(e.target.value)}
                    className="w-full bg-zinc-700 border-zinc-600 rounded-xl p-2.5 text-white text-sm"
                  >
                    <option value="nakit">Nakit</option>
                    <option value="kart">Kredi/Banka Kartı</option>
                    <option value="veresiye">Veresiye</option>
                  </select>
                </div>

                {/* Toplam */}
                <div className="space-y-1">
                  {kuponUygulandiMi && (
                    <div className="flex justify-between text-sm text-zinc-400">
                      <span>Ara Toplam:</span>
                      <span>{toplamHam.toFixed(0)}₺</span>
                    </div>
                  )}
                  {kuponUygulandiMi && (
                    <div className="flex justify-between text-sm text-green-400">
                      <span>İndirim:</span>
                      <span>-{kuponIndirim.toFixed(0)}₺</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black">
                    <span>Toplam:</span>
                    <span style={{ color: temaRenk }}>{toplamTutar.toFixed(0)}₺</span>
                  </div>
                </div>

                <Button
                  onClick={siparisVer}
                  disabled={siparisGonderiliyor || !masa}
                  style={{ backgroundColor: temaRenk }}
                  className="w-full text-white hover:opacity-80 font-bold py-6 text-lg disabled:bg-zinc-600 rounded-xl"
                >
                  {siparisGonderiliyor ? 'Gönderiliyor...' : !masa ? 'Masa Seçilmedi' : 'Siparişi Onayla'}
                </Button>
                {!masa && (
                  <p className="text-xs text-red-400 text-center">
                    QR kodu masadan okutun veya yukarıdan seçin
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Çark Çevirme Modal */}
      <AnimatePresence>
        {carkGoster && restoran && (
          <CarkCevir
            restoranId={restoran.id}
            masaId={masa?.id}
            onKapat={() => setCarkGoster(false)}
            onOdulKazanildi={(odul) => {
              setKazanilanOdul(odul)
              if (odul.kupon_kodu) {
                setKuponKodu(odul.kupon_kodu)
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

export default function MenuPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500" />
      </div>
    }>
      <MenuPageInner />
    </Suspense>
  )
}
