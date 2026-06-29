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
import { paketKontrol } from '@/lib/paketler'
import {
  QrCode, Receipt, Download, Plus, Trash2, GripVertical,
  Phone, Package, ShoppingCart, DollarSign, BarChart3,
  Users, CalendarDays, Settings, ChefHat, Warehouse,
  LayoutDashboard, UtensilsCrossed, Tag, Brain
} from 'lucide-react'
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
        className={`p-4 border-2 text-center transition hover:shadow-lg ${
          masa.aktifSiparisVar
            ? 'bg-red-900/30 border-red-600 shadow-red-900/20'
            : masa.durum === 'dolu'
            ? 'bg-orange-900/20 border-orange-700'
            : 'bg-zinc-800 border-zinc-700 hover:border-zinc-500'
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-zinc-700">
            <GripVertical className="w-4 h-4 text-zinc-500" />
          </button>
          <Button
            onClick={() => masaSil(masa)}
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-red-500 hover:text-red-400 hover:bg-red-950"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        <div className={`w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center ${
          masa.aktifSiparisVar ? 'bg-red-600' : masa.durum === 'dolu' ? 'bg-orange-600' : 'bg-zinc-600'
        }`}>
          <ChefHat className="w-5 h-5 text-white" />
        </div>

        <h2 className="text-base font-bold text-white mb-1">{masa.ad}</h2>
        <p className={`text-xs font-bold mb-1 ${
          masa.aktifSiparisVar ? 'text-red-400' : masa.durum === 'dolu' ? 'text-orange-400' : 'text-green-400'
        }`}>
          {masa.aktifSiparisVar ? 'SİPARİŞ VAR' : masa.durum === 'dolu' ? 'DOLU' : 'BOŞ'}
        </p>
        {masa.kapasite && (
          <p className="text-xs text-zinc-500 mb-3">{masa.kapasite} Kişilik</p>
        )}
        <div className="flex gap-1.5 justify-center">
          <Button
            onClick={() => masaClick(masa)}
            size="sm"
            className={`flex-1 text-xs ${
              masa.aktifSiparisVar
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-zinc-700 hover:bg-zinc-600 text-white'
            }`}
          >
            <Receipt size={13} className="mr-1" />
            {masa.aktifSiparisVar ? 'Siparişi Gör' : 'Sipariş Al'}
          </Button>
          {paketKontrol(paketTuru, 'qr_menu') && (
            <Button
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation()
                qrOlustur(masa)
              }}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 px-2"
              title="QR İndir"
            >
              <Download size={13} />
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'masalar', filter: `restoran_id=eq.${restoran.id}` }, () => {
        getMasalar(restoran.id)
      })
      .subscribe()

    const siparisChannel = supabase
      .channel('siparis_sayisi')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'siparisler', filter: `restoran_id=eq.${restoran.id}` }, () => {
        getAktifSiparisSayisi(restoran.id)
      })
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

    if (error || !restoranData) {
      toast.error('Restoran bulunamadı')
      setLoading(false)
      return
    }

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

    const { error } = await supabase.from('masalar').delete().eq('id', masa.id)
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

    for (let i = 0; i < yeniMasalar.length; i++) {
      await supabase.from('masalar').update({ sira: i }).eq('id', yeniMasalar[i].id)
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
        color: { dark: '#000000', light: '#FFFFFF' }
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
      if (restoran?.slug) {
        const masaParam = masa.ad.replace(/\s+/g, '-')
        window.open(`/menu/${restoran.slug}?masa=${masaParam}`, '_blank')
      } else {
        router.push(`/siparis/${masa.id}`)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500 mx-auto mb-3" />
          <p className="text-zinc-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  const bosMasa = masalar.filter(m => !m.aktifSiparisVar && m.durum !== 'dolu').length
  const doluMasa = masalar.filter(m => m.aktifSiparisVar || m.durum === 'dolu').length

  return (
    <div className="p-6 bg-zinc-900 min-h-screen">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <ChefHat className="w-7 h-7 text-yellow-500" />
            {restoran?.ad || 'Masalar'}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-green-400 font-medium">{bosMasa} Boş</span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-red-400 font-medium">{doluMasa} Dolu</span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-zinc-400">{masalar.length} Toplam</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => router.push('/dashboard')}
            className="bg-zinc-700 hover:bg-zinc-600 text-sm"
            size="sm"
          >
            <LayoutDashboard className="w-4 h-4 mr-1.5" />
            Dashboard
          </Button>
          <Button
            onClick={() => router.push('/siparisler')}
            className="bg-orange-600 hover:bg-orange-700 text-sm relative"
            size="sm"
          >
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            Siparişler
            {aktifSiparisSayisi > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                {aktifSiparisSayisi}
              </span>
            )}
          </Button>
          <Button
            onClick={() => router.push('/kasa')}
            className="bg-green-600 hover:bg-green-700 text-sm"
            size="sm"
          >
            <DollarSign className="w-4 h-4 mr-1.5" />
            Kasa
          </Button>
          <Button
            onClick={() => router.push('/qr-kodlar')}
            className="bg-blue-600 hover:bg-blue-700 text-sm"
            size="sm"
          >
            <QrCode className="w-4 h-4 mr-1.5" />
            QR
          </Button>
          <Button
            onClick={() => router.push('/urunler')}
            className="bg-zinc-700 hover:bg-zinc-600 text-sm"
            size="sm"
          >
            <Package className="w-4 h-4 mr-1.5" />
            Ürünler
          </Button>
          <Button
            onClick={() => setEkleModal(true)}
            className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold text-sm"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Masa Ekle
          </Button>
        </div>
      </div>

      {/* Masa Grid */}
      {masalar.length > 0 ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={masalar.map(m => m.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
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
          <div className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <ChefHat className="w-8 h-8 text-zinc-500" />
          </div>
          <p className="text-zinc-400 mb-2 font-bold">Henüz masa eklenmemiş</p>
          <p className="text-zinc-500 text-sm mb-6">İlk masanı ekleyerek başla</p>
          <Button
            onClick={() => setEkleModal(true)}
            className="bg-yellow-500 text-black font-bold hover:bg-yellow-400"
          >
            <Plus className="w-4 h-4 mr-2" />
            İlk Masayı Ekle
          </Button>
        </Card>
      )}

      {/* Masa Ekle Dialog */}
      <Dialog open={ekleModal} onOpenChange={setEkleModal}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-yellow-500" />
              Yeni Masa Ekle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="masa-ad" className="text-zinc-300">Masa Adı</Label>
              <Input
                id="masa-ad"
                value={yeniMasaAd}
                onChange={(e) => setYeniMasaAd(e.target.value)}
                placeholder="Örn: Masa 1, Bahçe 5, VIP"
                className="bg-zinc-800 border-zinc-700 mt-2 focus:border-yellow-500"
                onKeyDown={(e) => e.key === 'Enter' && masaEkle()}
              />
            </div>
            <div>
              <Label htmlFor="kapasite" className="text-zinc-300">Kapasite (Kişi)</Label>
              <Input
                id="kapasite"
                type="number"
                min="1"
                max="50"
                value={yeniMasaKapasite}
                onChange={(e) => setYeniMasaKapasite(Number(e.target.value))}
                className="bg-zinc-800 border-zinc-700 mt-2 focus:border-yellow-500"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setEkleModal(false)}
                variant="outline"
                className="flex-1 border-zinc-600 hover:bg-zinc-800"
              >
                İptal
              </Button>
              <Button
                onClick={masaEkle}
                className="flex-1 bg-yellow-500 text-black font-bold hover:bg-yellow-400"
              >
                Ekle
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <canvas ref={qrCanvasRef} className="hidden" />
    </div>
  )
}
