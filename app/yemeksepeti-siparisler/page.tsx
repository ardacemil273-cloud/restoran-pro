'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, TrendingUp, AlertCircle, RefreshCw, Check, Clock, Settings, Copy, Eye, EyeOff, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'

type YemeksepetiSiparis = {
  id: string
  yemeksepeti_order_id: string
  musteri_ad: string
  musteri_telefon: string
  urunler: any[]
  toplam_tutar: number
  teslimat_adresi: string
  notlar: string
  durum: 'yeni' | 'hazirlaniyor' | 'hazir' | 'tamamlandi' | 'iptal'
  created_at: string
}

export default function YemeksepetiSiparislerPage() {
  const [siparisler, setSiparisler] = useState<YemeksepetiSiparis[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('tum')
  const [showWebhookInfo, setShowWebhookInfo] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/api/yemeksepeti/webhook`
      setWebhookUrl(url)
    }
    fetchSiparisler()
    const interval = setInterval(fetchSiparisler, 10000) // Her 10 saniyede kontrol et
    return () => clearInterval(interval)
  }, [])

  const copyWebhookUrl = () => {
    navigator.clipboard.writeText(webhookUrl)
    setCopied(true)
    toast.success('Webhook URL kopyalandı!')
    setTimeout(() => setCopied(false), 2000)
  }

  const fetchSiparisler = async () => {
    try {
      const res = await fetch('/api/yemeksepeti/webhook')
      if (!res.ok) throw new Error('Fetch failed')
      const { data } = await res.json()
      setSiparisler(data || [])
    } catch (err) {
      console.error('Yemeksepeti siparişleri yüklenemedi:', err)
      toast.error('Siparişler yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = siparisler.filter(s => {
    if (filter === 'tum') return true
    return s.durum === filter
  })

  const getStatusColor = (durum: string) => {
    const colors: Record<string, string> = {
      yeni: 'from-blue-500 to-blue-600',
      hazirlaniyor: 'from-orange-500 to-orange-600',
      hazir: 'from-green-500 to-green-600',
      tamamlandi: 'from-purple-500 to-purple-600',
      iptal: 'from-red-500 to-red-600'
    }
    return colors[durum] || 'from-gray-500 to-gray-600'
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl lg:text-4xl font-black text-white flex items-center gap-3">
              <Package className="w-8 h-8 text-primary" />
              Yemeksepeti Siparişleri
            </h1>
            <p className="text-white/40 mt-2">Yemeksepeti platformundan gelen siparişler</p>
          </div>
          <button
            onClick={fetchSiparisler}
            className="p-3 bg-primary/10 hover:bg-primary/20 rounded-xl transition-all text-primary"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        {/* Webhook Info Card */}
        <div className="bg-gradient-to-r from-pink-500/10 to-orange-500/10 border border-pink-500/20 rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Settings size={20} />
                Webhook Konfigürasyonu
              </h2>
              <p className="text-white/50 text-sm mt-1">Yemeksepeti'nden siparişleri almak için webhook URL'sini kullan</p>
            </div>
            <button
              onClick={() => setShowWebhookInfo(!showWebhookInfo)}
              className="text-white/40 hover:text-white transition-all"
            >
              {showWebhookInfo ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {showWebhookInfo && (
            <div className="space-y-3">
              <div className="bg-black/20 rounded-lg p-4 space-y-2">
                <p className="text-xs text-white/60 uppercase font-bold">Webhook URL</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-sm text-white/80 break-all font-mono bg-black/40 p-2 rounded">
                    {webhookUrl}
                  </code>
                  <button
                    onClick={copyWebhookUrl}
                    className="p-2 bg-pink-500/20 hover:bg-pink-500/30 rounded-lg transition-all"
                  >
                    <Copy size={18} />
                  </button>
                </div>
              </div>

              <div className="bg-black/20 rounded-lg p-4 space-y-2">
                <p className="text-xs text-white/60 uppercase font-bold">Test JSON</p>
                <pre className="text-xs text-white/70 overflow-x-auto bg-black/40 p-2 rounded">{`{
  "order_id": "YS-123456",
  "customer_name": "Test Müşteri",
  "customer_phone": "+905551234567",
  "items": [{"name": "Döner", "quantity": 2, "price": 50}],
  "total_price": 100,
  "delivery_address": "Test Adresi",
  "notes": "Test notu"
}`}</pre>
              </div>

              <a
                href="https://www.yemeksepeti.com/api"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-pink-400 hover:text-pink-300 text-sm font-bold transition-all"
              >
                Yemeksepeti API Dokümantasyonu
                <ExternalLink size={16} />
              </a>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Toplam', count: siparisler.length, icon: Package },
            { label: 'Yeni', count: siparisler.filter(s => s.durum === 'yeni').length, icon: AlertCircle },
            { label: 'Hazırlanıyor', count: siparisler.filter(s => s.durum === 'hazirlaniyor').length, icon: Clock },
            { label: 'Hazır', count: siparisler.filter(s => s.durum === 'hazir').length, icon: Check }
          ].map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-white/10 p-4 bg-white/5"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm">{stat.label}</p>
                    <p className="text-2xl font-black text-white mt-1">{stat.count}</p>
                  </div>
                  <Icon className="w-6 h-6 text-primary/50" />
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'tum', label: 'Tüm Siparişler' },
            { id: 'yeni', label: 'Yeni' },
            { id: 'hazirlaniyor', label: 'Hazırlanıyor' },
            { id: 'hazir', label: 'Hazır' },
            { id: 'tamamlandi', label: 'Teslim Edildi' }
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
              {tab.label}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl border border-white/10 p-4 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-2/3 mb-3" />
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
            <motion.div className="space-y-4">
              {filteredOrders.map(siparis => (
                <motion.div
                  key={siparis.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="rounded-xl border border-white/10 overflow-hidden hover:border-white/20 transition-all"
                >
                  <div className={`h-1 bg-gradient-to-r ${getStatusColor(siparis.durum)}`} />
                  
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-black text-white">{siparis.musteri_ad}</h3>
                        <p className="text-xs text-white/40 mt-1">
                          Sipariş: {siparis.yemeksepeti_order_id}
                        </p>
                      </div>
                      <div className={`px-3 py-1 rounded-lg bg-gradient-to-r ${getStatusColor(siparis.durum)} text-xs font-bold`}>
                        {siparis.durum.toUpperCase()}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-white/40">Telefon</p>
                        <p className="text-white font-bold">{siparis.musteri_telefon}</p>
                      </div>
                      <div>
                        <p className="text-white/40">Tutar</p>
                        <p className="text-white font-bold">{siparis.toplam_tutar.toFixed(2)} ₺</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-white/40 text-xs mb-1">Teslimat Adresi</p>
                      <p className="text-white/80 text-xs">{siparis.teslimat_adresi}</p>
                    </div>

                    {siparis.notlar && (
                      <div className="px-2 py-2 bg-white/5 rounded-lg border border-white/10">
                        <p className="text-xs text-white/60">
                          <span className="font-bold">Not:</span> {siparis.notlar}
                        </p>
                      </div>
                    )}

                    <div className="pt-2 border-t border-white/10">
                      <p className="text-xs text-white/40 mb-2">Ürünler ({siparis.urunler?.length || 0})</p>
                      <div className="space-y-1">
                        {siparis.urunler?.slice(0, 3).map((item: any, i: number) => (
                          <p key={i} className="text-xs text-white/60">
                            {item.quantity}x {item.name} - {item.price?.toFixed(2)} ₺
                          </p>
                        ))}
                        {siparis.urunler?.length > 3 && (
                          <p className="text-xs text-white/40">+{siparis.urunler.length - 3} ürün daha</p>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}
