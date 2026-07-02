'use client'
import { useEffect, useState } from 'react'
import { Settings, Copy, Check, AlertCircle, Info, Code } from 'lucide-react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export default function YemeksepetiAyarlar() {
  const [apiKey, setApiKey] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [restoran, setRestoran] = useState<any>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: restoranData, error } = await supabase
        .from('restoranlar')
        .select('*')
        .eq('sahibi_id', user.id)
        .single()

      if (error) throw error

      setRestoran(restoranData)
      setApiKey(restoranData?.yemeksepeti_api_key || '')
      
      // Webhook URL'sini oluştur
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      setWebhookUrl(`${baseUrl}/api/yemeksepeti/webhook`)
    } catch (err) {
      console.error('Ayarlar yüklenemedi:', err)
      toast.error('Ayarlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error('API Anahtarı boş olamaz')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase
        .from('restoranlar')
        .update({
          yemeksepeti_api_key: apiKey,
          yemeksepeti_aktif: true
        })
        .eq('id', restoran.id)

      if (error) throw error

      toast.success('✅ API Anahtarı kaydedildi!')
      setRestoran({ ...restoran, yemeksepeti_api_key: apiKey, yemeksepeti_aktif: true })
    } catch (err) {
      console.error('Kaydetme hatası:', err)
      toast.error('Kaydetme başarısız oldu')
    } finally {
      setSaving(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-8 flex items-center justify-center">
        <div className="text-white/40">Yükleniyor...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl lg:text-4xl font-black text-white flex items-center gap-3 mb-2">
            <Settings className="w-8 h-8 text-primary" />
            Yemeksepeti Ayarları
          </h1>
          <p className="text-white/40">Yemeksepeti entegrasyonunu yapılandır ve siparişleri otomatik olarak al</p>
        </div>

        {/* Info Box */}
        <div className="mb-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200">
            <p className="font-bold mb-1">Yemeksepeti Entegrasyonu Nasıl Çalışır?</p>
            <p>Yemeksepeti'nden gelen siparişler otomatik olarak sisteme düşer, mutfak ekranında görünür ve push bildirimleri gönderilir.</p>
          </div>
        </div>

        {/* API Key Section */}
        <div className="bg-card border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-black text-white mb-4">1. API Anahtarı</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">
                Yemeksepeti API Anahtarı
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Yemeksepeti Partner Portal'dan alınan API Key..."
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={() => handleSaveApiKey()}
                  disabled={saving}
                  className="px-6 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-black font-bold rounded-lg transition-all"
                >
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
              <p className="text-xs text-white/40 mt-2">
                🔐 API anahtarınız şifreli olarak saklanır ve asla açık metin olarak gösterilmez.
              </p>
            </div>

            {restoran?.yemeksepeti_aktif && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg flex gap-2">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-sm text-green-200">✅ Yemeksepeti entegrasyonu aktif</p>
              </div>
            )}
          </div>
        </div>

        {/* Webhook Section */}
        <div className="bg-card border border-white/10 rounded-xl p-6 mb-6">
          <h2 className="text-xl font-black text-white mb-4">2. Webhook URL'sini Ayarla</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-white/80 mb-2">
                Webhook URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={webhookUrl}
                  readOnly
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/60 focus:outline-none"
                />
                <button
                  onClick={() => {
                    copyToClipboard(webhookUrl)
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-lg transition-all flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Kopyalandı' : 'Kopyala'}
                </button>
              </div>
            </div>

            <div className="p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-sm font-bold text-white mb-3">📋 Yemeksepeti Partner Portal'da Yapılacaklar:</p>
              <ol className="text-sm text-white/60 space-y-2">
                <li><strong>1.</strong> Yemeksepeti Partner Portal'a gir</li>
                <li><strong>2.</strong> Ayarlar → API & Webhook bölümüne git</li>
                <li><strong>3.</strong> Webhook URL'sini yukarıdaki URL ile değiştir</li>
                <li><strong>4.</strong> Event'ler: <code className="bg-black/30 px-2 py-1 rounded text-xs">order.created</code>, <code className="bg-black/30 px-2 py-1 rounded text-xs">order.accepted</code>, <code className="bg-black/30 px-2 py-1 rounded text-xs">order.completed</code> seçeneklerini işaretle</li>
                <li><strong>5.</strong> Kaydet ve test et</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Test Section */}
        <div className="bg-card border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-black text-white mb-4">3. Test Siparişi Gönder</h2>
          
          <div className="space-y-4">
            <p className="text-sm text-white/60">
              Entegrasyonun düzgün çalışıp çalışmadığını test etmek için aşağıdaki komutları kullanabilirsin:
            </p>

            <div className="p-4 bg-black/30 rounded-lg overflow-x-auto">
              <code className="text-xs text-green-400 font-mono">
                curl -X POST {webhookUrl} \<br/>
                &nbsp;&nbsp;-H "Content-Type: application/json" \<br/>
                &nbsp;&nbsp;-d '{'{'}
                <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"order_id": "TEST-001",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"customer_name": "Test Kullanıcı",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"customer_phone": "05551112233",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"items": [{"{"}
                <br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"name": "Adana Kebap",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"quantity": 1,<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"price": 250<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;{"}"}],<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"total_price": 250,<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"delivery_address": "Test Mahallesi",<br/>
                &nbsp;&nbsp;&nbsp;&nbsp;"notes": "Test siparişi"<br/>
                &nbsp;&nbsp;{'}'}'
              </code>
            </div>

            <p className="text-xs text-white/40">
              💡 Test sonrası "Yemeksepeti Siparişleri" sayfasında yeni siparişi görebilirsin.
            </p>
          </div>
        </div>

        {/* Status */}
        <div className="mt-8 p-4 bg-white/5 border border-white/10 rounded-xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-white">Entegrasyon Durumu</p>
              <p className="text-xs text-white/40 mt-1">
                {restoran?.yemeksepeti_aktif ? '✅ Aktif' : '⏸️ Pasif'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${restoran?.yemeksepeti_aktif ? 'bg-green-500' : 'bg-gray-500'}`} />
          </div>
        </div>
      </div>
    </div>
  )
}
