'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings, Link2, Unlink2, Copy, Check, AlertCircle, RefreshCw,
  Eye, EyeOff, Loader, CheckCircle2, XCircle, Clock, Zap
} from 'lucide-react'
import { toast } from 'sonner'

type YemeksepetiConnection = {
  id: string
  client_id: string
  client_secret: string
  chain_id: string | null
  vendor_id: string | null
  baglanti_aktif: boolean
  webhook_aktif: boolean
  son_senkronizasyon: string | null
  hata_mesaji: string | null
  token_expires_at: string | null
}

export default function YemeksepetiAyarlarPage() {
  const router = useRouter()
  const [connection, setConnection] = useState<YemeksepetiConnection | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [restoran, setRestoran] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      // Restoran bilgisi
      const { data: restoranData } = await supabase
        .from('restoranlar')
        .select('*')
        .eq('user_id', user.id)
        .single()
      setRestoran(restoranData)

      // Yemeksepeti bağlantısı
      const { data: connectionData } = await supabase
        .from('yemeksepeti_connections')
        .select('*')
        .eq('restoran_id', restoranData?.id)
        .single()

      if (connectionData) {
        setConnection(connectionData)
        setClientId(connectionData.client_id)
      }
    } catch (err) {
      console.error('Veri yükleme hatası:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async () => {
    if (!clientId || !clientSecret) {
      toast.error('Client ID ve Secret zorunlu')
      return
    }

    setConnecting(true)
    try {
      // Önce bağlantı kaydını oluştur
      const { data: newConnection, error: insertError } = await supabase
        .from('yemeksepeti_connections')
        .upsert({
          restoran_id: restoran.id,
          client_id: clientId,
          client_secret: clientSecret,
          baglanti_aktif: false,
          webhook_aktif: true
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Token'ı al
      const tokenResponse = await fetch('/api/yemeksepeti/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restoran_id: restoran.id,
          client_id: clientId,
          client_secret: clientSecret
        })
      })

      if (!tokenResponse.ok) {
        const error = await tokenResponse.json()
        throw new Error(error.details || 'Token alınamadı')
      }

      const tokenData = await tokenResponse.json()

      // Bağlantıyı aktif et
      await supabase
        .from('yemeksepeti_connections')
        .update({
          baglanti_aktif: true,
          son_senkronizasyon: new Date().toISOString()
        })
        .eq('restoran_id', restoran.id)

      setConnection(newConnection)
      toast.success('✅ Yemeksepeti bağlantısı kuruldu!')
      loadData()
    } catch (err: any) {
      console.error('Bağlantı hatası:', err)
      toast.error(`Bağlantı başarısız: ${err.message}`)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    if (!window.confirm('Yemeksepeti bağlantısını kaldırmak istediğine emin misin?')) return

    try {
      await supabase
        .from('yemeksepeti_connections')
        .update({ baglanti_aktif: false })
        .eq('restoran_id', restoran.id)

      setConnection(null)
      setClientId('')
      setClientSecret('')
      toast.success('Bağlantı kaldırıldı')
      loadData()
    } catch (err) {
      toast.error('Bağlantı kaldırılamadı')
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} kopyalandı`)
  }

  const getWebhookUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/yemeksepeti/webhook`
    }
    return 'https://YOUR_DOMAIN/api/yemeksepeti/webhook'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Yemeksepeti Ayarları" icon={<Zap className="w-6 h-6" />} />
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-zinc-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Yemeksepeti Entegrasyonu"
        subtitle="Yemeksepeti siparişlerini yönetin"
        icon={<Settings className="w-6 h-6" />}
      />

      <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-8">
        {/* Bağlantı Durumu */}
        {connection?.baglanti_aktif ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-white mb-2">✅ Bağlı</h3>
                <p className="text-sm text-white/70 mb-4">
                  Yemeksepeti siparişleri otomatik olarak alınıyor.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-white/50">Chain ID</p>
                    <p className="font-bold text-white">{connection.chain_id || 'Bekleniyor...'}</p>
                  </div>
                  <div>
                    <p className="text-white/50">Vendor ID</p>
                    <p className="font-bold text-white">{connection.vendor_id || 'Bekleniyor...'}</p>
                  </div>
                  {connection.son_senkronizasyon && (
                    <div>
                      <p className="text-white/50">Son Senkronizasyon</p>
                      <p className="font-bold text-white">
                        {new Date(connection.son_senkronizasyon).toLocaleTimeString('tr-TR')}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-300 rounded-lg font-bold transition-all"
                >
                  <Unlink2 className="w-4 h-4 inline mr-2" />
                  Bağlantıyı Kaldır
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20 p-6"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-500/20 rounded-xl flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="font-black text-white mb-1">⚠️ Bağlı Değil</h3>
                <p className="text-sm text-white/70">
                  Yemeksepeti siparişlerini almak için bağlantı kur.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Bağlantı Formu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-zinc-800/50 border border-white/10 p-6"
        >
          <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
            <Link2 className="w-6 h-6 text-primary" />
            Bağlantı Bilgileri
          </h2>

          <div className="space-y-4">
            {/* Client ID */}
            <div>
              <label className="block text-sm font-bold text-white/70 mb-2">
                Client ID
              </label>
              <input
                type="text"
                value={clientId}
                onChange={e => setClientId(e.target.value)}
                placeholder="Yemeksepeti Partner Portal'dan al"
                disabled={connection?.baglanti_aktif}
                className="w-full px-4 py-3 rounded-xl bg-zinc-700/50 border border-white/10 text-white placeholder-white/30 disabled:opacity-50"
              />
              <p className="text-xs text-white/50 mt-1">
                https://partner.yemeksepeti.com → Ayarlar → API Anahtarları
              </p>
            </div>

            {/* Client Secret */}
            <div>
              <label className="block text-sm font-bold text-white/70 mb-2">
                Client Secret
              </label>
              <div className="relative">
                <input
                  type={showSecret ? 'text' : 'password'}
                  value={clientSecret}
                  onChange={e => setClientSecret(e.target.value)}
                  placeholder="Yemeksepeti Partner Portal'dan al"
                  disabled={connection?.baglanti_aktif}
                  className="w-full px-4 py-3 rounded-xl bg-zinc-700/50 border border-white/10 text-white placeholder-white/30 disabled:opacity-50"
                />
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                >
                  {showSecret ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <p className="text-xs text-white/50 mt-1">
                ⚠️ Bunu kimseyle paylaşma! Sadece Restoran Pro'da sakla.
              </p>
            </div>

            {/* Bağlan Butonu */}
            {!connection?.baglanti_aktif && (
              <button
                onClick={handleConnect}
                disabled={connecting || !clientId || !clientSecret}
                className="w-full px-6 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:opacity-50 text-white font-black rounded-xl transition-all flex items-center justify-center gap-2"
              >
                {connecting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Bağlanıyor...
                  </>
                ) : (
                  <>
                    <Link2 className="w-5 h-5" />
                    Yemeksepeti'ye Bağlan
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>

        {/* Webhook Bilgileri */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-zinc-800/50 border border-white/10 p-6"
        >
          <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-cyan-400" />
            Webhook Ayarları
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-white/70 mb-2">
                Webhook URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={getWebhookUrl()}
                  readOnly
                  className="flex-1 px-4 py-3 rounded-xl bg-zinc-700/50 border border-white/10 text-white/60 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(getWebhookUrl(), 'Webhook URL')}
                  className="px-4 py-3 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-xl transition-all"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-white/50 mt-2">
                💡 Bu URL'yi Yemeksepeti Partner Portal'da Webhook ayarlarına yapıştır.
              </p>
            </div>

            {/* Webhook Durumu */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white/70">Webhook Durumu</span>
                <div className="flex items-center gap-2">
                  {connection?.webhook_aktif ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <span className="text-xs font-bold text-green-400">Aktif</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-xs font-bold text-red-400">Pasif</span>
                    </>
                  )}
                </div>
              </div>
              <p className="text-xs text-white/50">
                Yemeksepeti'den gelen siparişler bu webhook aracılığıyla alınır.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Kurulum Adımları */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 p-6"
        >
          <h2 className="text-xl font-black text-white mb-6">📋 Kurulum Adımları</h2>
          <div className="space-y-3">
            {[
              '1. Yemeksepeti Partner Portal\'da API anahtarlarını oluştur',
              '2. Client ID ve Secret\'ı yukarıya yapıştır',
              '3. "Yemeksepeti\'ye Bağlan" butonuna tıkla',
              '4. Webhook URL\'sini Yemeksepeti\'de ayarla',
              '5. Test siparişi gönder ve kontrol et'
            ].map((step, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-violet-500/20 border border-violet-500/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-black text-violet-300">{idx + 1}</span>
                </div>
                <p className="text-sm text-white/70 pt-0.5">{step}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Detaylı Rehber */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-zinc-800/50 border border-white/10 p-6"
        >
          <h2 className="text-xl font-black text-white mb-4">📚 Detaylı Rehber</h2>
          <p className="text-sm text-white/70 mb-4">
            Adım adım kurulum talimatları için:
          </p>
          <a
            href="/YEMEKSEPETI_KURULUM_REHBERI.md"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-xl font-bold transition-all"
          >
            📖 Detaylı Rehberi Aç
          </a>
        </motion.div>
      </div>
    </div>
  )
}
