'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import { motion } from 'framer-motion'
import {
  Send, Loader, CheckCircle2, AlertCircle, Copy, RefreshCw, Zap
} from 'lucide-react'
import { toast } from 'sonner'

export default function TestPanelPage() {
  const router = useRouter()
  const [restoran, setRestoran] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])
  const [chainId, setChainId] = useState(`test-chain-${Date.now()}`)
  const [vendorId, setVendorId] = useState(`test-vendor-${Date.now()}`)

  useEffect(() => {
    loadRestoran()
  }, [])

  const loadRestoran = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const { data: restoranData } = await supabase
        .from('restoranlar')
        .select('*')
        .eq('sahibi_id', user.id)
        .single()
      setRestoran(restoranData)
    } catch (err) {
      console.error('Restoran yükleme hatası:', err)
    } finally {
      setLoading(false)
    }
  }

  const sendWebhook = async (action: string) => {
    setSending(true)
    try {
      const response = await fetch('/api/test/webhook-simulator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          chain_id: chainId,
          vendor_id: vendorId
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      const result = {
        id: Date.now(),
        action,
        status: 'success',
        timestamp: new Date().toLocaleTimeString('tr-TR'),
        payload: data.payload,
        response: data.response
      }

      setTestResults([result, ...testResults])
      toast.success(`✅ ${action} webhook'u gönderildi`)
    } catch (err: any) {
      console.error('Webhook hatası:', err)
      const result = {
        id: Date.now(),
        action,
        status: 'error',
        timestamp: new Date().toLocaleTimeString('tr-TR'),
        error: err.message
      }
      setTestResults([result, ...testResults])
      toast.error(`❌ ${action} başarısız: ${err.message}`)
    } finally {
      setSending(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Kopyalandı')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Test Paneli" icon={<Zap className="w-6 h-6" />} />
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <div className="h-96 bg-zinc-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Test Paneli"
        subtitle="Webhook'ları test et ve simüle et"
        icon={<Zap className="w-6 h-6" />}
      />

      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8">
        {/* Webhook Simulator */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-zinc-800/50 border border-white/10 p-6"
        >
          <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
            <Send className="w-6 h-6 text-primary" />
            Webhook Simulator
          </h2>

          {/* Chain ve Vendor ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-bold text-white/70 mb-2">
                Chain ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chainId}
                  onChange={e => setChainId(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl bg-zinc-700/50 border border-white/10 text-white text-sm"
                />
                <button
                  onClick={() => copyToClipboard(chainId)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/60 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-white/70 mb-2">
                Vendor ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={vendorId}
                  onChange={e => setVendorId(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-xl bg-zinc-700/50 border border-white/10 text-white text-sm"
                />
                <button
                  onClick={() => copyToClipboard(vendorId)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-all text-white/60 hover:text-white"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Test Butonları */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              { action: 'order_created', label: '📦 Yeni Sipariş', color: 'from-green-500 to-green-600' },
              { action: 'order_updated', label: '🔄 Sipariş Güncelle', color: 'from-blue-500 to-blue-600' },
              { action: 'order_cancelled', label: '❌ Sipariş İptal', color: 'from-red-500 to-red-600' }
            ].map(item => (
              <motion.button
                key={item.action}
                onClick={() => sendWebhook(item.action)}
                disabled={sending}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-4 py-3 bg-gradient-to-r ${item.color} hover:shadow-lg hover:shadow-current/20 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2`}
              >
                {sending ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Gönderiliyor...
                  </>
                ) : (
                  item.label
                )}
              </motion.button>
            ))}
          </div>

          {/* Bilgi */}
          <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-xs text-white/60">
              💡 <strong>İpucu:</strong> Chain ID ve Vendor ID'yi Yemeksepeti bağlantısında kullandığın değerlerle değiştirebilirsin. Test webhook'ları gerçek siparişler gibi işlenir.
            </p>
          </div>
        </motion.div>

        {/* Test Sonuçları */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-zinc-800/50 border border-white/10 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <RefreshCw className="w-6 h-6 text-cyan-400" />
              Test Sonuçları
            </h2>
            {testResults.length > 0 && (
              <button
                onClick={() => setTestResults([])}
                className="px-3 py-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 text-white/70 hover:text-white rounded-lg transition-all"
              >
                Temizle
              </button>
            )}
          </div>

          {testResults.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 mx-auto text-white/20 mb-3" />
              <p className="text-white/40">Henüz test webhook'u gönderilmedi</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {testResults.map(result => (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 rounded-xl border ${
                    result.status === 'success'
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {result.status === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-white">{result.action}</span>
                        <span className="text-xs text-white/50">{result.timestamp}</span>
                      </div>
                      {result.status === 'success' ? (
                        <p className="text-xs text-green-300">✅ Başarılı</p>
                      ) : (
                        <p className="text-xs text-red-300">❌ {result.error}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Kurulum Talimatları */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 p-6"
        >
          <h2 className="text-xl font-black text-white mb-4">📋 Test Adımları</h2>
          <div className="space-y-3 text-sm text-white/70">
            <p>
              <strong className="text-white">1.</strong> Yukarıdaki butonlardan birini tıkla (örn: "Yeni Sipariş")
            </p>
            <p>
              <strong className="text-white">2.</strong> Webhook başarılı mesajını gör
            </p>
            <p>
              <strong className="text-white">3.</strong> Siparişler sayfasına git → "Yemeksepeti Siparişleri" sekmesine bak
            </p>
            <p>
              <strong className="text-white">4.</strong> Test siparişini görebilirsin ✅
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
