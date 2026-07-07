import type {
  AuthSessionResponse,
  CategoryInput,
  CategoryResponse,
  ContactLead,
  ContentPageInput,
  ContentPageResponse,
  DownloadInput,
  DownloadResponse,
  LeadStatus,
  MediaAsset,
  MediaListResponse,
  MediaMetadataInput,
  MediaUsage,
  OfferingInput,
  OfferingResponse,
  PartnerInput,
  PartnerResponse,
  PostInput,
  PostResponse,
  PostRevisionDetail,
  PostRevisionSummary,
  TestimonialInput,
  TestimonialResponse,
  CreateUserInput,
  UpdateUserInput,
  UserSummary,
  HomepageInput,
  HomepagePreviewSession,
  HomepageRevisionDetail,
  HomepageRevisionSummary,
  HomepageResponse,
  SiteProfileInput,
  SiteProfileResponse,
  ExternalLinks,
  MenuResponse,
  MenuItemInput,
  AuditLogEntry,
} from '@iorder/contracts'

const localApiHost =
  typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'localhost' : '127.0.0.1'
const isLocal = typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(window.location.hostname)
const API_URL = import.meta.env.VITE_API_URL ?? (isLocal ? `http://${localApiHost}:4000` : '')

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const isFormData = init?.body instanceof FormData
  let response: Response | null = null
  const requestInit = {
    ...init,
    credentials: 'include' as const,
    headers: {
      ...(!isFormData && init?.body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...init?.headers,
    },
  }

  let lastError: unknown
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      response = await fetch(`${API_URL}${path}`, requestInit)
      lastError = null
      break
    } catch (error) {
      lastError = error
      if (attempt < 3) await new Promise((resolve) => window.setTimeout(resolve, 500 * (attempt + 1)))
    }
  }
  if (lastError || !response) throw new Error('API_UNAVAILABLE')

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? `HTTP_${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export function autosaveHomepage(input: HomepageInput, baseVersion: number) {
  return request<{ item: HomepageResponse; autosavedAt: string }>('/api/admin/homepage/autosave', {
    method: 'PUT',
    body: JSON.stringify({ data: input, baseVersion }),
  })
}

export function login(username: string, password: string) {
  return request<AuthSessionResponse>('/api/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export function getSession() {
  return request<AuthSessionResponse>('/api/admin/auth/me')
}

export async function checkApiHealth() {
  // Dùng endpoint dưới /api (được vite proxy forward) để hoạt động cả khi mở qua IP LAN.
  const response = await fetch(`${API_URL}/api/public/health`, { cache: 'no-store' })
  if (!response.ok) throw new Error('API_UNAVAILABLE')
  return response.json() as Promise<{ status: string }>
}

export function logout() {
  return request<void>('/api/admin/auth/logout', { method: 'POST' })
}

export function listMedia(kind?: 'image' | 'document', search?: string) {
  const params = new URLSearchParams()
  if (kind) params.set('kind', kind)
  if (search?.trim()) params.set('search', search.trim())
  const query = params.toString()
  return request<MediaListResponse>(`/api/admin/media${query ? `?${query}` : ''}`)
}

export function uploadMedia(file: File, metadata: MediaMetadataInput) {
  const body = new FormData()
  body.append('altText', metadata.altText ?? '')
  body.append('caption', metadata.caption ?? '')
  body.append('file', file)

  return request<{ item: MediaAsset }>('/api/admin/media', {
    method: 'POST',
    body,
  })
}

export function updateMedia(id: string, metadata: MediaMetadataInput) {
  return request<{ item: MediaAsset }>(`/api/admin/media/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(metadata),
  })
}

export function getMediaUsage(id: string) {
  return request<{ items: MediaUsage[]; total: number; canDelete: boolean }>(`/api/admin/media/${id}/usage`)
}

export function deleteMedia(id: string) {
  return request<void>(`/api/admin/media/${id}`, { method: 'DELETE' })
}

