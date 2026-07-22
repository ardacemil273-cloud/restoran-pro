# 🔧 Scroll Resetleme Hatası - Çözüm Rehberi

## Problem
Menü açılırken veya tab değiştirilirken sayfa otomatik olarak en üste atılıyor. Bu, kullanıcı deneyimini kötü yapıyor.

## Çözüm

### 1. **useScrollPreservation Hook'u Kullan**

```tsx
import { useScrollPreservation } from '@/hooks/useScrollPreservation'

export default function MyComponent() {
  const { saveScrollPosition, restoreScrollPosition } = useScrollPreservation()

  const handleTabChange = () => {
    saveScrollPosition()
    setActiveTab('new-tab')
  }

  return (
    <button onClick={handleTabChange}>
      Tab Değiştir
    </button>
  )
}
```

### 2. **SmoothAccordion Bileşeni Kullan**

Scroll resetlemeden açılır/kapanır menü:

```tsx
import SmoothAccordion from '@/components/SmoothAccordion'
import { Settings } from 'lucide-react'

export default function Settings() {
  return (
    <SmoothAccordion
      title="Ayarlar"
      icon={<Settings className="w-5 h-5" />}
      onOpen={() => console.log('Açıldı')}
    >
      {/* İçerik */}
    </SmoothAccordion>
  )
}
```

### 3. **ResponsiveSidebar Kullan**

Mobilde scroll resetlemeden açılan sidebar:

```tsx
import ResponsiveSidebar from '@/components/ResponsiveSidebar'

export default function Layout() {
  return (
    <ResponsiveSidebar title="Menü">
      {/* Sidebar içeriği */}
    </ResponsiveSidebar>
  )
}
```

### 4. **Scroll Utility Fonksiyonları Kullan**

```tsx
import { 
  scrollIntoViewSmooth, 
  disableScroll, 
  enableScroll,
  scrollToPosition 
} from '@/lib/scrollUtils'

// Belirli bir elementin görünür olmasını sağla
scrollIntoViewSmooth('element-id', 100)

// Modal açılırken scroll'u engelle
disableScroll()

// Modal kapanırken scroll'u aç
enableScroll()

// Belirli bir pozisyona yumuşak scroll
scrollToPosition(500, 500) // 500px'e 500ms'de git
```

## Best Practices

### ✅ Yapılması Gerekenler

1. **Tab değişimi sırasında:**
   ```tsx
   onClick={() => {
     saveScrollPosition()
     setActiveTab('new-tab')
   }}
   ```

2. **Modal açılırken:**
   ```tsx
   useEffect(() => {
     if (isOpen) disableScroll()
     else enableScroll()
   }, [isOpen])
   ```

3. **Menü açılırken:**
   ```tsx
   <SmoothAccordion>
     {/* Otomatik olarak scroll resetlenmez */}
   </SmoothAccordion>
   ```

### ❌ Yapılmaması Gerekenler

1. **href="#" kullanma** - Scroll'u resetler
2. **window.scrollTo(0, 0)** - Kullanıcıyı en üste atlar
3. **Sayfayı yeniden render etme** - State değişiminde scroll resetlenir

## Debugging

Scroll resetleme sorununu debug etmek için:

```tsx
// Scroll değişimini izle
useEffect(() => {
  const handleScroll = () => {
    console.log('Scroll Y:', window.scrollY)
  }
  
  window.addEventListener('scroll', handleScroll)
  return () => window.removeEventListener('scroll', handleScroll)
}, [])
```

## Performance Tips

- `behavior: 'auto'` kullan (instant scroll)
- `behavior: 'smooth'` sadece kullanıcı etkileşiminde kullan
- Scroll event'leri throttle et
- Büyük listelerde virtualization kullan

---

**Özet:** Her zaman `useScrollPreservation` hook'unu veya scroll utility'lerini kullan, `window.scrollTo(0, 0)` asla kullanma! 🚀
