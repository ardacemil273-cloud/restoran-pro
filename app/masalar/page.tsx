'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { PAKETLER, paketKontrol } from '@/lib/paketler'
import { QrCode, Receipt, Download, Plus, Trash2, GripVertical, Phone } from 'lucide-react'
import QRCode from 'qrcode'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function SortableMasa({ masa, masaClick, qrOlustur, masaSil, paketTuru }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: masa.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        className={`p-6 border-zinc-700 text-center transition ${
          masa.durum === 'dolu' || masa.aktifSiparisVar
    ? 'bg-red-900/30 border-red-700'
            : 'bg-zinc-800'
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="w-4 h-4 text-zinc-500" />
          </button>
          <Button
            onClick={() => masaSil(masa)}
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-red-500 hover:text-red-400 hover:bg-red-950"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        <h2 className="text-xl font-bold text-white mb-2">{masa.ad}</h2>
        <p className={`text-sm font-bold mb-1 ${
          masa.durum === 'dolu' || masa.aktifSiparisVar? 'text-red-400' : 'text-green-400'
        }`}>
          {masa.aktifSiparisVar? 'SİPARİŞ VAR' : masa.durum.toUpperCase()}
        </p>
        {masa.kapasite && (
          <p className="text-xs text-zinc-500 mb-3">{masa.kapasite} Kişilik</p>
        )}
        <div className="flex gap-2 justify-center">
          <Button
            onClick={() => masaClick(masa)}
            size="sm"
            className="bg-zinc-700 hover:bg-zinc-600 flex-1"
          >
            <Receipt size={16} className="mr-1" />
            Sipariş
          </Button>
          {paketKontrol(paketTuru, 'qr_menu') && (
            <Button
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                qrOlustur(masa)
              }}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700"
              title="QR İndir"
            >
              <Download size={16} />
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

export default function MasalarPage() {
  const [masalar, setMasalar] = useState<any[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [paketTuru, setPaketTuru] = useState<'basit' | 'big' | 'pro'>('basit')
  const [aktifSiparisSayisi, setAktifSiparisSayisi] = useState(0)
  const [loading, setLoading] = useState(true)
  const [ekleModal, setEkleModal] = useState(false)
  const [yeniMasaAd, setYeniMasaAd] = useState('')
  const [yeniMasaKapasite, setYeniMasaKapasite] = useState(4)
  const router = useRouter()
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  )

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (!restoran) return

    const masaChannel = supabase
 .channel('masalar-realtime')
 .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'masalar',
          filter: `restoran_id=eq.${restoran.id}`
        },
        () => {
          getMasalar(restoran.id)
        }
      )
 .subscribe()

    const siparisChannel = supabase
 .channel('siparis_sayisi')
 .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'siparisler',
          filter: `restoran_id=eq.${restoran.id}`
        },
        () => {
          getAktifSiparisSayisi(restoran.id)
        }
      )
 .subscribe()

    return () => {
      supabase.removeChannel(masaChannel)
      supabase.removeChannel(siparisChannel)
    }
  }, [restoran])

  const loadData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData, error } = await supabase
 .from('restoranlar')
 .select('*')
 .eq('sahibi_id', user.id)
 .single()

    if (error ||!restoranData) {
      console.error('Restoran çekme hatası:', error)
      toast.error('Restoran bulunamadı')
      setLoading(false)
      return
    }

    console.log('RESTORAN DATA:', restoranData)
    console.log('PAKET TÜRÜ:', restoranData.paket_turu)

    setRestoran(restoranData)
    setPaketTuru(restoranData.paket_turu || 'basit')

    await getMasalar(restoranData.id)
    await getAktifSiparisSayisi(restoranData.id)

    setLoading(false)
  }

  async function getMasalar(restoranId: string) {
    const { data: masalarData } = await supabase
 .from('masalar')
 .select('*, siparisler!left(id, durum)')
 .eq('restoran_id', restoranId)
 .order('sira', { ascending: true })
 .order('ad')

    const masalarWithSiparis = masalarData?.map(masa => ({
...masa,
      aktifSiparisVar: masa.siparisler?.some((s: any) => s.durum === 'hazirlaniyor')
    }))

    setMasalar(masalarWithSiparis || [])
  }

  async function getAktifSiparisSayisi(restoranId: string) {
    const { count } = await supabase
 .from('siparisler')
 .select('*', { count: 'exact', head: true })
 .eq('restoran_id', restoranId)
 .eq('durum', 'hazirlaniyor')

    setAktifSiparisSayisi(count || 0)
  }

  async function masaEkle() {
    if (!yeniMasaAd.trim()) {
      toast.error('Masa adı gir')
      return
    }

    if (masalar.length >= PAKETLER[paketTuru].limit.masa) {
      toast.error(`${PAKETLER[paketTuru].ad} pakette max ${PAKETLER[paketTuru].limit.masa} masa`)
      return
    }

    const { error } = await supabase
 .from('masalar')
 .insert({
        restoran_id: restoran.id,
        ad: yeniMasaAd.trim(),
        kapasite: yeniMasaKapasite,
        sira: masalar.length,
        durum: 'bos'
      })

    if (error) {
      toast.error('Masa eklenemedi')
      return
    }

    toast.success('Masa eklendi')
    setEkleModal(false)
    setYeniMasaAd('')
    setYeniMasaKapasite(4)
    getMasalar(restoran.id)
  }

  async function masaSil(masa: any) {
    if (masa.aktifSiparisVar) {
      toast.error('Aktif siparişi olan masa silinemez')
      return
    }

    if (!confirm(`${masa.ad} silinsin mi?`)) return

    const { error } = await supabase
 .from('masalar')
 .delete()
 .eq('id', masa.id)

    if (error) {
      toast.error('Masa silinemedi')
      return
    }

    toast.success('Masa silindi')
    getMasalar(restoran.id)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = masalar.findIndex(m => m.id === active.id)
    const newIndex = masalar.findIndex(m => m.id === over.id)
    const yeniMasalar = arrayMove(masalar, oldIndex, newIndex)
    setMasalar(yeniMasalar)

    const updates = yeniMasalar.map((m, i) => ({
      id: m.id,
      sira: i
    }))

    for (const u of updates) {
      await supabase.from('masalar').update({ sira: u.sira }).eq('id', u.id)
    }
  }

  async function qrOlustur(masa: any) {
    if (!restoran?.slug) {
      toast.error('Restoran slug bulunamadı. Ayarlardan slug ekleyin.')
      return
    }

    const masaParam = masa.ad.replace(/\s+/g, '-')
    const url = `${window.location.origin}/menu/${restoran.slug}?masa=${masaParam}`

    if (qrCanvasRef.current) {
      await QRCode.toCanvas(qrCanvasRef.current, url, {
        width: 512,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      const link = document.createElement('a')
      link.download = `${restoran.ad}-${masa.ad}-QR.png`
      link.href = qrCanvasRef.current.toDataURL()
      link.click()

      toast.success(`${masa.ad} QR kodu indirildi`)
    }
  }

  const masaClick = (masa: any) => {
    if (masa.aktifSiparisVar) {
      router.push(`/siparisler?masa_id=${masa.id}`)
    } else {
      const masaParam = masa.ad.replace(/\s+/g, '-')
      window.open(`/menu/${restoran.slug}?masa=${masaParam}`, '_blank')
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-zinc-900 text-white p-4 flex items-center justify-center">Yükleniyor...</div>
  }

  const paket = PAKETLER[paketTuru]

  return (
    <div className="p-6 bg-zinc-900 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Masalar - {restoran?.ad}</h1>
          <p className="text-sm text-zinc-400 mt-1">
            Paket: <span className="text-yellow-500 font-bold">{paket.ad}</span>
            {paket.fiyat > 0 && ` - ${paket.fiyat}₺/ay`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {paketKontrol(paketTuru, 'garson_panel') && (
            <Button
              onClick={() => router.push('/siparisler')}
              className="bg-orange-500 text-black font-bold hover:bg-orange-600 relative"
            >
              Siparişler
              {aktifSiparisSayisi > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                  {aktifSiparisSayisi}
                </span>
              )}
            </Button>
          )}

          {paketKontrol(paketTuru, 'kasa') && (
            <Button
              onClick={() => router.push('/kasa')}
              className="bg-green-500 text-black font-bold hover:bg-green-600"
            >
              Kasa
            </Button>
          )}

          {paketKontrol(paketTuru, 'qr_menu') && (
            <Button
              onClick={() => router.push('/qr')}
              className="bg-blue-500 text-white font-bold hover:bg-blue-600"
            >
              <QrCode className="w-4 h-4 mr-2" />
              QR Kodlar
            </Button>
          )}

          {paketKontrol(paketTuru, 'garson_panel') && (
            <Button
              onClick={() => router.push('/aramalar')}
              className="bg-green-600 text-white font-bold hover:bg-green-700"
            >
              <Phone className="w-4 h-4 mr-2" />
              Aramalar
            </Button>
          )}

          {paketKontrol(paketTuru, 'garson_panel') && (
            <>
              <Button
                onClick={() => router.push('/urunler')}
                className="bg-zinc-700 hover:bg-zinc-600"
              >
                Ürünler
              </Button>
              <Button
                onClick={() => router.push('/kategoriler')}
                className="bg-zinc-700 hover:bg-zinc-600"
              >
                Kategoriler
              </Button>
            </>
          )}

          {paketKontrol(paketTuru, 'rapor') && (
            <Button
              onClick={() => router.push('/rapor')}
              className="bg-zinc-700 hover:bg-zinc-600"
            >
              Rapor
            </Button>
          )}

          <Button
            onClick={() => setEkleModal(true)}
            className="bg-yellow-500 text-black hover:bg-yellow-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Masa Ekle ({masalar.length}/{paket.limit.masa === 999? '∞' : paket.limit.masa})
          </Button>
        </div>
      </div>

      {paketKontrol(paketTuru, 'garson_panel')? (
        <>
          {masalar.length > 0? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={masalar.map(m => m.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {masalar.map((masa) => (
                    <SortableMasa
                      key={masa.id}
                      masa={masa}
                      masaClick={masaClick}
                      qrOlustur={qrOlustur}
                      masaSil={masaSil}
                      paketTuru={paketTuru}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : (
            <Card className="p-12 bg-zinc-800 text-center border-zinc-700">
              <p className="text-zinc-400 mb-4">Henüz masa eklenmemiş</p>
              <Button
                onClick={() => setEkleModal(true)}
                className="bg-yellow-500 text-black"
              >
                İlk Masayı Ekle
              </Button>
            </Card>
          )}
        </>
      ) : (
        <Card className="p-12 bg-zinc-800 text-center border-zinc-700">
          <p className="text-zinc-400">Garson Paneli bu pakette yok.</p>
          <p className="text-sm text-zinc-500 mt-2">Paketi yükseltmek için ayarlara git.</p>
          <Button
            onClick={() => router.push('/ayarlar/paket')}
            className="mt-4 bg-yellow-500 text-black"
          >
            Paketi Yükselt
          </Button>
        </Card>
      )}

      <Dialog open={ekleModal} onOpenChange={setEkleModal}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle>Yeni Masa Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="masa-ad">Masa Adı</Label>
              <Input
                id="masa-ad"
                value={yeniMasaAd}
                onChange={(e) => setYeniMasaAd(e.target.value)}
                placeholder="Örn: Masa 1, Bahçe 5"
                className="bg-zinc-800 border-zinc-700 mt-2"
              />
            </div>
            <div>
              <Label htmlFor="kapasite">Kapasite</Label>
              <Input
                id="kapasite"
                type="number"
                value={yeniMasaKapasite}
                onChange={(e) => setYeniMasaKapasite(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 mt-2"
              />
            </div>
            <Button onClick={masaEkle} className="w-full bg-green-600 hover:bg-green-700">
              Ekle
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <canvas ref={qrCanvasRef} className="hidden" />
    </div>
  )
}
