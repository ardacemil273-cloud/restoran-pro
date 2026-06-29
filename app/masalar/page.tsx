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
import { motion, AnimatePresence } from 'framer-motion'
import {
  Receipt, Download, Plus, Trash2, GripVertical,
  ShoppingCart, DollarSign, ChefHat,
  LayoutDashboard, RefreshCw, Users, QrCode, Package
} from 'lucide-react'
import QRCode from 'qrcode'
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, DragEndEvent
} from '@dnd-kit/core'
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy
} from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

function getMasaStyle(masa: any) {
  if (masa.aktifSiparisVar) return {
    card: 'bg-red-900/30 border-red-600 shadow-red-900/20 shadow-lg',
    dot: 'bg-red-500 animate-pulse',
    label: 'SİPARİŞ VAR', labelColor: 'text-red-400',
    icon: 'bg-red-600', btn: 'bg-red-600 hover:bg-red-700 text-white'
  }
  if (masa.durum === 'dolu') return {
    card: 'bg-orange-900/20 border-orange-700',
    dot: 'bg-orange-500', label: 'DOLU', labelColor: 'text-orange-400',
    icon: 'bg-orange-600', btn: 'bg-orange-600 hover:bg-orange-700 text-white'
  }
  return {
    card: 'bg-zinc-800 border-zinc-700 hover:border-zinc-500',
    dot: 'bg-green-500', label: 'BOŞ', labelColor: 'text-green-400',
    icon: 'bg-zinc-600', btn: 'bg-zinc-700 hover:bg-zinc-600 text-white'
  }
}

function MasaSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {[1,2,3,4,5,6,7,8].map(i => (
        <div key={i} className="rounded-xl border-2 border-zinc-700 p-4 space-y-3 animate-pulse">
          <div className="flex justify-between"><div className="h-4 w-4 bg-zinc-700 rounded" /><div className="h-4 w-4 bg-zinc-700 rounded" /></div>
          <div className="w-10 h-10 bg-zinc-700 rounded-full mx-auto" />
          <div className="h-4 bg-zinc-700 rounded w-3/4 mx-auto" />
          <div className="h-3 bg-zinc-700 rounded w-1/2 mx-auto" />
          <div className="h-8 bg-zinc-700 rounded" />
        </div>
      ))}
    </div>
  )
}

