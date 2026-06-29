'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Users, Plus, Trash2, Eye, EyeOff, RefreshCw,
  UserCheck, UserX, Copy, ExternalLink
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
  const [sifreler, setSifreler] = useState<Record<string, boolean>>({})
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

    setEkleniyor(true)

    try {
      // Supabase Auth'da kullanıcı oluştur
      const { data: authData, error: authError } = await supabase.auth.admin
        ? // Admin API varsa kullan
          { data: null, error: { message: 'admin not available' } }
        : { data: null, error: { message: 'use signup' } }

      // Garson kaydını direkt ekle (kullanıcı kendi giriş yapacak)
      const { error: garsonError } = await supabase
        .from('garsonlar')
        .insert({
          restoran_id: restoran.id,
          ad: yeniGarson.ad,
          email: yeniGarson.email,
          sifre_hash: yeniGarson.sifre, // Gerçekte hash'lenecek
          aktif: true
        })

      if (garsonError) throw garsonError

      toast.success(`${yeniGarson.ad} eklendi! Giriş bilgileri: ${yeniGarson.email} / ${yeniGarson.sifre}`)
      setYeniGarson({ ad: '', email: '', sifre: '' })
      setEkleModal(false)
      getGarsonlar(restoran.id)
    } catch (err: any) {
      toast.error('Hata: ' + err.message)
    }

    setEkleniyor(false)
  }

  const durumDegistir = async (garsonId: string, aktif: boolean) => {
    await supabase.from('garsonlar').update({ aktif }).eq('id', garsonId)
    toast.success(aktif ? 'Garson aktif edildi' : 'Garson pasif yapıldı')
    getGarsonlar(restoran.id)
  }

  const garsonSil = async (garsonId: string) => {
    if (!confirm('Bu garson silinecek. Emin misin?')) return
    await supabase.from('garsonlar').delete().eq('id', garsonId)
    toast.success('Garson silindi')
    getGarsonlar(restoran.id)
  }

  const panelLinkKopyala = () => {
    const link = `${window.location.origin}/garson/giris`
    navigator.clipboard.writeText(link)
    toast.success('Garson paneli linki kopyalandı!')
  }

  if (yukleniyor) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-yellow-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="text-yellow-500" />
            Garson Yönetimi
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad}</p>
        </div>
        <div className="flex gap-2">
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
            onClick={() => setEkleModal(true)}
            className="bg-yellow-500 text-black hover:bg-yellow-400 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Garson Ekle
          </Button>
        </div>
      </div>

      {/* Garson Paneli Bilgi Kutusu */}
      <Card className="p-4 bg-blue-950/30 border-blue-700 mb-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-blue-300">Garson Paneli Nasıl Çalışır?</p>
            <p className="text-sm text-blue-400/80 mt-1">
              Garsonlar <strong className="text-blue-300">/garson</strong> adresine girerek kendi hesaplarıyla giriş yapar.
              Masaları görür, sipariş alır ve "Mutfağa Gönder" butonuna basar. Sipariş anında mutfak ekranına düşer.
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => window.open('/garson', '_blank')}
                className="text-xs text-blue-400 underline"
              >
                → Garson Panelini Aç
              </button>
              <button
                onClick={() => window.open('/garson/mutfak', '_blank')}
                className="text-xs text-orange-400 underline"
              >
                → Mutfak Ekranını Aç
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Garson Listesi */}
      {garsonlar.length === 0 ? (
        <Card className="p-12 bg-zinc-800 border-zinc-700 text-center">
          <Users className="w-12 h-12 mx-auto mb-3 text-zinc-500 opacity-50" />
          <p className="text-zinc-400 mb-4">Henüz garson eklenmemiş</p>
          <Button
            onClick={() => setEkleModal(true)}
            className="bg-yellow-500 text-black hover:bg-yellow-400"
          >
            <Plus className="w-4 h-4 mr-2" />
            İlk Garsonunu Ekle
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {garsonlar.map(garson => (
            <Card key={garson.id} className={`p-4 border ${garson.aktif ? 'bg-zinc-800 border-zinc-700' : 'bg-zinc-800/50 border-zinc-700/50 opacity-60'}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${garson.aktif ? 'bg-yellow-500 text-black' : 'bg-zinc-600 text-zinc-400'}`}>
                    {garson.ad.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold">{garson.ad}</p>
                    <p className="text-xs text-zinc-400">{garson.email}</p>
                  </div>
                </div>
                <Badge className={garson.aktif ? 'bg-green-800 text-green-200' : 'bg-zinc-700 text-zinc-400'}>
                  {garson.aktif ? 'Aktif' : 'Pasif'}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => durumDegistir(garson.id, !garson.aktif)}
                  className={`flex-1 ${garson.aktif ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-green-700 hover:bg-green-600'}`}
                >
                  {garson.aktif ? (
                    <><UserX className="w-3 h-3 mr-1" /> Pasif Yap</>
                  ) : (
                    <><UserCheck className="w-3 h-3 mr-1" /> Aktif Et</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => garsonSil(garson.id)}
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
          <Card className="p-6 bg-zinc-800 border-zinc-700 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-yellow-500" />
              Yeni Garson Ekle
            </h2>

            <div className="space-y-4">
              <div>
                <Label className="text-zinc-300 mb-2 block">Ad Soyad</Label>
                <Input
                  placeholder="Ahmet Yılmaz"
                  value={yeniGarson.ad}
                  onChange={e => setYeniGarson(p => ({ ...p, ad: e.target.value }))}
                  className="bg-zinc-700 border-zinc-600"
                />
              </div>
              <div>
                <Label className="text-zinc-300 mb-2 block">E-posta</Label>
                <Input
                  type="email"
                  placeholder="garson@restoran.com"
                  value={yeniGarson.email}
                  onChange={e => setYeniGarson(p => ({ ...p, email: e.target.value }))}
                  className="bg-zinc-700 border-zinc-600"
                />
              </div>
              <div>
                <Label className="text-zinc-300 mb-2 block">Şifre</Label>
                <Input
                  type="text"
                  placeholder="En az 6 karakter"
                  value={yeniGarson.sifre}
                  onChange={e => setYeniGarson(p => ({ ...p, sifre: e.target.value }))}
                  className="bg-zinc-700 border-zinc-600"
                />
                <p className="text-xs text-zinc-500 mt-1">Bu şifreyi garsona ilet</p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => setEkleModal(false)}
                variant="outline"
                className="flex-1 border-zinc-600"
              >
                İptal
              </Button>
              <Button
                onClick={garsonEkle}
                disabled={ekleniyor}
                className="flex-1 bg-yellow-500 text-black hover:bg-yellow-400 font-bold"
              >
                {ekleniyor ? 'Ekleniyor...' : 'Garson Ekle'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
