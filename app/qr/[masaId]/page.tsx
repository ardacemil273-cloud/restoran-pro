'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShoppingCart, Plus, Minus, Send, Home, Menu, Filter, Search,
  X, Check, AlertCircle
} from 'lucide-react'

type Urun = {
  id: string
  ad: string
  fiyat: number
  kategori_id: string
  aciklama?: string
}

type Kategori = {
  id: string
  ad: string
}

type SepetItem = {
  urun_id: string
  urun_ad: string
  fiyat: number
  adet: number
}

export default function QRSiparisPage() {
  const [urunler, setUrunler] = useState<Urun[]>([])
  const [kategoriler, setKategoriler] = useState<Kategori[]>([])
  const [sepetiAc, setSepetiAc] = useState(false)
  const [sepet, setSepet] = useState<SepetItem[]>([])
  const [selectedKategori, setSelectedKategori] = useState<string | null>(null)
  const [aramaQuery, setAramaQuery] = useState('')
  const [yukleniyor, setYukleniyor] = useState(true)
  const [gonderiliyor, setGonderiliyor] = useState(false)
  const params = useParams()
  const router = useRouter()
  const masaId = params.masaId as string

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: restoranData } = await supabase
      .from('masalar').select('restoran_id').eq('id', masaId).single()
    if (!restoranData) { toast.error('Masa bulunamadı'); return }

    const { data: kategorilerData } = await supabase
      .from('kategoriler')
      .select('*')
      .eq('restoran_id', restoranData.restoran_id)
      .order('sira', { ascending: true })
    if (kategorilerData) {
      setKategoriler(kategorilerData)
      if (kategorilerData.length > 0) setSelectedKategori(kategorilerData[0].id)
    }

    const { data: urunlerData } = await supabase
      .from('urunler')
      .select('*')
      .eq('restoran_id', restoranData.restoran_id)
      .order('sira', { ascending: true })
    if (urunlerData) setUrunler(urunlerData)

    setYukleniyor(false)
  }

  function addToCart(urun: Urun) {
    setSepet(prev => {
      const existing = prev.find(item => item.urun_id === urun.id)
      if (existing) {
        return prev.map(item =>
          item.urun_id === urun.id ? { ...item, adet: item.adet + 1 } : item
        )
      }
      return [...prev, { urun_id: urun.id, urun_ad: urun.ad, fiyat: urun.fiyat, adet: 1 }]
    })
    toast.success(`${urun.ad} sepete eklendi`)
  }

  function removeFromCart(urunId: string) {
    setSepet(prev => prev.filter(item => item.urun_id !== urunId))
  }

  function updateQuantity(urunId: string, adet: number) {
    if (adet <= 0) {
      removeFromCart(urunId)
      return
    }
    setSepet(prev =>
      prev.map(item => item.urun_id === urunId ? { ...item, adet } : item)
    )
  }

  async function gonderSiparis() {
    if (sepet.length === 0) { toast.error('Sepet boş'); return }
    setGonderiliyor(true)

    try {
      const { data: restoranData } = await supabase
        .from('masalar').select('restoran_id').eq('id', masaId).single()
      if (!restoranData) { toast.error('Masa bulunamadı'); return }

      const toplam = sepet.reduce((sum, item) => sum + (item.fiyat * item.adet), 0)

      const { error } = await supabase.from('siparisler').insert({
        restoran_id: restoranData.restoran_id,
        masa_id: masaId,
        masa_ad: 'QR Sipariş',
        durum: 'hazirlaniyor',
        toplam_tutar: toplam,
        siparis_urunleri: sepet.map(item => ({
          urun_id: item.urun_id,
          adet: item.adet,
          birim_fiyat: item.fiyat
        }))
      })

      if (error) throw error

      toast.success('✅ Siparişiniz alındı!')
      setSepet([])
      setSepetiAc(false)
      setTimeout(() => router.push('/'), 2000)
    } catch (err) {
      toast.error('Sipariş gönderilemedi')
    } finally {
      setGonderiliyor(false)
    }
  }

  const filteredUrunler = urunler.filter(u => {
    const matchKategori = !selectedKategori || u.kategori_id === selectedKategori
    const matchArama = u.ad.toLowerCase().includes(aramaQuery.toLowerCase())
    return matchKategori && matchArama
  })

  const toplamTutar = sepet.reduce((sum, item) => sum + (item.fiyat * item.adet), 0)

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <ShoppingCart className="w-16 h-16 text-yellow-600" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 pb-32">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white p-6 sticky top-0 z-30 shadow-lg"
      >
        <h1 className="text-3xl font-black flex items-center gap-2">
          <Menu className="w-8 h-8" />
          Menü
        </h1>
        <p className="text-yellow-100 text-sm mt-1">Siparişinizi seçin</p>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="p-4 bg-white border-b sticky top-16 z-20"
      >
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
          <Search className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            placeholder="Ürün ara..."
            value={aramaQuery}
            onChange={(e) => setAramaQuery(e.target.value)}
            className="bg-transparent flex-1 outline-none text-gray-800"
          />
        </div>
      </motion.div>

      {/* Kategoriler */}
      <motion.div
        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
        className="p-4 bg-white border-b sticky top-28 z-20 overflow-x-auto"
      >
        <div className="flex gap-2">
          {kategoriler.map(kat => (
            <button
              key={kat.id}
              onClick={() => setSelectedKategori(kat.id)}
              className={`px-4 py-2 rounded-full font-bold whitespace-nowrap transition-all ${
                selectedKategori === kat.id
                  ? 'bg-yellow-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {kat.ad}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Ürünler */}
      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {filteredUrunler.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="col-span-full text-center py-12 text-gray-500"
            >
              <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Ürün bulunamadı</p>
            </motion.div>
          ) : (
            filteredUrunler.map((urun, idx) => (
              <motion.div
                key={urun.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Card className="p-4 bg-white border-2 border-gray-200 hover:border-yellow-400 transition-all cursor-pointer hover:shadow-lg"
                  onClick={() => addToCart(urun)}
                >
                  <div className="mb-3">
                    <h3 className="font-bold text-gray-900 text-sm">{urun.ad}</h3>
                    {urun.aciklama && <p className="text-xs text-gray-600 mt-1">{urun.aciklama}</p>}
                  </div>
                  <p className="text-2xl font-black text-yellow-600">{urun.fiyat.toFixed(2)}₺</p>
                  <Button
                    onClick={(e) => { e.stopPropagation(); addToCart(urun) }}
                    className="w-full mt-3 bg-yellow-600 hover:bg-yellow-700 text-white font-bold"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Ekle
                  </Button>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Sepet Butonu */}
      <motion.button
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        onClick={() => setSepetiAc(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-full p-6 shadow-2xl hover:shadow-3xl transition-all"
      >
        <ShoppingCart className="w-8 h-8" />
        {sepet.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-black w-8 h-8 rounded-full flex items-center justify-center">
            {sepet.length}
          </span>
        )}
      </motion.button>

      {/* Sepet Modal */}
      <AnimatePresence>
        {sepetiAc && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setSepetiAc(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-50 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-gray-900">Sepetim</h2>
                <button onClick={() => setSepetiAc(false)} className="text-gray-500 hover:text-gray-900">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {sepet.length === 0 ? (
                <p className="text-center text-gray-500 py-8">Sepet boş</p>
              ) : (
                <>
                  <div className="space-y-3 mb-6">
                    {sepet.map(item => (
                      <motion.div
                        key={item.urun_id}
                        layout
                        className="flex items-center justify-between p-4 bg-gray-100 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{item.urun_ad}</p>
                          <p className="text-sm text-gray-600">{item.fiyat.toFixed(2)}₺</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => updateQuantity(item.urun_id, item.adet - 1)}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="font-bold text-gray-900 w-8 text-center">{item.adet}</span>
                          <Button
                            onClick={() => updateQuantity(item.urun_id, item.adet + 1)}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Button
                            onClick={() => removeFromCart(item.urun_id)}
                            size="sm"
                            variant="destructive"
                            className="ml-2"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="border-t pt-4 mb-6">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-lg font-bold text-gray-900">Toplam:</span>
                      <span className="text-3xl font-black text-yellow-600">{toplamTutar.toFixed(2)}₺</span>
                    </div>
                  </div>

                  <Button
                    onClick={gonderSiparis}
                    disabled={gonderiliyor}
                    className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-black text-lg py-6 rounded-xl"
                  >
                    {gonderiliyor ? (
                      <>Gönderiliyor...</>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Siparişi Gönder
                      </>
                    )}
                  </Button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
