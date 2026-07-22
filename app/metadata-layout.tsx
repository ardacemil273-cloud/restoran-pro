import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Restoran Pro',
  description: 'Profesyonel Restoran Yönetim Sistemi - Sipariş, Kasa, Garson Paneli, Mutfak Ekranı',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Restoran Pro',
    startupImage: [
      { url: '/icons/icon-512x512.png' }
    ]
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#eab308',
    'msapplication-TileImage': '/icons/icon-144x144.png',
  }
}

export const viewport: Viewport = {
  themeColor: '#eab308',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}
