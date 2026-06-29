'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell, Check, Clock, Truck, Volume2, Printer,
  Trash2, ChefHat, Receipt, RefreshCw, AlertCircle, Timer, Package, Eye
} from 'lucide-react'

type Siparis = {
  id: string
  masa_id: string | null
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
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('tum')
  const [selectedOrder, setSelectedOrder] = useState<Siparis | null>(null)
  const [sessionValid, setSessionValid] = useState(true)

  useEffect(() => {
    // F5 sorunu çözümü: Session doğrulama
    const validateSession = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setSessionValid(false)
          // Sayfayı yenile ve login'e yönlendir
          window.location.href = '/login'
          return
        }
        setSessionValid(true)
      } catch (error) {
        console.error('Session validation error:', error)
        setSessionValid(false)
      }
    }

    validateSession()
    fetchSiparisler()
    const interval = setInterval(fetchSiparisler, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchSiparisler = async () => {
    try {
      const { data, error } = await supabase
        .from('siparisler')
        .select('*, siparis_urunleri(*, urunler(ad, fiyat))')
        .order('created_at', { ascending: false })

      if (error) throw error
      setSiparisler(data || [])
    } catch (err) {
      console.error('Siparişler yüklenemedi:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateDurum = async (id: string, durum: string) => {
    try {
      const { error } = await supabase
        .from('siparisler')
        .update({ durum })
        .eq('id', id)

      if (error) throw error
      toast.success('Sipariş durumu güncellendi')
      fetchSiparisler()
    } catch (err) {
      toast.error('Hata: ' + (err as any).message)
    }
  }

  const deleteSiparis = async (id: string) => {
    try {
      const { error } = await supabase
        .from('siparisler')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Sipariş silindi')
      fetchSiparisler()
    } catch (err) {
      toast.error('Hata: ' + (err as any).message)
    }
  }

  const filteredOrders = siparisler.filter(s => {
    if (filter === 'tum') return true
    return s.durum === filter
  })

  const getStatusColor = (durum: string) => {
    const colors: Record<string, string> = {
      hazirlaniyor: 'from-orange-500 to-orange-600 text-orange-100',
      hazir: 'from-green-500 to-green-600 text-green-100',
      tamamlandi: 'from-blue-500 to-blue-600 text-blue-100',
      iptal: 'from-zinc-500 to-zinc-600 text-zinc-100'
    }
    return colors[durum] || 'from-gray-500 to-gray-600'
  }

  const getStatusIcon = (durum: string) => {
    const icons: Record<string, any> = {
      hazirlaniyor: Clock,
      hazir: Check,
      tamamlandi: Truck,
      iptal: AlertCircle
    }
    return icons[durum] || Clock
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-white flex items-center gap-3">
              <Receipt className="w-8 h-8 text-primary" />
              Siparişler
            </h1>
            <p className="text-white/40 mt-2">Aktif sipariş yönetimi ve takibi</p>
          </div>
          <button
            onClick={fetchSiparisler}
            className="p-3 bg-primary/10 hover:bg-primary/20 rounded-xl transition-all text-primary"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'tum', label: 'Tüm Siparişler', count: siparisler.length },
            { id: 'hazirlaniyor', label: 'Hazırlanıyor', count: siparisler.filter(s => s.durum === 'hazirlaniyor').length },
            { id: 'hazir', label: 'Hazır', count: siparisler.filter(s => s.durum === 'hazir').length },
            { id: 'tamamlandi', label: 'Teslim Edildi', count: siparisler.filter(s => s.durum === 'tamamlandi').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-lg font-bold whitespace-nowrap transition-all ${
                filter === tab.id
                  ? 'bg-primary text-black'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="rounded-xl border border-white/10 p-4 space-y-3 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-2/3" />
                <div className="space-y-2">
                  <div className="h-4 bg-white/10 rounded" />
                  <div className="h-4 bg-white/10 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 text-lg">Sipariş bulunamadı</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map(siparis => {
                const sure = Math.floor((Date.now() - new Date(siparis.created_at).getTime()) / 60000)
                const gecikme = sure > 20
                const StatusIcon = getStatusIcon(siparis.durum)

                return (
                  <motion.div
                    key={siparis.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    className={`relative rounded-xl border border-white/10 overflow-hidden transition-all hover:border-white/20 hover:shadow-lg hover:shadow-primary/5 ${
                      gecikme ? 'ring-2 ring-red-500/50' : ''
                    }`}
                  >
                    {/* Status Bar */}
                    <div className={`h-1 bg-gradient-to-r ${getStatusColor(siparis.durum)}`} />

                    <div className="p-4 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-black text-white">{siparis.masa_ad}</h3>
                          <p className="text-xs text-white/40 mt-1">
                            {new Date(siparis.created_at).toLocaleTimeString('tr-TR')}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r ${getStatusColor(siparis.durum)}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          <span className="text-xs font-bold">
                            {siparis.durum === 'hazirlaniyor' && 'Hazırlanıyor'}
                            {siparis.durum === 'hazir' && 'Hazır'}
                            {siparis.durum === 'tamamlandi' && 'Teslim'}
                            {siparis.durum === 'iptal' && 'İptal'}
                          </span>
                        </div>
                      </div>

                      {/* Time Info */}
                      {gecikme && (
                        <div className="flex items-center gap-2 px-2 py-1.5 bg-red-500/10 border border-red-500/30 rounded-lg">
                          <AlertCircle className="w-4 h-4 text-red-400" />
                          <span className="text-xs text-red-300 font-bold">{sure} dakika geçti</span>
                        </div>
                      )}

                      {/* Items */}
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {siparis.siparis_urunleri?.map(item => (
                          <div key={item.id} className="flex justify-between text-xs">
                            <span className="text-white/60">
                              {item.adet}x {item.urunler?.ad || 'Ürün'}
                            </span>
                            <span className="text-white/80 font-bold">
                              {(item.adet * item.birim_fiyat).toFixed(2)} ₺
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div className="border-t border-white/10 pt-3 flex justify-between">
                        <span className="text-sm text-white/60">Toplam</span>
                        <span className="text-lg font-black text-primary">
                          {siparis.toplam_tutar.toFixed(2)} ₺
                        </span>
                      </div>

                      {/* Notes */}
                      {siparis.not && (
                        <div className="px-2 py-2 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-xs text-white/60">
                            <span className="font-bold">Not:</span> {siparis.not}
                          </p>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="grid grid-cols-3 gap-2">
                        {siparis.durum !== 'tamamlandi' && siparis.durum !== 'iptal' && (
                          <>
                            {siparis.durum === 'hazirlaniyor' && (
                              <button
                                onClick={() => updateDurum(siparis.id, 'hazir')}
                                className="px-3 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 rounded-lg font-bold text-xs transition-all"
                              >
                                <Check className="w-4 h-4 mx-auto" />
                              </button>
                            )}
                            {siparis.durum === 'hazir' && (
                              <button
                                onClick={() => updateDurum(siparis.id, 'tamamlandi')}
                                className="px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg font-bold text-xs transition-all"
                              >
                                <Truck className="w-4 h-4 mx-auto" />
                              </button>
                            )}
                          </>
                        )}
                        <button
                          onClick={() => setSelectedOrder(siparis)}
                          className="px-3 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg font-bold text-xs transition-all"
                        >
                          <Eye className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => deleteSiparis(siparis.id)}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg font-bold text-xs transition-all"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedOrder(null)}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-card rounded-xl p-6 max-w-md w-full border border-white/10"
            >
              <h2 className="text-2xl font-black text-white mb-4">{selectedOrder.masa_ad}</h2>
              <div className="space-y-3 mb-6">
                {selectedOrder.siparis_urunleri?.map(item => (
                  <div key={item.id} className="flex justify-between">
                    <span className="text-white/60">{item.adet}x {item.urunler?.ad}</span>
                    <span className="text-white font-bold">{(item.adet * item.birim_fiyat).toFixed(2)} ₺</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 pt-4 mb-6">
                <div className="flex justify-between mb-4">
                  <span className="text-white/60">Toplam</span>
                  <span className="text-2xl font-black text-primary">{selectedOrder.toplam_tutar.toFixed(2)} ₺</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full px-4 py-2 bg-primary hover:bg-primary/90 text-black font-black rounded-lg transition-all"
              >
                Kapat
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
