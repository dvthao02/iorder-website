const localApiHost = typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'localhost' : '127.0.0.1'
const isLocal = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
const API_URL = import.meta.env.VITE_API_URL ?? (isLocal ? `http://${localApiHost}:4000` : '')

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { 'Cache-Control': 'no-cache' },
    ...options,
  })
  if (!response.ok) throw new Error(`HTTP_${response.status}`)
  return response.json()
}

// ── Posts ──────────────────────────────────────────────────────────────────

export function normalizeCmsPost(post) {
  return {
    ...post,
    category: post.category ?? (post.type === 'promotion' ? 'Khuyến mãi' : 'Tin tức'),
    date: post.publishedAt ?? post.updatedAt,
    image: post.coverUrl,
    imageAlt: post.title,
    readingTime: `${Math.max(1, Math.ceil((post.body?.split(/\s+/).length ?? 0) / 220))} phút đọc`,
    focusName: post.category ?? 'Nội dung iOrder',
    highlights: post.checklist?.slice(0, 3) ?? [],
    body: post.body ? post.body.split(/\n\s*\n/).filter(Boolean) : [],
    checklist: post.checklist ?? [],
  }
}

export async function fetchPublishedPosts(limit = 50) {
  const payload = await apiFetch(`/api/public/posts?limit=${limit}`)
  return (payload.items ?? []).map(normalizeCmsPost)
}

export async function fetchPublishedPost(slug) {
  const payload = await apiFetch(`/api/public/posts/${encodeURIComponent(slug)}`)
  return normalizeCmsPost(payload.item)
}

// ── Offerings ──────────────────────────────────────────────────────────────

const TYPE_PREFIX = { software: 'phan-mem', solution: 'giai-phap', service: 'dich-vu', industry: 'nganh-hang' }

export function normalizeOffering(o) {
  const c = o.contentJson ?? {}
  return {
    ...o,
    description: c.description ?? o.summary ?? '',
    tags: c.tags ?? [],
    bestFor: c.bestFor ?? null,
    keyValue: c.keyValue ?? null,
    metrics: c.metrics ?? [],
    features: c.features ?? [],
    benefits: c.benefits ?? [],
    faq: c.faq ?? [],
    items: c.items ?? [],
    category: c.category ?? null,
    href: `/${TYPE_PREFIX[o.type] ?? o.type}/${o.slug}`,
    iconKey: o.icon ?? 'server',
  }
}

export async function fetchOfferings(type) {
  const payload = await apiFetch(`/api/public/offerings?type=${encodeURIComponent(type)}`)
  return (payload.items ?? []).map(normalizeOffering)
}

export async function fetchOffering(type, slug) {
  const payload = await apiFetch(`/api/public/offerings/${encodeURIComponent(type)}/${encodeURIComponent(slug)}`)
  return normalizeOffering(payload.item)
}

let _navCache = null
export async function fetchNavOfferings() {
  if (_navCache) return _navCache
  const [software, solutions, services] = await Promise.all([
    fetchOfferings('software'),
    fetchOfferings('solution'),
    fetchOfferings('service'),
  ])
  _navCache = { software, solutions, services }
  return _navCache
}

// ── Site stats ─────────────────────────────────────────────────────────────

let _statsCache = null
let _statsCacheExpiry = 0

export async function fetchSiteStats() {
  const now = Date.now()
  if (_statsCache !== null && now < _statsCacheExpiry) return _statsCache
  const data = await apiFetch('/api/public/stats')
  _statsCache = data
  _statsCacheExpiry = now + 5 * 60 * 1000
  return data
}

// ── Navigation & settings ──────────────────────────────────────────────────

export async function fetchSiteSettings() {
  const payload = await apiFetch('/api/public/settings')
  return payload
}

export async function fetchMenu(location) {
  const payload = await apiFetch(`/api/public/menus/${encodeURIComponent(location)}`)
  return payload
}
