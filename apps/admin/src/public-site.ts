const LOCAL_PUBLIC_PORT = '5173'

function withTrailingSlash(url: string) {
  return url.endsWith('/') ? url : `${url}/`
}

function getDefaultPublicSiteUrl() {
  if (typeof window === 'undefined') return '/'

  const { hostname, origin, port, protocol } = window.location
  const isLocalAdminDev = (hostname === 'localhost' || hostname === '127.0.0.1') && port === '5174'

  if (isLocalAdminDev) {
    return `${protocol}//${hostname}:${LOCAL_PUBLIC_PORT}/`
  }

  return `${origin}/`
}

export const PUBLIC_SITE_URL = withTrailingSlash(import.meta.env.VITE_PUBLIC_SITE_URL ?? getDefaultPublicSiteUrl())

export function publicSiteUrl(path = '') {
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  return new URL(normalizedPath, PUBLIC_SITE_URL).toString()
}

export function openPublicSite(path: string) {
  window.open(publicSiteUrl(path), '_blank', 'noopener')
}
