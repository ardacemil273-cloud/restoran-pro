'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
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
  LayoutDashboard, RefreshCw, Users, QrCode, Package,
  AlertTriangle, Zap, Eye, EyeOff
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
    card: 'bg-red-500/15 border-red-500/40 shadow-lg shadow-red-500/20',
    dot: 'bg-red-500 animate-pulse',
    label: 'SIPARIŞ VAR', labelColor: 'text-red-400',
    icon: 'bg-red-600', btn: 'bg-red-600 hover:bg-red-700 text-white'
  }
  if (masa.durum === 'dolu') return {
    card: 'bg-orange-500/15 border-orange-500/40 shadow-lg shadow-orange-500/10',
    dot: 'bg-orange-500', label: 'DOLU', labelColor: 'text-orange-400',
    icon: 'bg-orange-600', btn: 'bg-orange-600 hover:bg-orange-700 text-white'
  }
  return {
    card: 'bg-green-500/10 border-green-500/30 hover:border-green-500/50 shadow-lg shadow-green-500/10',
    dot: 'bg-green-500', label: 'BOŞ', labelColor: 'text-green-400',
    icon: 'bg-green-600', btn: 'bg-green-600 hover:bg-green-700 text-white'
  }
}

function MasaSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {[1,2,3,4,5,6,7,8].map(i => (
        <div key={i} className="rounded-2xl border border-white/10 p-4 space-y-3 skeleton" />
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
        <div className={`p-4 border-2 rounded-2xl text-center transition-all duration-300 cursor-pointer ${s.card}`} onClick={() => masaClick(masa)}>
          <div className="flex justify-between items-start mb-3">
            <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-white/10 touch-none transition-all">
              <GripVertical className="w-4 h-4 text-white/40" />
            </button>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${s.dot}`} />
              <button onClick={(e) => { e.stopPropagation(); masaSil(masa) }} className="h-6 w-6 text-red-500 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-all">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          
          <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center ${s.icon} transition-colors duration-300 shadow-lg`}>
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          
          <h2 className="text-sm font-black text-white mb-1 truncate">{masa.ad}</h2>
          <p className={`text-xs font-bold mb-2 ${s.labelColor}`}>{s.label}</p>
          
          {masa.kapasite && (
            <p className="text-xs text-white/50 mb-3 flex items-center justify-center gap-1">
              <Users className="w-3 h-3" />{masa.kapasite} Kişilik
            </p>
          )}
          
          <div className="flex gap-1.5 justify-center">
            <button onClick={() => masaClick(masa)} className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${s.btn}`}>
              <Receipt size={12} className="inline mr-1" />
              {masa.aktifSiparisVar ? 'Siparişi Gör' : 'Sipariş Al'}
            </button>
            {paketKontrol(paketTuru, 'qr_menu') && (
              <button onClick={(e: React.MouseEvent) => { e.stopPropagation(); qrOlustur(masa) }} className="bg-blue-600 hover:bg-blue-700 px-2 py-2 rounded-lg transition-all" title="QR İndir">
                <Download size={12} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default function MasalarPage() {
  const [masalar, setMasalar] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogAcik, setDialogAcik] = useState(false)
  const [yeniMasaAd, setYeniMasaAd] = useState('')
  const [yeniMasaKapasite, setYeniMasaKapasite] = useState('')
  const [restoran, setRestoran] = useState<any>(null)
  const [paketTuru, setPaketTuru] = useState('')
  const router = useRouter()
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')
    
    const { data: restoranData } = await supabase.from('restoranlar').select('*').eq('sahibi_id', user.id).single()
    if (!restoranData) { setLoading(false); return }
    
    setRestoran(restoranData)
    setPaketTuru(restoranData.paket_turu || 'free')
    
    const { data: masalarData } = await supabase.from('masalar').select('*').eq('restoran_id', restoranData.id).order('sira', { ascending: true })
    const { data: siparisler } = await supabase.from('siparisler').select('masa_id').eq('restoran_id', restoranData.id).in('durum', ['hazirlaniyor', 'hazir', 'bekleniyor'])
    
    const siparisliMasalar = new Set(siparisler?.map((s: any) => s.masa_id) || [])
    const masalarWithStatus = (masalarData || []).map((m: any) => ({
      ...m,
      aktifSiparisVar: siparisliMasalar.has(m.id)
    }))
    
    setMasalar(masalarWithStatus)
    setLoading(false)
  }

  const masaEkle = async () => {
    if (!yeniMasaAd.trim()) {
      toast.error('Masa adı gerekli')
      return
    }
    
    const { error } = await supabase.from('masalar').insert([{
      restoran_id: restoran.id,
      ad: yeniMasaAd,
      kapasite: yeniMasaKapasite ? parseInt(yeniMasaKapasite) : null,
      durum: 'bos',
      sira: masalar.length + 1
    }])
    
    if (error) {
      toast.error('Masa eklenirken hata: ' + error.message)
      return
    }
    
    toast.success(`${yeniMasaAd} başarıyla eklendi`)
    setYeniMasaAd('')
    setYeniMasaKapasite('')
    setDialogAcik(false)
    loadData()
  }

  const masaSil = async (masa: any) => {
    if (!confirm(`${masa.ad} silinsin mi?`)) return
    
    const { error } = await supabase.from('masalar').delete().eq('id', masa.id)
    if (error) {
      toast.error('Silme hatası: ' + error.message)
      return
    }
    
    toast.success(`${masa.ad} silindi`)
    loadData()
  }

  const masaClick = (masa: any) => {
    router.push(`/siparis/${masa.id}`)
  }

  const qrOlustur = async (masa: any) => {
    try {
      const qrUrl = `${window.location.origin}/qr/${masa.id}`
      const canvas = await QRCode.toCanvas(qrUrl, { width: 300, margin: 2 })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `${masa.ad}-QR.png`
      link.click()
      toast.success(`${masa.ad} QR kodu indirildi`)
    } catch (error) {
      toast.error('QR oluşturma hatası')
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = masalar.findIndex(m => m.id === active.id)
      const newIndex = masalar.findIndex(m => m.id === over.id)
      const newMasalar = arrayMove(masalar, oldIndex, newIndex)
      setMasalar(newMasalar)
      
      for (let i = 0; i < newMasalar.length; i++) {
        await supabase.from('masalar').update({ sira: i + 1 }).eq('id', newMasalar[i].id)
      }
    }
  }

  if (loading) return <MasaSkeleton />

  return (
    <div className="p-4 lg:p-6 space-y-6" style={{backgroundColor: 'hsl(224,71%,4%)', minHeight: '100vh'}}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Masalar</h1>
          <p className="text-sm mt-1" style={{color: 'rgba(255,255,255,0.4)'}}>Toplam: {masalar.length} masa</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadData} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all" style={{background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.6)'}}>
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Yenile</span>
          </button>
          <button onClick={() => setDialogAcik(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-black transition-all" style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 4px 12px rgba(245,158,11,0.3)'}}>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Masa Ekle</span>
          </button>
        </div>
      </div>

      {/* Masalar Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={masalar.map(m => m.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            <AnimatePresence>
              {masalar.map(masa => (
                <SortableMasa key={masa.id} masa={masa} masaClick={masaClick} qrOlustur={qrOlustur} masaSil={masaSil} paketTuru={paketTuru} />
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>

      {/* Dialog - Masa Ekle */}
      <Dialog open={dialogAcik} onOpenChange={setDialogAcik}>
        <DialogContent className="bg-zinc-900 border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-white">Yeni Masa Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white">Masa Adı</Label>
              <Input value={yeniMasaAd} onChange={e => setYeniMasaAd(e.target.value)} placeholder="Örn: Masa 1" className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div>
              <Label className="text-white">Kapasite (İsteğe Bağlı)</Label>
              <Input value={yeniMasaKapasite} onChange={e => setYeniMasaKapasite(e.target.value)} placeholder="4" type="number" className="bg-zinc-800 border-zinc-700 text-white" />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDialogAcik(false)} className="px-4 py-2 rounded-lg text-white" style={{background: 'rgba(255,255,255,0.05)'}}>
                İptal
              </button>
              <button onClick={masaEkle} className="px-4 py-2 rounded-lg font-bold text-black" style={{background: 'linear-gradient(135deg, #f59e0b, #f97316)'}}>
                Ekle
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