export function listPosts() {
  return request<{ items: PostResponse[]; total: number }>('/api/admin/posts')
}

export function createPost(input: PostInput) {
  return request<{ item: PostResponse }>('/api/admin/posts', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updatePost(id: string, input: PostInput) {
  return request<{ item: PostResponse }>(`/api/admin/posts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function publishPost(id: string) {
  return request<{ item: PostResponse }>(`/api/admin/posts/${id}/publish`, { method: 'POST' })
}

export function unpublishPost(id: string) {
  return request<{ item: PostResponse }>(`/api/admin/posts/${id}/unpublish`, { method: 'POST' })
}

export function listPostRevisions(postId: string) {
  return request<{ items: PostRevisionSummary[] }>(`/api/admin/posts/${postId}/revisions`)
}

export function getPostRevision(postId: string, version: number) {
  return request<{ item: PostRevisionDetail }>(`/api/admin/posts/${postId}/revisions/${version}`)
}

export function restorePostRevision(postId: string, version: number) {
  return request<{ item: PostResponse }>(`/api/admin/posts/${postId}/revisions/${version}/restore`, {
    method: 'POST',
  })
}

export function listCategories() {
  return request<{ items: CategoryResponse[] }>('/api/admin/categories')
}

export function createCategory(input: CategoryInput) {
  return request<{ item: CategoryResponse }>('/api/admin/categories', { method: 'POST', body: JSON.stringify(input) })
}

export function updateCategory(id: string, input: CategoryInput) {
  return request<{ item: CategoryResponse }>(`/api/admin/categories/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteCategory(id: string) {
  return request<void>(`/api/admin/categories/${id}`, { method: 'DELETE' })
}

export function archivePost(id: string) {
  return request<{ item: PostResponse }>(`/api/admin/posts/${id}/archive`, { method: 'POST' })
}

export function deletePost(id: string) {
  return request<void>(`/api/admin/posts/${id}`, { method: 'DELETE' })
}

export function getHomepage() {
  return request<{ item: HomepageResponse | null }>('/api/admin/homepage')
}

export function saveHomepage(input: HomepageInput) {
  return request<{ item: HomepageResponse }>('/api/admin/homepage', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function checkpointHomepage(baseVersion: number, changeNote: string | null = null) {
  return request<{ item: HomepageResponse; revisionId: string }>('/api/admin/homepage/checkpoint', {
    method: 'POST',
    body: JSON.stringify({ baseVersion, changeNote }),
  })
}

export function publishHomepage(baseVersion: number, changeNote: string | null = null) {
  return request<{ item: HomepageResponse }>('/api/admin/homepage/publish', {
    method: 'POST',
    body: JSON.stringify({ baseVersion, changeNote }),
  })
}

export function listHomepageRevisions() {
  return request<{ items: HomepageRevisionSummary[] }>('/api/admin/homepage/revisions')
}

export function getHomepageRevision(version: number) {
  return request<{ item: HomepageRevisionDetail }>(`/api/admin/homepage/revisions/${version}`)
}

export function restoreHomepageRevision(version: number, baseVersion: number) {
  return request<{ item: HomepageResponse }>(`/api/admin/homepage/revisions/${version}/restore`, {
    method: 'POST',
    body: JSON.stringify({ baseVersion, changeNote: null }),
  })
}

export function createHomepagePreview() {
  return request<HomepagePreviewSession>('/api/admin/homepage/preview-token', { method: 'POST' })
}

// ── Offerings ──────────────────────────────────────────────────────────────
export function listOfferings(type?: string, status?: string) {
  const params = new URLSearchParams()
  if (type) params.set('type', type)
  if (status) params.set('status', status)
  const qs = params.toString()
  return request<{ items: OfferingResponse[]; total: number }>(`/api/admin/offerings${qs ? `?${qs}` : ''}`)
}

export function createOffering(input: OfferingInput) {
  return request<{ item: OfferingResponse }>('/api/admin/offerings', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateOffering(id: string, input: OfferingInput) {
  return request<{ item: OfferingResponse }>(`/api/admin/offerings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function publishOffering(id: string) {
  return request<{ item: OfferingResponse }>(`/api/admin/offerings/${id}/publish`, { method: 'POST' })
}

export function archiveOffering(id: string) {
  return request<{ item: OfferingResponse }>(`/api/admin/offerings/${id}/archive`, { method: 'POST' })
}

export function unpublishOffering(id: string) {
  return request<{ item: OfferingResponse }>(`/api/admin/offerings/${id}/unpublish`, { method: 'POST' })
}

export function deleteOffering(id: string) {
  return request<void>(`/api/admin/offerings/${id}`, { method: 'DELETE' })
}

// ── Partners ───────────────────────────────────────────────────────────────
export function listPartners() {
  return request<{ items: PartnerResponse[]; total: number }>('/api/admin/partners')
}

export function createPartner(input: PartnerInput) {
  return request<{ item: PartnerResponse }>('/api/admin/partners', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updatePartner(id: string, input: PartnerInput) {
  return request<{ item: PartnerResponse }>(`/api/admin/partners/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deletePartner(id: string) {
  return request<void>(`/api/admin/partners/${id}`, { method: 'DELETE' })
}

// ── Content Pages (trang nội dung tĩnh) ─────────────────────────────────────
export function listContentPages(search?: string, status?: string) {
  const params = new URLSearchParams()
  if (search?.trim()) params.set('search', search.trim())
  if (status) params.set('status', status)
  const qs = params.toString()
  return request<{ items: ContentPageResponse[]; total: number }>(`/api/admin/content-pages${qs ? `?${qs}` : ''}`)
}

export function createContentPage(input: ContentPageInput) {
  return request<{ item: ContentPageResponse }>('/api/admin/content-pages', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateContentPage(id: string, input: ContentPageInput) {
  return request<{ item: ContentPageResponse }>(`/api/admin/content-pages/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function publishContentPage(id: string) {
  return request<{ item: ContentPageResponse }>(`/api/admin/content-pages/${id}/publish`, { method: 'POST' })
}

export function unpublishContentPage(id: string) {
  return request<{ item: ContentPageResponse }>(`/api/admin/content-pages/${id}/unpublish`, { method: 'POST' })
}

export function deleteContentPage(id: string) {
  return request<void>(`/api/admin/content-pages/${id}`, { method: 'DELETE' })
}

// ── Downloads (Hỗ trợ cài đặt) ──────────────────────────────────────────────
export function listDownloads() {
  return request<{ items: DownloadResponse[]; total: number }>('/api/admin/downloads')
}

export function createDownload(input: DownloadInput) {
  return request<{ item: DownloadResponse }>('/api/admin/downloads', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateDownload(id: string, input: DownloadInput) {
  return request<{ item: DownloadResponse }>(`/api/admin/downloads/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteDownload(id: string) {
  return request<void>(`/api/admin/downloads/${id}`, { method: 'DELETE' })
}

// ── Testimonials ───────────────────────────────────────────────────────────
export function listTestimonials() {
  return request<{ items: TestimonialResponse[]; total: number }>('/api/admin/testimonials')
}

export function createTestimonial(input: TestimonialInput) {
  return request<{ item: TestimonialResponse }>('/api/admin/testimonials', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateTestimonial(id: string, input: TestimonialInput) {
  return request<{ item: TestimonialResponse }>(`/api/admin/testimonials/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function deleteTestimonial(id: string) {
  return request<void>(`/api/admin/testimonials/${id}`, { method: 'DELETE' })
}

// ── Leads (khách liên hệ) ────────────────────────────────────────────────────
export function getLeads(params: { page?: number; limit?: number; status?: LeadStatus }) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.status) query.set('status', params.status)
  const qs = query.toString()
  return request<{ items: ContactLead[]; total: number; totalNew: number }>(`/api/admin/leads${qs ? `?${qs}` : ''}`)
}

export function updateLeadStatus(id: string, status: LeadStatus) {
  return request<{ item: ContactLead }>(`/api/admin/leads/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

// ── Navigation ─────────────────────────────────────────────────────────────
export function listMenus() {
  return request<{ items: MenuResponse[] }>('/api/admin/menus')
}

export function getMenu(location: string) {
  return request<MenuResponse>(`/api/admin/menus/${location}`)
}

export function upsertMenuItem(location: string, itemId: string, input: MenuItemInput) {
  return request<{ item: MenuResponse['items'][number] }>(`/api/admin/menus/${location}/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteMenuItem(location: string, itemId: string) {
  return request<void>(`/api/admin/menus/${location}/items/${itemId}`, { method: 'DELETE' })
}

export function listLinkGroups() {
  return request<{ items: Array<{ id: string; code: string; name: string; links: unknown[] }> }>(
    '/api/admin/link-groups',
  )
}

export function upsertContentLink(code: string, linkId: string, input: Record<string, unknown>) {
  return request<{ item: unknown }>(`/api/admin/link-groups/${code}/links/${linkId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function deleteContentLink(code: string, linkId: string) {
  return request<void>(`/api/admin/link-groups/${code}/links/${linkId}`, { method: 'DELETE' })
}

export function seedDefaultMenus() {
  return request<{ created: string[] }>('/api/admin/menus/seed-defaults', { method: 'POST' })
}

export function createMenu(name: string, location: string) {
  return request<{ item: MenuResponse }>('/api/admin/menus', {
    method: 'POST',
    body: JSON.stringify({ name, location }),
  })
}

// ── Settings ───────────────────────────────────────────────────────────────
export function getSiteProfile() {
  return request<{ item: SiteProfileResponse | null }>('/api/admin/settings/profile')
}

export function updateSiteProfile(input: SiteProfileInput) {
  return request<{ item: SiteProfileResponse }>('/api/admin/settings/profile', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export function getExternalLinks() {
  return request<{ item: ExternalLinks }>('/api/admin/settings/external-links')
}

export function updateExternalLinks(input: ExternalLinks) {
  return request<{ item: ExternalLinks }>('/api/admin/settings/external-links', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

export type AppearanceSettings = { primaryColor: string; accentColor: string; darkMode: boolean }

export function getAppearance() {
  return request<{ item: AppearanceSettings }>('/api/admin/settings/appearance')
}

export function updateAppearance(input: AppearanceSettings) {
  return request<{ item: AppearanceSettings }>('/api/admin/settings/appearance', {
    method: 'PUT',
    body: JSON.stringify(input),
  })
}

// ── Activity (nhật ký hoạt động) ────────────────────────────────────────────

export function listActivity(query: { page?: number; limit?: number; entityType?: string; action?: string } = {}) {
  const params = new URLSearchParams()
  if (query.page) params.set('page', String(query.page))
  if (query.limit) params.set('limit', String(query.limit))
  if (query.entityType) params.set('entityType', query.entityType)
  if (query.action) params.set('action', query.action)
  const suffix = params.size > 0 ? `?${params.toString()}` : ''
  return request<{ items: AuditLogEntry[]; total: number }>(`/api/admin/activity${suffix}`)
}

// ── Users (quản lý người dùng) ───────────────────────────────────────────────

export function listUsers() {
  return request<{ items: UserSummary[] }>('/api/admin/users')
}

export function createUser(input: CreateUserInput) {
  return request<{ item: UserSummary }>('/api/admin/users', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function updateUser(id: string, input: UpdateUserInput) {
  return request<{ item: UserSummary }>(`/api/admin/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  })
}

export function resetUserPassword(id: string, password: string) {
  return request<{ item: UserSummary }>(`/api/admin/users/${id}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  })
}

export function disableUser(id: string) {
  return request<{ item: UserSummary }>(`/api/admin/users/${id}/disable`, {
    method: 'POST',
  })
}

export function changePassword(currentPassword: string, newPassword: string) {
  return request<{ item: UserSummary }>('/api/admin/me/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  })
}
