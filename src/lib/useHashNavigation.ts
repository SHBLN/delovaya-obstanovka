import { useEffect } from 'react'
import { scrollToSection } from './scroll'

const idFromHash = (hash: string) => {
  try {
    return decodeURIComponent(hash.slice(1))
  } catch {
    return ''
  }
}

// Адрес вида /#contacts (прямая ссылка, ручное изменение адреса, «Назад»/«Вперёд») должен вести к разделу под шапкой.
export function useHashNavigation() {
  useEffect(() => {
    const goToHash = () => {
      const id = idFromHash(window.location.hash)
      if (id) scrollToSection(id)
    }
    goToHash()
    window.addEventListener('hashchange', goToHash)
    return () => window.removeEventListener('hashchange', goToHash)
  }, [])
}
