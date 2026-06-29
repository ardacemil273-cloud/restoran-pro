'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

type StokUyariItem = {
  id: string
  ad: string
  stok: number
  kritik_stok: number
  stok_birimi: string
  durum: 'tukendi' | 'kritik'
}

export default function StokUyari() {
  const [uyarilar, setUyarilar] = useState<StokUyariItem[]>([])
  const [kapali, setKapali] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadUyarilar()
  }, [])

  const loadUyarilar = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: restoranData } = await supabase
      .from('restoranlar')
      .select('id')
      .eq('sahibi_id', user.id)
      .single()

    if (!restoranData) return

    const { data: tumUrunler } = await supabase
      .from('urunler')
      .select('id, ad, stok, kritik_stok, stok_birimi')
      .eq('restoran_id', restoranData.id)
      .eq('aktif', true)
      .not('stok', 'is', null)

    if (!tumUrunler) return

    const kritikler = tumUrunler
      .filter(u => u.stok !== null && u.stok <= u.kritik_stok)
      .map(u => ({
        ...u,
        durum: u.stok === 0 ? 'tukendi' as const : 'kritik' as const
      }))

    setUyarilar(kritikler)
  }

  if (kapali || uyarilar.length === 0) return null

  return (
    <div className="bg-red-950/60 border border-red-700 rounded-lg p-4 mx-4 mt-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-300 text-sm mb-2">
              Stok Uyarısı — {uyarilar.length} ürün kritik seviyede!
            </p>
            <div className="flex flex-wrap gap-2">
              {uyarilar.map(u => (
                <span
                  key={u.id}
                  className={`text-xs px-2 py-1 rounded font-medium ${
                    u.durum === 'tukendi'
                      ? 'bg-red-700 text-red-100'
                      : 'bg-orange-700 text-orange-100'
                  }`}
                >
                  {u.ad}: {u.durum === 'tukendi' ? 'TÜKENDİ' : `${u.stok} ${u.stok_birimi} kaldı`}
                </span>
              ))}
            </div>
            <Button
              onClick={() => router.push('/stok')}
              size="sm"
              className="mt-3 bg-red-700 hover:bg-red-600 text-white text-xs h-7"
            >
              Stok Yönetimine Git →
            </Button>
          </div>
        </div>
        <button
          onClick={() => setKapali(true)}
          className="text-red-400 hover:text-red-200 flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
