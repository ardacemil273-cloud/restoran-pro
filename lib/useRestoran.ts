'use client'
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export function useRestoran() {
  const [restoran, setRestoran] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const getRestoran = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('restoranlar')
      .select('*')
      .eq('sahibi_id', user.id)
      .single()

    setRestoran(data)
    setLoading(false)
  }

  useEffect(() => {
    getRestoran()
  }, [])

  return { 
    restoran, 
    loading, 
    refreshRestoran: getRestoran // EKLENDİ
  }
}
