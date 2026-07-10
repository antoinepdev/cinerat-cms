export function cleanText(text: string): string {
  const keywords = ['español', 'latino', 'castellano', '🇲🇽', '🇪🇸']

  for (const kw of keywords) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(escaped, 'giu')
    text = text.replace(regex, '')
  }

  text = text.replace(/[^\p{L}\p{N}\s]/gu, '') // Conservar solo letras (incluye acentos y caracteres Unicode), números y espacios

  text = text.replace(/\s+/g, ' ').trim() // Eliminar espacios innecesarios: colapsar múltiples espacios en uno solo y recortar extremos

  if (!text) return ''
  else return text
}
