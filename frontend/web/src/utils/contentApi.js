const localApiHost =
  typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'localhost' : '127.0.0.1'
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

// ── Contact leads ────────────────────────────────────────────────────────────

export async function submitContactLead(payload) {
  const response = await fetch(`${API_URL}/api/public/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.error ?? `HTTP_${response.status}`)
  }
  return response.json()
}

// ── Posts ──────────────────────────────────────────────────────────────────

// Bài viết từ TipTap được lưu dưới dạng HTML (chứa thẻ < >).
// Bài cũ là văn bản thuần — vẫn tách theo đoạn để tương thích ngược.
const isHtml = (value) => typeof value === 'string' && /<\/?[a-z][\s\S]*>/i.test(value)

export function normalizeCmsPost(post) {
  const rawBody = post.body ?? ''
  const wordCount = rawBody
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  return {
    ...post,
    category: post.category ?? (post.type === 'promotion' ? 'Khuyến mãi' : 'Tin tức'),
    date: post.publishedAt ?? post.updatedAt,
    image: post.coverUrl,
    imageAlt: post.title,
    readingTime: `${Math.max(1, Math.ceil(wordCount / 220))} phút đọc`,
    focusName: post.category ?? 'Nội dung iOrder',
    highlights: post.checklist?.slice(0, 3) ?? [],
    bodyHtml: isHtml(rawBody) ? rawBody : null,
    body: isHtml(rawBody) ? [] : rawBody.split(/\n\s*\n/).filter(Boolean),
    checklist: post.checklist ?? [],
  }
}

export async function fetchPublishedPosts(limit = 50, category = null) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (category) params.set('category', category)
  const payload = await apiFetch(`/api/public/posts?${params}`)
  return (payload.items ?? []).map(normalizeCmsPost)
}

export async function fetchCategories() {
  const payload = await apiFetch('/api/public/categories')
  return (payload.items ?? []).filter((category) => category.postCount > 0)
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

// ── Partners ───────────────────────────────────────────────────────────────

export async function fetchPartners() {
  const payload = await apiFetch('/api/public/partners')
  return (payload.items ?? [])
    .filter((p) => p.logoUrl)
    .map((p) => ({ src: p.logoUrl, name: p.name, websiteUrl: p.websiteUrl }))
}

// ── Testimonials ─────────────────────────────────────────────────────────────

export async function fetchTestimonials() {
  const payload = await apiFetch('/api/public/testimonials')
  return (payload.items ?? []).map((t) => ({
    quote: t.quote,
    name: t.authorName,
    role: t.authorRole,
    company: t.company,
    rating: t.rating,
    avatarUrl: t.avatarUrl,
    initials: t.authorName?.[0] ?? '?',
  }))
}

// ── Downloads (Hỗ trợ cài đặt) ───────────────────────────────────────────────

export async function fetchDownloads() {
  const payload = await apiFetch('/api/public/downloads')
  return payload.items ?? []
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

// ── Content Pages (trang nội dung tĩnh, vd FAQ/hướng dẫn) ───────────────────

export async function fetchContentPage(slug) {
  const payload = await apiFetch(`/api/public/content-pages/${slug}`)
  return payload.item
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
