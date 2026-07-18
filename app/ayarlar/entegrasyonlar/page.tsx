'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Copy, Eye, EyeOff, Check, AlertCircle, Zap, Plus, Edit2, Trash2, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface EntegrasyonAyarlari {
  id: string
  restoran_id: string
  
  // Yemeksepeti
  yemeksepeti_aktif: boolean
  yemeksepeti_webhook_url: string
  yemeksepeti_webhook_secret: string
  yemeksepeti_api_key: string
  
  // GetirYemek
  getir_aktif: boolean
  getir_app_secret_key: string
  getir_restaurant_secret_key: string
  getir_restaurant_id: string
  
  // Trendyol
  trendyol_aktif: boolean
  trendyol_api_token: string
  trendyol_supplier_id: string
  trendyol_webhook_secret: string
  
  // Genel
  siparis_bildirimi_aktif: boolean
  ses_bildirimi_aktif: boolean
}

export default function EntegrasyonlarPage() {
  const [ayarlar, setAyarlar] = useState<EntegrasyonAyarlari | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSecrets, setShowSecrets] = useState<{ [key: string]: boolean }>({})
  const [restoranId, setRestoranId] = useState<string | null>(null)

  useEffect(() => {
    fetchAyarlar()
  }, [])

  async function fetchAyarlar() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Restoran ID'sini al
      const { data: restoran } = await supabase
        .from('restoranlar')
        .select('id')
        .eq('sahibi_id', user.id)
        .maybeSingle()

      if (!restoran) return
      setRestoranId(restoran.id)

      // Entegrasyon ayarlarını al
      const { data, error } = await supabase
        .from('restoran_entegrasyon_ayarlari')
        .select('*')
        .eq('restoran_id', restoran.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (!data) {
        // Yeni kayıt oluştur
        const { data: newData } = await supabase
          .from('restoran_entegrasyon_ayarlari')
          .insert({ restoran_id: restoran.id })
          .select()
          .single()
        setAyarlar(newData)
      } else {
        setAyarlar(data)
      }
    } catch (error) {
      console.error('Ayarlar yüklenemedi:', error)
      toast.error('Ayarlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }

  async function saveAyarlar() {
    if (!ayarlar || !restoranId) return
    setSaving(true)

    try {
      const { error } = await supabase
        .from('restoran_entegrasyon_ayarlari')
        .update(ayarlar)
        .eq('restoran_id', restoranId)

      if (error) throw error
      toast.success('Ayarlar kaydedildi!')
    } catch (error) {
      toast.error('Kayıt başarısız')
    } finally {
      setSaving(false)
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    toast.success('Kopyalandı!')
  }

  function toggleSecret(key: string) {
    setShowSecrets(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center"><RefreshCw className="w-8 h-8 animate-spin text-blue-400" /></div>
  }

  if (!ayarlar) {
    return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center text-slate-400">Veri yüklenemedi</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black flex items-center gap-3 mb-2 gradient-text">
            <Zap className="w-10 h-10" />
            Entegrasyonlar
          </h1>
          <p className="text-slate-400">Yemeksepeti, Getir ve Trendyol Yemek'i bağla</p>
        </div>

        {/* Bilgi */}
        <div className="glass rounded-2xl p-4 border border-slate-700/50 mb-8">
          <p className="text-sm text-slate-300">
            💡 <strong>Entegrasyonlarınızı bağlayın:</strong> Yemeksepeti, Getir ve Trendyol'dan gelen siparişleri otomatik olarak alın. Her platformun API anahtarlarını bulup buraya yapıştırın.
          </p>
        </div>

        {/* Yemeksepeti Section */}
        <div className="glass rounded-2xl p-6 border border-slate-700/50 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-white">🍽️ Yemeksepeti</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={ayarlar.yemeksepeti_aktif}
                onChange={(e) => setAyarlar({ ...ayarlar, yemeksepeti_aktif: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-bold text-slate-300">Aktif</span>
            </label>
          </div>

          <div className="space-y-4">
            {/* Webhook URL */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Webhook URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={ayarlar.yemeksepeti_webhook_url || ''}
                  onChange={(e) => setAyarlar({ ...ayarlar, yemeksepeti_webhook_url: e.target.value })}
                  className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://yourdomain.com/api/orders/yemeksepeti"
                />
                <button
                  onClick={() => copyToClipboard(ayarlar.yemeksepeti_webhook_url || '')}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
                >
                  <Copy className="w-4 h-4 text-blue-400" />
                </button>
              </div>
            </div>

            {/* Webhook Secret */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Webhook Secret</label>
              <div className="flex gap-2">
                <input
                  type={showSecrets['yemeksepeti_secret'] ? 'text' : 'password'}
                  value={ayarlar.yemeksepeti_webhook_secret || ''}
                  onChange={(e) => setAyarlar({ ...ayarlar, yemeksepeti_webhook_secret: e.target.value })}
                  className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => toggleSecret('yemeksepeti_secret')}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
                >
                  {showSecrets['yemeksepeti_secret'] ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </div>

            {/* API Key */}
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">API Key</label>
              <div className="flex gap-2">
                <input
                  type={showSecrets['yemeksepeti_key'] ? 'text' : 'password'}
                  value={ayarlar.yemeksepeti_api_key || ''}
                  onChange={(e) => setAyarlar({ ...ayarlar, yemeksepeti_api_key: e.target.value })}
                  className="flex-1 bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => toggleSecret('yemeksepeti_key')}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-all"
                >
                  {showSecrets['yemeksepeti_key'] ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="p-3 glass rounded-lg flex items-center gap-2 border border-slate-700/50">
              <Zap className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-slate-300">
                {ayarlar.yemeksepeti_aktif ? '✓ Aktif ve siparişleri alıyor' : '✗ Devre dışı'}
              </span>
            </div>
          </div>
        </div>

        {/* GetirYemek Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">🚴 GetirYemek</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={ayarlar.getir_aktif}
                onChange={(e) => setAyarlar({ ...ayarlar, getir_aktif: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Aktif</span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Secret Key</label>
              <input
                type={showSecrets['getir_app'] ? 'text' : 'password'}
                value={ayarlar.getir_app_secret_key || ''}
                onChange={(e) => setAyarlar({ ...ayarlar, getir_app_secret_key: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant Secret Key</label>
              <input
                type={showSecrets['getir_rest'] ? 'text' : 'password'}
                value={ayarlar.getir_restaurant_secret_key || ''}
                onChange={(e) => setAyarlar({ ...ayarlar, getir_restaurant_secret_key: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant ID</label>
              <input
                type="text"
                value={ayarlar.getir_restaurant_id || ''}
                onChange={(e) => setAyarlar({ ...ayarlar, getir_restaurant_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                {ayarlar.getir_aktif ? '✓ Aktif - Her dakika siparişleri kontrol ediyor' : 'Devre dışı'}
              </span>
            </div>
          </div>
        </div>

        {/* Trendyol Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">📦 Trendyol Yemek</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={ayarlar.trendyol_aktif}
                onChange={(e) => setAyarlar({ ...ayarlar, trendyol_aktif: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">Aktif</span>
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">API Token</label>
              <input
                type={showSecrets['trendyol_token'] ? 'text' : 'password'}
                value={ayarlar.trendyol_api_token || ''}
                onChange={(e) => setAyarlar({ ...ayarlar, trendyol_api_token: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier ID</label>
              <input
                type="text"
                value={ayarlar.trendyol_supplier_id || ''}
                onChange={(e) => setAyarlar({ ...ayarlar, trendyol_supplier_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Webhook Secret</label>
              <input
                type={showSecrets['trendyol_secret'] ? 'text' : 'password'}
                value={ayarlar.trendyol_webhook_secret || ''}
                onChange={(e) => setAyarlar({ ...ayarlar, trendyol_webhook_secret: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-700">
                {ayarlar.trendyol_aktif ? '✓ Aktif - Her 5 dakikada siparişleri kontrol ediyor' : 'Devre dışı'}
              </span>
            </div>
          </div>
        </div>

        {/* Genel Ayarlar */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">⚙️ Genel Ayarlar</h2>

          <div className="space-y-4">
            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={ayarlar.siparis_bildirimi_aktif}
                onChange={(e) => setAyarlar({ ...ayarlar, siparis_bildirimi_aktif: e.target.checked })}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium text-gray-900">Sipariş Bildirimleri</p>
                <p className="text-sm text-gray-600">Yeni sipariş geldiğinde tarayıcı bildirimi gönder</p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={ayarlar.ses_bildirimi_aktif}
                onChange={(e) => setAyarlar({ ...ayarlar, ses_bildirimi_aktif: e.target.checked })}
                className="w-4 h-4"
              />
              <div>
                <p className="font-medium text-gray-900">Sesli Uyarılar</p>
                <p className="text-sm text-gray-600">Yeni sipariş geldiğinde ses çal</p>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={saveAyarlar}
          disabled={saving}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-slate-600 disabled:to-slate-600 text-white font-bold py-3 rounded-lg transition-all"
        >
          {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
        </button>
      </div>
    </div>
  )
}
