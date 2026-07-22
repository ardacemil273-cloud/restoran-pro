'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRestoran } from '@/lib/useRestoran'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Tag, Plus, Trash2, Package, LayoutDashboard, Edit2, Check, X } from 'lucide-react'

export default function KategorilerPage() {
  const { restoran } = useRestoran()
  const [kategoriler, setKategoriler] = useState<any[]>([])
  const [yeniKategori, setYeniKategori] = useState('')
  const [loading, setLoading] = useState(false)
  const [duzenlenenId, setDuzenlenenId] = useState<string | null>(null)
  const [duzenlemeAdi, setDuzenlemeAdi] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (!restoran) return
    getKategoriler()
  }, [restoran])

  async function getKategoriler() {
    const { data, error } = await supabase
      .from('kategoriler')
      .select('*, urunler(count)')
      .eq('restoran_id', restoran.id)
      .order('sira')

    if (error) {
      toast.error('Kategoriler yüklenemedi')
      return
    }
    if (data) setKategoriler(data)
  }

  async function kategoriEkle() {
    if (!yeniKategori.trim()) return toast.error('Kategori adı gir')

    setLoading(true)
    const { error } = await supabase.from('kategoriler').insert({
      restoran_id: restoran.id,
      ad: yeniKategori.trim(),
      sira: kategoriler.length
    })
    setLoading(false)

    if (error) {
      toast.error('Hata: ' + error.message)
      return
    }

    toast.success('Kategori eklendi!')
    setYeniKategori('')
    getKategoriler()
  }

  async function kategoriSil(id: string, ad: string) {
    if (!confirm(`"${ad}" kategorisini silmek istediğine emin misin? İçindeki ürünler kategorisiz kalabilir.`)) return

    const { error } = await supabase.from('kategoriler').delete().eq('id', id)
    if (error) {
      toast.error('Silinemedi: ' + error.message)
      return
    }
    toast.success('Kategori silindi')
    getKategoriler()
  }

  async function kategoriDuzenle(id: string) {
    if (!duzenlemeAdi.trim()) return toast.error('Kategori adı boş olamaz')

    const { error } = await supabase.from('kategoriler').update({ ad: duzenlemeAdi.trim() }).eq('id', id)
    if (error) {
      toast.error('Güncellenemedi')
      return
    }
    toast.success('Kategori güncellendi')
    setDuzenlenenId(null)
    getKategoriler()
  }

  if (!restoran) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <Tag className="w-7 h-7 text-pink-500" />
            Kategori Yönetimi
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{kategoriler.length} kategori • {restoran.ad}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => router.push('/dashboard')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <LayoutDashboard className="w-4 h-4 mr-1.5" />
            Dashboard
          </Button>
          <Button onClick={() => router.push('/urunler')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <Package className="w-4 h-4 mr-1.5" />
            Ürünler
          </Button>
        </div>
      </div>

      {/* Kategori Ekleme */}
      <Card className="p-5 bg-zinc-800 border-zinc-700 mb-6 max-w-lg">
        <h2 className="font-bold mb-3 text-zinc-200">Yeni Kategori Ekle</h2>
        <div className="flex gap-2">
          <Input
            placeholder="Örn: Ana Yemekler, İçecekler, Tatlılar"
            value={yeniKategori}
            onChange={e => setYeniKategori(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && kategoriEkle()}
            className="bg-zinc-700 border-zinc-600 focus:border-yellow-500"
          />
          <Button
            onClick={kategoriEkle}
            disabled={loading}
            className="bg-yellow-500 text-black font-bold hover:bg-yellow-400 shrink-0"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {loading ? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </div>
      </Card>

      {/* Kategori Listesi */}
      {kategoriler.length === 0 ? (
        <Card className="p-12 bg-zinc-800 border-zinc-700 text-center">
          <Tag className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
          <p className="text-zinc-400 font-bold mb-2">Henüz kategori eklenmemiş</p>
          <p className="text-zinc-500 text-sm mb-4">
            Ürünlerinizi kategorilere ayırarak menünüzü düzenleyin
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-sm text-zinc-500">
            <span className="bg-zinc-700 px-3 py-1 rounded-full">Ana Yemekler</span>
            <span className="bg-zinc-700 px-3 py-1 rounded-full">İçecekler</span>
            <span className="bg-zinc-700 px-3 py-1 rounded-full">Tatlılar</span>
            <span className="bg-zinc-700 px-3 py-1 rounded-full">Başlangıçlar</span>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {kategoriler.map((kat, index) => (
            <Card
              key={kat.id}
              className="p-4 bg-zinc-800 border-zinc-700 hover:border-zinc-600 transition"
            >
              {duzenlenenId === kat.id ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={duzenlemeAdi}
                    onChange={e => setDuzenlemeAdi(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && kategoriDuzenle(kat.id)}
                    className="bg-zinc-700 border-zinc-600 focus:border-yellow-500 h-8 text-sm"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    className="h-8 w-8 bg-green-600 hover:bg-green-700 shrink-0"
                    onClick={() => kategoriDuzenle(kat.id)}
                  >
                    <Check className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setDuzenlenenId(null)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-zinc-700 rounded-lg flex items-center justify-center text-xs font-bold text-zinc-400">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-bold text-white">{kat.ad}</p>
                      <p className="text-xs text-zinc-500">
                        {kat.urunler?.[0]?.count || 0} ürün
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-zinc-400 hover:text-white hover:bg-zinc-700"
                      onClick={() => { setDuzenlenenId(kat.id); setDuzenlemeAdi(kat.ad) }}
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-950"
                      onClick={() => kategoriSil(kat.id, kat.ad)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
