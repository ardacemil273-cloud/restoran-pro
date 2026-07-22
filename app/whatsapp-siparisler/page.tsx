'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageCircle, Phone, CheckCircle, Clock, AlertCircle, Copy, ExternalLink
} from 'lucide-react'

type WhatsAppSiparis = {
  id: string
  musteri_telefon: string
  musteri_adi: string
  mesaj: string
  durum: 'bekleniyor' | 'isleniyor' | 'tamamlandi' | 'iptal'
  ozel_istekler: string
  created_at: string
}

export default function WhatsAppSiparislerPage() {
  const [siparisler, setSiparisler] = useState<WhatsAppSiparis[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [whatsappLink, setWhatsappLink] = useState('')
  const router = useRouter()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar').select('*').eq('sahibi_id', user.id).single()
    if (!restoranData) { toast.error('Restoran bulunamadı'); return }
    setRestoran(restoranData)

    // WhatsApp link'i oluştur
    const link = `https://wa.me/${restoranData.telefon || '905551234567'}?text=Merhaba%20${restoranData.ad}%20%F0%9F%8D%BD%0A%0ASipariş%20vermek%20istiyorum%3A`
    setWhatsappLink(link)

    const { data: siparislerData } = await supabase
      .from('whatsapp_siparisler')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .order('created_at', { ascending: false })

    if (siparislerData) setSiparisler(siparislerData)
    setYukleniyor(false)
  }

  async function durumGuncelle(siparisId: string, yeniDurum: string) {
    const { error } = await supabase
      .from('whatsapp_siparisler')
      .update({ durum: yeniDurum })
      .eq('id', siparisId)
    
    if (error) { toast.error('Güncellenemedi'); return }
    toast.success('✅ Durum güncellendi!')
    await loadData()
  }

  function copyWhatsappLink() {
    navigator.clipboard.writeText(whatsappLink)
    toast.success('WhatsApp linki kopyalandı!')
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <MessageCircle className="w-16 h-16 text-green-500" />
        </motion.div>
      </div>
    )
  }

  const bekleyen = siparisler.filter(s => s.durum === 'bekleniyor')
  const isleniyor = siparisler.filter(s => s.durum === 'isleniyor')
  const tamamlanan = siparisler.filter(s => s.durum === 'tamamlandi')

  return (
    <div className="p-4 md:p-6 bg-zinc-900 min-h-screen">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
      >
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <MessageCircle className="w-7 h-7 text-green-500" />
            WhatsApp Siparişler
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad} — Müşteriler WhatsApp'tan sipariş verebilir</p>
        </div>
        <Button
          onClick={copyWhatsappLink}
          className="bg-green-600 hover:bg-green-700 text-white font-bold"
        >
          <Copy className="w-4 h-4 mr-2" />
          WhatsApp Linkini Kopyala
        </Button>
      </motion.div>

      {/* WhatsApp Link Kartı */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="mb-6 p-6 bg-gradient-to-r from-green-900/50 to-zinc-800 border-2 border-green-600 rounded-xl"
      >
        <h2 className="font-bold text-white mb-3 flex items-center gap-2">
          <ExternalLink className="w-5 h-5 text-green-400" />
          Müşteri Linki
        </h2>
        <div className="flex items-center gap-2 bg-zinc-900 p-3 rounded-lg">
          <input
            type="text"
            value={whatsappLink}
            readOnly
            className="flex-1 bg-transparent text-zinc-300 text-sm outline-none"
          />
          <Button
            onClick={copyWhatsappLink}
            size="sm"
            className="bg-green-600 hover:bg-green-700"
          >
            Kopyala
          </Button>
        </div>
        <p className="text-xs text-zinc-400 mt-2">Bu linki müşterilere göster veya QR'a dönüştür</p>
      </motion.div>

      {/* İstatistikler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="grid grid-cols-3 gap-4 mb-6"
      >
        <Card className="p-4 bg-orange-900/30 border-orange-700 text-center">
          <p className="text-xs text-orange-300 mb-1">Bekleyen</p>
          <p className="text-3xl font-black text-orange-400">{bekleyen.length}</p>
        </Card>
        <Card className="p-4 bg-blue-900/30 border-blue-700 text-center">
          <p className="text-xs text-blue-300 mb-1">İşleniyor</p>
          <p className="text-3xl font-black text-blue-400">{isleniyor.length}</p>
        </Card>
        <Card className="p-4 bg-green-900/30 border-green-700 text-center">
          <p className="text-xs text-green-300 mb-1">Tamamlanan</p>
          <p className="text-3xl font-black text-green-400">{tamamlanan.length}</p>
        </Card>
      </motion.div>

      {/* Siparişler */}
      <div className="space-y-6">
        {/* Bekleyen */}
        <div>
          <h2 className="text-xl font-black text-orange-400 mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6" />
            Bekleyen ({bekleyen.length})
          </h2>
          <div className="space-y-3">
            <AnimatePresence>
              {bekleyen.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center py-8 text-zinc-500"
                >
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Bekleyen sipariş yok</p>
                </motion.div>
              ) : (
                bekleyen.map((siparis, idx) => (
                  <motion.div
                    key={siparis.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="p-4 bg-zinc-800 border-zinc-700 hover:border-orange-500 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-white">{siparis.musteri_adi || 'Anonim'}</h3>
                          <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" />
                            {siparis.musteri_telefon}
                          </p>
                        </div>
                        <span className="text-xs text-zinc-400">
                          {new Date(siparis.created_at).toLocaleTimeString('tr-TR')}
                        </span>
                      </div>
                      <p className="text-white mb-3 p-2 bg-zinc-900/50 rounded text-sm">{siparis.mesaj}</p>
                      {siparis.ozel_istekler && (
                        <p className="text-xs text-yellow-400 mb-3">📝 {siparis.ozel_istekler}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => durumGuncelle(siparis.id, 'isleniyor')}
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          İşlemeye Başla
                        </Button>
                        <Button
                          onClick={() => durumGuncelle(siparis.id, 'iptal')}
                          size="sm"
                          variant="outline"
                          className="border-zinc-600"
                        >
                          İptal
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* İşleniyor */}
        {isleniyor.length > 0 && (
          <div>
            <h2 className="text-xl font-black text-blue-400 mb-4">İşleniyor ({isleniyor.length})</h2>
            <div className="space-y-3">
              {isleniyor.map((siparis, idx) => (
                <motion.div
                  key={siparis.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="p-4 bg-zinc-800 border-blue-600">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-white">{siparis.musteri_adi || 'Anonim'}</h3>
                        <p className="text-xs text-zinc-400">{siparis.musteri_telefon}</p>
                      </div>
                    </div>
                    <p className="text-white mb-3 text-sm">{siparis.mesaj}</p>
                    <Button
                      onClick={() => durumGuncelle(siparis.id, 'tamamlandi')}
                      size="sm"
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Tamamlandı
                    </Button>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
