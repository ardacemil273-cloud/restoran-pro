'use client'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Download, Printer } from 'lucide-react'
import QRCode from 'qrcode'

export default function QRPage() {
  const [restoran, setRestoran] = useState<any>(null)
  const [masalar, setMasalar] = useState<any[]>([])
  const [qrList, setQrList] = useState<{ ad: string; dataUrl: string }[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)

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

    if (!restoranData) {
      toast.error('Restoran bulunamadı')
      return
    }
    setRestoran(restoranData)

    const { data: masaData } = await supabase
 .from('masalar')
 .select('*')
 .eq('restoran_id', restoranData.id)
 .order('sira', { ascending: true })

    setMasalar(masaData || [])
    setLoading(false)
  }

  async function tumQRLariOlustur() {
    if (!restoran?.slug) {
      toast.error('Restoran slug yok. Ayarlardan ekle.')
      return
    }

    const list: { ad: string; dataUrl: string }[] = []

    for (const masa of masalar) {
      const masaParam = masa.ad.replace(/\s+/g, '-')
      const url = `${window.location.origin}/menu/${restoran.slug}?masa=${masaParam}`

      const dataUrl = await QRCode.toDataURL(url, {
        width: 400,
        margin: 1,
        errorCorrectionLevel: 'H',
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      list.push({ ad: masa.ad, dataUrl })
    }

    setQrList(list)
    toast.success(`${list.length} QR oluşturuldu`)
  }

  function yazdir() {
    if (qrList.length === 0) {
      toast.error('Önce QR oluştur')
      return
    }
    window.print()
  }

  if (loading) {
    return <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
      Yükleniyor...
    </div>
  }

  return (
    <div className="p-6 bg-zinc-900 min-h-screen">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
         .print-area,.print-area * {
            visibility: visible;
          }
         .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
         .no-print {
            display: none!important;
          }
        }
      `}</style>

      <div className="no-print">
        <h1 className="text-3xl font-bold text-white mb-6">{restoran?.ad} - QR Kodlar</h1>

        <Card className="p-6 bg-zinc-800 border-zinc-700 mb-6">
          <div className="flex gap-4">
            <Button
              onClick={tumQRLariOlustur}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Tüm QR'ları Oluştur ({masalar.length} masa)
            </Button>

            <Button
              onClick={yazdir}
              disabled={qrList.length === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <Printer className="w-4 h-4 mr-2" />
              Yazdır
            </Button>

            <Button
              onClick={() => router.push('/masalar')}
              variant="outline"
              className="border-zinc-600"
            >
              Masalara Dön
            </Button>
          </div>
        </Card>
      </div>

      {/* Yazdırılacak Alan */}
      <div ref={printRef} className="print-area">
        {qrList.length > 0 && (
          <div className="grid grid-cols-2 gap-4 bg-white p-8">
            {qrList.map((qr, i) => (
              <div
                key={i}
                className="border-2 border-dashed border-black p-4 text-center page-break-inside-avoid"
              >
                <h3 className="text-2xl font-bold text-black mb-2">{restoran.ad}</h3>
                <p className="text-xl text-black mb-4">{qr.ad}</p>
                <img src={qr.dataUrl} alt={qr.ad} className="w-full max-w-[200px] mx-auto" />
                <p className="text-xs text-black mt-4">Menüyü görmek için okutun</p>
              </div>
            ))}
          </div>
        )}

        {qrList.length === 0 && (
          <Card className="p-12 bg-zinc-800 text-center border-zinc-700 no-print">
            <p className="text-zinc-400">Henüz QR oluşturulmadı</p>
            <p className="text-sm text-zinc-500 mt-2">Yukarıdaki butona basarak tüm masalar için QR oluştur</p>
          </Card>
        )}
      </div>
    </div>
  )
}
