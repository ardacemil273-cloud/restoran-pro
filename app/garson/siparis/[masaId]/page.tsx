'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useParams, useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ArrowLeft, Plus, Minus, Trash2, Send, ChefHat,
  StickyNote, ShoppingCart, Check
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type SepetItem = {
  id: string
  ad: string
  fiyat: number
  adet: number
  not?: string
}

export default function GarsonSiparisPage() {
  const params = useParams()
  const router = useRouter()
  const masaId = params.masaId as string

  const [masa, setMasa] = useState<any>(null)
  const [kategoriler, setKategoriler] = useState<any[]>([])
  const [urunler, setUrunler] = useState<any[]>([])
  const [sepet, setSepet] = useState<SepetItem[]>([])
  const [aktifKategori, setAktifKategori] = useState('')
  const [siparisDurum, setSiparisDurum] = useState<'bos' | 'aktif'>('bos')
  const [aktifSiparisId, setAktifSiparisId] = useState<string | null>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [gonderiyor, setGonderiyor] = useState(false)
  const [sepetAcik, setSepetAcik] = useState(false)
  const [siparisNot, setSiparisNot] = useState('')
  const [notModal, setNotModal] = useState(false)

  useEffect(() => {
    if (masaId) loadData()
  }, [masaId])

  const loadData = async () => {
    setYukleniyor(true)

    const { data: masaData } = await supabase
      .from('masalar')
      .select('*, restoranlar(*)')
      .eq('id', masaId)
      .single()

    if (!masaData) {
      toast.error('Masa bulunamadı')
      return router.push('/garson')
    }

    setMasa(masaData)

    // Aktif sipariş var mı?
    const { data: aktifSiparis } = await supabase
      .from('siparisler')
      .select('id, durum')
      .eq('masa_id', masaId)
      .in('durum', ['hazirlaniyor', 'hazir'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (aktifSiparis) {
      setSiparisDurum('aktif')
      setAktifSiparisId(aktifSiparis.id)
    }

    // Kategoriler
    const { data: katData } = await supabase
      .from('kategoriler')
      .select('*')
      .eq('restoran_id', masaData.restoran_id)
      .order('sira', { ascending: true })

    setKategoriler(katData || [])
    if (katData && katData.length > 0) setAktifKategori(katData[0].id)

    // Ürünler
    const { data: urunData } = await supabase
      .from('urunler')
      .select('*')
      .eq('restoran_id', masaData.restoran_id)
      .eq('aktif', true)
      .order('ad')

    setUrunler(urunData || [])
    setYukleniyor(false)
  }

  const sepeteEkle = (urun: any) => {
    setSepet(prev => {
      const mevcut = prev.find(s => s.id === urun.id)
      if (mevcut) {
        return prev.map(s => s.id === urun.id ? { ...s, adet: s.adet + 1 } : s)
      }
      return [...prev, { id: urun.id, ad: urun.ad, fiyat: urun.fiyat, adet: 1 }]
    })
    // Kısa titreşim geri bildirimi (mobil)
    if (navigator.vibrate) navigator.vibrate(30)
  }

  const adetDegistir = (id: string, delta: number) => {
    setSepet(prev => {
      const yeni = prev.map(s => s.id === id ? { ...s, adet: s.adet + delta } : s)
      return yeni.filter(s => s.adet > 0)
    })
  }

  const siparisGonder = async () => {
    if (sepet.length === 0) return toast.error('Sepet boş')
    setGonderiyor(true)

    try {
      const toplam = sepet.reduce((t, u) => t + u.fiyat * u.adet, 0)

      let siparisId = aktifSiparisId

      if (!siparisId) {
        // Yeni sipariş oluştur
        const { data: yeniSiparis, error: siparisError } = await supabase
          .from('siparisler')
          .insert({
            masa_id: masaId,
            masa_ad: masa.ad,
            restoran_id: masa.restoran_id,
            toplam_tutar: toplam,
            durum: 'hazirlaniyor',
            not: siparisNot || null,
            garson_id: null // garson_id sonra eklenebilir
          })
          .select()
          .single()

        if (siparisError) throw siparisError
        siparisId = yeniSiparis.id
        setAktifSiparisId(siparisId)
        setSiparisDurum('aktif')
      } else {
        // Mevcut siparişe ürün ekle - toplam güncelle
        const { data: mevcutUrunler } = await supabase
          .from('siparis_urunleri')
          .select('birim_fiyat, adet')
          .eq('siparis_id', siparisId)

        const eskiToplam = mevcutUrunler?.reduce((t, u) => t + u.birim_fiyat * u.adet, 0) || 0

        await supabase
          .from('siparisler')
          .update({ toplam_tutar: eskiToplam + toplam })
          .eq('id', siparisId)
      }

      // Sipariş ürünlerini ekle
      const siparisUrunleri = sepet.map(u => ({
        siparis_id: siparisId,
        urun_id: u.id,
        urun_adi: u.ad,
        adet: u.adet,
        birim_fiyat: u.fiyat,
        not: u.not || null
      }))

      const { error: urunError } = await supabase
        .from('siparis_urunleri')
        .insert(siparisUrunleri)

      if (urunError) throw urunError

      // Masayı dolu yap
      await supabase.from('masalar').update({ durum: 'dolu' }).eq('id', masaId)

      // Mutfak bildirimi (mutfak_siparisler tablosuna yaz)
      await supabase.from('mutfak_siparisler').insert({
        siparis_id: siparisId,
        restoran_id: masa.restoran_id,
        masa_ad: masa.ad,
        urunler: sepet.map(u => ({ ad: u.ad, adet: u.adet, not: u.not })),
        durum: 'bekliyor',
        siparis_notu: siparisNot || null
      })

      toast.success('Sipariş mutfağa gönderildi!', {
        description: `${masa.ad} - ${sepet.length} kalem`,
        duration: 3000
      })

      setSepet([])
      setSiparisNot('')
      setSepetAcik(false)

      // Başarı animasyonu için kısa bekle
      setTimeout(() => router.push('/garson'), 1500)

    } catch (err: any) {
      toast.error('Hata: ' + err.message)
    }

    setGonderiyor(false)
  }

  const toplam = sepet.reduce((t, u) => t + u.fiyat * u.adet, 0)
  const toplamAdet = sepet.reduce((t, u) => t + u.adet, 0)

  const aktifUrunler = urunler.filter(u => u.kategori_id === aktifKategori)

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-white text-center">
          <ChefHat className="w-10 h-10 mx-auto mb-2 text-yellow-500 animate-pulse" />
          <p>Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex flex-col">
      {/* Header */}
      <div className="bg-zinc-800 border-b border-zinc-700 px-4 py-3 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/garson')} className="text-zinc-400 hover:text-white">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-lg">{masa?.ad}</h1>
            <p className="text-xs text-zinc-400">
              {siparisDurum === 'aktif' ? (
                <span className="text-orange-400">Aktif sipariş var — ürün ekleyebilirsin</span>
              ) : 'Yeni sipariş'}
            </p>
          </div>
          {sepet.length > 0 && (
            <button
              onClick={() => setSepetAcik(!sepetAcik)}
              className="relative bg-yellow-500 text-black rounded-full w-10 h-10 flex items-center justify-center font-bold"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {toplamAdet}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Kategori Seçici */}
      <div className="bg-zinc-800/50 border-b border-zinc-700 px-4 py-2 overflow-x-auto flex gap-2 sticky top-[61px] z-10">
        {kategoriler.map(kat => (
          <button
            key={kat.id}
            onClick={() => setAktifKategori(kat.id)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              aktifKategori === kat.id
                ? 'bg-yellow-500 text-black'
                : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
            }`}
          >
            {kat.ad}
          </button>
        ))}
      </div>

      {/* Ürün Grid */}
      <div className="flex-1 p-4 pb-32">
        {aktifUrunler.length === 0 ? (
          <div className="text-center py-12 text-zinc-500">
            <p>Bu kategoride ürün yok</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {aktifUrunler.map(urun => {
              const sepetteki = sepet.find(s => s.id === urun.id)
              return (
                <button
                  key={urun.id}
                  onClick={() => sepeteEkle(urun)}
                  className={`relative p-4 rounded-xl text-left transition-all active:scale-95 border-2 ${
                    sepetteki
                      ? 'bg-yellow-500/20 border-yellow-500'
                      : 'bg-zinc-800 border-zinc-700 hover:border-zinc-500'
                  }`}
                >
                  {sepetteki && (
                    <span className="absolute top-2 right-2 bg-yellow-500 text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                      {sepetteki.adet}
                    </span>
                  )}
                  <p className="font-semibold text-sm mb-1 pr-6">{urun.ad}</p>
                  <p className="text-yellow-400 font-bold">{urun.fiyat}₺</p>
                  {urun.aciklama && (
                    <p className="text-xs text-zinc-500 mt-1 truncate">{urun.aciklama}</p>
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Sepet Paneli */}
      {sepet.length > 0 && (
        <div className={`fixed bottom-0 left-0 right-0 bg-zinc-800 border-t border-zinc-700 transition-all z-30 ${
          sepetAcik ? 'max-h-[70vh]' : 'max-h-24'
        }`}>
          {/* Sepet Başlık - her zaman görünür */}
          <div
            className="flex items-center justify-between px-4 py-3 cursor-pointer"
            onClick={() => setSepetAcik(!sepetAcik)}
          >
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-yellow-500" />
              <span className="font-bold">{toplamAdet} ürün</span>
              <span className="text-zinc-400 text-sm">· {toplam}₺</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500">{sepetAcik ? '▼' : '▲'}</span>
            </div>
          </div>

          {/* Sepet İçeriği */}
          {sepetAcik && (
            <div className="px-4 pb-4 overflow-y-auto max-h-[calc(70vh-120px)]">
              <div className="space-y-2 mb-4">
                {sepet.map(item => (
                  <div key={item.id} className="flex items-center justify-between py-2 border-b border-zinc-700">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.ad}</p>
                      <p className="text-xs text-yellow-400">{item.fiyat}₺ x {item.adet} = {item.fiyat * item.adet}₺</p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <button
                        onClick={() => adetDegistir(item.id, -1)}
                        className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center hover:bg-zinc-600"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center font-bold">{item.adet}</span>
                      <button
                        onClick={() => adetDegistir(item.id, 1)}
                        className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center hover:bg-zinc-600"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setSepet(prev => prev.filter(s => s.id !== item.id))}
                        className="w-7 h-7 rounded-full bg-red-900/50 flex items-center justify-center hover:bg-red-900"
                      >
                        <Trash2 className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Not alanı */}
              <div className="mb-4">
                <textarea
                  placeholder="Sipariş notu (isteğe bağlı)..."
                  value={siparisNot}
                  onChange={e => setSiparisNot(e.target.value)}
                  className="w-full bg-zinc-700 border border-zinc-600 rounded-lg p-3 text-sm text-white placeholder-zinc-500 resize-none h-16"
                />
              </div>

              <Button
                onClick={siparisGonder}
                disabled={gonderiyor}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-base"
              >
                {gonderiyor ? (
                  <span className="flex items-center gap-2">
                    <Check className="w-5 h-5 animate-bounce" />
                    Gönderiliyor...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Mutfağa Gönder — {toplam}₺
                  </span>
                )}
              </Button>
            </div>
          )}

          {/* Kapalı haldeyken hızlı gönder butonu */}
          {!sepetAcik && (
            <div className="px-4 pb-3">
              <Button
                onClick={siparisGonder}
                disabled={gonderiyor}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-10"
              >
                <Send className="w-4 h-4 mr-2" />
                Mutfağa Gönder — {toplam}₺
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
