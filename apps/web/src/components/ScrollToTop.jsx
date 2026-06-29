import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation()

  useEffect(() => {
    if (hash) {
      const targetId = decodeURIComponent(hash.slice(1))
      const timeoutId = window.setTimeout(() => {
        document.getElementById(targetId)?.scrollIntoView({ block: 'start', behavior: 'auto' })
      }, 0)
      return () => window.clearTimeout(timeoutId)
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [pathname, search, hash])

  return null
}
