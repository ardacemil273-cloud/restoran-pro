'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import PageHeader from '@/components/PageHeader'
import {
  Bell, Check, Clock, Truck, Volume2, Printer,
  Trash2, ChefHat, Receipt, RefreshCw, AlertCircle, Timer, Package, Eye,
  Webhook, Copy, ExternalLink, Shield, Send, X
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

  // Webhook modal state
  const [showWebhookModal, setShowWebhookModal] = useState(false)
  const [restoranId, setRestoranId] = useState<string | null>(null)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookAktif, setWebhookAktif] = useState(false)
  const [webhookSecret, setWebhookSecret] = useState('')
  const [webhookKaydediyor, setWebhookKaydediyor] = useState(false)
  const [webhookTest, setWebhookTest] = useState(false)
  const [showSecret, setShowSecret] = useState(false)

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
        // Restoran ID'yi al
        const { data: restoran } = await supabase
          .from('restoranlar')
          .select('id')
          .eq('user_id', user.id)
          .single()
        if (restoran) setRestoranId(restoran.id)
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

  // ─── Webhook Fonksiyonları ───────────────────────────────────────────────

  const webhookModalAc = async () => {
    if (!restoranId) {
      toast.error('Restoran bilgisi yüklenemedi')
      return
    }
    try {
      const res = await fetch(`/api/siparis-webhook/ayarlar?restoran_id=${restoranId}`)
      const json = await res.json()
      if (json.success) {
        setWebhookUrl(json.data.siparis_webhook_url || '')
        setWebhookAktif(json.data.siparis_webhook_aktif || false)
        setWebhookSecret(json.data.siparis_webhook_secret || '')
      }
    } catch (err) {
      console.error('Webhook ayarları yüklenemedi:', err)
    }
    setShowWebhookModal(true)
  }

  const webhookKaydet = async () => {
    if (!restoranId) return
    if (webhookUrl && !webhookUrl.startsWith('http')) {
      toast.error('Webhook URL https:// ile başlamalı')
      return
    }
    setWebhookKaydediyor(true)
    try {
      const res = await fetch('/api/siparis-webhook/ayarlar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restoran_id: restoranId,
          siparis_webhook_url: webhookUrl,
          siparis_webhook_aktif: webhookAktif,
          siparis_webhook_secret: webhookSecret
        })
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Webhook ayarları kaydedildi ✓')
      } else {
        toast.error(json.error || 'Kayıt başarısız')
      }
    } catch (err) {
      toast.error('Kayıt sırasında hata oluştu')
    } finally {
      setWebhookKaydediyor(false)
    }
  }

  const webhookTestGonder = async () => {
    if (!restoranId || !webhookUrl) {
      toast.error('Önce webhook URL girin ve kaydedin')
      return
    }
    setWebhookTest(true)
    try {
      const sonSiparis = siparisler[0]
      if (!sonSiparis) {
        toast.error('Test için en az 1 sipariş gerekli')
        setWebhookTest(false)
        return
      }
      const res = await fetch('/api/siparis-webhook/gonder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siparis_id: sonSiparis.id,
          restoran_id: restoranId
        })
      })
      const json = await res.json()
      if (json.success) {
        toast.success(`Test webhook gönderildi! HTTP ${json.http_status}`)
      } else {
        toast.error(json.message || json.error || 'Test başarısız')
      }
    } catch (err) {
      toast.error('Test sırasında hata oluştu')
    } finally {
      setWebhookTest(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Kopyalandı!')
  }

  // ────────────────────────────────────────────────────────────────────────

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
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <PageHeader
        title="Siparişler"
        subtitle="Aktif sipariş yönetimi ve takibi"
        icon={<Receipt className="w-6 h-6" />}
      />

      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Actions */}
        <div className="flex items-center gap-2 mb-8">
          {/* Webhook Butonu */}
          <button
            onClick={webhookModalAc}
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/15 hover:bg-violet-500/25 border border-violet-500/30 hover:border-violet-500/60 text-violet-300 rounded-xl font-bold text-sm transition-all"
            title="Webhook Ayarları"
          >
            <Webhook className="w-4 h-4" />
            <span className="hidden sm:inline">Webhook</span>
            {webhookAktif && (
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            )}
          </button>
          {/* Yenile Butonu */}
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

      {/* ─── Webhook Ayarları Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showWebhookModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowWebhookModal(false)}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-zinc-900 rounded-2xl p-6 max-w-lg w-full border border-violet-500/30 shadow-2xl shadow-violet-500/10"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-500/15 rounded-xl">
                    <Webhook className="w-5 h-5 text-violet-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Sipariş Webhook Ayarları</h2>
                    <p className="text-xs text-zinc-400">Yeni sipariş geldiğinde kendi sisteminize bildirim gönderin</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWebhookModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all text-zinc-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Açıklama Kutusu */}
              <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 mb-5">
                <p className="text-sm text-violet-200 leading-relaxed">
                  Webhook aktif olduğunda, her yeni sipariş oluştuğunda belirlediğiniz URL&apos;ye otomatik olarak <strong>POST</strong> isteği gönderilir. Kendi POS sisteminize, Zapier&apos;e, Make&apos;e veya herhangi bir servise bağlayabilirsiniz.
                </p>
              </div>

              <div className="space-y-4">
                {/* Webhook URL */}
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-1.5">
                    Webhook URL <span className="text-red-400">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={webhookUrl}
                      onChange={e => setWebhookUrl(e.target.value)}
                      placeholder="https://sizin-sisteminiz.com/webhook"
                      className="flex-1 bg-zinc-800 border border-zinc-600 focus:border-violet-500 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors"
                    />
                    {webhookUrl && (
                      <button
                        onClick={() => copyToClipboard(webhookUrl)}
                        className="p-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-400 hover:text-white transition-all"
                        title="Kopyala"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">Örnek: https://hooks.zapier.com/hooks/catch/xxx</p>
                </div>

                {/* Secret Key */}
                <div>
                  <label className="block text-sm font-bold text-zinc-300 mb-1.5">
                    <Shield className="w-3.5 h-3.5 inline mr-1 text-zinc-400" />
                    Güvenlik Anahtarı (Opsiyonel)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type={showSecret ? 'text' : 'password'}
                      value={webhookSecret}
                      onChange={e => setWebhookSecret(e.target.value)}
                      placeholder="Gizli anahtar (isteğe bağlı)"
                      className="flex-1 bg-zinc-800 border border-zinc-600 focus:border-violet-500 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none transition-colors"
                    />
                    <button
                      onClick={() => setShowSecret(!showSecret)}
                      className="p-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-400 hover:text-white transition-all"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1">
                    Tanımlanırsa <code className="bg-zinc-800 px-1 rounded text-violet-300">Authorization: Bearer &lt;anahtar&gt;</code> header ile gönderilir
                  </p>
                </div>

                {/* Aktif Toggle */}
                <div className="flex items-center justify-between p-4 bg-zinc-800 rounded-xl border border-zinc-700">
                  <div>
                    <p className="font-bold text-sm text-white">Webhook Aktif</p>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {webhookAktif ? 'Her yeni siparişte bildirim gönderilecek' : 'Webhook şu an kapalı'}
                    </p>
                  </div>
                  <button
                    onClick={() => setWebhookAktif(!webhookAktif)}
                    className={`relative w-12 h-6 rounded-full transition-all ${webhookAktif ? 'bg-violet-500' : 'bg-zinc-600'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${webhookAktif ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                {/* Payload Örneği */}
                <details className="group">
                  <summary className="cursor-pointer text-xs font-bold text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1">
                    <ExternalLink className="w-3 h-3" />
                    Gönderilecek veri formatı (JSON örneği)
                  </summary>
                  <pre className="mt-2 bg-zinc-800 rounded-lg p-3 text-xs text-green-300 overflow-x-auto border border-zinc-700">{`{
  "event": "yeni_siparis",
  "timestamp": "2026-07-02T10:30:00Z",
  "restoran": { "id": "uuid", "ad": "Restoran Adı" },
  "siparis": {
    "id": "uuid",
    "masa": "Masa 3",
    "durum": "hazirlaniyor",
    "toplam_tutar": 150.00,
    "urunler": [
      { "ad": "Köfte", "adet": 2, "birim_fiyat": 75, "toplam": 150 }
    ]
  }
}`}</pre>
                </details>
              </div>

              {/* Butonlar */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={webhookTestGonder}
                  disabled={webhookTest || !webhookUrl}
                  className="flex items-center gap-2 px-4 py-2.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all border border-zinc-600"
                >
                  <Send className="w-4 h-4" />
                  {webhookTest ? 'Gönderiliyor...' : 'Test Et'}
                </button>
                <button
                  onClick={webhookKaydet}
                  disabled={webhookKaydediyor}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-sm transition-all"
                >
                  {webhookKaydediyor ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
