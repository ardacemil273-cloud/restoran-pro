import { useEffect, useRef } from 'react'

export function useMobileMenu(isOpen: boolean) {
  const scrollPositionRef = useRef(0)

  useEffect(() => {
    if (isOpen) {
      // Menü açıldığında scroll pozisyonunu kaydet
      scrollPositionRef.current = window.scrollY
      // Scroll'u engelle
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'
      document.body.style.top = `-${scrollPositionRef.current}px`
    } else {
      // Menü kapatıldığında scroll'u geri al
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
      window.scrollTo(0, scrollPositionRef.current)
    }

    return () => {
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.width = ''
      document.body.style.top = ''
    }
  }, [isOpen])
}
