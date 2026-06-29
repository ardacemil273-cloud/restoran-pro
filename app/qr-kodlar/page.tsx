'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Download, QrCode, Printer, Palette, RefreshCw, Globe, LayoutDashboard, ChefHat } from 'lucide-react'
import QRCode from 'qrcode'
import { QRCodeSVG } from 'qrcode.react'

export default function QrKodlarPage() {
  const [restoran, setRestoran] = useState<any>(null)
  const [masalar, setMasalar] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [onKarenk, setOnKarenk] = useState('#000000')
  const [arkaKarenk, setArkaKarenk] = useState('#ffffff')
  const [logoGoster, setLogoGoster] = useState(true)
  const [secilenMasa, setSecilenMasa] = useState<string | null>(null)
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

  const getQrUrl = (masaAd: string) => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/menu/${restoran?.slug}?masa=${encodeURIComponent(masaAd)}`
  }

  const qrIndir = async (masaAd: string) => {
    const url = getQrUrl(masaAd)
    try {
      const canvas = document.createElement('canvas')
      // Yüksek çözünürlüklü QR kodu
      await QRCode.toCanvas(canvas, url, {
        width: 800,
        margin: 3,
        color: {
          dark: onKarenk,
          light: arkaKarenk
        },
        errorCorrectionLevel: 'H' // Yüksek hata düzeltme (logo için)
      })

      // Restoran adı ve masa adı ekle
      const ctx = canvas.getContext('2d')
      if (ctx) {
        // Üst başlık alanı ekle
        const finalCanvas = document.createElement('canvas')
        finalCanvas.width = 800
        finalCanvas.height = 920
        const finalCtx = finalCanvas.getContext('2d')
        if (finalCtx) {
          // Arka plan
          finalCtx.fillStyle = arkaKarenk
          finalCtx.fillRect(0, 0, 800, 920)

          // QR kodu çiz
          finalCtx.drawImage(canvas, 0, 60)

          // Restoran adı
          finalCtx.fillStyle = onKarenk
          finalCtx.font = 'bold 36px Arial'
          finalCtx.textAlign = 'center'
          finalCtx.fillText(restoran?.ad || '', 400, 45)

          // Masa adı (alt)
          finalCtx.font = 'bold 28px Arial'
          finalCtx.fillText(masaAd, 400, 895)

          const link = document.createElement('a')
          link.download = `${restoran?.ad}-${masaAd}-QR.png`
          link.href = finalCanvas.toDataURL('image/png')
          link.click()
        }
      }

      toast.success(`${masaAd} QR kodu indirildi`)
    } catch (err) {
      toast.error('QR oluşturulamadı')
    }
  }

  const tumunuIndir = async () => {
    toast.info('Tüm QR kodlar indiriliyor...')
    for (const masa of masalar) {
      await qrIndir(masa.ad)
      await new Promise(resolve => setTimeout(resolve, 400))
    }
    toast.success('Tüm QR kodlar indirildi!')
  }

  const tumunuYazdir = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (!printWindow) return

    const qrItems = masalar.map(masa => {
      const url = getQrUrl(masa.ad)
      return `
        <div class="qr-item">
          <div class="masa-ad">${restoran?.ad}</div>
          <div id="qr-${masa.id}" class="qr-placeholder" data-url="${url}"></div>
          <div class="masa-isim">${masa.ad}</div>
          <div class="url-text">${url.replace('https://', '')}</div>
        </div>
      `
    }).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>QR Kodlar - ${restoran?.ad}</title>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; background: #fff; }
            .header { text-align: center; padding: 20px; border-bottom: 2px solid #000; margin-bottom: 20px; }
            .header h1 { font-size: 24px; }
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px; }
            .qr-item {
              border: 2px solid #000;
              border-radius: 8px;
              padding: 16px;
              text-align: center;
              page-break-inside: avoid;
            }
            .masa-ad { font-size: 14px; font-weight: bold; color: #666; margin-bottom: 8px; }
            .masa-isim { font-size: 22px; font-weight: bold; margin-top: 10px; }
            .url-text { font-size: 9px; color: #999; margin-top: 4px; word-break: break-all; }
            .qr-placeholder { display: flex; justify-content: center; }
            @media print {
              @page { margin: 10mm; size: A4; }
              .grid { grid-template-columns: repeat(3, 1fr); }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${restoran?.ad} - QR Menü Kodları</h1>
            <p style="font-size:12px; color:#666; margin-top:4px;">Masalara yapıştırın - Müşteriler okutarak menüye ulaşabilir</p>
          </div>
          <div class="grid">
            ${qrItems}
          </div>
          <script>
            window.onload = function() {
              ${masalar.map(masa => `
                new QRCode(document.getElementById('qr-${masa.id}'), {
                  text: '${getQrUrl(masa.ad)}',
                  width: 180,
                  height: 180,
                  colorDark: '${onKarenk}',
                  colorLight: '${arkaKarenk}',
                  correctLevel: QRCode.CorrectLevel.H
                });
              `).join('')}
              setTimeout(function() { window.print(); }, 1500);
            }
          <\/script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin mr-2" />
        Yükleniyor...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <QrCode className="w-7 h-7 text-yellow-500" />
            QR Kod Oluşturucu
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad} · {masalar.length} masa</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button onClick={() => router.push('/dashboard')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <LayoutDashboard className="w-4 h-4 mr-1.5" />
            Dashboard
          </Button>
          <Button onClick={() => router.push('/masalar')} className="bg-zinc-700 hover:bg-zinc-600" size="sm">
            <ChefHat className="w-4 h-4 mr-1.5" />
            Masalar
          </Button>
          {masalar.length > 0 && (
            <>
              <Button
                onClick={tumunuYazdir}
                variant="outline"
                className="border-zinc-600 text-zinc-300"
                size="sm"
              >
                <Printer className="w-4 h-4 mr-1.5" />
                Tümünü Yazdır
              </Button>
              <Button
                onClick={tumunuIndir}
                className="bg-yellow-500 text-black hover:bg-yellow-400"
                size="sm"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Tümünü İndir
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Renk Özelleştirme */}
      <Card className="p-4 bg-zinc-800 border-zinc-700 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-5 h-5 text-yellow-500" />
          <h2 className="font-bold">QR Kod Özelleştirme</h2>
        </div>
        <div className="flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-3">
            <Label className="text-zinc-300">Ön Renk (QR)</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={onKarenk}
                onChange={e => setOnKarenk(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
              />
              <Input
                value={onKarenk}
                onChange={e => setOnKarenk(e.target.value)}
                className="w-28 bg-zinc-700 border-zinc-600 text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-zinc-300">Arka Renk</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={arkaKarenk}
                onChange={e => setArkaKarenk(e.target.value)}
                className="w-10 h-10 rounded cursor-pointer border-0 bg-transparent"
              />
              <Input
                value={arkaKarenk}
                onChange={e => setArkaKarenk(e.target.value)}
                className="w-28 bg-zinc-700 border-zinc-600 text-sm"
              />
            </div>
          </div>
          <Button
            onClick={() => { setOnKarenk('#000000'); setArkaKarenk('#ffffff') }}
            variant="outline"
            size="sm"
            className="border-zinc-600 text-zinc-400"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Sıfırla
          </Button>
        </div>
      </Card>

      {masalar.length === 0 ? (
        <Card className="p-8 bg-zinc-800 border-zinc-700 text-center">
          <QrCode className="w-16 h-16 mx-auto text-zinc-600 mb-4" />
          <p className="text-zinc-400 mb-4">Henüz masa eklenmemiş</p>
          <Button
            onClick={() => router.push('/masalar')}
            className="bg-yellow-500 text-black hover:bg-yellow-400"
          >
            Masa Ekle
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {masalar.map(masa => {
            const url = getQrUrl(masa.ad)
            return (
              <Card
                key={masa.id}
                className={`p-5 border-2 transition-all cursor-pointer ${
                  secilenMasa === masa.id
                    ? 'border-yellow-500 bg-yellow-950/20'
                    : 'border-zinc-700 bg-zinc-800 hover:border-zinc-500'
                }`}
                onClick={() => setSecilenMasa(secilenMasa === masa.id ? null : masa.id)}
              >
                {/* QR Önizleme */}
                <div
                  className="flex justify-center items-center mb-4 p-3 rounded-lg"
                  style={{ backgroundColor: arkaKarenk }}
                >
                  <QRCodeSVG
                    value={url}
                    size={140}
                    fgColor={onKarenk}
                    bgColor={arkaKarenk}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <h3 className="font-bold text-xl text-center mb-1">{masa.ad}</h3>

                <div className="flex items-center gap-1 mb-3">
                  <Globe className="w-3 h-3 text-zinc-500 flex-shrink-0" />
                  <p className="text-xs text-zinc-500 truncate">{url}</p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={(e) => { e.stopPropagation(); qrIndir(masa.ad) }}
                    className="flex-1 bg-yellow-500 text-black hover:bg-yellow-400 text-sm"
                    size="sm"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    PNG İndir
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Seçili Masa Büyük Önizleme */}
      {secilenMasa && (() => {
        const masa = masalar.find(m => m.id === secilenMasa)
        if (!masa) return null
        const url = getQrUrl(masa.ad)
        return (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setSecilenMasa(null)}>
            <Card className="p-8 bg-white text-black max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
              <p className="font-bold text-lg mb-1">{restoran?.ad}</p>
              <p className="text-zinc-500 text-sm mb-4">Menüye erişmek için okutun</p>
              <div className="flex justify-center mb-4" style={{ backgroundColor: arkaKarenk, padding: '16px', borderRadius: '8px' }}>
                <QRCodeSVG
                  value={url}
                  size={220}
                  fgColor={onKarenk}
                  bgColor={arkaKarenk}
                  level="H"
                  includeMargin={false}
                />
              </div>
              <p className="font-bold text-2xl mb-2">{masa.ad}</p>
              <p className="text-xs text-zinc-400 break-all mb-4">{url}</p>
              <div className="flex gap-2">
                <Button onClick={() => qrIndir(masa.ad)} className="flex-1 bg-yellow-500 text-black hover:bg-yellow-400">
                  <Download className="w-4 h-4 mr-2" />
                  PNG İndir
                </Button>
                <Button onClick={() => setSecilenMasa(null)} variant="outline" className="flex-1">
                  Kapat
                </Button>
              </div>
            </Card>
          </div>
        )
      })()}
    </div>
  )
}
