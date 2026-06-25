'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRestoran } from '@/lib/useRestoran'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function KategorilerPage() {
  const { restoran } = useRestoran()
  const [kategoriler, setKategoriler] = useState<any[]>([])
  const [yeniKategori, setYeniKategori] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!restoran) return
    getKategoriler()
  }, [restoran])

  async function getKategoriler() {
    const { data, error } = await supabase
 .from('kategoriler')
 .select('*')
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
      ad: yeniKategori,
      sira: kategoriler.length
    })
    setLoading(false)

    if (error) {
      toast.error('Hata: ' + error.message)
      return
    }

    toast.success('Kategori eklendi')
    setYeniKategori('')
    getKategoriler()
  }

  async function kategoriSil(id: number) {
    const { error } = await supabase.from('kategoriler').delete().eq('id', id)

    if (error) {
      toast.error('Silinemedi: ' + error.message)
      return
    }

    toast.success('Silindi')
    getKategoriler()
  }

  if (!restoran) return <div className="min-h-screen bg-zinc-900 text-white p-6">Yükleniyor...</div>

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      {/* ÜST BAR - NAVİGASYON EKLENDİ */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Kategoriler - {restoran.ad}</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => router.push('/masalar')}
            className="bg-zinc-700 hover:bg-zinc-600"
          >
            Masalar
          </Button>
          <Button
            onClick={() => router.push('/urunler')}
            className="bg-zinc-700 hover:bg-zinc-600"
          >
            Ürünler
          </Button>
        </div>
      </div>

      <Card className="p-6 bg-zinc-800 border-zinc-700 mb-6 max-w-md">
        <div className="flex gap-2">
          <Input
            placeholder="Yeni Kategori Adı"
            value={yeniKategori}
            onChange={e => setYeniKategori(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && kategoriEkle()}
            className="bg-zinc-700"
          />
          <Button
            onClick={kategoriEkle}
            disabled={loading}
            className="bg-yellow-500 text-black font-bold"
          >
            {loading? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {kategoriler.map(kat => (
          <Card key={kat.id} className="p-4 bg-zinc-800 border-zinc-700 flex justify-between items-center">
            <span className="font-bold">{kat.ad}</span>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => kategoriSil(kat.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Sil
            </Button>
          </Card>
        ))}
      </div>

      {kategoriler.length === 0 && (
        <Card className="p-12 bg-zinc-800 text-center border-zinc-700">
          <p className="text-zinc-400">Henüz kategori yok</p>
        </Card>
      )}
    </div>
  )
}
