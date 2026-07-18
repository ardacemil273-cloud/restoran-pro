'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { NotificationProvider } from '@/components/NotificationProvider'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [restoranId, setRestoranId] = useState('')

  useEffect(() => {
    const getRestoran = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      let { data, error } = await supabase
        .from('restoranlar')
        .select('id')
        .eq('kullanici_id', user.id)
        .maybeSingle()
      
      if (!data && (error?.message?.includes('schema') || !error)) {
        const { data: retry } = await supabase
          .from('restoranlar')
          .select('id')
          .eq('sahibi_id', user.id)
          .maybeSingle()
        data = retry
      }
      if (data) setRestoranId(data.id)
    }
    getRestoran()
  }, [])

  return (
    <>
      <NotificationProvider restoranId={restoranId} />
      {children}
    </>
  )
}