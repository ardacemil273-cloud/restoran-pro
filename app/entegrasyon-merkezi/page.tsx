'use client'
import { useEffect, useState } from 'react'
import {
  Settings, Link2, Unlink2, Copy, Check, AlertCircle, RefreshCw,
  Eye, EyeOff, Loader, CheckCircle2, XCircle, Clock, Zap,
  Package, Truck, BarChart3, Info, ExternalLink, Globe, Smartphone,
  ChevronDown, ChevronUp, Shield, Key, Webhook, ArrowRight, Star,
  BookOpen, HelpCircle, ToggleLeft, ToggleRight, Wifi, WifiOff
} from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

type Platform = 'yemeksepeti' | 'getiryemek' | 'trendyolyemek'

interface ConnectionStatus {
  yemeksepeti: boolean
  getiryemek: boolean
  trendyolyemek: boolean
}

export default function EntegrasyonMerkeziPage() {
  const [loading, setLoading] = useState(true)
  const [restoran, setRestoran] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<Platform>('yemeksepeti')
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    yemeksepeti: false,
    getiryemek: false,
    trendyolyemek: false,
  })
  const router = useRouter()

  // Yemeksepeti State
  const [ysClientId, setYsClientId] = useState('')
  const [ysClientSecret, setYsClientSecret] = useState('')
  const [ysShowSecret, setYsShowSecret] = useState(false)
  const [ysConnecting, setYsConnecting] = useState(false)
  const [ysDisconnecting, setYsDisconnecting] = useState(false)

  // GetirYemek State
  const [getirAppSecret, setGetirAppSecret] = useState('')
  const [getirRestaurantSecret, setGetirRestaurantSecret] = useState('')
  const [getirShowSecret, setGetirShowSecret] = useState(false)
  const [getirConnecting, setGetirConnecting] = useState(false)
  const [getirDisconnecting, setGetirDisconnecting] = useState(false)

  // Trendyol State
  const [trendyolSupplierId, setTrendyolSupplierId] = useState('')
  const [trendyolApiKey, setTrendyolApiKey] = useState('')
  const [trendyolApiSecret, setTrendyolApiSecret] = useState('')
  const [trendyolShowSecret, setTrendyolShowSecret] = useState(false)
  const [trendyolConnecting, setTrendyolConnecting] = useState(false)
  const [trendyolDisconnecting, setTrendyolDisconnecting] = useState(false)

  const [copied, setCopied] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState<Platform | null>(null)

  const [origin, setOrigin] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const { data: restoranData, error: restError } = await supabase
        .from('restoranlar')
        .select('*')
        .eq('sahibi_id', user.id)
        .maybeSingle()

      if (!restoranData) {
        // Hata varsa veya veri yoksa user_id ile tekrar dene (Schema Cache hatası için)
        const { data: retryData } = await supabase
          .from('restoranlar')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
        
        if (!retryData) return router.push('/masalar')
        setRestoran(retryData)
      } else {
        setRestoran(restoranData)
      }
      setRestoran(restoranData)

      // Yemeksepeti
      const { data: ysData } = await supabase
        .from('yemeksepeti_connections')
        .select('*')
        .eq('restoran_id', restoranData.id)
        .maybeSingle()
      if (ysData) {
        setYsClientId(ysData.client_id || '')
        setConnectionStatus(prev => ({ ...prev, yemeksepeti: !!ysData.baglanti_aktif }))
      }

      // GetirYemek
      const { data: getirData } = await supabase
        .from('getir_yemek_connections')
        .select('*')
        .eq('restoran_id', restoranData.id)
        .maybeSingle()
      if (getirData) {
        setGetirAppSecret(getirData.getir_restaurant_id || '')
        setGetirRestaurantSecret(getirData.api_key || '')
        setConnectionStatus(prev => ({ ...prev, getiryemek: !!getirData.baglanti_aktif }))
      }

      // Trendyol
      const { data: trendyolData } = await supabase
        .from('trendyol_yemek_connections')
        .select('*')
        .eq('restoran_id', restoranData.id)
        .maybeSingle()
      if (trendyolData) {
        setTrendyolSupplierId(trendyolData.integrator_token || '')
        setTrendyolApiKey(trendyolData.api_key || '')
        setConnectionStatus(prev => ({ ...prev, trendyolyemek: !!trendyolData.baglanti_aktif }))
      }

    } catch (err) {
      console.error('Yükleme hatası:', err)
      toast.error('Veriler yüklenirken hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    toast.success('Kopyalandı!')
    setTimeout(() => setCopied(null), 2000)
  }

  const getWebhookUrl = (platform: Platform) => {
    const urlMap: Record<Platform, string> = {
      yemeksepeti: `${origin}/api/yemeksepeti/webhook`,
      getiryemek: `${origin}/api/getir-yemek/webhook`,
      trendyolyemek: `${origin}/api/trendyol-yemek/webhook`,
    }
    return urlMap[platform]
  }

  // Yemeksepeti Bağla
  const handleYsConnect = async () => {
    if (!ysClientId.trim() || !ysClientSecret.trim()) {
      return toast.error('Client ID ve Client Secret zorunludur')
    }
    setYsConnecting(true)
    try {
      const { error } = await supabase.from('yemeksepeti_connections').upsert({
        restoran_id: restoran.id,
        client_id: ysClientId.trim(),
        client_secret: ysClientSecret.trim(),
        baglanti_aktif: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'restoran_id' })
      if (error) throw error
      toast.success('✅ Yemeksepeti başarıyla bağlandı!')
      setConnectionStatus(prev => ({ ...prev, yemeksepeti: true }))
    } catch (err: any) {
      toast.error('Bağlantı hatası: ' + (err.message || 'Bilinmeyen hata'))
    } finally {
      setYsConnecting(false)
    }
  }

  // Yemeksepeti Bağlantıyı Kes
  const handleYsDisconnect = async () => {
    setYsDisconnecting(true)
    try {
      const { error } = await supabase
        .from('yemeksepeti_connections')
        .update({ baglanti_aktif: false })
        .eq('restoran_id', restoran.id)
      if (error) throw error
      toast.success('Yemeksepeti bağlantısı kesildi')
      setConnectionStatus(prev => ({ ...prev, yemeksepeti: false }))
    } catch (err: any) {
      toast.error('Hata: ' + (err.message || 'Bilinmeyen hata'))
    } finally {
      setYsDisconnecting(false)
    }
  }

  // GetirYemek Bağla
  const handleGetirConnect = async () => {
    if (!getirAppSecret.trim() || !getirRestaurantSecret.trim()) {
      return toast.error('App Secret Key ve Restaurant Secret Key zorunludur')
    }
    setGetirConnecting(true)
    try {
      const { error } = await supabase.from('getir_yemek_connections').upsert({
        restoran_id: restoran.id,
        getir_restaurant_id: getirAppSecret.trim(),
        api_key: getirRestaurantSecret.trim(),
        baglanti_aktif: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'restoran_id' })
      if (error) throw error
      toast.success('✅ GetirYemek başarıyla bağlandı!')
      setConnectionStatus(prev => ({ ...prev, getiryemek: true }))
    } catch (err: any) {
      toast.error('Bağlantı hatası: ' + (err.message || 'Bilinmeyen hata'))
    } finally {
      setGetirConnecting(false)
    }
  }

  // GetirYemek Bağlantıyı Kes
  const handleGetirDisconnect = async () => {
    setGetirDisconnecting(true)
    try {
      const { error } = await supabase
        .from('getir_yemek_connections')
        .update({ baglanti_aktif: false })
        .eq('restoran_id', restoran.id)
      if (error) throw error
      toast.success('GetirYemek bağlantısı kesildi')
      setConnectionStatus(prev => ({ ...prev, getiryemek: false }))
    } catch (err: any) {
      toast.error('Hata: ' + (err.message || 'Bilinmeyen hata'))
    } finally {
      setGetirDisconnecting(false)
    }
  }

  // Trendyol Bağla
  const handleTrendyolConnect = async () => {
    if (!trendyolSupplierId.trim() || !trendyolApiKey.trim()) {
      return toast.error('Supplier ID ve API Key zorunludur')
    }
    setTrendyolConnecting(true)
    try {
      const { error } = await supabase.from('trendyol_yemek_connections').upsert({
        restoran_id: restoran.id,
        integrator_token: trendyolSupplierId.trim(),
        api_key: trendyolApiKey.trim() + (trendyolApiSecret.trim() ? ':' + trendyolApiSecret.trim() : ''),
        baglanti_aktif: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'restoran_id' })
      if (error) throw error
      toast.success('✅ Trendyol Yemek başarıyla bağlandı!')
      setConnectionStatus(prev => ({ ...prev, trendyolyemek: true }))
    } catch (err: any) {
      toast.error('Bağlantı hatası: ' + (err.message || 'Bilinmeyen hata'))
    } finally {
      setTrendyolConnecting(false)
    }
  }

  // Trendyol Bağlantıyı Kes
  const handleTrendyolDisconnect = async () => {
    setTrendyolDisconnecting(true)
    try {
      const { error } = await supabase
        .from('trendyol_yemek_connections')
        .update({ baglanti_aktif: false })
        .eq('restoran_id', restoran.id)
      if (error) throw error
      toast.success('Trendyol Yemek bağlantısı kesildi')
      setConnectionStatus(prev => ({ ...prev, trendyolyemek: false }))
    } catch (err: any) {
      toast.error('Hata: ' + (err.message || 'Bilinmeyen hata'))
    } finally {
      setTrendyolDisconnecting(false)
    }
  }

  const connectedCount = Object.values(connectionStatus).filter(Boolean).length

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin w-10 h-10 text-primary mx-auto mb-3" />
          <p className="text-white/40">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  const platforms = [
    {
      id: 'yemeksepeti' as Platform,
      label: 'Yemeksepeti',
      emoji: '🍽️',
      color: 'pink',
      bgColor: 'bg-pink-600',
      hoverColor: 'hover:bg-pink-500',
      borderColor: 'border-pink-500/30',
      focusColor: 'focus:border-pink-500/50',
      shadowColor: 'shadow-pink-600/20',
      badgeColor: 'bg-pink-500/20 text-pink-400',
    },
    {
      id: 'getiryemek' as Platform,
      label: 'GetirYemek',
      emoji: '🚗',
      color: 'purple',
      bgColor: 'bg-purple-600',
      hoverColor: 'hover:bg-purple-500',
      borderColor: 'border-purple-500/30',
      focusColor: 'focus:border-purple-500/50',
      shadowColor: 'shadow-purple-600/20',
      badgeColor: 'bg-purple-500/20 text-purple-400',
    },
    {
      id: 'trendyolyemek' as Platform,
      label: 'Trendyol Yemek',
      emoji: '🧡',
      color: 'orange',
      bgColor: 'bg-orange-600',
      hoverColor: 'hover:bg-orange-500',
      borderColor: 'border-orange-500/30',
      focusColor: 'focus:border-orange-500/50',
      shadowColor: 'shadow-orange-600/20',
      badgeColor: 'bg-orange-500/20 text-orange-400',
    },
  ]

  const activePlatform = platforms.find(p => p.id === activeTab)!
  const isConnected = connectionStatus[activeTab]

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8 pb-28">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-primary/20 rounded-2xl flex items-center justify-center">
              <Globe className="text-primary w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">Entegrasyon Merkezi</h1>
              <p className="text-white/40 text-sm">Yemek platformlarını bağla, siparişleri otomatik al</p>
            </div>
          </div>

          {/* Genel Durum */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
              connectedCount > 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/5 text-white/40 border border-white/10'
            }`}>
              {connectedCount > 0 ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              {connectedCount} / 3 Platform Bağlı
            </div>
            {platforms.map(p => (
              <div key={p.id} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
                connectionStatus[p.id]
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/5 text-white/30'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${connectionStatus[p.id] ? 'bg-green-400' : 'bg-white/20'}`} />
                {p.emoji} {p.label}
              </div>
            ))}
          </div>
        </header>

        {/* Platform Sekmeleri */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {platforms.map(platform => (
            <button
              key={platform.id}
              onClick={() => setActiveTab(platform.id)}
              className={`relative px-5 py-3 rounded-xl font-black transition-all text-sm flex items-center gap-2 ${
                activeTab === platform.id
                  ? `${platform.bgColor} text-white shadow-lg shadow-${platform.color}-600/20`
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <span>{platform.emoji}</span>
              <span>{platform.label}</span>
              {connectionStatus[platform.id] && (
                <span className="w-2 h-2 bg-green-400 rounded-full absolute -top-0.5 -right-0.5 ring-2 ring-background" />
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ana İçerik */}
          <div className="lg:col-span-2 space-y-5 relative min-h-[700px]">

            {/* Bağlantı Durumu Kartı */}
            <div className={`rounded-2xl p-4 border flex items-center justify-between relative z-10 mb-4 ${
              isConnected
                ? 'bg-green-500/10 border-green-500/30'
                : 'bg-white/5 border-white/10'
            }`}>
              <div className="flex items-center gap-3">
                {isConnected ? (
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-white/30" />
                )}
                <div>
                  <p className={`font-black text-sm ${isConnected ? 'text-green-400' : 'text-white/50'}`}>
                    {isConnected ? `${activePlatform.emoji} ${activePlatform.label} Bağlı` : `${activePlatform.emoji} ${activePlatform.label} Bağlı Değil`}
                  </p>
                  <p className="text-xs text-white/30">
                    {isConnected ? 'Siparişler otomatik olarak alınıyor' : 'Bağlanmak için aşağıdaki bilgileri girin'}
                  </p>
                </div>
              </div>
              {isConnected && (
                <button
                  onClick={activeTab === 'yemeksepeti' ? handleYsDisconnect : activeTab === 'getiryemek' ? handleGetirDisconnect : handleTrendyolDisconnect}
                  disabled={ysDisconnecting || getirDisconnecting || trendyolDisconnecting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl text-xs font-bold transition-all border border-red-500/20"
                >
                  {(ysDisconnecting || getirDisconnecting || trendyolDisconnecting) ? (
                    <Loader className="w-3 h-3 animate-spin" />
                  ) : (
                    <Unlink2 className="w-3 h-3" />
                  )}
                  Bağlantıyı Kes
                </button>
              )}
            </div>

            {/* Form Alanı Container */}
            <div className="relative">
              <AnimatePresence mode="wait">
                {activeTab === 'yemeksepeti' && (
                  <motion.div
                    key="yemeksepeti"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                    className="bg-card border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 absolute inset-x-0 top-0 z-20"
                  >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-pink-500/20 rounded-xl flex items-center justify-center text-xl">🍽️</div>
                  <div>
                    <h2 className="text-xl font-black text-white">Yemeksepeti Bağlantısı</h2>
                    <p className="text-xs text-white/40">Partner Portal API bilgilerini girin</p>
                  </div>
                </div>

                {/* Rehber */}
                <button
                  onClick={() => setShowGuide(showGuide === 'yemeksepeti' ? null : 'yemeksepeti')}
                  className="w-full flex items-center justify-between p-3 bg-pink-500/10 border border-pink-500/20 rounded-xl text-sm font-bold text-pink-400 hover:bg-pink-500/20 transition-all"
                >
                  <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> API Bilgilerini Nasıl Alırım?</span>
                  {showGuide === 'yemeksepeti' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showGuide === 'yemeksepeti' && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">1</span>
                      <div>
                        <p className="text-sm font-bold text-white">Partner Portal'a giriş yapın</p>
                        <a href="https://partner.yemeksepeti.com" target="_blank" rel="noopener noreferrer" className="text-xs text-pink-400 underline flex items-center gap-1 mt-0.5">
                          partner.yemeksepeti.com <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">2</span>
                      <div>
                        <p className="text-sm font-bold text-white">Ayarlar &gt; API &amp; Webhook bölümüne gidin</p>
                        <p className="text-xs text-white/40 mt-0.5">Sol menüden "Ayarlar" seçeneğine tıklayın</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">3</span>
                      <div>
                        <p className="text-sm font-bold text-white">Shop Integrations Plugin bölümünden alın</p>
                        <p className="text-xs text-white/40 mt-0.5">Client ID ve Client Secret değerlerini kopyalayın</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-pink-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">4</span>
                      <div>
                        <p className="text-sm font-bold text-white">Webhook URL'yi Yemeksepeti paneline ekleyin</p>
                        <p className="text-xs text-white/40 mt-0.5">Aşağıdaki Webhook URL'yi kopyalayıp panele yapıştırın</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                      <Key className="w-3 h-3" /> Client ID
                    </label>
                    <input
                      type="text"
                      value={ysClientId}
                      onChange={e => setYsClientId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-pink-500/50 outline-none transition-all text-sm placeholder:text-white/20"
                      placeholder="Örn: abc123def456..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Client Secret
                    </label>
                    <div className="relative">
                      <input
                        type={ysShowSecret ? 'text' : 'password'}
                        value={ysClientSecret}
                        onChange={e => setYsClientSecret(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white focus:border-pink-500/50 outline-none transition-all text-sm placeholder:text-white/20 relative z-10"
                        placeholder="••••••••••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setYsShowSecret(!ysShowSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-all z-20 p-1"
                      >
                        {ysShowSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleYsConnect}
                  disabled={ysConnecting}
                  className="w-full bg-pink-600 hover:bg-pink-500 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-600/20"
                >
                  {ysConnecting ? <Loader className="animate-spin w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                  {isConnected ? 'Bilgileri Güncelle' : 'Yemeksepeti Hesabını Bağla'}
                </button>
              </motion.div>
            )}

            {/* GetirYemek Formu */}
            {activeTab === 'getiryemek' && (
              <motion.div
                key="getiryemek"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-card border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 absolute inset-x-0 top-0 z-20"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center text-xl">🚗</div>
                  <div>
                    <h2 className="text-xl font-black text-white">GetirYemek Bağlantısı</h2>
                    <p className="text-xs text-white/40">Getir Restoran Paneli POS bilgilerini girin</p>
                  </div>
                </div>

                {/* Rehber */}
                <button
                  onClick={() => setShowGuide(showGuide === 'getiryemek' ? null : 'getiryemek')}
                  className="w-full flex items-center justify-between p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-sm font-bold text-purple-400 hover:bg-purple-500/20 transition-all"
                >
                  <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> API Bilgilerini Nasıl Alırım?</span>
                  {showGuide === 'getiryemek' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showGuide === 'getiryemek' && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">1</span>
                      <div>
                        <p className="text-sm font-bold text-white">Getir Restoran Paneli'ne giriş yapın</p>
                        <a href="https://restoran.getiryemek.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-purple-400 underline flex items-center gap-1 mt-0.5">
                          restoran.getiryemek.com <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">2</span>
                      <div>
                        <p className="text-sm font-bold text-white">Ayarlar &gt; POS Yönetimi bölümüne gidin</p>
                        <p className="text-xs text-white/40 mt-0.5">Sol menüden "Ayarlar" seçeneğine tıklayın</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">3</span>
                      <div>
                        <p className="text-sm font-bold text-white">App Secret Key ve Restaurant Secret Key'i kopyalayın</p>
                        <p className="text-xs text-white/40 mt-0.5">Her iki değeri de aşağıdaki alanlara yapıştırın</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">4</span>
                      <div>
                        <p className="text-sm font-bold text-white">Webhook URL'yi Getir paneline ekleyin</p>
                        <p className="text-xs text-white/40 mt-0.5">POS Yönetimi &gt; Webhook URL alanına yapıştırın</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                      <Key className="w-3 h-3" /> App Secret Key
                    </label>
                    <input
                      type="text"
                      value={getirAppSecret}
                      onChange={e => setGetirAppSecret(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-purple-500/50 outline-none transition-all text-sm placeholder:text-white/20"
                      placeholder="App Secret Key girin..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Restaurant Secret Key
                    </label>
                    <div className="relative">
                      <input
                        type={getirShowSecret ? 'text' : 'password'}
                        value={getirRestaurantSecret}
                        onChange={e => setGetirRestaurantSecret(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white focus:border-purple-500/50 outline-none transition-all text-sm placeholder:text-white/20 relative z-10"
                        placeholder="••••••••••••••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setGetirShowSecret(!getirShowSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-all z-20 p-1"
                      >
                        {getirShowSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleGetirConnect}
                  disabled={getirConnecting}
                  className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20"
                >
                  {getirConnecting ? <Loader className="animate-spin w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                  {isConnected ? 'Bilgileri Güncelle' : 'GetirYemek Hesabını Bağla'}
                </button>
              </motion.div>
            )}

            {/* Trendyol Formu */}
            {activeTab === 'trendyolyemek' && (
              <motion.div
                key="trendyolyemek"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className="bg-card border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 absolute inset-x-0 top-0 z-20"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center text-xl">🧡</div>
                  <div>
                    <h2 className="text-xl font-black text-white">Trendyol Yemek Bağlantısı</h2>
                    <p className="text-xs text-white/40">Trendyol Partner Paneli entegrasyon bilgilerini girin</p>
                  </div>
                </div>

                {/* Rehber */}
                <button
                  onClick={() => setShowGuide(showGuide === 'trendyolyemek' ? null : 'trendyolyemek')}
                  className="w-full flex items-center justify-between p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-sm font-bold text-orange-400 hover:bg-orange-500/20 transition-all"
                >
                  <span className="flex items-center gap-2"><BookOpen className="w-4 h-4" /> API Bilgilerini Nasıl Alırım?</span>
                  {showGuide === 'trendyolyemek' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showGuide === 'trendyolyemek' && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">1</span>
                      <div>
                        <p className="text-sm font-bold text-white">Trendyol Partner Paneli'ne giriş yapın</p>
                        <a href="https://partner.trendyol.com/" target="_blank" rel="noopener noreferrer" className="text-xs text-orange-400 underline flex items-center gap-1 mt-0.5">
                          partner.trendyol.com <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">2</span>
                      <div>
                        <p className="text-sm font-bold text-white">Hesap Bilgilerim &gt; Entegrasyon Bilgileri</p>
                        <p className="text-xs text-white/40 mt-0.5">Sağ üst köşedeki profil menüsünden ulaşabilirsiniz</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">3</span>
                      <div>
                        <p className="text-sm font-bold text-white">Supplier ID, API Key ve API Secret'ı kopyalayın</p>
                        <p className="text-xs text-white/40 mt-0.5">Üç değeri de aşağıdaki alanlara ayrı ayrı yapıştırın</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 mt-0.5">4</span>
                      <div>
                        <p className="text-sm font-bold text-white">Webhook URL'yi Trendyol paneline ekleyin</p>
                        <p className="text-xs text-white/40 mt-0.5">Entegrasyon Bilgileri &gt; Webhook URL alanına yapıştırın</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                      <Key className="w-3 h-3" /> Supplier ID
                    </label>
                    <input
                      type="text"
                      value={trendyolSupplierId}
                      onChange={e => setTrendyolSupplierId(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 outline-none transition-all text-sm placeholder:text-white/20"
                      placeholder="Örn: 123456"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                      <Key className="w-3 h-3" /> API Key
                    </label>
                    <input
                      type="text"
                      value={trendyolApiKey}
                      onChange={e => setTrendyolApiKey(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 outline-none transition-all text-sm placeholder:text-white/20"
                      placeholder="API Key girin..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-white/50 mb-1.5 uppercase tracking-wider flex items-center gap-1">
                      <Shield className="w-3 h-3" /> API Secret
                    </label>
                    <div className="relative">
                      <input
                        type={trendyolShowSecret ? 'text' : 'password'}
                        value={trendyolApiSecret}
                        onChange={e => setTrendyolApiSecret(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-12 text-white focus:border-orange-500/50 outline-none transition-all text-sm placeholder:text-white/20"
                        placeholder="••••••••••••••••••••"
                      />
                      <button
                        onClick={() => setTrendyolShowSecret(!trendyolShowSecret)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-all"
                      >
                        {trendyolShowSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleTrendyolConnect}
                  disabled={trendyolConnecting}
                  className="w-full bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-black py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-600/20"
                >
                  {trendyolConnecting ? <Loader className="animate-spin w-5 h-5" /> : <Link2 className="w-5 h-5" />}
                  {isConnected ? 'Bilgileri Güncelle' : 'Trendyol Yemek Hesabını Bağla'}
                </button>
              </motion.div>
            )}
            </AnimatePresence>
            </div>

            {/* Webhook URL Kartı */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <h3 className="text-base font-black text-white mb-1 flex items-center gap-2">
                <Webhook className="w-4 h-4 text-primary" />
                Webhook URL
              </h3>
              <p className="text-xs text-white/40 mb-4">
                Bu URL'yi <strong className="text-white/60">{activePlatform.emoji} {activePlatform.label}</strong> panelindeki Webhook/POS ayarlarına yapıştırın.
              </p>
              <div className="flex gap-2">
                <code className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-primary text-xs font-mono overflow-x-auto whitespace-nowrap">
                  {getWebhookUrl(activeTab)}
                </code>
                <button
                  onClick={() => copyToClipboard(getWebhookUrl(activeTab), 'webhook')}
                  className="flex-shrink-0 p-3 bg-white/10 hover:bg-white/20 rounded-xl transition-all"
                >
                  {copied === 'webhook' ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-white/60" />}
                </button>
              </div>
            </div>
          </div>

          {/* Sağ Sidebar */}
          <div className="space-y-5">
            {/* Tüm Platformlar Durumu */}
            <div className="bg-card border border-white/10 rounded-2xl p-5 sticky top-8">
              <h3 className="text-base font-black text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Platform Durumları
              </h3>
              <div className="space-y-3">
                {platforms.map(p => (
                  <div key={p.id} className={`flex items-center justify-between p-3 rounded-xl border ${
                    connectionStatus[p.id]
                      ? 'bg-green-500/10 border-green-500/20'
                      : 'bg-white/5 border-white/5'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-base">{p.emoji}</span>
                      <span className={`text-sm font-bold ${connectionStatus[p.id] ? 'text-white' : 'text-white/40'}`}>
                        {p.label}
                      </span>
                    </div>
                    {connectionStatus[p.id] ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-green-400">
                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                        Aktif
                      </span>
                    ) : (
                      <span className="text-xs text-white/20 font-bold">Bağlı Değil</span>
                    )}
                  </div>
                ))}
              </div>

              {connectedCount === 0 && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <p className="text-xs text-yellow-400 font-bold">💡 Henüz platform bağlanmadı</p>
                  <p className="text-xs text-white/30 mt-1">Sol taraftaki formu doldurup bağla butonuna basın</p>
                </div>
              )}

              {connectedCount > 0 && connectedCount < 3 && (
                <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-xs text-blue-400 font-bold">🚀 {connectedCount} platform aktif</p>
                  <p className="text-xs text-white/30 mt-1">Diğer platformları da bağlayarak tüm siparişleri tek yerden yönetin</p>
                </div>
              )}

              {connectedCount === 3 && (
                <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-xl">
                  <p className="text-xs text-green-400 font-bold">🎉 Tüm platformlar bağlı!</p>
                  <p className="text-xs text-white/30 mt-1">Siparişler otomatik olarak sisteme aktarılıyor</p>
                </div>
              )}
            </div>

            {/* Güvenlik Notu */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <h4 className="text-sm font-black text-white mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Güvenlik
              </h4>
              <ul className="space-y-2 text-xs text-white/40">
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                  API anahtarları şifreli olarak saklanır
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                  Sadece siz görebilirsiniz
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 text-green-400 mt-0.5 flex-shrink-0" />
                  Webhook'lar imzalı isteklerle doğrulanır
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
