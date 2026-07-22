'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Toaster } from 'sonner'

export default function GarsonLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#27272a',
            color: '#fff',
            border: '1px solid #3f3f46'
          }
        }}
      />
      {children}
    </>
  )
}
