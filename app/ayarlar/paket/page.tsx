'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRestoran } from '@/lib/useRestoran'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { PAKETLER } from '@/lib/paketler'

function PaketIcerik() {
  const { restoran, loading: restoranLoading } = useRestoran()
  const [iframeToken, setIframeToken] = useState<string | null>(null)
  const [odemeLoading, setOdemeLoading] = useState(false)
  const [secilenPaket, setSecilenPaket] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // PayTR'den dönen sonuç
  useEffect(() => {
    const sonuc = searchParams.get('sonuc')
    const paket = searchParams.get('paket')

    if (sonuc === 'basarili' && paket) {
      toast.success(`${PAKETLER[paket as keyof typeof PAKETLER]?.ad} pakete geçildi! 🎉`)
      // URL'i temizle
      router.replace('/ayarlar/paket')
    } else if (sonuc === 'hata') {
      toast.error('Ödeme başarısız. Tekrar deneyin.')
      router.replace('/ayarlar/paket')
    }
  }, [searchParams, router])

  const odemeBaslat = async (paketTuru: string) => {
    if (!restoran) return
    setOdemeLoading(true)
    setSecilenPaket(paketTuru)

    const { data: { user } } = await supabase.auth.getUser()

    const res = await fetch('/api/paytr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paketTuru,
        restoranId: restoran.id,
        kullaniciEmail: user?.email
      })
    })

    const data = await res.json()
    setOdemeLoading(false)

    if (data.error) {
      toast.error('Ödeme başlatılamadı: ' + data.error)
      return
    }

    setIframeToken(data.iframeToken)
  }

  const iptalEt = () => {
    setIframeToken(null)
    setSecilenPaket(null)
  }

  if (restoranLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        Yükleniyor...
      </div>
    )
  }

  const mevcutPaket = restoran?.paket_turu || 'basit'
  const bitisTarihi = restoran?.paket_bitis_tarihi
    ? new Date(restoran.paket_bitis_tarihi).toLocaleDateString('tr-TR')
    : null

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Paket Yönetimi</h1>
            <p className="text-zinc-400 mt-1">
              Mevcut Paket:{' '}
              <span className="text-yellow-500 font-bold">
                {PAKETLER[mevcutPaket as keyof typeof PAKETLER]?.ad}
              </span>
              {bitisTarihi && (
                <span className="text-zinc-500 text-sm ml-2">
                  (Bitiş: {bitisTarihi})
                </span>
              )}
            </p>
          </div>
          <Button onClick={() => router.push('/ayarlar')} className="bg-zinc-700">
            Geri
          </Button>
        </div>

        {/* PayTR Iframe */}
        {iframeToken && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl overflow-hidden w-full max-w-lg">
              <div className="flex justify-between items-center p-4 bg-zinc-800">
                <span className="text-white font-bold">Güvenli Ödeme</span>
                <button
                  onClick={iptalEt}
                  className="text-zinc-400 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>
              <iframe
                src={`https://www.paytr.com/odeme/guvenli/${iframeToken}`}
                width="100%"
                height="600"
                frameBorder="0"
                scrolling="yes"
                style={{ display: 'block' }}
              />
            </div>
          </div>
        )}

        {/* Paket Kartları */}
        <div className="grid md:grid-cols-3 gap-4">
          {Object.entries(PAKETLER).map(([key, paket]) => {
            const aktif = mevcutPaket === key
            const daha_ucuz = ['basit'].includes(key) && mevcutPaket !== 'basit'

            return (
              <Card
                key={key}
                className={`p-6 border-2 transition ${
                  aktif
                    ? 'bg-yellow-500/20 border-yellow-500'
                    : 'bg-zinc-800 border-zinc-700'
                }`}
              >
                {aktif && (
                  <div className="text-xs text-yellow-500 font-bold mb-2">
                    ✓ MEVCUT PAKETİNİZ
                  </div>
                )}

                <h2 className="text-2xl font-bold mb-1">{paket.ad}</h2>
                <p className="text-3xl font-bold text-yellow-500 mb-1">
                  {paket.fiyat === 0 ? 'Ücretsiz' : `${paket.fiyat}₺`}
                  {paket.fiyat > 0 && (
                    <span className="text-sm text-zinc-400">/ay</span>
                  )}
                </p>

                <div className="my-4 space-y-2 text-sm border-t border-zinc-700 pt-4">
                  <div className="flex items-center gap-2">
                    <span>{paket.ozellikler.garson_panel ? '✅' : '❌'}</span>
                    <span>Garson Paneli</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{paket.ozellikler.kasa ? '✅' : '❌'}</span>
                    <span>Kasa / Hızlı Satış</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{paket.ozellikler.qr_menu ? '✅' : '❌'}</span>
                    <span>QR Menü</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{paket.ozellikler.rapor ? '✅' : '❌'}</span>
                    <span>Raporlama</span>
                  </div>
                  <div className="border-t border-zinc-700 pt-2 mt-2 text-zinc-400">
                    <p>{paket.limit.masa === 999 ? 'Sınırsız' : paket.limit.masa} Masa</p>
                    <p>{paket.limit.urun === 999 ? 'Sınırsız' : paket.limit.urun} Ürün</p>
                  </div>
                </div>

                {aktif ? (
                  <Button disabled className="w-full bg-zinc-600 text-zinc-400">
                    Aktif Paketiniz
                  </Button>
                ) : daha_ucuz ? (
                  <Button disabled className="w-full bg-zinc-700 text-zinc-500">
                    Düşürülemez
                  </Button>
                ) : paket.fiyat === 0 ? (
                  <Button disabled className="w-full bg-zinc-700 text-zinc-500">
                    Ücretsiz Plan
                  </Button>
                ) : (
                  <Button
                    onClick={() => odemeBaslat(key)}
                    disabled={odemeLoading && secilenPaket === key}
                    className="w-full bg-yellow-500 text-black font-bold hover:bg-yellow-600"
                  >
                    {odemeLoading && secilenPaket === key
                      ? 'Yükleniyor...'
                      : `${paket.ad} Pakete Geç`}
                  </Button>
                )}
              </Card>
            )
          })}
        </div>

        {/* Bilgi Kutusu */}
        <Card className="p-4 bg-zinc-800 border-zinc-700 mt-6">
          <h3 className="font-bold mb-2 text-yellow-500">Ödeme Güvenliği</h3>
          <p className="text-sm text-zinc-400">
            Tüm ödemeler PayTR altyapısıyla güvenli şekilde işlenir.
            Kart bilgileriniz bizim sunucularımızda saklanmaz.
            Ödeme başarılı olunca paketiniz anında güncellenir.
          </p>
        </Card>
      </div>
    </div>
  )
}

export default function PaketPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        Yükleniyor...
      </div>
    }>
      <PaketIcerik />
    </Suspense>
  )
}
