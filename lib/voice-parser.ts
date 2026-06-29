/**
 * Sesli sipariş metnini düzenleyen helper
 * Örnek: "lahmacun acısız" -> "Acısız Lahmacun"
 * Örnek: "1 iskender yoğurtlu kola yok" -> "Yoğurtlu İskender (Kola Yok)"
 */
export function parseVoiceOrder(text: string): string {
  if (!text) return ''
  
  let processed = text.toLowerCase().trim()
  
  // Sık kullanılan düzeltmeler
  const corrections: Record<string, string> = {
    'acısız': 'Acısız',
    'acılı': 'Acılı',
    'yoğurtlu': 'Yoğurtlu',
    'bol': 'Bol',
    'az': 'Az',
    'soğansız': 'Soğansız',
    'soğanlı': 'Soğanlı',
    'ekstra': 'Ekstra',
    'yok': 'Yok',
  }

  // Kelimeleri ayır
  const words = processed.split(' ')
  
  // Sıfatları ve ana ürünü tespit etmeye çalış (basit mantık)
  // Eğer metinde "acısız", "yoğurtlu" gibi kelimeler sonda geçiyorsa başa al
  const adjectives = ['acısız', 'acılı', 'yoğurtlu', 'bol', 'az', 'soğansız', 'soğanlı', 'ekstra']
  
  let foundAdjectives: string[] = []
  let mainProduct: string[] = []
  let negativeNotes: string[] = []

  words.forEach((word, index) => {
    if (adjectives.includes(word)) {
      foundAdjectives.push(corrections[word])
    } else if (word === 'yok' && index > 0) {
      // Bir önceki kelimeyi not olarak al
      const prevWord = words[index-1]
      negativeNotes.push(`${prevWord.charAt(0).toUpperCase() + prevWord.slice(1)} Yok`)
      // Ana üründen önceki kelimeyi çıkar (eğer oradaysa)
      mainProduct = mainProduct.filter(w => w !== prevWord)
    } else if (word !== 'yok') {
      mainProduct.push(word.charAt(0).toUpperCase() + word.slice(1))
    }
  })

  let result = ''
  if (foundAdjectives.length > 0) result += foundAdjectives.join(' ') + ' '
  result += mainProduct.join(' ')
  if (negativeNotes.length > 0) result += ` (${negativeNotes.join(', ')})`

  return result.trim()
}
