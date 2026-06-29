'use client'
import { useEffect, useState, Suspense } from 'react'
import { supabase } from '@/lib/supabase'
import { useRestoran } from '@/lib/useRestoran'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { PAKETLER } from '@/lib/paketler'
import { Check, X, Clock, Shield, Zap, Crown } from 'lucide-react'

function PaketIcerik() {
  const { restoran, loading: restoranLoading } = useRestoran()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const sonuc = searchParams.get('sonuc')
    const paket = searchParams.get('paket')
    if (sonuc === 'basarili' && paket) {
      toast.success(`${PAKETLER[paket as keyof typeof PAKETLER]?.ad} pakete geçildi! 🎉`)
      router.replace('/ayarlar/paket')
    } else if (sonuc === 'hata') {
      toast.error('Ödeme başarısız. Tekrar deneyin.')
      router.replace('/ayarlar/paket')
    }
  }, [searchParams, router])

  if (restoranLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
      </div>
    )
  }

  const mevcutPaket = restoran?.paket_turu || 'basit'
  const bitisTarihi = restoran?.paket_bitis_tarihi
    ? new Date(restoran.paket_bitis_tarihi).toLocaleDateString('tr-TR')
    : null

  const paketOzellikleri = [
    { ad: 'Garson Paneli', basit: true, big: true, pro: true },
    { ad: 'Kasa & Hızlı Satış', basit: false, big: true, pro: true },
    { ad: 'QR Menü', basit: false, big: true, pro: true },
    { ad: 'Stok Takibi', basit: false, big: true, pro: true },
    { ad: 'Müşteri Yönetimi', basit: false, big: true, pro: true },
    { ad: 'Rezervasyon', basit: false, big: true, pro: true },
    { ad: 'Gider Takibi', basit: false, big: true, pro: true },
    { ad: 'İndirim & Kupon', basit: false, big: true, pro: true },
    { ad: 'Gelişmiş Raporlama', basit: false, big: false, pro: true },
    { ad: 'AI Satış Analizi', basit: false, big: false, pro: true },
    { ad: 'Sınırsız Masa', basit: false, big: true, pro: true },
    { ad: 'Sınırsız Ürün', basit: false, big: true, pro: true },
  ]

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Başlık */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-black">Paket Yönetimi</h1>
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
          <Button onClick={() => router.push('/ayarlar')} className="bg-zinc-700 hover:bg-zinc-600">
            ← Geri
          </Button>
        </div>

        {/* Beta Banner */}
        <Card className="p-4 bg-yellow-500/10 border-yellow-500/40 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center shrink-0">
              <Zap className="w-5 h-5 text-black" />
            </div>
            <div>
              <p className="font-bold text-yellow-400">Beta Döneminde Tüm Özellikler Ücretsiz!</p>
              <p className="text-sm text-yellow-500/70 mt-0.5">
                Şu an tüm özellikler tüm kullanıcılara açık. Ödeme sistemi yakında aktif olacak.
                Mevcut kullanıcılara özel erken kayıt fiyatı sunulacak.
              </p>
            </div>
          </div>
        </Card>

        {/* Paket Kartları */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {/* Basit Paket */}
          <Card className={`p-6 border-2 transition ${mevcutPaket === 'basit' ? 'bg-yellow-500/10 border-yellow-500' : 'bg-zinc-800 border-zinc-700'}`}>
            {mevcutPaket === 'basit' && (
              <div className="text-xs text-yellow-500 font-bold mb-2">✓ MEVCUT PAKETİNİZ</div>
            )}
            <h2 className="text-2xl font-black mb-1">Basit</h2>
            <div className="mb-4">
              <p className="text-3xl font-black text-green-400">Ücretsiz</p>
              <p className="text-xs text-zinc-500">Sonsuza kadar</p>
            </div>
            <div className="space-y-1.5 mb-6 text-sm">
              <div className="flex items-center gap-2 text-zinc-400"><Check className="w-4 h-4 text-green-500" /> 5 Masa</div>
              <div className="flex items-center gap-2 text-zinc-400"><Check className="w-4 h-4 text-green-500" /> 20 Ürün</div>
              <div className="flex items-center gap-2 text-zinc-400"><Check className="w-4 h-4 text-green-500" /> Garson Paneli</div>
              <div className="flex items-center gap-2 text-zinc-500"><X className="w-4 h-4" /> Kasa</div>
              <div className="flex items-center gap-2 text-zinc-500"><X className="w-4 h-4" /> QR Menü</div>
              <div className="flex items-center gap-2 text-zinc-500"><X className="w-4 h-4" /> Raporlama</div>
            </div>
            <Button disabled className="w-full bg-zinc-700 text-zinc-400 cursor-default">
              {mevcutPaket === 'basit' ? 'Aktif Paketiniz' : 'Ücretsiz Plan'}
            </Button>
          </Card>

          {/* Big Paket */}
          <Card className={`p-6 border-2 relative transition ${mevcutPaket === 'big' ? 'bg-yellow-500/10 border-yellow-500' : 'bg-zinc-800 border-yellow-500/50 md:scale-105 shadow-xl shadow-yellow-500/10'}`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-xs font-black px-4 py-1 rounded-full">
              EN POPÜLER
            </div>
            {mevcutPaket === 'big' && (
              <div className="text-xs text-yellow-500 font-bold mb-2">✓ MEVCUT PAKETİNİZ</div>
            )}
            <h2 className="text-2xl font-black mb-1">Big</h2>
            <div className="mb-4">
              <p className="text-3xl font-black text-yellow-500">199₺<span className="text-sm text-zinc-400 font-normal">/ay</span></p>
              <p className="text-xs text-zinc-500">Ödeme sistemi yakında aktif</p>
            </div>
            <div className="space-y-1.5 mb-6 text-sm">
              <div className="flex items-center gap-2 text-zinc-300"><Check className="w-4 h-4 text-green-500" /> Sınırsız Masa</div>
              <div className="flex items-center gap-2 text-zinc-300"><Check className="w-4 h-4 text-green-500" /> Sınırsız Ürün</div>
              <div className="flex items-center gap-2 text-zinc-300"><Check className="w-4 h-4 text-green-500" /> Garson Paneli</div>
              <div className="flex items-center gap-2 text-zinc-300"><Check className="w-4 h-4 text-green-500" /> Kasa & Fiş</div>
              <div className="flex items-center gap-2 text-zinc-300"><Check className="w-4 h-4 text-green-500" /> QR Menü</div>
              <div className="flex items-center gap-2 text-zinc-300"><Check className="w-4 h-4 text-green-500" /> Stok & Gider</div>
              <div className="flex items-center gap-2 text-zinc-500"><X className="w-4 h-4" /> AI Analiz</div>
            </div>
            <Button
              disabled
              className="w-full bg-yellow-500/30 text-yellow-300 cursor-not-allowed border border-yellow-500/30"
            >
              <Clock className="w-4 h-4 mr-2" />
              Yakında Aktif
            </Button>
          </Card>

          {/* Pro Paket */}
          <Card className={`p-6 border-2 transition ${mevcutPaket === 'pro' ? 'bg-yellow-500/10 border-yellow-500' : 'bg-zinc-800 border-purple-500/50'}`}>
            {mevcutPaket === 'pro' && (
              <div className="text-xs text-yellow-500 font-bold mb-2">✓ MEVCUT PAKETİNİZ</div>
            )}
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-2xl font-black">Pro</h2>
              <Crown className="w-5 h-5 text-purple-400" />
            </div>
            <div className="mb-4">
              <p className="text-3xl font-black text-purple-400">399₺<span className="text-sm text-zinc-400 font-normal">/ay</span></p>
              <p className="text-xs text-zinc-500">Ödeme sistemi yakında aktif</p>
            </div>
            <div className="space-y-1.5 mb-6 text-sm">
              <div className="flex items-center gap-2 text-zinc-300"><Check className="w-4 h-4 text-green-500" /> Big'deki Her Şey</div>
              <div className="flex items-center gap-2 text-zinc-300"><Check className="w-4 h-4 text-green-500" /> Gelişmiş Raporlama</div>
              <div className="flex items-center gap-2 text-zinc-300"><Check className="w-4 h-4 text-green-500" /> AI Satış Analizi</div>
              <div className="flex items-center gap-2 text-zinc-300"><Check className="w-4 h-4 text-green-500" /> Öncelikli Destek</div>
            </div>
            <Button
              disabled
              className="w-full bg-purple-500/30 text-purple-300 cursor-not-allowed border border-purple-500/30"
            >
              <Clock className="w-4 h-4 mr-2" />
              Yakında Aktif
            </Button>
          </Card>
        </div>

        {/* Özellik Karşılaştırma Tablosu */}
        <Card className="p-6 bg-zinc-800 border-zinc-700 mb-6">
          <h3 className="font-black text-lg mb-4">Özellik Karşılaştırması</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left py-2 text-zinc-400 font-medium">Özellik</th>
                  <th className="text-center py-2 text-zinc-400 font-medium">Basit</th>
                  <th className="text-center py-2 text-yellow-500 font-bold">Big</th>
                  <th className="text-center py-2 text-purple-400 font-bold">Pro</th>
                </tr>
              </thead>
              <tbody>
                {paketOzellikleri.map((ozellik, i) => (
                  <tr key={i} className="border-b border-zinc-700/50">
                    <td className="py-2.5 text-zinc-300">{ozellik.ad}</td>
                    <td className="py-2.5 text-center">
                      {ozellik.basit
                        ? <Check className="w-4 h-4 text-green-500 mx-auto" />
                        : <X className="w-4 h-4 text-zinc-600 mx-auto" />
                      }
                    </td>
                    <td className="py-2.5 text-center">
                      {ozellik.big
                        ? <Check className="w-4 h-4 text-green-500 mx-auto" />
                        : <X className="w-4 h-4 text-zinc-600 mx-auto" />
                      }
                    </td>
                    <td className="py-2.5 text-center">
                      {ozellik.pro
                        ? <Check className="w-4 h-4 text-green-500 mx-auto" />
                        : <X className="w-4 h-4 text-zinc-600 mx-auto" />
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Bilgi Kutusu */}
        <Card className="p-4 bg-zinc-800 border-zinc-700">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-green-400 mb-1">Ödeme Güvenliği (Yakında)</h3>
              <p className="text-sm text-zinc-400">
                Tüm ödemeler PayTR altyapısıyla güvenli şekilde işlenecek.
                Kart bilgileriniz bizim sunucularımızda saklanmayacak.
                Ödeme başarılı olunca paketiniz anında güncellenecek.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default function PaketPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500" />
      </div>
    }>
      <PaketIcerik />
    </Suspense>
  )
}
