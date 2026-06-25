'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Bell, Check, Clock, Truck, Volume2, VolumeX, Printer, Trash2 } from 'lucide-react'

type Siparis = {
  id: string
  masa_ad: string
  durum: 'hazirlaniyor' | 'hazir' | 'tamamlandi' | 'iptal'
  not: string | null
  toplam_tutar: number
  created_at: string
  siparis_urunleri: {
    id: string
    adet: number
    birim_fiyat: number
    urunler: { ad: string; fiyat: number }
  }[]
}

export default function SiparislerPage() {
  const [siparisler, setSiparisler] = useState<Siparis[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [sesAcik, setSesAcik] = useState(true)
  const router = useRouter()
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!restoran) return

    // Realtime: Yeni sipariş + güncelleme
    const channel = supabase
      .channel('siparisler-realtime')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'siparisler',
          filter: `restoran_id=eq.${restoran.id}`
        },
        (payload) => {
          if (sesAcik) audioRef.current?.play().catch(() => {})
          toast.success('Yeni sipariş!', {
            description: `Masa: ${payload.new.masa_ad}`,
            duration: 5000
          })
          getSiparisler(restoran.id)
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'siparisler',
          filter: `restoran_id=eq.${restoran.id}`
        },
        () => getSiparisler(restoran.id)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restoran, sesAcik])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar')
      .select('*')
      .eq('sahibi_id', user.id)
      .single()

    if (!restoranData) {
      toast.error('Restoran bulunamadı')
      router.push('/ayarlar')
      return
    }

    setRestoran(restoranData)
    await getSiparisler(restoranData.id)
    setYukleniyor(false)
  }

  async function getSiparisler(restoranId: string) {
    const { data } = await supabase
      .from('siparisler')
      .select(`
        *,
        siparis_urunleri (
          id,
          adet,
          birim_fiyat,
          urunler (ad, fiyat)
        )
      `)
      .eq('restoran_id', restoranId)
      .neq('durum', 'iptal')
      .order('created_at', { ascending: false })

    setSiparisler(data || [])
  }

  async function durumGuncelle(siparisId: string, yeniDurum: string) {
    const { error } = await supabase
      .from('siparisler')
      .update({ durum: yeniDurum })
      .eq('id', siparisId)

    if (error) {
      toast.error('Güncellenemedi')
      return
    }

    if (yeniDurum === 'tamamlandi') {
      toast.success('Sipariş teslim edildi')
    } else if (yeniDurum === 'hazir') {
      toast.success('Sipariş hazırlandı')
    }
  }

  async function siparisSil(siparisId: string) {
    if (!confirm('Siparişi iptal etmek istediğine emin misin?')) return
    
    const { error } = await supabase
      .from('siparisler')
      .update({ durum: 'iptal' })
      .eq('id', siparisId)

    if (error) toast.error('Silinemedi')
    else toast.success('Sipariş iptal edildi')
  }

  function yazdir(siparis: Siparis) {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const urunlerHTML = siparis.siparis_urunleri.map(item => `
      <tr>
        <td>${item.adet}x ${item.urunler.ad}</td>
        <td style="text-align:right">${item.adet * item.birim_fiyat}₺</td>
      </tr>
    `).join('')

    printWindow.document.write(`
      <html>
        <head>
          <title>Adisyon - ${siparis.masa_ad}</title>
          <style>
            body { font-family: monospace; padding: 20px; width: 300px; }
            h1 { text-align: center; font-size: 20px; margin-bottom: 10px; }
            .info { text-align: center; margin-bottom: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            td { padding: 5px 0; border-bottom: 1px dashed #ccc; }
            .total { font-size: 18px; font-weight: bold; margin-top: 10px; }
            .not { margin-top: 10px; padding: 10px; border: 1px solid #000; }
          </style>
        </head>
        <body>
          <h1>${restoran?.ad}</h1>
          <div class="info">
            <div>${siparis.masa_ad}</div>
            <div>${new Date(siparis.created_at).toLocaleString('tr-TR')}</div>
          </div>
          <table>${urunlerHTML}</table>
          <div class="total">TOPLAM: ${siparis.toplam_tutar}₺</div>
          ${siparis.not ? `<div class="not"><b>Not:</b> ${siparis.not}</div>` : ''}
          <div style="text-align:center; margin-top:20px;">Afiyet olsun!</div>
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  if (yukleniyor) {
    return <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
      <Clock className="w-8 h-8 animate-spin mr-2" />
      Yükleniyor...
    </div>
  }

  const hazirlaniyor = siparisler.filter(s => s.durum === 'hazirlaniyor')
  const hazir = siparisler.filter(s => s.durum === 'hazir')
  const tamamlandi = siparisler.filter(s => s.durum === 'tamamlandi')

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <audio ref={audioRef} src="/notification.mp3" preload="auto" />
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{restoran?.ad} - Siparişler</h1>
        <Button
          onClick={() => setSesAcik(!sesAcik)}
          variant={sesAcik ? 'default' : 'outline'}
          className={sesAcik ? 'bg-green-600 hover:bg-green-700' : ''}
        >
          {sesAcik ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
          Ses {sesAcik ? 'Açık' : 'Kapalı'}
        </Button>
      </div>

      <Tabs defaultValue="hazirlaniyor" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
          <TabsTrigger value="hazirlaniyor" className="data-[state=active]:bg-orange-600">
            <Clock className="w-4 h-4 mr-2" />
            Hazırlanıyor ({hazirlaniyor.length})
          </TabsTrigger>
          <TabsTrigger value="hazir" className="data-[state=active]:bg-green-600">
            <Bell className="w-4 h-4 mr-2" />
            Hazır ({hazir.length})
          </TabsTrigger>
          <TabsTrigger value="tamamlandi" className="data-[state=active]:bg-blue-600">
            <Check className="w-4 h-4 mr-2" />
            Teslim ({tamamlandi.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hazirlaniyor" className="mt-6">
          <SiparisGrid siparisler={hazirlaniyor} onDurumGuncelle={durumGuncelle} onSil={siparisSil} onYazdir={yazdir} />
        </TabsContent>

        <TabsContent value="hazir" className="mt-6">
          <SiparisGrid siparisler={hazir} onDurumGuncelle={durumGuncelle} onSil={siparisSil} onYazdir={yazdir} />
        </TabsContent>

        <TabsContent value="tamamlandi" className="mt-6">
          <SiparisGrid siparisler={tamamlandi} onDurumGuncelle={durumGuncelle} onSil={siparisSil} onYazdir={yazdir} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SiparisGrid({ siparisler, onDurumGuncelle, onSil, onYazdir }: any) {
  if (siparisler.length === 0) {
    return (
      <Card className="p-12 bg-zinc-800 border-zinc-700 text-center text-zinc-400">
        Bu durumda sipariş yok
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {siparisler.map((siparis: Siparis) => (
        <SiparisCard 
          key={siparis.id} 
          siparis={siparis} 
          onDurumGuncelle={onDurumGuncelle}
          onSil={onSil}
          onYazdir={onYazdir}
        />
      ))}
    </div>
  )
}

function SiparisCard({ siparis, onDurumGuncelle, onSil, onYazdir }: any) {
  // Sipariş süresi hesapla
  const gecenDakika = Math.floor((Date.now() - new Date(siparis.created_at).getTime()) / 60000)
  
  const zaman = new Date(siparis.created_at).toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  const renkMap = {
    hazirlaniyor: 'border-orange-700 bg-orange-950/30',
    hazir: 'border-green-700 bg-green-950/30',
    tamamlandi: 'border-blue-700 bg-blue-950/30'
  }

  return (
    <Card className={`p-4 border-2 ${renkMap[siparis.durum as keyof typeof renkMap]}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-xl font-bold">{siparis.masa_ad}</h3>
          <p className="text-sm text-zinc-400">
            {zaman} 
            <Badge className="ml-2 bg-zinc-700 text-zinc-300 text-xs">
              {gecenDakika} dk
            </Badge>
          </p>
        </div>
        <Badge className="bg-yellow-500 text-black text-lg px-3">
          {siparis.toplam_tutar}₺
        </Badge>
      </div>

      <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
        {siparis.siparis_urunleri.map((item: any) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-zinc-200">{item.adet}x {item.urunler.ad}</span>
            <span className="text-zinc-400">{item.adet * item.birim_fiyat}₺</span>
          </div>
        ))}
      </div>

      {siparis.not && (
        <p className="text-sm bg-zinc-800 p-2 rounded mb-3 border border-zinc-700">
          <b className="text-yellow-500">Not:</b> {siparis.not}
        </p>
      )}

      <div className="flex gap-2">
        {siparis.durum === 'hazirlaniyor' && (
          <Button 
            onClick={() => onDurumGuncelle(siparis.id, 'hazir')}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-2" />
            Hazır
          </Button>
        )}
        {siparis.durum === 'hazir' && (
          <Button 
            onClick={() => onDurumGuncelle(siparis.id, 'tamamlandi')}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Truck className="w-4 h-4 mr-2" />
            Teslim Et
          </Button>
        )}
        <Button 
          onClick={() => onYazdir(siparis)}
          variant="outline" 
          size="icon"
          className="border-zinc-600"
        >
          <Printer className="w-4 h-4" />
        </Button>
        <Button 
          onClick={() => onSil(siparis.id)}
          variant="destructive" 
          size="icon"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  )
}
