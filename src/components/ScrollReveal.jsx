import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const REVEAL_SELECTOR = [
  'main .section-eyebrow',
  'main h1',
  'main h2',
  'main h3',
  'main p',
  'main li',
  'main .btn',
  'main .hero-badge',
  'main .hero-point',
  'main .hero-slide-copy',
  'main .intro-card',
  'main .partner-item',
  'main .industry-card',
  'main .feature-card',
  'main .deployment-card',
  'main .solution-card',
  'main .news-card',
  'main .listing-card',
  'main .detail-card',
  'main .detail-cta',
  'main .contact-card',
  'main .contact-form',
  'main .tools-download-card',
].join(',')

export default function ScrollReveal() {
  const { pathname } = useLocation()

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const elements = Array.from(document.querySelectorAll(REVEAL_SELECTOR))
      .filter((element) => !element.closest('.header, .footer, .floating-actions'))

    elements.forEach((element, index) => {
      element.classList.remove('is-visible')
      element.classList.add('reveal-on-scroll')
      element.style.setProperty('--reveal-delay', `${Math.min(index % 8, 7) * 45}ms`)
    })

    if (reduceMotion || !('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'))
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        })
      },
      {
        root: null,
        rootMargin: '0px 0px -12% 0px',
        threshold: 0.12,
      },
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [pathname])

  return null
}