function SortableMasa({ masa, masaClick, qrOlustur, masaSil, paketTuru }: any) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: masa.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const s = getMasaStyle(masa)
  return (
    <div ref={setNodeRef} style={style}>
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
        <Card className={`p-4 border-2 text-center transition-all duration-300 ${s.card}`}>
          <div className="flex justify-between items-start mb-2">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-zinc-700 touch-none">
              <GripVertical className="w-4 h-4 text-zinc-500" />
            </button>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              <Button onClick={(e) => { e.stopPropagation(); masaSil(masa) }} size="icon" variant="ghost" className="h-6 w-6 text-red-500 hover:text-red-400 hover:bg-red-950">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${s.icon} transition-colors duration-300`}>
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-sm font-black text-white mb-1 truncate">{masa.ad}</h2>
          <p className={`text-xs font-bold mb-1 ${s.labelColor}`}>{s.label}</p>
          {masa.kapasite && (
            <p className="text-xs text-zinc-500 mb-3 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />{masa.kapasite} Kişilik
            </p>
          )}
          <div className="flex gap-1.5 justify-center">
            <Button onClick={() => masaClick(masa)} size="sm" className={`flex-1 text-xs font-bold ${s.btn}`}>
              <Receipt size={12} className="mr-1" />
              {masa.aktifSiparisVar ? 'Siparişi Gör' : 'Sipariş Al'}
            </Button>
            {paketKontrol(paketTuru, 'qr_menu') && (
              <Button onClick={(e: React.MouseEvent) => { e.stopPropagation(); qrOlustur(masa) }} size="sm" className="bg-blue-600 hover:bg-blue-700 px-2" title="QR İndir">
                <Download size={12} />
              </Button>
            )}
          </div>
        </Card>
      </motion.div>
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
  const [yenileniyor, setYenileniyor] = useState(false)
  const router = useRouter()
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => { loadData() }, [])

  useEffect(() => {
    if (!restoran) return
    const ch = supabase.channel('masalar-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'masalar', filter: `restoran_id=eq.${restoran.id}` }, () => getMasalar(restoran.id))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'siparisler', filter: `restoran_id=eq.${restoran.id}` }, () => { getMasalar(restoran.id); getAktifSiparisSayisi(restoran.id) })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [restoran])

  async function loadData() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    const { data: restoranData } = await supabase.from('restoranlar').select('*').eq('sahibi_id', user.id).single()
    if (!restoranData) { setLoading(false); return }
    setRestoran(restoranData)
    setPaketTuru(restoranData.paket_turu || 'basit')
    await Promise.all([getMasalar(restoranData.id), getAktifSiparisSayisi(restoranData.id)])
    setLoading(false)
  }

  async function getMasalar(restoranId: string) {
    const { data: masalarData } = await supabase
      .from('masalar')
      .select('*, siparisler!left(id, durum, masa_id)')
      .eq('restoran_id', restoranId)
      .order('sira', { ascending: true })
      .order('ad')
    const masalarWithSiparis = masalarData?.map(masa => ({
      ...masa,
      aktifSiparisVar: masa.siparisler?.some((s: any) => s.durum === 'hazirlaniyor' || s.durum === 'hazir')
    }))
    // 🔧 KRİTİK FIX: Aktif sipariş yoksa ama masa 'dolu' ise otomatik düzelt
    if (masalarWithSiparis) {
      for (const masa of masalarWithSiparis) {
        if (!masa.aktifSiparisVar && masa.durum === 'dolu') {
          await supabase.from('masalar').update({ durum: 'bos' }).eq('id', masa.id)
          masa.durum = 'bos'
        }
      }
    }
    setMasalar(masalarWithSiparis || [])
  }

  async function getAktifSiparisSayisi(restoranId: string) {
    const { count } = await supabase.from('siparisler').select('*', { count: 'exact', head: true }).eq('restoran_id', restoranId).in('durum', ['hazirlaniyor', 'hazir'])
    setAktifSiparisSayisi(count || 0)
  }

  async function masaEkle() {
    if (!yeniMasaAd.trim()) { toast.error('Masa adı gir'); return }
    const { error } = await supabase.from('masalar').insert({ restoran_id: restoran.id, ad: yeniMasaAd.trim(), kapasite: yeniMasaKapasite, sira: masalar.length, durum: 'bos' })
    if (error) { toast.error('Masa eklenemedi'); return }
    toast.success(`✅ "${yeniMasaAd.trim()}" eklendi`)
    setEkleModal(false); setYeniMasaAd(''); setYeniMasaKapasite(4)
    getMasalar(restoran.id)
  }

  async function masaSil(masa: any) {
    if (masa.aktifSiparisVar) { toast.error('Aktif siparişi olan masa silinemez'); return }
    if (!confirm(`"${masa.ad}" silinsin mi?`)) return
    const { error } = await supabase.from('masalar').delete().eq('id', masa.id)
    if (error) { toast.error('Masa silinemedi'); return }
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
    if (!restoran?.slug) { toast.error('Restoran slug bulunamadı. Ayarlardan slug ekleyin.'); return }
    const masaParam = masa.ad.replace(/\s+/g, '-')
    const url = `${window.location.origin}/menu/${restoran.slug}?masa=${masaParam}`
    if (qrCanvasRef.current) {
      await QRCode.toCanvas(qrCanvasRef.current, url, { width: 512, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#000000', light: '#FFFFFF' } })
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

  async function yenile() {
    setYenileniyor(true)
    await getMasalar(restoran.id)
    await getAktifSiparisSayisi(restoran.id)
    setYenileniyor(false)
    toast.success('Masalar güncellendi')
  }

  if (loading) {
    return (
      <div className="p-6 bg-zinc-900 min-h-screen">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 bg-zinc-700 rounded-lg animate-pulse" />
          <div className="h-7 w-32 bg-zinc-700 rounded animate-pulse" />
        </div>
        <MasaSkeleton />
      </div>
    )
  }

  const bosMasa = masalar.filter(m => !m.aktifSiparisVar && m.durum !== 'dolu').length
  const doluMasa = masalar.filter(m => m.aktifSiparisVar || m.durum === 'dolu').length
  const dolulukOrani = masalar.length > 0 ? Math.round((doluMasa / masalar.length) * 100) : 0

  return (
    <div className="p-4 md:p-6 bg-zinc-900 min-h-screen">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
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
            <span className="text-zinc-600">•</span>
            <span className="text-xs text-yellow-400 font-bold">%{dolulukOrani} Dolu</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push('/dashboard')} className="bg-zinc-700 hover:bg-zinc-600 text-sm" size="sm">
            <LayoutDashboard className="w-4 h-4 mr-1.5" />Dashboard
          </Button>
          <Button onClick={() => router.push('/siparisler')} className="relative bg-zinc-700 hover:bg-zinc-600 text-sm" size="sm">
            <ShoppingCart className="w-4 h-4 mr-1.5" />Siparişler
            {aktifSiparisSayisi > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-black rounded-full w-5 h-5 flex items-center justify-center animate-pulse">{aktifSiparisSayisi}</span>
            )}
          </Button>
          <Button onClick={() => router.push('/kasa')} className="bg-green-600 hover:bg-green-700 text-sm" size="sm">
            <DollarSign className="w-4 h-4 mr-1.5" />Kasa
          </Button>
          <Button onClick={yenile} variant="outline" size="sm" className="border-zinc-600 hover:bg-zinc-800" disabled={yenileniyor}>
            <RefreshCw className={`w-4 h-4 ${yenileniyor ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setEkleModal(true)} className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold text-sm" size="sm">
            <Plus className="w-4 h-4 mr-1.5" />Masa Ekle
          </Button>
        </div>
      </motion.div>

      {masalar.length > 0 && (
        <motion.div initial={{ opacity: 0, scaleX: 0 }} animate={{ opacity: 1, scaleX: 1 }} className="mb-5 bg-zinc-800 rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full transition-all duration-700" style={{ width: `${dolulukOrani}%` }} />
        </motion.div>
      )}

      {masalar.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={masalar.map(m => m.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              <AnimatePresence>
                {masalar.map((masa) => (
                  <SortableMasa key={masa.id} masa={masa} masaClick={masaClick} qrOlustur={qrOlustur} masaSil={masaSil} paketTuru={paketTuru} />
                ))}
              </AnimatePresence>
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="p-12 bg-zinc-800 text-center border-zinc-700">
            <div className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <ChefHat className="w-8 h-8 text-zinc-500" />
            </div>
            <p className="text-zinc-400 mb-2 font-bold">Henüz masa eklenmemiş</p>
            <p className="text-zinc-500 text-sm mb-6">İlk masanı ekleyerek başla</p>
            <Button onClick={() => setEkleModal(true)} className="bg-yellow-500 text-black font-bold hover:bg-yellow-400">
              <Plus className="w-4 h-4 mr-2" />İlk Masayı Ekle
            </Button>
          </Card>
        </motion.div>
      )}

      <Dialog open={ekleModal} onOpenChange={setEkleModal}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5 text-yellow-500" />Yeni Masa Ekle
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="masa-ad" className="text-zinc-300">Masa Adı</Label>
              <Input id="masa-ad" value={yeniMasaAd} onChange={(e) => setYeniMasaAd(e.target.value)} placeholder="Örn: Masa 1, Bahçe 5, VIP" className="bg-zinc-800 border-zinc-700 mt-2 focus:border-yellow-500" onKeyDown={(e) => e.key === 'Enter' && masaEkle()} autoFocus />
            </div>
            <div>
              <Label htmlFor="kapasite" className="text-zinc-300">Kapasite (Kişi)</Label>
              <Input id="kapasite" type="number" min="1" max="50" value={yeniMasaKapasite} onChange={(e) => setYeniMasaKapasite(Number(e.target.value))} className="bg-zinc-800 border-zinc-700 mt-2 focus:border-yellow-500" />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => setEkleModal(false)} variant="outline" className="flex-1 border-zinc-600 hover:bg-zinc-800">İptal</Button>
              <Button onClick={masaEkle} className="flex-1 bg-yellow-500 text-black font-bold hover:bg-yellow-400">Ekle</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <canvas ref={qrCanvasRef} className="hidden" />
    </div>
  )
}
