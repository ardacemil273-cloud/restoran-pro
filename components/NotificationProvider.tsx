'use client'
import { Toaster } from 'react-hot-toast'
import { useOrderNotifications } from '@/hooks/useOrderNotifications'

export function NotificationProvider({ restoranId }: { restoranId: string }) {
  useOrderNotifications(restoranId)
  return <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
}