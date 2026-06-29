'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRestoran } from '@/lib/useRestoran'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function GecmisPage() {
  const { restoran, loading: restoranLoading } = useRestoran()
  const [siparisler, setSiparisler] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtre, setFiltre] = useState<'bugun' | 'hafta' | 'ay'>('bugun')
  const router = useRouter()

  useEffect(() => {
    if (restoranLoading || !restoran) return
    getSiparisler()
  }, [restoran, restoranLoading, filtre])

  async function getSiparisler() {
    if (!restoran) return
    setLoading(true)

    const simdi = new Date()
    let baslangic = new Date()

    if (filtre === 'bugun') {
      baslangic.setHours(0, 0, 0, 0)
    } else if (filtre === 'hafta') {
      baslangic.setDate(simdi.getDate() - 7)
    } else {
      baslangic.setDate(simdi.getDate() - 30)
    }

    const { data, error } = await supabase
      .from('siparisler')
      .select(`
        id,
        toplam_tutar,
        durum,
        olusturulma_tarihi,
        tamamlanma_tarihi,
        masa_id,
        masalar (ad),
        siparis_urunleri (
          id,
          adet,
          birim_fiyat,
          urunler (ad)
        )
      `)
      .eq('restoran_id', restoran.id)
      .eq('durum', 'tamamlandi')
      .gte('tamamlanma_tarihi', baslangic.toISOString())
      .order('tamamlanma_tarihi', { ascending: false })

    if (error) {
      toast.error('Geçmiş yüklenemedi: ' + error.message)
      setLoading(false)
      return
    }

    setSiparisler(data || [])
    setLoading(false)
  }

  const toplamCiro = siparisler.reduce((acc, s) => acc + (s.toplam_tutar || 0), 0)

  if (restoranLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p>Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black">Sipariş Geçmişi</h1>
          <p className="text-sm text-zinc-400 mt-1">{restoran?.ad}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push('/dashboard')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            Dashboard
          </Button>
          <Button onClick={() => router.push('/siparisler')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            Aktif Siparişler
          </Button>
          <Button onClick={() => router.push('/rapor')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            Raporlar
          </Button>
        </div>
      </div>

      {/* Filtre */}
      <div className="flex gap-2 mb-6">
        {(['bugun', 'hafta', 'ay'] as const).map((f) => (
          <Button
            key={f}
            onClick={() => setFiltre(f)}
            className={filtre === f ? 'bg-yellow-500 text-black font-bold' : 'bg-zinc-700 hover:bg-zinc-600'}
          >
            {f === 'bugun' ? 'Bugün' : f === 'hafta' ? 'Son 7 Gün' : 'Son 30 Gün'}
          </Button>
        ))}
      </div>

      {/* Özet */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card className="p-4 bg-zinc-800 border-zinc-700">
          <p className="text-zinc-400 text-sm">Toplam Sipariş</p>
          <p className="text-3xl font-bold text-yellow-500">{siparisler.length}</p>
        </Card>
        <Card className="p-4 bg-zinc-800 border-zinc-700">
          <p className="text-zinc-400 text-sm">Toplam Ciro</p>
          <p className="text-3xl font-bold text-green-400">{toplamCiro}₺</p>
        </Card>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-12">Yükleniyor...</div>
      ) : siparisler.length === 0 ? (
        <Card className="p-12 bg-zinc-800 text-center border-zinc-700">
          <p className="text-zinc-400 text-xl">Bu dönemde tamamlanan sipariş yok</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {siparisler.map(siparis => (
            <Card key={siparis.id} className="p-6 bg-zinc-800 border-zinc-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-bold text-yellow-500">
                    {siparis.masalar?.ad || 'Masa?'}
                  </h2>
                  <p className="text-xs text-zinc-400">
                    {new Date(siparis.tamamlanma_tarihi || siparis.olusturulma_tarihi).toLocaleString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      day: '2-digit',
                      month: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{siparis.toplam_tutar}₺</p>
                  <p className="text-xs text-green-400">Tamamlandı ✓</p>
                </div>
              </div>

              <div className="space-y-2 border-t border-zinc-700 pt-3">
                {siparis.siparis_urunleri?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      <span className="font-bold">{item.adet}x</span> {item.urunler?.ad}
                    </span>
                    <span className="text-zinc-400">{item.birim_fiyat * item.adet}₺</span>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}