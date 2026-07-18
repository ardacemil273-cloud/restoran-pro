import { useEffect, useRef } from 'react'

/**
 * Sayfa scroll pozisyonunu koruyan hook
 * Tab değişimi veya menü açılması sırasında scroll resetlenmesini önler
 */
export function useScrollPreservation() {
  const scrollPositionRef = useRef<number>(0)

  // Scroll pozisyonunu kaydet
  const saveScrollPosition = () => {
    scrollPositionRef.current = window.scrollY
  }

  // Scroll pozisyonunu geri yükle
  const restoreScrollPosition = () => {
    window.scrollTo({
      top: scrollPositionRef.current,
      behavior: 'auto' // Smooth yerine instant, yoksa kullanıcı fark eder
    })
  }

  // Scroll'u engelle (menü açılırken)
  const preventScroll = () => {
    document.body.style.overflow = 'hidden'
  }

  // Scroll'u aç
  const allowScroll = () => {
    document.body.style.overflow = 'unset'
  }

  return {
    saveScrollPosition,
    restoreScrollPosition,
    preventScroll,
    allowScroll,
    currentPosition: scrollPositionRef.current
  }
}
