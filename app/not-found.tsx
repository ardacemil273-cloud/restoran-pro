import Link from 'next/link'
import { ChefHat, Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <ChefHat className="w-20 h-20 text-yellow-500 mx-auto mb-6 opacity-50" />
        <h1 className="text-6xl font-black text-yellow-500 mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-4">Sayfa Bulunamadı</h2>
        <p className="text-zinc-400 mb-8">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-yellow-500 text-black font-bold px-6 py-3 rounded-lg hover:bg-yellow-400 transition"
          >
            <Home className="w-4 h-4" />
            Ana Sayfa
          </Link>
          <Link
            href="/masalar"
            className="flex items-center justify-center gap-2 border border-zinc-600 text-zinc-300 font-bold px-6 py-3 rounded-lg hover:bg-zinc-800 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Masalara Dön
          </Link>
        </div>
      </div>
    </div>
  )
}
