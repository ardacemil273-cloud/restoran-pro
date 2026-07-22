'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  ChefHat, Clock, Check, Printer, Bell, BellOff,
  RefreshCw, ArrowLeft, Flame, CheckCircle2, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

type MutfakSiparis = {
  id: string
  siparis_id: string
  masa_ad: string
  urunler: any[] | string // JSONB veya JSON string
  durum: 'bekliyor' | 'hazirlaniyor' | 'hazir'
  siparis_notu: string | null
  created_at: string
  restoran_id: string
}

const DURUM_RENK = {
  bekliyor: 'border-red-600 bg-red-950/40',
  hazirlaniyor: 'border-orange-500 bg-orange-950/40',
  hazir: 'border-green-600 bg-green-950/30'
}

const DURUM_BADGE = {
  bekliyor: 'bg-red-700 text-red-100',
  hazirlaniyor: 'bg-orange-600 text-orange-100',
  hazir: 'bg-green-700 text-green-100'
}

const DURUM_METIN = {
  bekliyor: 'Bekliyor',
  hazirlaniyor: 'Hazırlanıyor',
  hazir: 'Hazır'
}

export default function MutfakPage() {
  const [siparisler, setSiparisler] = useState<MutfakSiparis[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [sesAcik, setSesAcik] = useState(true)
  const [filtre, setFiltre] = useState<'hepsi' | 'bekliyor' | 'hazirlaniyor' | 'hazir'>('hepsi')
  const audioCtxRef = useRef<AudioContext | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!restoran) return

    const channel = supabase
      .channel('mutfak-siparisler-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mutfak_siparisler',
        filter: `restoran_id=eq.${restoran.id}`
      }, (payload) => {
        if (sesAcik) playBeep()
        toast.success('Yeni sipariş geldi!', {
          description: `Masa: ${payload.new.masa_ad}`,
          duration: 6000,
          icon: '🔔'
        })
        getSiparisler(restoran.id)
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'mutfak_siparisler',
        filter: `restoran_id=eq.${restoran.id}`
      }, () => {
        getSiparisler(restoran.id)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [restoran, sesAcik])

  const playBeep = () => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext()
      }
      const ctx = audioCtxRef.current
      const oscillator = ctx.createOscillator()
      const gainNode = ctx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(ctx.destination)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, ctx.currentTime)
      oscillator.frequency.setValueAtTime(660, ctx.currentTime + 0.1)
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.4)
    } catch {}
  }

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/garson/giris')

    const { data: garsonData } = await supabase
      .from('garsonlar')
      .select('restoran_id, restoranlar(*)')
      .eq('kullanici_id', user.id)
      .single()

    let restoranId: string

    if (!garsonData) {
      const { data: restoranData } = await supabase
        .from('restoranlar')
        .select('*')
        .eq('sahibi_id', user.id)
        .single()

      if (!restoranData) return router.push('/garson/giris')
      setRestoran(restoranData)
      restoranId = restoranData.id
    } else {
      setRestoran((garsonData as any).restoranlar)
      restoranId = garsonData.restoran_id
    }

    await getSiparisler(restoranId)
    setYukleniyor(false)
  }

  const getSiparisler = async (restoranId: string) => {
    const { data } = await supabase
      .from('mutfak_siparisler')
      .select('*')
      .eq('restoran_id', restoranId)
      .in('durum', ['bekliyor', 'hazirlaniyor', 'hazir'])
      .order('created_at', { ascending: true })

    setSiparisler(data || [])
  }

  const durumGuncelle = async (id: string, yeniDurum: MutfakSiparis['durum']) => {
    await supabase
      .from('mutfak_siparisler')
      .update({ durum: yeniDurum })
      .eq('id', id)

    // Ana sipariş tablosunu da güncelle
    const siparis = siparisler.find(s => s.id === id)
    if (siparis) {
      await supabase
        .from('siparisler')
        .update({ durum: yeniDurum === 'hazir' ? 'hazir' : 'hazirlaniyor' })
        .eq('id', siparis.siparis_id)
    }

    if (yeniDurum === 'hazir') {
      toast.success('Sipariş hazır! Garson bilgilendirildi.')
      if (sesAcik) playBeep()
    }
  }

  const siparisiBitir = async (id: string) => {
    await supabase
      .from('mutfak_siparisler')
      .update({ durum: 'tamamlandi' as any })
      .eq('id', id)

    const siparis = siparisler.find(s => s.id === id)
    if (siparis) {
      await supabase
        .from('siparisler')
        .update({ durum: 'tamamlandi' })
        .eq('id', siparis.siparis_id)
    }

    setSiparisler(prev => prev.filter(s => s.id !== id))
    toast.success('Sipariş tamamlandı')
  }

  const mutfakFisiYazdir = (siparis: MutfakSiparis) => {
      const urunler = Array.isArray(siparis.urunler) ? siparis.urunler : JSON.parse(siparis.urunler || '[]')
      const fisIcerigi = `
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: 'Courier New', monospace; font-size: 16px; padding: 10px; max-width: 300px; }
          h1 { font-size: 22px; font-weight: bold; text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px; }
          .masa { font-size: 28px; font-weight: bold; text-align: center; margin: 10px 0; }
          .zaman { text-align: center; font-size: 13px; color: #555; margin-bottom: 10px; }
          .urun { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px dashed #ccc; font-size: 15px; }
          .adet { font-weight: bold; font-size: 20px; min-width: 30px; }
          .not { background: #fff3cd; padding: 8px; border-radius: 4px; margin-top: 10px; font-size: 13px; }
          @media print { body { margin: 0; } }
        </style>
      </head>
      <body>
        <h1>MUTFAK FİŞİ</h1>
        <div class="masa">${siparis.masa_ad}</div>
        <div class="zaman">${new Date(siparis.created_at).toLocaleTimeString('tr-TR')}</div>
        ${urunler.map((u: any) => `
          <div class="urun">
            <span class="adet">${u.adet}x</span>
            <span>${u.ad}</span>
            ${u.not ? `<span style="color:red;font-size:12px">${u.not}</span>` : ''}
          </div>
        `).join('')}
        ${siparis.siparis_notu ? `<div class="not">⚠️ Not: ${siparis.siparis_notu}</div>` : ''}
      </body>
      </html>
    `
    const win = window.open('', '_blank', 'width=380,height=600')
    if (win) {
      win.document.write(fisIcerigi)
      win.document.close()
      win.focus()
      setTimeout(() => { win.print(); win.close() }, 500)
    }
  }

  const dakikaHesapla = (tarih: string) => {
    const fark = Math.floor((Date.now() - new Date(tarih).getTime()) / 60000)
    if (fark < 1) return 'Az önce'
    if (fark < 60) return `${fark} dk önce`
    return `${Math.floor(fark / 60)} sa önce`
  }

  const filtreliSiparisler = filtre === 'hepsi'
    ? siparisler
    : siparisler.filter(s => s.durum === filtre)

  const bekleyenSayisi = siparisler.filter(s => s.durum === 'bekliyor').length
  const hazirlananSayisi = siparisler.filter(s => s.durum === 'hazirlaniyor').length
  const hazirSayisi = siparisler.filter(s => s.durum === 'hazir').length

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-white text-center">
          <ChefHat className="w-12 h-12 mx-auto mb-3 text-orange-500 animate-pulse" />
          <p>Mutfak ekranı yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white">
      {/* Header */}
      <div className="bg-zinc-800 border-b border-zinc-700 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/garson')} className="text-zinc-400">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <ChefHat className="w-6 h-6 text-orange-500" />
            <div>
              <p className="font-bold">Mutfak Ekranı</p>
              <p className="text-xs text-zinc-400">{restoran?.ad}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSesAcik(!sesAcik)}
              className={`p-2 rounded-lg ${sesAcik ? 'bg-green-900/50 text-green-400' : 'bg-zinc-700 text-zinc-400'}`}
            >
              {sesAcik ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => restoran && getSiparisler(restoran.id)}
              className="p-2 rounded-lg bg-zinc-700 text-zinc-400"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sayaçlar */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => setFiltre('hepsi')}
            className={`text-xs px-3 py-1 rounded-full ${filtre === 'hepsi' ? 'bg-zinc-600 text-white' : 'bg-zinc-700/50 text-zinc-400'}`}
          >
            Tümü ({siparisler.length})
          </button>
          <button
            onClick={() => setFiltre('bekliyor')}
            className={`text-xs px-3 py-1 rounded-full ${filtre === 'bekliyor' ? 'bg-red-700 text-white' : 'bg-zinc-700/50 text-zinc-400'}`}
          >
            🔴 Bekliyor ({bekleyenSayisi})
          </button>
          <button
            onClick={() => setFiltre('hazirlaniyor')}
            className={`text-xs px-3 py-1 rounded-full ${filtre === 'hazirlaniyor' ? 'bg-orange-600 text-white' : 'bg-zinc-700/50 text-zinc-400'}`}
          >
            🟠 Hazırlanıyor ({hazirlananSayisi})
          </button>
          <button
            onClick={() => setFiltre('hazir')}
            className={`text-xs px-3 py-1 rounded-full ${filtre === 'hazir' ? 'bg-green-700 text-white' : 'bg-zinc-700/50 text-zinc-400'}`}
          >
            🟢 Hazır ({hazirSayisi})
          </button>
        </div>
      </div>

      {/* Sipariş Kartları */}
      <div className="p-4">
        {filtreliSiparisler.length === 0 ? (
          <div className="text-center py-20">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4 opacity-50" />
            <p className="text-zinc-400 text-lg">
              {filtre === 'hepsi' ? 'Bekleyen sipariş yok 🎉' : `${DURUM_METIN[filtre as keyof typeof DURUM_METIN]} sipariş yok`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtreliSiparisler.map(siparis => {
              const urunler = Array.isArray(siparis.urunler) ? siparis.urunler : JSON.parse(typeof siparis.urunler === 'string' ? (siparis.urunler || '[]') : '[]')
              const dakika = Math.floor((Date.now() - new Date(siparis.created_at).getTime()) / 60000)
              const acil = dakika >= 10 && siparis.durum === 'bekliyor'

              return (
                <Card
                  key={siparis.id}
                  className={`p-4 border-2 ${DURUM_RENK[siparis.durum]} ${acil ? 'animate-pulse' : ''}`}
                >
                  {/* Kart Başlık */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl font-bold">{siparis.masa_ad}</h3>
                      <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {dakikaHesapla(siparis.created_at)}
                        {acil && <span className="text-red-400 font-bold ml-1">⚠️ ACİL</span>}
                      </div>
                    </div>
                    <Badge className={DURUM_BADGE[siparis.durum]}>
                      {DURUM_METIN[siparis.durum]}
                    </Badge>
                  </div>

                  {/* Ürün Listesi */}
                  <div className="space-y-1.5 mb-3">
                    {urunler.map((urun: any, i: number) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-2xl font-black text-yellow-400 min-w-[2rem]">{urun.adet}x</span>
                        <div>
                          <p className="font-semibold text-sm">{urun.ad}</p>
                          {urun.not && (
                            <p className="text-xs text-orange-400">⚠️ {urun.not}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Sipariş Notu */}
                  {siparis.siparis_notu && (
                    <div className="bg-yellow-900/30 border border-yellow-700 rounded p-2 mb-3 text-xs text-yellow-300">
                      📝 {siparis.siparis_notu}
                    </div>
                  )}

                  {/* Aksiyon Butonları */}
                  <div className="flex flex-col gap-2">
                    {siparis.durum === 'bekliyor' && (
                      <Button
                        onClick={() => durumGuncelle(siparis.id, 'hazirlaniyor')}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold"
                        size="sm"
                      >
                        <Flame className="w-4 h-4 mr-1" />
                        Hazırlamaya Başla
                      </Button>
                    )}

                    {siparis.durum === 'hazirlaniyor' && (
                      <Button
                        onClick={() => durumGuncelle(siparis.id, 'hazir')}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
                        size="sm"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Hazır!
                      </Button>
                    )}

                    {siparis.durum === 'hazir' && (
                      <Button
                        onClick={() => siparisiBitir(siparis.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold"
                        size="sm"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Teslim Edildi
                      </Button>
                    )}

                    <Button
                      onClick={() => mutfakFisiYazdir(siparis)}
                      variant="outline"
                      className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                      size="sm"
                    >
                      <Printer className="w-4 h-4 mr-1" />
                      Mutfak Fişi Yazdır
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
