import { siteUrl } from '../data/siteContent'

function absoluteUrl(path) {
  if (/^https?:\/\//i.test(path ?? '')) return path
  const cleanPath = path || window.location.pathname || '/'
  return `${siteUrl}${cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`}`
}

function setMeta(attribute, key, content) {
  if (!content) return

  let meta = document.querySelector(`meta[${attribute}="${key}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attribute, key)
    document.head.appendChild(meta)
  }

  meta.setAttribute('content', content)
}

function setCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]')
  if (!link) {
    link = document.createElement('link')
    link.setAttribute('rel', 'canonical')
    document.head.appendChild(link)
  }

  link.setAttribute('href', url)
}

export function setPageSeo({ title, description }) {
  if (typeof document === 'undefined') return

  const canonicalUrl = absoluteUrl(window.location.pathname)

  if (title) {
    document.title = title
    setMeta('property', 'og:title', title)
    setMeta('name', 'twitter:title', title)
  }

  setCanonical(canonicalUrl)
  setMeta('property', 'og:url', canonicalUrl)
  setMeta('property', 'og:type', 'website')
  setMeta('property', 'og:locale', 'vi_VN')
  setMeta('name', 'twitter:card', 'summary_large_image')

  if (description) {
    setMeta('name', 'description', description)
    setMeta('property', 'og:description', description)
    setMeta('name', 'twitter:description', description)
  }
}
