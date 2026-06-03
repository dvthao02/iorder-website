import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const REVEAL_SELECTOR = [
  'main .section-title',
  'main .listing-hero-title',
  'main .listing-hero-lead',
  'main .detail-title',
  'main .detail-summary',
  'main .btn',
  'main .hero-badge',
  'main .hero-point',
  'main .hero-slide-copy',
  'main .about-copy',
  'main .about-value-card',
  'main .about-chip-row',
  'main .partner-marquee',
  'main .industry-group',
  'main .industry-item',
  'main .partner-item',
  'main .industry-card',
  'main .feature-card',
  'main .deployment-copy',
  'main .deployment-visual',
  'main .deployment-step',
  'main .deployment-model-card',
  'main .solution-card',
  'main .ecosystem-card',
  'main .news-card',
  'main .news-feature-card',
  'main .news-insight-card',
  'main .home-news-card',
  'main .listing-card',
  'main .detail-card',
  'main .detail-cta',
  'main .article-content',
  'main .article-source-card',
  'main .article-inline-cta-box',
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
      element.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 38}ms`)
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
