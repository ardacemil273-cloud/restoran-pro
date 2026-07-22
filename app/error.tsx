'use client'
import { useEffect } from 'react'
import { ChefHat, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-zinc-900 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <ChefHat className="w-20 h-20 text-red-500 mx-auto mb-6 opacity-50" />
        <h1 className="text-4xl font-black text-red-500 mb-4">Hata!</h1>
        <h2 className="text-xl font-bold mb-4">Bir şeyler yanlış gitti</h2>
        <p className="text-zinc-400 mb-8">
          Beklenmedik bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.
        </p>
        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-2 bg-yellow-500 text-black font-bold px-6 py-3 rounded-lg hover:bg-yellow-400 transition mx-auto"
        >
          <RefreshCw className="w-4 h-4" />
          Tekrar Dene
        </button>
      </div>
    </div>
  )
}
