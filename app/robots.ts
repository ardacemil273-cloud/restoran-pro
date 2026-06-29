import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/login', '/register'],
      disallow: ['/masalar', '/urunler', '/kategoriler', '/siparisler', '/kasa', '/rapor', '/ayarlar', '/garson', '/api/'],
    },
    sitemap: 'https://restoran-pro-scm-22.vercel.app/sitemap.xml',
  }
}
