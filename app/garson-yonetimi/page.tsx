'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import PageHeader from '@/components/PageHeader'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Edit2, Trash2, Copy, Check, AlertCircle, Eye, EyeOff, Loader, Shield
} from 'lucide-react'
import { toast } from 'sonner'

interface Garson {
  id: string
  ad: string
  telefon: string
  email: string
  rol: 'garson' | 'mutfak' | 'kurye' | 'admin'
  pin_kodu: string
  pin_aktif: boolean
  aktif: boolean
  created_at: string
}

export default function GarsonYonetimiPage() {
  const router = useRouter()
  const [restoran, setRestoran] = useState<any>(null)
  const [garsonlar, setGarsonlar] = useState<Garson[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showPin, setShowPin] = useState<{ [key: string]: boolean }>({})
  const [formData, setFormData] = useState<{
    ad: string
    telefon: string
    email: string
    rol: 'garson' | 'mutfak' | 'kurye' | 'admin'
    pin_kodu: string
  }>({
    ad: '',
    telefon: '',
    email: '',
    rol: 'garson',
    pin_kodu: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push('/login')

      const { data: restoranData } = await supabase
        .from('restoranlar')
        .select('*')
        .eq('sahibi_id', user.id)
        .single()
      setRestoran(restoranData)

      const { data: garsonlarData } = await supabase
        .from('garsonlar')
        .select('*')
        .eq('restoran_id', restoranData?.id)
        .order('created_at', { ascending: false })

      setGarsonlar(garsonlarData || [])
    } catch (err) {
      console.error('Veri yükleme hatası:', err)
    } finally {
      setLoading(false)
    }
  }

  const generatePin = () => {
    const pin = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    setFormData({ ...formData, pin_kodu: pin })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.ad || !formData.pin_kodu) {
      toast.error('Ad ve PIN kodu zorunlu')
      return
    }

    if (formData.pin_kodu.length !== 4 || !/^\d{4}$/.test(formData.pin_kodu)) {
      toast.error('PIN kodu 4 haneli sayı olmalı')
      return
    }

    try {
      if (editingId) {
        // Güncelle
        const { error } = await supabase
          .from('garsonlar')
          .update({
            ad: formData.ad,
            telefon: formData.telefon,
            email: formData.email,
            rol: formData.rol,
            pin_kodu: formData.pin_kodu
          })
          .eq('id', editingId)

        if (error) throw error
        toast.success('Garson güncellendi')
      } else {
        // Yeni ekle
        const { error } = await supabase
          .from('garsonlar')
          .insert({
            restoran_id: restoran.id,
            ad: formData.ad,
            telefon: formData.telefon,
            email: formData.email,
            rol: formData.rol,
            pin_kodu: formData.pin_kodu,
            pin_aktif: true,
            aktif: true
          })

        if (error) throw error
        toast.success('Garson eklendi')
      }

      setShowModal(false)
      setEditingId(null)
      setFormData({ ad: '', telefon: '', email: '', rol: 'garson', pin_kodu: '' })
      loadData()
    } catch (err: any) {
      console.error('İşlem hatası:', err)
      toast.error(err.message)
    }
  }

  const handleEdit = (garson: Garson) => {
    setFormData({
      ad: garson.ad,
      telefon: garson.telefon,
      email: garson.email,
      rol: garson.rol,
      pin_kodu: garson.pin_kodu
    })
    setEditingId(garson.id)
    setShowModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Bu garsonı silmek istediğine emin misin?')) return

    try {
      const { error } = await supabase
        .from('garsonlar')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast.success('Garson silindi')
      loadData()
    } catch (err: any) {
      toast.error('Silme başarısız: ' + err.message)
    }
  }

  const togglePinActive = async (garson: Garson) => {
    try {
      const { error } = await supabase
        .from('garsonlar')
        .update({ pin_aktif: !garson.pin_aktif })
        .eq('id', garson.id)

      if (error) throw error
      toast.success(garson.pin_aktif ? 'PIN deaktif edildi' : 'PIN aktif edildi')
      loadData()
    } catch (err: any) {
      toast.error('İşlem başarısız: ' + err.message)
    }
  }

  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin)
    toast.success('PIN kopyalandı')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeader title="Garson Yönetimi" icon={<Users className="w-6 h-6" />} />
        <div className="p-4 lg:p-8 max-w-6xl mx-auto">
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-zinc-800 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Garson Yönetimi"
        subtitle={`Toplam: ${garsonlar.length} garson`}
        icon={<Users className="w-6 h-6" />}
      />

      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-8">
        {/* Yeni Garson Butonu */}
        <motion.button
          onClick={() => {
            setEditingId(null)
            setFormData({ ad: '', telefon: '', email: '', rol: 'garson', pin_kodu: '' })
            setShowModal(true)
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-black rounded-xl transition-all flex items-center gap-2 w-full md:w-auto justify-center md:justify-start"
        >
          <Plus className="w-5 h-5" />
          Yeni Garson Ekle
        </motion.button>

        {/* Garsonlar Listesi */}
        <div className="space-y-4">
          {garsonlar.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl bg-zinc-800/50 border border-white/10 p-12 text-center"
            >
              <Users className="w-12 h-12 mx-auto text-white/20 mb-4" />
              <p className="text-white/60 mb-4">Henüz garson eklenmemiş</p>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded-lg font-bold transition-all"
              >
                İlk Garsonunu Ekle
              </button>
            </motion.div>
          ) : (
            garsonlar.map((garson, idx) => (
              <motion.div
                key={garson.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="rounded-2xl bg-zinc-800/50 border border-white/10 hover:border-white/20 p-6 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Bilgiler */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="font-black text-primary text-sm">
                          {garson.ad.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-black text-white text-lg">{garson.ad}</h3>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                            {garson.rol === 'garson' ? '🍽️ Garson' : garson.rol === 'mutfak' ? '👨‍🍳 Mutfak' : garson.rol === 'kurye' ? '🚗 Kurye' : '🔐 Admin'}
                          </span>
                          {garson.aktif ? (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300 font-bold">
                              ✅ Aktif
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300 font-bold">
                              ❌ Pasif
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      {garson.telefon && (
                        <div>
                          <p className="text-white/50">Telefon</p>
                          <p className="text-white font-bold">{garson.telefon}</p>
                        </div>
                      )}
                      {garson.email && (
                        <div>
                          <p className="text-white/50">E-posta</p>
                          <p className="text-white font-bold">{garson.email}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-white/50">PIN Kodu</p>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold font-mono">
                            {showPin[garson.id] ? garson.pin_kodu : '••••'}
                          </span>
                          <button
                            onClick={() => setShowPin({ ...showPin, [garson.id]: !showPin[garson.id] })}
                            className="p-1 hover:bg-white/10 rounded transition-all text-white/60 hover:text-white"
                          >
                            {showPin[garson.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => copyPin(garson.pin_kodu)}
                            className="p-1 hover:bg-white/10 rounded transition-all text-white/60 hover:text-white"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Butonlar */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleEdit(garson)}
                      className="p-2 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 rounded-lg transition-all"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => togglePinActive(garson)}
                      className={`p-2 border rounded-lg transition-all ${
                        garson.pin_aktif
                          ? 'hover:bg-red-500/20 border-red-500/30 text-red-400'
                          : 'hover:bg-green-500/20 border-green-500/30 text-green-400'
                      }`}
                    >
                      <Shield className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(garson.id)}
                      className="p-2 hover:bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-white/10 p-6"
            >
              <h2 className="text-2xl font-black text-white mb-6">
                {editingId ? '✏️ Garson Düzenle' : '➕ Yeni Garson Ekle'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Ad */}
                <div>
                  <label className="block text-sm font-bold text-white/70 mb-2">Ad</label>
                  <input
                    type="text"
                    value={formData.ad}
                    onChange={e => setFormData({ ...formData, ad: e.target.value })}
                    placeholder="Garson adı"
                    className="w-full px-4 py-2 rounded-xl bg-zinc-800/50 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
                    required
                  />
                </div>

                {/* Telefon */}
                <div>
                  <label className="block text-sm font-bold text-white/70 mb-2">Telefon</label>
                  <input
                    type="tel"
                    value={formData.telefon}
                    onChange={e => setFormData({ ...formData, telefon: e.target.value })}
                    placeholder="+905551234567"
                    className="w-full px-4 py-2 rounded-xl bg-zinc-800/50 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* E-posta */}
                <div>
                  <label className="block text-sm font-bold text-white/70 mb-2">E-posta</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="garson@restoran.com"
                    className="w-full px-4 py-2 rounded-xl bg-zinc-800/50 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Rol */}
                <div>
                  <label className="block text-sm font-bold text-white/70 mb-2">Rol</label>
                  <select
                    value={formData.rol}
                    onChange={e => setFormData({ ...formData, rol: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-xl bg-zinc-800/50 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="garson">🍽️ Garson</option>
                    <option value="mutfak">👨‍🍳 Mutfak</option>
                    <option value="kurye">🚗 Kurye</option>
                    <option value="admin">🔐 Admin</option>
                  </select>
                </div>

                {/* PIN Kodu */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-bold text-white/70">PIN Kodu</label>
                    <button
                      type="button"
                      onClick={generatePin}
                      className="text-xs px-2 py-1 bg-primary/20 hover:bg-primary/30 border border-primary/50 text-primary rounded font-bold transition-all"
                    >
                      🎲 Otomatik Oluştur
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.pin_kodu}
                    onChange={e => setFormData({ ...formData, pin_kodu: e.target.value })}
                    placeholder="0000"
                    maxLength={4}
                    className="w-full px-4 py-2 rounded-xl bg-zinc-800/50 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-center text-2xl"
                    required
                  />
                  <p className="text-xs text-white/50 mt-1">4 haneli sayı (0000-9999)</p>
                </div>

                {/* Butonlar */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-bold rounded-xl transition-all"
                  >
                    {editingId ? 'Güncelle' : 'Ekle'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
