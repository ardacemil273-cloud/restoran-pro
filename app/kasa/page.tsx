'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DollarSign, Users, CheckCircle, Plus, Minus, ShoppingCart } from 'lucide-react'

type Masa = {
  id: string
  ad: string
  durum: 'bos' | 'dolu'
  siparisler: any[]
}

type Urun = {
  id: string
  ad: string
  fiyat: number
  kategori_id: string
}

export default function KasaPage() {
  const [masalar, setMasalar] = useState<Masa[]>([])
  const [tumMasalar, setTumMasalar] = useState<any[]>([])
  const [urunler, setUrunler] = useState<Urun[]>([])
  const [gunlukCiro, setGunlukCiro] = useState(0)
  const [restoran, setRestoran] = useState<any>(null)
  const [siparisModal, setSiparisModal] = useState(false)
  const [seciliMasa, setSeciliMasa] = useState<string>('')
  const [sepet, setSepet] = useState<{ id: string; ad: string; fiyat: number; adet: number }[]>([])
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
    .from('restoranlar')
    .select('*')
    .eq('sahibi_id', user.id)
    .single()

    if (!restoranData) return
    setRestoran(restoranData)

    // Tüm masalar
    const { data: tumMasaData } = await supabase
    .from('masalar')
    .select('*')
    .eq('restoran_id', restoranData.id)
    .order('ad')

    setTumMasalar(tumMasaData || [])

    // Dolu masalar + siparişler
    const { data: masaData } = await supabase
    .from('masalar')
    .select(`
        *,
        siparisler!inner (
          id,
          toplam_tutar,
          durum,
          created_at
        )
      `)
    .eq('restoran_id', restoranData.id)
    .eq('durum', 'dolu')
    .neq('siparisler.durum', 'iptal')
    .neq('siparisler.durum', 'odendi')

    setMasalar(masaData || [])

    // Ürünler - kasadan eklemek için
    const { data: urunData } = await supabase
    .from('urunler')
    .select('*')
    .eq('restoran_id', restoranData.id)
    .eq('aktif', true)
    .order('ad')

    setUrunler(urunData || [])

    // Günlük ciro
    const bugun = new Date().toISOString().split('T')[0]
    const { data: ciroData } = await supabase
    .from('siparisler')
    .select('toplam_tutar')
    .eq('restoran_id', restoranData.id)
    .eq('durum', 'odendi')
    .gte('created_at', `${bugun}T00:00:00`)

    const ciro = ciroData?.reduce((sum, s) => sum + Number(s.toplam_tutar), 0) || 0
    setGunlukCiro(ciro)
  }

  function sepeteEkle(urun: Urun) {
    setSepet(prev => {
      const varMi = prev.find(i => i.id === urun.id)
      if (varMi) {
        return prev.map(i => i.id === urun.id? {...i, adet: i.adet + 1 } : i)
      }
      return [...prev, { id: urun.id, ad: urun.ad, fiyat: urun.fiyat, adet: 1 }]
    })
  }

  function adetGuncelle(urunId: string, delta: number) {
    setSepet(prev => prev.map(i => {
      if (i.id === urunId) {
        const yeniAdet = i.adet + delta
        return yeniAdet > 0? {...i, adet: yeniAdet } : i
      }
      return i
    }).filter(i => i.adet > 0))
  }

  async function kasadanSiparisVer() {
    if (!seciliMasa) {
      toast.error('Masa seç')
      return
    }
    if (sepet.length === 0) {
      toast.error('Sepet boş')
      return
    }

    const toplam = sepet.reduce((sum, i) => sum + i.fiyat * i.adet, 0)
    const masa = tumMasalar.find(m => m.id === seciliMasa)

    // 1. Sipariş oluştur
    const { data: siparis, error: siparisError } = await supabase
    .from('siparisler')
    .insert({
        restoran_id: restoran.id,
        masa_id: seciliMasa,
        masa_ad: masa?.ad,
        toplam_tutar: toplam,
        durum: 'hazirlaniyor',
        siparis_notu: 'Kasa siparişi'
      })
    .select()
    .single()

    if (siparisError) {
      toast.error('Sipariş oluşturulamadı')
      return
    }

    // 2. Ürünleri ekle
    const siparisUrunleri = sepet.map(item => ({
      siparis_id: siparis.id,
      urun_id: item.id,
      adet: item.adet,
      birim_fiyat: item.fiyat
    }))

    await supabase.from('siparis_urunleri').insert(siparisUrunleri)

    // 3. Masayı dolu yap
    await supabase.from('masalar').update({ durum: 'dolu' }).eq('id', seciliMasa)

    toast.success('Sipariş eklendi')
    setSiparisModal(false)
    setSepet([])
    setSeciliMasa('')
    loadData()
  }

  async function masaKapat(masaId: string, masaAd: string) {
    if (!confirm(`${masaAd} kapatılsın mı? Tüm siparişler ödendi sayılacak.`)) return

    await supabase
    .from('siparisler')
    .update({ durum: 'odendi' })
    .eq('masa_id', masaId)
    .in('durum', ['hazirlaniyor', 'hazir', 'tamamlandi'])

    await supabase
    .from('masalar')
    .update({ durum: 'bos' })
    .eq('id', masaId)

    toast.success(`${masaAd} kapatıldı`)
    loadData()
  }

  const toplamSepet = sepet.reduce((sum, i) => sum + i.fiyat * i.adet, 0)

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{restoran?.ad} - Kasa</h1>
        <Button onClick={() => setSiparisModal(true)} className="bg-orange-600 hover:bg-orange-700">
          <Plus className="w-4 h-4 mr-2" />
          Sipariş Ekle
        </Button>
      </div>

      {/* Günlük Ciro */}
      <Card className="p-6 bg-green-950/30 border-green-700 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Bugünkü Ciro</p>
            <p className="text-4xl font-bold text-green-500">{gunlukCiro.toFixed(2)}₺</p>
          </div>
          <DollarSign className="w-12 h-12 text-green-500" />
        </div>
      </Card>

      {/* Açık Masalar */}
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Users className="text-orange-500" />
        Açık Masalar ({masalar.length})
      </h2>

      {masalar.length === 0? (
        <Card className="p-12 bg-zinc-800 border-zinc-700 text-center text-zinc-400">
          Açık masa yok
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {masalar.map(masa => {
            const toplam = masa.siparisler.reduce((sum: number, s: any) => sum + Number(s.toplam_tutar), 0)
            return (
              <Card key={masa.id} className="p-4 bg-zinc-800 border-orange-700 border-2">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-bold">{masa.ad}</h3>
                  <Badge className="bg-red-500 text-white">DOLU</Badge>
                </div>
                <p className="text-2xl font-bold text-yellow-500 mb-4">{toplam.toFixed(2)}₺</p>
                <Button
                  onClick={() => masaKapat(masa.id, masa.ad)}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Masayı Kapat
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      {/* Sipariş Ekleme Modal */}
      <Dialog open={siparisModal} onOpenChange={setSiparisModal}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-white max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kasadan Sipariş Ekle</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Select value={seciliMasa} onValueChange={setSeciliMasa}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700">
                <SelectValue placeholder="Masa seç" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {tumMasalar.map(masa => (
                  <SelectItem key={masa.id} value={masa.id}>
                    {masa.ad} {masa.durum === 'dolu' && '(Dolu)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
              {urunler.map(urun => (
                <Button
                  key={urun.id}
                  onClick={() => sepeteEkle(urun)}
                  variant="outline"
                  className="justify-between border-zinc-700 hover:bg-zinc-800"
                >
                  <span>{urun.ad}</span>
                  <span className="text-yellow-500">{urun.fiyat}₺</span>
                </Button>
              ))}
            </div>

            {sepet.length > 0 && (
              <div className="border-t border-zinc-700 pt-4">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" />
                  Sepet
                </h3>
                {sepet.map(item => (
                  <div key={item.id} className="flex justify-between items-center mb-2 bg-zinc-800 p-2 rounded">
                    <span>{item.ad}</span>
                    <div className="flex items-center gap-2">
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => adetGuncelle(item.id, -1)}>
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center">{item.adet}</span>
                      <Button size="icon" variant="outline" className="h-6 w-6" onClick={() => adetGuncelle(item.id, 1)}>
                        <Plus className="w-3 h-3" />
                      </Button>
                      <span className="w-16 text-right text-yellow-500">{(item.fiyat * item.adet).toFixed(2)}₺</span>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-xl font-bold mt-4 pt-4 border-t border-zinc-700">
                  <span>Toplam:</span>
                  <span className="text-green-500">{toplamSepet.toFixed(2)}₺</span>
                </div>
                <Button onClick={kasadanSiparisVer} className="w-full mt-4 bg-green-600 hover:bg-green-700">
                  Siparişi Kaydet
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
