'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Download, QrCode } from 'lucide-react'
import QRCode from 'qrcode'

export default function QrKodlarPage() {
  const [restoran, setRestoran] = useState<any>(null)
  const [masalar, setMasalar] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
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
    .single()

    if (!restoranData) {
      toast.error('Restoran bulunamadı')
      return router.push('/')
    }

    setRestoran(restoranData)

    const { data: masaData } = await supabase
    .from('masalar')
    .select('*')
    .eq('restoran_id', restoranData.id)
    .order('ad')

    setMasalar(masaData || [])
    setLoading(false)
  }

  const qrIndir = async (masaAd: string) => {
    const url = `${window.location.origin}/menu/${restoran.slug}?masa=${encodeURIComponent(masaAd)}`

    try {
      // QR'ı canvas olarak üret
      const canvas = document.createElement('canvas')
      await QRCode.toCanvas(canvas, url, {
        width: 512,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      // PNG olarak indir
      const link = document.createElement('a')
      link.download = `${restoran.ad}-${masaAd}-QR.png`
      link.href = canvas.toDataURL()
      link.click()

      toast.success(`${masaAd} QR kodu indirildi`)
    } catch (err) {
      toast.error('QR oluşturulamadı')
    }
  }

  const tumunuIndir = async () => {
    for (const masa of masalar) {
      await qrIndir(masa.ad)
      await new Promise(resolve => setTimeout(resolve, 300)) // 300ms bekle
    }
    toast.success('Tüm QR kodlar indirildi')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <p>Yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <QrCode className="text-yellow-500" />
            QR Kodlar
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran.ad}</p>
        </div>

        {masalar.length > 0 && (
          <Button
            onClick={tumunuIndir}
            className="bg-yellow-500 text-black hover:bg-yellow-400"
          >
            <Download className="w-4 h-4 mr-2" />
            Tümünü İndir
          </Button>
        )}
      </div>

      {masalar.length === 0? (
        <Card className="p-8 bg-zinc-800 border-zinc-700 text-center">
          <p className="text-zinc-400">Henüz masa eklenmemiş</p>
          <Button
            onClick={() => router.push('/masalar')}
            className="mt-4 bg-zinc-700"
          >
            Masa Ekle
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {masalar.map(masa => (
            <Card key={masa.id} className="p-6 bg-zinc-800 border-zinc-700 text-center">
              <div className="mb-4">
                <QrCode className="w-24 h-24 mx-auto text-zinc-600" />
              </div>

              <h3 className="font-bold text-xl mb-1">{masa.ad}</h3>
              <p className="text-xs text-zinc-500 mb-4 break-all">
                /menu/{restoran.slug}?masa={masa.ad}
              </p>

              <Button
                onClick={() => qrIndir(masa.ad)}
                className="w-full bg-yellow-500 text-black hover:bg-yellow-400"
              >
                <Download className="w-4 h-4 mr-2" />
                QR İndir
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
