'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Brain, TrendingUp, Clock, Package, Sparkles,
  RefreshCw, ChevronRight, Star, AlertCircle
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, Cell
} from 'recharts'

type AnalizVeri = {
  restoran_adi: string
  donem: string
  toplam_siparis: number
  toplam_ciro: number
  ortalama_siparis_tutari: number
  en_yogun_saat: string
  saatlik_dagilim: { saat: string; siparis: number; ciro: number }[]
  gunluk_dagilim: { gun: string; siparis: number; ciro: number }[]
  en_cok_satan: { ad: string; adet: number; ciro: number; karKatkisi: number }[]
  en_cok_kazandiran: { ad: string; adet: number; ciro: number; karKatkisi: number }[]
}

export default function AiAnalizPage() {
  const [analiz, setAnaliz] = useState<string | null>(null)
  const [veri, setVeri] = useState<AnalizVeri | null>(null)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState<string | null>(null)
  const [restoran, setRestoran] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return router.push('/login')

    const { data: restoranData } = await supabase
      .from('restoranlar')
      .select('*')
      .eq('sahibi_id', user.id)
      .single()

    if (restoranData) setRestoran(restoranData)
  }

  const analizBaslat = async () => {
    setYukleniyor(true)
    setHata(null)
    setAnaliz(null)

    try {
      const response = await fetch('/api/ai-analiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (data.error) {
        setHata(data.error)
        toast.error('Analiz başarısız')
      } else {
        setVeri(data.veri)
        if (data.analiz) {
          setAnaliz(data.analiz)
          toast.success('AI analizi tamamlandı!')
        } else if (data.hata) {
          setHata(data.hata)
          toast.info('Veriler yüklendi, AI analizi yapılamadı')
        }
      }
    } catch (err: any) {
      setHata(err.message)
      toast.error('Bağlantı hatası')
    }

    setYukleniyor(false)
  }

  // Markdown'ı basit HTML'e çevir
  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-yellow-400 mt-4 mb-2">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-yellow-500 mt-5 mb-2">$2</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-yellow-500 mt-5 mb-3">$1</h1>')
      .replace(/^\d+\. \*\*(.+?)\*\*/gm, '<div class="font-bold text-yellow-400 mt-3">$1</div>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 text-zinc-300">• $1</li>')
      .replace(/\n\n/g, '<br/><br/>')
  }

  const RENKLER = ['#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#a855f7', '#06b6d4']

  return (
    <div className="min-h-screen bg-zinc-900 text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="text-purple-400" />
            AI Satış Analizi
          </h1>
          <p className="text-zinc-400 text-sm mt-1">{restoran?.ad} · Son 30 gün</p>
        </div>
        <Button
          onClick={analizBaslat}
          disabled={yukleniyor}
          className="bg-purple-600 hover:bg-purple-700 text-white font-bold"
        >
          {yukleniyor ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Analiz Ediliyor...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              AI Analizi Başlat
            </>
          )}
        </Button>
      </div>

      {/* Başlangıç Ekranı */}
      {!veri && !yukleniyor && (
        <Card className="p-12 bg-zinc-800 border-zinc-700 text-center">
          <Brain className="w-20 h-20 mx-auto text-purple-400 mb-6 opacity-60" />
          <h2 className="text-2xl font-bold mb-3">Satışlarını AI ile Analiz Et</h2>
          <p className="text-zinc-400 mb-6 max-w-lg mx-auto">
            Son 30 günlük satış verilerini analiz ederek yoğunluk saatlerini,
            en karlı ürünleri ve gelir artırma fırsatlarını keşfet.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
            <div className="p-4 bg-zinc-700 rounded-lg">
              <Clock className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Yoğunluk Saatleri</p>
              <p className="text-xs text-zinc-400 mt-1">Hangi saatler kritik?</p>
            </div>
            <div className="p-4 bg-zinc-700 rounded-lg">
              <Package className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Ürün Performansı</p>
              <p className="text-xs text-zinc-400 mt-1">En çok ne kazandırıyor?</p>
            </div>
            <div className="p-4 bg-zinc-700 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Gelir Önerileri</p>
              <p className="text-xs text-zinc-400 mt-1">Nasıl daha fazla kazanırsın?</p>
            </div>
          </div>
          <Button
            onClick={analizBaslat}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-3 text-lg"
          >
            <Sparkles className="w-5 h-5 mr-2" />
            Analizi Başlat
          </Button>
        </Card>
      )}

      {/* Yükleniyor */}
      {yukleniyor && (
        <Card className="p-12 bg-zinc-800 border-zinc-700 text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <Brain className="w-24 h-24 text-purple-400 opacity-30" />
            <RefreshCw className="w-10 h-10 text-purple-400 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <h2 className="text-xl font-bold mb-2">Veriler Analiz Ediliyor...</h2>
          <p className="text-zinc-400">Son 30 günlük satış verileri işleniyor</p>
        </Card>
      )}

      {/* Hata */}
      {hata && (
        <Card className="p-4 bg-orange-950/40 border-orange-700 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />
            <p className="text-orange-300 text-sm">{hata}</p>
          </div>
        </Card>
      )}

      {/* Veri Gösterimi */}
      {veri && (
        <div className="space-y-6">
          {/* Özet Kartlar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 bg-gradient-to-br from-green-900/50 to-zinc-800 border-green-700">
              <p className="text-xs text-green-400">Toplam Ciro</p>
              <p className="text-2xl font-bold text-green-400">{veri.toplam_ciro.toFixed(0)}₺</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-blue-900/50 to-zinc-800 border-blue-700">
              <p className="text-xs text-blue-400">Sipariş Sayısı</p>
              <p className="text-2xl font-bold text-blue-400">{veri.toplam_siparis}</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-yellow-900/50 to-zinc-800 border-yellow-700">
              <p className="text-xs text-yellow-400">Ort. Sipariş</p>
              <p className="text-2xl font-bold text-yellow-400">{veri.ortalama_siparis_tutari.toFixed(0)}₺</p>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-orange-900/50 to-zinc-800 border-orange-700">
              <p className="text-xs text-orange-400">En Yoğun Saat</p>
              <p className="text-lg font-bold text-orange-400">{veri.en_yogun_saat}</p>
            </Card>
          </div>

          {/* Grafikler */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Saatlik Yoğunluk */}
            <Card className="p-5 bg-zinc-800 border-zinc-700">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-orange-400" />
                Saatlik Sipariş Yoğunluğu
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={veri.saatlik_dagilim}>
                  <XAxis dataKey="saat" stroke="#71717a" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#71717a" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
                    formatter={(value: any, name: string) => [
                      name === 'siparis' ? `${value} sipariş` : `${Number(value).toFixed(0)}₺`,
                      name === 'siparis' ? 'Sipariş' : 'Ciro'
                    ]}
                  />
                  <Bar dataKey="siparis" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* En Çok Satan */}
            <Card className="p-5 bg-zinc-800 border-zinc-700">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-400" />
                En Çok Satan Ürünler (Top 10)
              </h3>
              <div className="space-y-2 max-h-52 overflow-y-auto">
                {veri.en_cok_satan.map((urun, i) => (
                  <div key={urun.ad} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ backgroundColor: RENKLER[i % RENKLER.length] + '30', color: RENKLER[i % RENKLER.length] }}
                      >
                        {i + 1}
                      </span>
                      <span className="text-sm truncate">{urun.ad}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-zinc-400">{urun.adet} adet</span>
                      <span className="text-sm font-bold text-yellow-400">{urun.ciro.toFixed(0)}₺</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* En Çok Kazandıran */}
            <Card className="p-5 bg-zinc-800 border-zinc-700">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                En Çok Kazandıran Ürünler
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={veri.en_cok_kazandiran} layout="vertical">
                  <XAxis type="number" stroke="#71717a" tickFormatter={v => `${v}₺`} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="ad" stroke="#71717a" width={100} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
                    formatter={(value: any) => `${Number(value).toFixed(2)}₺`}
                  />
                  <Bar dataKey="ciro" radius={[0, 6, 6, 0]}>
                    {veri.en_cok_kazandiran.map((_, i) => (
                      <Cell key={i} fill={RENKLER[i % RENKLER.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Günlük Dağılım */}
            <Card className="p-5 bg-zinc-800 border-zinc-700">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-400" />
                Günlük Sipariş Dağılımı
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={veri.gunluk_dagilim}>
                  <XAxis dataKey="gun" stroke="#71717a" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#71717a" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }}
                    formatter={(value: any) => `${value} sipariş`}
                  />
                  <Bar dataKey="siparis" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* AI Analiz Metni */}
          {analiz && (
            <Card className="p-6 bg-gradient-to-br from-purple-950/40 to-zinc-800 border-purple-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-400" />
                AI Analiz Raporu
                <Badge className="bg-purple-700 text-purple-100 ml-2">GPT-4o Mini</Badge>
              </h2>
              <div
                className="prose prose-invert max-w-none text-zinc-200 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(analiz) }}
              />
            </Card>
          )}

          {/* Yeniden Analiz */}
          <div className="text-center">
            <Button
              onClick={analizBaslat}
              disabled={yukleniyor}
              variant="outline"
              className="border-purple-600 text-purple-400 hover:bg-purple-950"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${yukleniyor ? 'animate-spin' : ''}`} />
              Analizi Yenile
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
