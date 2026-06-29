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
import {
  DollarSign, Users, CheckCircle, Plus, Minus, ShoppingCart,
  LayoutDashboard, ChefHat, BarChart3, TrendingUp, Receipt,
  RefreshCw, Printer
} from 'lucide-react'
import { fisYazdir } from '@/components/FisYazdir'

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
  const [haftalikCiro, setHaftalikCiro] = useState(0)
  const [restoran, setRestoran] = useState<any>(null)
  const [temaRenk, setTemaRenk] = useState('#f59e0b')
  const [siparisModal, setSiparisModal] = useState(false)
  const [seciliMasa, setSeciliMasa] = useState<string>('')
  const [sepet, setSepet] = useState<{ id: string; ad: string; fiyat: number; adet: number }[]>([])
  const [yukleniyor, setYukleniyor] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setYukleniyor(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar')
      .select('*')
      .eq('sahibi_id', user.id)
      .single()

    if (!restoranData) return
    setRestoran(restoranData)
    setTemaRenk(restoranData.tema_renk?.replace(/'/g, '') || '#f59e0b')

    const { data: tumMasaData } = await supabase
      .from('masalar')
      .select('*')
      .eq('restoran_id', restoranData.id)
      .order('ad')

    setTumMasalar(tumMasaData || [])

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

    setMasalar(masaData || [])

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

    // Haftalık ciro
    const haftaOnce = new Date()
    haftaOnce.setDate(haftaOnce.getDate() - 7)
    const { data: haftalikData } = await supabase
      .from('siparisler')
      .select('toplam_tutar')
      .eq('restoran_id', restoranData.id)
      .eq('durum', 'odendi')
      .gte('created_at', haftaOnce.toISOString())

    const haftalik = haftalikData?.reduce((sum, s) => sum + Number(s.toplam_tutar), 0) || 0
    setHaftalikCiro(haftalik)

    setYukleniyor(false)
  }

  function sepeteEkle(urun: Urun) {
    setSepet(prev => {
      const varMi = prev.find(i => i.id === urun.id)
      if (varMi) {
        return prev.map(i => i.id === urun.id ? { ...i, adet: i.adet + 1 } : i)
      }
      return [...prev, { id: urun.id, ad: urun.ad, fiyat: urun.fiyat, adet: 1 }]
    })
  }

  function adetGuncelle(urunId: string, delta: number) {
    setSepet(prev => prev.map(i => {
      if (i.id === urunId) {
        const yeniAdet = i.adet + delta
        return yeniAdet > 0 ? { ...i, adet: yeniAdet } : i
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

    const siparisUrunleri = sepet.map(item => ({
      siparis_id: siparis.id,
      urun_id: item.id,
      adet: item.adet,
      birim_fiyat: item.fiyat
    }))

    await supabase.from('siparis_urunleri').insert(siparisUrunleri)
    await supabase.from('masalar').update({ durum: 'dolu' }).eq('id', seciliMasa)

    toast.success('Sipariş eklendi!')
    setSiparisModal(false)
    setSepet([])
    setSeciliMasa('')
    loadData()
  }

  async function masaKapat(masaId: string, masaAd: string, toplamTutar: number) {
    if (!confirm(`${masaAd} kapatılsın mı? Toplam: ${toplamTutar.toFixed(2)}₺`)) return

    await supabase
      .from('siparisler')
      .update({ durum: 'odendi' })
      .eq('masa_id', masaId)
      .in('durum', ['hazirlaniyor', 'hazir', 'tamamlandi'])

    await supabase
      .from('masalar')
      .update({ durum: 'bos' })
      .eq('id', masaId)

    toast.success(`${masaAd} kapatıldı ✓ ${toplamTutar.toFixed(2)}₺ alındı`)
    loadData()
  }

  const toplamSepet = sepet.reduce((sum, i) => sum + i.fiyat * i.adet, 0)
  const toplamAcikMasaTutar = masalar.reduce((sum, m) =>
    sum + m.siparisler.reduce((s: number, sp: any) => s + Number(sp.toplam_tutar), 0), 0)

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-yellow-500 mx-auto mb-3" />
          <p className="text-zinc-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: temaRenk }}>
            <DollarSign className="w-7 h-7" />
            Kasa
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push('/dashboard')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <LayoutDashboard className="w-4 h-4 mr-1.5" />
            Dashboard
          </Button>
          <Button onClick={() => router.push('/masalar')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <ChefHat className="w-4 h-4 mr-1.5" />
            Masalar
          </Button>
          <Button onClick={() => router.push('/siparisler')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            Siparişler
          </Button>
          <Button onClick={() => router.push('/rapor')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <BarChart3 className="w-4 h-4 mr-1.5" />
            Raporlar
          </Button>
          <Button
            onClick={loadData}
            className="bg-zinc-700 hover:bg-zinc-600"
            size="sm"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button
            onClick={() => setSiparisModal(true)}
            style={{ backgroundColor: temaRenk }}
            className="text-black font-bold hover:opacity-80"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Sipariş Ekle
          </Button>
        </div>
      </div>

      {/* Ciro Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card
          className="p-5 border-2"
          style={{ borderColor: temaRenk + '40', backgroundColor: temaRenk + '10' }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 mb-1">Bugünkü Ciro</p>
              <p className="text-3xl font-black" style={{ color: temaRenk }}>
                {gunlukCiro.toFixed(2)}₺
              </p>
            </div>
            <TrendingUp className="w-10 h-10 opacity-30" style={{ color: temaRenk }} />
          </div>
        </Card>

        <Card className="p-5 bg-zinc-800 border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 mb-1">Haftalık Ciro</p>
              <p className="text-3xl font-black text-blue-400">
                {haftalikCiro.toFixed(2)}₺
              </p>
            </div>
            <BarChart3 className="w-10 h-10 text-blue-400 opacity-30" />
          </div>
        </Card>

        <Card className="p-5 bg-zinc-800 border-zinc-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-400 mb-1">Açık Masalar</p>
              <p className="text-3xl font-black text-orange-400">
                {masalar.length}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">
                Bekleyen: {toplamAcikMasaTutar.toFixed(2)}₺
              </p>
            </div>
            <Users className="w-10 h-10 text-orange-400 opacity-30" />
          </div>
        </Card>
      </div>

      {/* Açık Masalar */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-black flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-400" />
          Açık Masalar
        </h2>
        <span className="text-sm text-zinc-400">{masalar.length} masa</span>
      </div>

      {masalar.length === 0 ? (
        <Card className="p-12 bg-zinc-800 border-zinc-700 text-center">
          <DollarSign className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
          <p className="text-zinc-400 font-bold">Açık masa yok</p>
          <p className="text-zinc-500 text-sm mt-1">Tüm masalar boş</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {masalar.map(masa => {
            const toplam = masa.siparisler.reduce((sum: number, s: any) => sum + Number(s.toplam_tutar), 0)
            const siparisSayisi = masa.siparisler.filter((s: any) => s.durum !== 'odendi').length
            return (
              <Card
                key={masa.id}
                className="p-5 bg-white text-zinc-900 border-2 hover:shadow-lg transition"
                style={{ borderColor: temaRenk }}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-black text-zinc-900">{masa.ad}</h3>
                  <Badge className="bg-red-500 text-white text-xs">
                    {siparisSayisi} Sipariş
                  </Badge>
                </div>
                <p className="text-3xl font-black mb-4" style={{ color: temaRenk }}>
                  {toplam.toFixed(2)}₺
                </p>
                <Button
                  onClick={() => masaKapat(masa.id, masa.ad, toplam)}
                  style={{ backgroundColor: temaRenk }}
                  className="w-full text-black font-bold hover:opacity-80"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Masayı Kapat & Tahsil Et
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      {/* Sipariş Ekleme Modal */}
      <Dialog open={siparisModal} onOpenChange={(open) => { setSiparisModal(open); if (!open) { setSepet([]); setSeciliMasa('') } }}>
        <DialogContent className="bg-zinc-900 border-zinc-700 text-zinc-100 max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2" style={{ color: temaRenk }}>
              <ShoppingCart className="w-5 h-5" />
              Kasadan Sipariş Ekle
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Select value={seciliMasa} onValueChange={setSeciliMasa}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Masa seç" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {tumMasalar.map(masa => (
                  <SelectItem key={masa.id} value={masa.id} className="text-white">
                    {masa.ad} {masa.durum === 'dolu' ? '(Dolu)' : '(Boş)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {urunler.length === 0 ? (
              <div className="text-center py-6 text-zinc-400">
                <p>Ürün bulunamadı. Önce ürün ekleyin.</p>
                <Button
                  onClick={() => { setSiparisModal(false); router.push('/urunler') }}
                  className="mt-3 bg-yellow-500 text-black"
                  size="sm"
                >
                  Ürünlere Git
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
                {urunler.map(urun => (
                  <Button
                    key={urun.id}
                    onClick={() => sepeteEkle(urun)}
                    variant="outline"
                    className="justify-between border-zinc-700 hover:bg-zinc-800 text-white h-auto py-2"
                  >
                    <span className="text-left text-sm">{urun.ad}</span>
                    <span className="font-bold shrink-0 ml-2" style={{ color: temaRenk }}>{urun.fiyat}₺</span>
                  </Button>
                ))}
              </div>
            )}

            {sepet.length > 0 && (
              <div className="border-t border-zinc-700 pt-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4" style={{ color: temaRenk }} />
                  Sepet
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {sepet.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-zinc-800 p-2.5 rounded-lg">
                      <span className="text-sm text-zinc-200 flex-1">{item.ad}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="icon" variant="outline" className="h-6 w-6 border-zinc-600" onClick={() => adetGuncelle(item.id, -1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-6 text-center text-white font-bold text-sm">{item.adet}</span>
                        <Button size="icon" variant="outline" className="h-6 w-6 border-zinc-600" onClick={() => adetGuncelle(item.id, 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                        <span className="w-16 text-right font-bold text-sm" style={{ color: temaRenk }}>
                          {(item.fiyat * item.adet).toFixed(2)}₺
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xl font-black mt-4 pt-4 border-t border-zinc-700">
                  <span>Toplam:</span>
                  <span style={{ color: temaRenk }}>{toplamSepet.toFixed(2)}₺</span>
                </div>
                <Button
                  onClick={kasadanSiparisVer}
                  style={{ backgroundColor: temaRenk }}
                  className="w-full mt-4 text-black font-bold hover:opacity-80"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
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
