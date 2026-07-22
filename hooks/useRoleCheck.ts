import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function usePatronOnly() {
  const [role, setRole] = useState<'patron' | 'garson' | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const { data: restoran } = await supabase
        .from('restoranlar')
        .select('id')
        .eq('sahibi_id', user.id)
        .maybeSingle()

      if (restoran) {
        setRole('patron')
      } else {
        setRole('garson')
      }
      setLoading(false)
    }
    checkRole()
  }, [])

  return { role, loading }
}

export function useRoleCheck() {
  const [role, setRole] = useState<'patron' | 'garson' | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }
      const { data: restoran } = await supabase
        .from('restoranlar')
        .select('id')
        .eq('sahibi_id', user.id)
        .maybeSingle()
      setRole(restoran ? 'patron' : 'garson')
      setLoading(false)
    }
    check()
  }, [])

  return { role, loading }
}
