'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Users, Plus, Trash2, Eye, EyeOff, RefreshCw,
  UserCheck, UserX, Copy, ExternalLink, ChefHat,
  Info, Key, Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

type Garson = {
  id: string
  ad: string
  email: string
  aktif: boolean
  created_at: string
  kullanici_id: string | null
}

export default function GarsonlarPage() {
  const [garsonlar, setGarsonlar] = useState<Garson[]>([])
  const [restoran, setRestoran] = useState<any>(null)
  const [yukleniyor, setYukleniyor] = useState(true)
  const [ekleModal, setEkleModal] = useState(false)
  const [yeniGarson, setYeniGarson] = useState({ ad: '', email: '', sifre: '' })
  const [ekleniyor, setEkleniyor] = useState(false)
  const [sifreGoster, setSifreGoster] = useState(false)
  const [kopyalananId, setKopyalananId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar')
      .select('*')
      .eq('sahibi_id', user.id)
      .maybeSingle()

    if (!restoranData) return
    setRestoran(restoranData)
    await getGarsonlar(restoranData.id)
    setYukleniyor(false)
  }

  const getGarsonlar = async (restoranId: string) => {
    const { data } = await supabase
      .from('garsonlar')
      .select('*')
      .eq('restoran_id', restoranId)
      .order('created_at', { ascending: false })

    setGarsonlar(data || [])
  }

  const garsonEkle = async () => {
    if (!yeniGarson.ad || !yeniGarson.email || !yeniGarson.sifre) {
      return toast.error('Tüm alanları doldur')
    }
    if (yeniGarson.sifre.length < 6) {
      return toast.error('Şifre en az 6 karakter olmalı')
    }
    if (!yeniGarson.email.includes('@')) {
      return toast.error('Geçerli bir e-posta gir')
    }

    setEkleniyor(true)

    try {
      // Garson kaydını ekle
      const { error: garsonError } = await supabase
        .from('garsonlar')
        .insert({
          restoran_id: restoran.id,
          ad: yeniGarson.ad,
          email: yeniGarson.email,
          sifre_hash: yeniGarson.sifre,
          aktif: true
        })

      if (garsonError) {
        if (garsonError.code === '23505') {
          throw new Error('Bu e-posta zaten kayıtlı')
        }
        throw garsonError
      }

      toast.success(`${yeniGarson.ad} başarıyla eklendi!`, {
        description: `Giriş: ${yeniGarson.email} / ${yeniGarson.sifre}`
      })
      setYeniGarson({ ad: '', email: '', sifre: '' })
      setEkleModal(false)
      getGarsonlar(restoran.id)
    } catch (err: any) {
      toast.error('Hata: ' + err.message)
    }

    setEkleniyor(false)
  }

  const durumDegistir = async (garsonId: string, aktif: boolean) => {
    const { error } = await supabase.from('garsonlar').update({ aktif }).eq('id', garsonId)
    if (error) {
      toast.error('Güncelleme başarısız')
      return
    }
    toast.success(aktif ? 'Garson aktif edildi' : 'Garson pasif yapıldı')
    getGarsonlar(restoran.id)
  }

  const garsonSil = async (garsonId: string, garsonAd: string) => {
    if (!confirm(`"${garsonAd}" silinecek. Emin misin?`)) return
    const { error } = await supabase.from('garsonlar').delete().eq('id', garsonId)
    if (error) {
      toast.error('Silme başarısız')
      return
    }
    toast.success('Garson silindi')
    getGarsonlar(restoran.id)
  }

  const panelLinkKopyala = () => {
    const link = `${window.location.origin}/garson/giris`
    navigator.clipboard.writeText(link)
    toast.success('Garson paneli linki kopyalandı!')
  }

  const bilgiKopyala = (garson: Garson) => {
    const bilgi = `Garson Paneli: ${window.location.origin}/garson/giris\nE-posta: ${garson.email}`
    navigator.clipboard.writeText(bilgi)
    setKopyalananId(garson.id)
    toast.success('Giriş bilgileri kopyalandı!')
    setTimeout(() => setKopyalananId(null), 2000)
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-yellow-500 mx-auto mb-3" />
          <p className="text-zinc-400">Yükleniyor...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black flex items-center gap-2">
            <Users className="text-yellow-500" />
            Garson Yönetimi
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={panelLinkKopyala}
            variant="outline"
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
          >
            <Copy className="w-4 h-4 mr-2" />
            Panel Linki
          </Button>
          <Button
            onClick={() => window.open('/garson', '_blank')}
            variant="outline"
            className="border-blue-600 text-blue-400 hover:bg-blue-950"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Paneli Aç
          </Button>
          <Button
            onClick={() => window.open('/garson/mutfak', '_blank')}
            variant="outline"
            className="border-orange-600 text-orange-400 hover:bg-orange-950"
          >
            <ChefHat className="w-4 h-4 mr-2" />
            Mutfak Ekranı
          </Button>
          <Button
            onClick={() => setEkleModal(true)}
            className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Garson Ekle
          </Button>
        </div>
      </div>

      {/* Bilgi Kutusu */}
      <Card className="p-4 bg-blue-950/30 border-blue-700/50 mb-6">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-blue-300 mb-1">Garson Paneli Nasıl Çalışır?</p>
            <p className="text-sm text-blue-400/80">
              Garsonlar <strong className="text-blue-300">/garson/giris</strong> adresine giderek e-posta ve şifreleriyle giriş yapar.
              Masaları görür, sipariş alır ve mutfağa gönderir. Siparişler anında mutfak ekranına düşer.
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              <button
                onClick={() => window.open('/garson/giris', '_blank')}
                className="text-xs text-blue-400 underline hover:text-blue-300"
              >
                → Garson Giriş Sayfası
              </button>
              <button
                onClick={() => window.open('/garson', '_blank')}
                className="text-xs text-blue-400 underline hover:text-blue-300"
              >
                → Garson Paneli
              </button>
              <button
                onClick={() => window.open('/garson/mutfak', '_blank')}
                className="text-xs text-orange-400 underline hover:text-orange-300"
              >
                → Mutfak Ekranı
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Garson Listesi */}
      {garsonlar.length === 0 ? (
        <Card className="p-12 bg-zinc-800 border-zinc-700 text-center">
          <div className="w-16 h-16 bg-zinc-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-zinc-500" />
          </div>
          <p className="text-zinc-400 mb-2 font-bold">Henüz garson eklenmemiş</p>
          <p className="text-zinc-500 text-sm mb-6">Garson ekleyerek sipariş alma sürecini hızlandırın</p>
          <Button
            onClick={() => setEkleModal(true)}
            className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            İlk Garsonunu Ekle
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {garsonlar.map(garson => (
            <Card
              key={garson.id}
              className={`p-4 border transition ${
                garson.aktif
                  ? 'bg-zinc-800 border-zinc-700 hover:border-zinc-600'
                  : 'bg-zinc-800/50 border-zinc-700/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-lg ${
                    garson.aktif ? 'bg-yellow-500 text-black' : 'bg-zinc-600 text-zinc-400'
                  }`}>
                    {garson.ad.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-white">{garson.ad}</p>
                    <p className="text-xs text-zinc-400">{garson.email}</p>
                  </div>
                </div>
                <Badge className={garson.aktif ? 'bg-green-800 text-green-200' : 'bg-zinc-700 text-zinc-400'}>
                  {garson.aktif ? 'Aktif' : 'Pasif'}
                </Badge>
              </div>

              <p className="text-xs text-zinc-500 mb-3">
                Eklenme: {new Date(garson.created_at).toLocaleDateString('tr-TR')}
              </p>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => bilgiKopyala(garson)}
                  className={`flex-1 text-xs ${kopyalananId === garson.id ? 'bg-green-700' : 'bg-zinc-700 hover:bg-zinc-600'}`}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  {kopyalananId === garson.id ? 'Kopyalandı!' : 'Bilgileri Kopyala'}
                </Button>
                <Button
                  size="sm"
                  onClick={() => durumDegistir(garson.id, !garson.aktif)}
                  className={`${garson.aktif ? 'bg-zinc-600 hover:bg-zinc-500' : 'bg-green-700 hover:bg-green-600'}`}
                >
                  {garson.aktif ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => garsonSil(garson.id, garson.ad)}
                  className="w-9 p-0"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Garson Ekle Modal */}
      {ekleModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <Card className="p-6 bg-zinc-800 border-zinc-700 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                <Plus className="w-5 h-5 text-black" />
              </div>
              <h2 className="text-xl font-black">Yeni Garson Ekle</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300 mb-1.5 block text-sm">Ad Soyad</Label>
                <Input
                  placeholder="Ahmet Yılmaz"
                  value={yeniGarson.ad}
                  onChange={e => setYeniGarson(p => ({ ...p, ad: e.target.value }))}
                  className="bg-zinc-700 border-zinc-600 focus:border-yellow-500"
                />
              </div>
              <div>
                <Label className="text-zinc-300 mb-1.5 block text-sm">E-posta</Label>
                <Input
                  type="email"
                  placeholder="garson@restoran.com"
                  value={yeniGarson.email}
                  onChange={e => setYeniGarson(p => ({ ...p, email: e.target.value }))}
                  className="bg-zinc-700 border-zinc-600 focus:border-yellow-500"
                />
              </div>
              <div>
                <Label className="text-zinc-300 mb-1.5 block text-sm">Şifre</Label>
                <div className="relative">
                  <Input
                    type={sifreGoster ? 'text' : 'password'}
                    placeholder="En az 6 karakter"
                    value={yeniGarson.sifre}
                    onChange={e => setYeniGarson(p => ({ ...p, sifre: e.target.value }))}
                    className="bg-zinc-700 border-zinc-600 focus:border-yellow-500 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setSifreGoster(!sifreGoster)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {sifreGoster ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1">
                  <Key className="w-3 h-3" />
                  Bu şifreyi garsona ilet. Giriş için kullanacak.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => { setEkleModal(false); setYeniGarson({ ad: '', email: '', sifre: '' }) }}
                variant="outline"
                className="flex-1 border-zinc-600 hover:bg-zinc-700"
              >
                İptal
              </Button>
              <Button
                onClick={garsonEkle}
                disabled={ekleniyor}
                className="flex-1 bg-yellow-500 text-black hover:bg-yellow-400 font-bold"
              >
                {ekleniyor ? (
                  <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Ekleniyor...</>
                ) : (
                  <><Plus className="w-4 h-4 mr-2" /> Garson Ekle</>
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
