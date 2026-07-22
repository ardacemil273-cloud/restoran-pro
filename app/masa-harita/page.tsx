'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { Save, RotateCcw, Grid3x3, Users, ChefHat, MapPin } from 'lucide-react'

type Masa = {
  id: string
  ad: string
  durum: 'bos' | 'dolu'
  kapasite: number
  x: number
  y: number
  sira: number
}

export default function MasaHaritaPage() {
  const [masalar, setMasalar] = useState<Masa[]>([])
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [degistirildi, setDegistirildi] = useState(false)
  const [gridMode, setGridMode] = useState(false)
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar').select('*').eq('sahibi_id', user.id).single()
    if (!restoranData) { toast.error('Restoran bulunamadı'); return }
    setRestoran(restoranData)

    const { data: masalarData } = await supabase
      .from('masalar')
      .select('id, ad, durum, kapasite, x, y, sira')
      .eq('restoran_id', restoranData.id)
      .order('sira', { ascending: true })

    if (masalarData) {
      setMasalar(masalarData.map((m, idx) => ({
        ...m,
        x: m.x || (idx % 4) * 200 + 50,
        y: m.y || Math.floor(idx / 4) * 200 + 50
      })))
    }
    setYukleniyor(false)
  }

  async function saveMasaPositions() {
    try {
      for (const masa of masalar) {
        await supabase
          .from('masalar')
          .update({ x: masa.x, y: masa.y })
          .eq('id', masa.id)
      }
      toast.success('✅ Masa konumları kaydedildi')
      setDegistirildi(false)
    } catch (err) {
      toast.error('Kaydedilemedi')
    }
  }

  function handleDragStart(e: React.MouseEvent, masaId: string) {
    setDraggingId(masaId)
  }

  function handleDragMove(e: React.MouseEvent) {
    if (!draggingId) return
    const container = document.getElementById('masa-container')
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = Math.max(0, Math.min(e.clientX - rect.left - 50, rect.width - 100))
    const y = Math.max(0, Math.min(e.clientY - rect.top - 50, rect.height - 100))

    setMasalar(prev =>
      prev.map(m => m.id === draggingId ? { ...m, x, y } : m)
    )
    setDegistirildi(true)
  }

  function handleDragEnd() {
    setDraggingId(null)
  }

  function resetPositions() {
    setMasalar(prev =>
      prev.map((m, idx) => ({
        ...m,
        x: (idx % 4) * 200 + 50,
        y: Math.floor(idx / 4) * 200 + 50
      }))
    )
    setDegistirildi(true)
  }

  function autoArrangeMasas() {
    const cols = Math.ceil(Math.sqrt(masalar.length))
    setMasalar(prev =>
      prev.map((m, idx) => ({
        ...m,
        x: (idx % cols) * 220 + 50,
        y: Math.floor(idx / cols) * 220 + 50
      }))
    )
    setDegistirildi(true)
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2 text-white">
            <MapPin className="w-7 h-7 text-yellow-500" />
            Masa Haritası
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad} — Masaları sürükle ve konumlandır</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => setGridMode(!gridMode)}
            variant={gridMode ? 'default' : 'outline'}
            size="sm"
            className={gridMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'border-zinc-600'}
          >
            <Grid3x3 className="w-4 h-4 mr-1.5" />
            Grid
          </Button>
          <Button onClick={autoArrangeMasas} variant="outline" size="sm" className="border-zinc-600 hover:bg-zinc-800">
            <Users className="w-4 h-4 mr-1.5" />
            Otomatik
          </Button>
          <Button onClick={resetPositions} variant="outline" size="sm" className="border-zinc-600 hover:bg-zinc-800">
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Sıfırla
          </Button>
          <Button
            onClick={saveMasaPositions}
            disabled={!degistirildi}
            className={degistirildi ? 'bg-green-600 hover:bg-green-700' : 'bg-zinc-700 opacity-50'}
            size="sm"
          >
            <Save className="w-4 h-4 mr-1.5" />
            Kaydet
          </Button>
        </div>
      </motion.div>

      {/* Masa Container */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        id="masa-container"
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        className="relative w-full bg-gradient-to-br from-zinc-800 to-zinc-900 border-2 border-zinc-700 rounded-2xl overflow-hidden"
        style={{ height: '600px', cursor: draggingId ? 'grabbing' : 'grab' }}
      >
        {/* Grid Background */}
        {gridMode && (
          <div className="absolute inset-0 opacity-10">
            {Array.from({ length: 6 }).map((_, i) =>
              Array.from({ length: 8 }).map((_, j) => (
                <div
                  key={`${i}-${j}`}
                  className="absolute border border-zinc-600"
                  style={{
                    width: '100px',
                    height: '100px',
                    left: `${j * 100}px`,
                    top: `${i * 100}px`
                  }}
                />
              ))
            )}
          </div>
        )}

        {/* Masalar */}
        <AnimatePresence>
          {masalar.map(masa => (
            <motion.div
              key={masa.id}
              layout
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="absolute"
              style={{ left: `${masa.x}px`, top: `${masa.y}px` }}
            >
              <div
                onMouseDown={(e) => handleDragStart(e, masa.id)}
                className={`
                  w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing
                  transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/20
                  ${masa.durum === 'dolu'
                    ? 'bg-red-950/40 border-red-600 shadow-lg shadow-red-500/20'
                    : 'bg-green-950/40 border-green-600 shadow-lg shadow-green-500/20'
                  }
                  ${draggingId === masa.id ? 'ring-2 ring-yellow-400 shadow-lg shadow-yellow-500/50' : ''}
                `}
              >
                <div className="text-center">
                  <p className="font-black text-white text-sm">{masa.ad}</p>
                  <div className="flex items-center gap-1 justify-center mt-1">
                    <Users className="w-3 h-3 text-zinc-300" />
                    <p className="text-xs text-zinc-300">{masa.kapasite}</p>
                  </div>
                  <p className={`text-xs font-bold mt-1 ${masa.durum === 'dolu' ? 'text-red-300' : 'text-green-300'}`}>
                    {masa.durum === 'dolu' ? 'DOLU' : 'BOŞ'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Bilgi Kartı */}
        {masalar.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <ChefHat className="w-16 h-16 text-zinc-700 mb-4" />
            <p className="text-zinc-500 font-medium">Henüz masa eklenmemiş</p>
            <Button onClick={() => router.push('/masalar')} className="mt-4 bg-yellow-600 hover:bg-yellow-700">
              Masa Ekle
            </Button>
          </div>
        )}
      </motion.div>

      {/* Bilgi */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <Card className="p-4 bg-zinc-800 border-zinc-700">
          <p className="text-xs text-zinc-400 mb-1">Toplam Masa</p>
          <p className="text-2xl font-black text-white">{masalar.length}</p>
        </Card>
        <Card className="p-4 bg-zinc-800 border-zinc-700">
          <p className="text-xs text-zinc-400 mb-1">Dolu Masalar</p>
          <p className="text-2xl font-black text-red-400">{masalar.filter(m => m.durum === 'dolu').length}</p>
        </Card>
        <Card className="p-4 bg-zinc-800 border-zinc-700">
          <p className="text-xs text-zinc-400 mb-1">Boş Masalar</p>
          <p className="text-2xl font-black text-green-400">{masalar.filter(m => m.durum === 'bos').length}</p>
        </Card>
      </motion.div>

      {degistirildi && (
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 right-6 bg-yellow-600 text-black px-4 py-3 rounded-xl font-bold flex items-center gap-2"
        >
          <div className="w-2 h-2 bg-black rounded-full animate-pulse" />
          Kaydedilmemiş değişiklikler var
        </motion.div>
      )}
    </div>
  )
}
