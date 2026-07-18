/**
 * Belirli bir elementin sayfada görünür olmasını sağlar
 * Scroll resetlemesi olmadan yumuşak bir şekilde odaklanır
 */
export function scrollIntoViewSmooth(elementId: string, offset = 100) {
  const element = document.getElementById(elementId)
  if (!element) return

  const elementPosition = element.getBoundingClientRect().top + window.scrollY
  const offsetPosition = elementPosition - offset

  window.scrollTo({
    top: offsetPosition,
    behavior: 'smooth'
  })
}

/**
 * Tıklanan elemanın konumunu kaydeder ve sonra restore eder
 * Tab değişimi sırasında kullanılır
 */
export function preserveScrollOnTabChange(tabId: string) {
  const scrollMap = new Map<string, number>()

  return {
    save: (id: string) => {
      scrollMap.set(id, window.scrollY)
    },
    restore: (id: string) => {
      const position = scrollMap.get(id)
      if (position !== undefined) {
        window.scrollTo({
          top: position,
          behavior: 'auto'
        })
      }
    },
    clear: () => scrollMap.clear()
  }
}

/**
 * Sayfa scroll'unu devre dışı bırakır (modal açılırken)
 */
export function disableScroll() {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  document.body.style.overflow = 'hidden'
  document.body.style.paddingRight = `${scrollbarWidth}px`
}

/**
 * Sayfa scroll'unu yeniden etkinleştirir
 */
export function enableScroll() {
  document.body.style.overflow = 'unset'
  document.body.style.paddingRight = '0'
}

/**
 * Smooth scroll animasyonu ile belirli bir Y pozisyonuna git
 */
export function scrollToPosition(position: number, duration = 500) {
  const startPosition = window.scrollY
  const distance = position - startPosition
  let start: number | null = null

  const animation = (currentTime: number) => {
    if (start === null) start = currentTime
    const elapsed = currentTime - start
    const progress = Math.min(elapsed / duration, 1)

    // Easing function: ease-out-cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3)

    window.scrollTo(0, startPosition + distance * easeProgress)

    if (progress < 1) {
      requestAnimationFrame(animation)
    }
  }

  requestAnimationFrame(animation)
}
