import type {
  AuthUser,
  CategoryResponse,
  MediaAsset,
  PostInput,
  PostResponse,
  PostRevisionSummary,
} from '@iorder/contracts'
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  History,
  Image as ImageIcon,
  Send,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import {
  BasicInfoCard,
  CategoryTagSelector,
  ContentBodyEditor,
  ContentCardsGrid,
  ContentEditorPage,
  ContentItemCard,
  ContentListPage,
  CoverImageCard,
  DisplaySettingCard,
  PublishSidebar,
  SeoMetaCard,
  StatusBadge,
  type ContentStatus,
} from './content-editor/ContentEditorPage'
import {
  archivePost,
  createCategory,
  createPost,
  deleteCategory,
  deletePost,
  listCategories,
  listMedia,
  listPostRevisions,
  listPosts,
  publishPost,
  restorePostRevision,
  unpublishPost,
  updatePost,
} from './api'
import { openPublicSite } from './public-site'
import { RichTextEditor } from './RichTextEditor'
import { toast } from './toast'
import { ActionMenu, type ActionMenuItem, DateTimePicker, ModalShell, useEscapeAndSave } from './ui'

type PostKindFilter = 'all' | 'news' | 'promotion'

const PAGE_SIZE = 6

const emptyPost: PostInput = {
  type: 'news',
  title: '',
  slug: '',
  excerpt: null,
  body: '',
  category: null,
  checklist: [],
  coverMediaId: null,
  seoTitle: null,
  seoDescription: null,
  canonicalUrl: null,
  promotionStartAt: null,
  promotionEndAt: null,
  scheduledAt: null,
  ctaLabel: null,
  ctaUrl: null,
  badgeText: null,
  categoryIds: [],
  tags: [],
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function validatePost(form: PostInput): string | null {
  if (form.title.trim().length < 2) return 'Tiêu đề phải có ít nhất 2 ký tự.'
  if (form.slug.trim().length < 3) return 'Đường dẫn (slug) phải có ít nhất 3 ký tự.'
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug))
    return 'Đường dẫn (slug) không hợp lệ (chỉ chữ thường, số và dấu gạch ngang).'
  const bodyText = form.body.replace(/<[^>]+>/g, ' ').trim()
  if (!bodyText) return 'Nội dung bài viết không được để trống.'
  if ((form.excerpt ?? '').length > 600) return 'Tóm tắt không được vượt quá 600 ký tự.'
  if (form.type === 'promotion' && form.promotionStartAt && form.promotionEndAt) {
    if (form.promotionEndAt.getTime() <= form.promotionStartAt.getTime())
      return 'Thời gian kết thúc khuyến mãi phải sau thời gian bắt đầu.'
  }
  return null
}

// Tách riêng check hẹn giờ: chỉ áp cho bài CHƯA đăng — bài đã published có thể còn
// scheduledAt cũ trong quá khứ (dữ liệu lịch sử), không được chặn lưu oan.
function validateSchedule(form: PostInput, isPublished: boolean): string | null {
  if (!isPublished && form.scheduledAt && form.scheduledAt.getTime() <= Date.now())
    return 'Thời gian hẹn giờ đăng phải ở tương lai.'
  return null
}

function toInput(post: PostResponse): PostInput {
  return {
    type: post.type,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    body: post.body,
    category: post.category,
    checklist: post.checklist,
    coverMediaId: post.coverMediaId,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    canonicalUrl: post.canonicalUrl,
    promotionStartAt: post.promotionStartAt ? new Date(post.promotionStartAt) : null,
    promotionEndAt: post.promotionEndAt ? new Date(post.promotionEndAt) : null,
    scheduledAt: post.scheduledAt ? new Date(post.scheduledAt) : null,
    ctaLabel: post.ctaLabel,
    ctaUrl: post.ctaUrl,
    badgeText: post.badgeText,
    categoryIds: post.categories.map((category) => category.id),
    tags: post.tags.map((tag) => tag.name),
  }
}

export function PostsManager({ currentUser }: { currentUser?: AuthUser | null } = {}) {
  const [posts, setPosts] = useState<PostResponse[]>([])
  const [images, setImages] = useState<MediaAsset[]>([])
  const [categories, setCategories] = useState<CategoryResponse[]>([])
  const [newCategory, setNewCategory] = useState('')
  const [tagInput, setTagInput] = useState('')

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<PostInput>(emptyPost)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [autoSaving, setAutoSaving] = useState(false)
  const initialFormRef = useRef<PostInput | null>(null)
  const autosaveTimer = useRef<number | null>(null)
  const savingRef = useRef(false)
  const selectedIdRef = useRef<string | null>(null)
  selectedIdRef.current = selectedId

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<PostKindFilter>('all')
  const [statusFilter, setStatusFilter] = useState<ContentStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [page, setPage] = useState(1)
  const [showCoverPicker, setShowCoverPicker] = useState(false)
  const [showRevisions, setShowRevisions] = useState(false)
  const [revisions, setRevisions] = useState<PostRevisionSummary[]>([])
  const [revisionsLoading, setRevisionsLoading] = useState(false)
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null)

  const loadData = async () => {
    const [postResult, mediaResult, categoryResult] = await Promise.all([
      listPosts(),
      listMedia('image'),
      listCategories(),
    ])
    setPosts(postResult.items)
    setImages(mediaResult.items)
    setCategories(categoryResult.items)
    return postResult.items
  }

  useEffect(() => {
    void loadData().catch(() => toast.error('Không thể tải danh sách bài viết.'))
  }, [])

  const patchForm = <Key extends keyof PostInput>(key: Key, value: PostInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const selectPost = (post: PostResponse) => {
    const nextForm = toInput(post)
    setSelectedId(post.id)
    setCreating(false)
    setForm(nextForm)
    initialFormRef.current = nextForm
    setShowCoverPicker(false)
    setLastSavedAt(null)
  }

  const newPost = () => {
    setSelectedId(null)
    setCreating(true)
    setForm(emptyPost)
    initialFormRef.current = emptyPost
    setShowCoverPicker(false)
    setLastSavedAt(null)
  }

  const closeEditor = () => {
    const isDirty = initialFormRef.current !== null && JSON.stringify(form) !== JSON.stringify(initialFormRef.current)
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current)
    if (isDirty) {
      const canSave = form.title.trim() && form.slug.trim() && form.body.trim()
      if (canSave) {
        // Flush thay đổi cuối trước khi đóng — gọi API trực tiếp (không dùng autoSave
        // vì autoSave setSelectedId sẽ mở lại editor vừa đóng).
        const snapshot = form
        const currentId = selectedIdRef.current
        void (currentId ? updatePost(currentId, snapshot) : createPost(snapshot))
          .then(() => {
            toast.success('Đã lưu nháp trước khi đóng.')
            void loadData().catch(() => undefined)
          })
          .catch(() => toast.warning('Không lưu được thay đổi cuối — kiểm tra lại bài viết.'))
      } else {
        toast.warning('Bài viết thiếu tiêu đề/slug/nội dung nên chưa thể lưu — thay đổi chưa lưu sẽ mất.')
      }
    }
    setSelectedId(null)
    setCreating(false)
    setShowCoverPicker(false)
    setShowRevisions(false)
    setLastSavedAt(null)
    initialFormRef.current = null
    void loadData().catch(() => undefined)
  }

  const addCategory = async () => {
    const name = newCategory.trim()
    if (!name) return
    try {
      const result = await createCategory({ name, description: null, parentId: null, sortOrder: categories.length })
      setCategories((prev) => [...prev, result.item])
      setForm((current) => ({ ...current, categoryIds: [...current.categoryIds, result.item.id] }))
      setNewCategory('')
    } catch {
      toast.error('Không thể tạo chuyên mục.')
    }
  }

  const removeCategory = async (id: string) => {
    try {
      await deleteCategory(id)
      setCategories((prev) => prev.filter((category) => category.id !== id))
      setForm((current) => ({ ...current, categoryIds: current.categoryIds.filter((cid) => cid !== id) }))
      toast.warning('Đã xóa chuyên mục. Bài viết đã bị gỡ khỏi chuyên mục này.')
    } catch {
      toast.error('Không thể xóa chuyên mục.')
    }
  }

  const toggleCategory = (id: string) => {
    setForm((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(id)
        ? current.categoryIds.filter((cid) => cid !== id)
        : [...current.categoryIds, id],
    }))
  }

  const commitTag = () => {
    const value = tagInput.trim().replace(/,$/, '').trim()
    if (!value) return
    if (!form.tags.includes(value)) patchForm('tags', [...form.tags, value])
    setTagInput('')
  }

  const onTagKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      commitTag()
    } else if (event.key === 'Backspace' && tagInput === '' && form.tags.length > 0) {
      patchForm('tags', form.tags.slice(0, -1))
    }
  }

  const savePost = async () => {
    const validationError =
      validatePost(form) ?? validateSchedule(form, (editingPost?.status ?? 'draft') === 'published')
    if (validationError) {
      toast.error(validationError)
      return
    }
    savingRef.current = true
    setIsSaving(true)
    try {
      const result = selectedId ? await updatePost(selectedId, form) : await createPost(form)
      setSelectedId(result.item.id)
      setCreating(false)
      const savedForm = toInput(result.item)
      setForm(savedForm)
      initialFormRef.current = savedForm
      setLastSavedAt(new Date().toISOString())
      await loadData()
      toast.success('Đã lưu bản nháp.')
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      toast.error(code === 'SLUG_EXISTS' ? 'Đường dẫn đã tồn tại.' : 'Không thể lưu bài viết.')
    } finally {
      savingRef.current = false
      setIsSaving(false)
    }
  }

  // Tự động lưu nháp sau 2 giây ngừng gõ — chạy im lặng, chỉ cập nhật mốc "Tự động lưu".
  const autoSave = async () => {
    if (savingRef.current) return
    if (!form.title.trim() || !form.slug.trim() || !form.body.trim()) return
    if (validatePost(form)) return
    if (initialFormRef.current && JSON.stringify(form) === JSON.stringify(initialFormRef.current)) return
    const snapshot = form
    const currentId = selectedIdRef.current
    savingRef.current = true
    setAutoSaving(true)
    try {
      const result = currentId ? await updatePost(currentId, snapshot) : await createPost(snapshot)
      setSelectedId(result.item.id)
      setCreating(false)
      initialFormRef.current = snapshot
      setLastSavedAt(new Date().toISOString())
    } catch {
      // im lặng — autosave lỗi không quấy rầy người dùng, họ vẫn có nút Lưu nháp
    } finally {
      savingRef.current = false
      setAutoSaving(false)
    }
  }

  const publish = async () => {
    const validationError = validatePost(form)
    if (validationError) {
      toast.error(validationError)
      return
    }
    savingRef.current = true
    setIsSaving(true)
    try {
      const saved = selectedId ? await updatePost(selectedId, form) : await createPost(form)
      setSelectedId(saved.item.id)
      const result = await publishPost(saved.item.id)
      setCreating(false)
      setForm(toInput(result.item))
      initialFormRef.current = null
      await loadData()
      closeEditor()
      toast.success('Đã xuất bản bài viết.')
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      toast.error(code === 'SLUG_EXISTS' ? 'Đường dẫn đã tồn tại.' : 'Không thể xuất bản.')
    } finally {
      savingRef.current = false
      setIsSaving(false)
    }
  }

  // Đặt lịch đăng: lưu nháp kèm mốc thời gian scheduledAt — hệ thống tự động quét mỗi 60 giây
  // và xuất bản bài viết khi đến hạn (xem backend/api/src/shared/scheduler/post-scheduler.ts).
  const schedule = async () => {
    if (!form.scheduledAt) return
    await savePost()
    toast.success(`Hệ thống sẽ tự động đăng bài lúc ${form.scheduledAt.toLocaleString('vi-VN')} (quét mỗi 60 giây).`)
  }

  const archive = async (id: string) => {
    try {
      const result = await archivePost(id)
      if (id === selectedId) setForm(toInput(result.item))
      await loadData()
      toast.warning('Bài viết đã được ẩn.')
    } catch {
      toast.error('Không thể ẩn bài viết.')
    }
  }

  const unpublish = async (id: string) => {
    try {
      const result = await unpublishPost(id)
      setPosts((current) => current.map((post) => (post.id === id ? result.item : post)))
      if (id === selectedId) setForm(toInput(result.item))
      toast.success('Đã gỡ xuất bản bài viết. Bài viết chuyển về bản nháp.')
    } catch {
      toast.error('Không thể gỡ xuất bản bài viết.')
    }
  }

  const removePost = async (id: string) => {
    try {
      await deletePost(id)
      if (id === selectedId) closeEditor()
      await loadData()
      toast.warning('Đã xóa bài viết.')
    } catch {
      toast.error('Không thể xóa bài viết.')
    }
  }

  const quickPublish = async (id: string) => {
    try {
      const result = await publishPost(id)
      if (id === selectedId) setForm(toInput(result.item))
      await loadData()
      toast.success('Đã xuất bản bài viết.')
    } catch {
      toast.error('Không thể xuất bản bài viết.')
    }
  }

  const duplicatePost = async (post: PostResponse) => {
    try {
      const copy = toInput(post)
      copy.title = `Bản sao: ${post.title}`
      copy.slug = `${post.slug}-copy-${Date.now().toString(36)}`
      const result = await createPost(copy)
      await loadData()
      selectPost(result.item)
      toast.success('Đã tạo bản sao.')
    } catch {
      toast.error('Không thể nhân bản bài viết.')
    }
  }

  const previewPost = (slug: string) => {
    if (slug) openPublicSite(`/tin-tuc/${slug}`)
  }

  // Trạng thái hẹn giờ hiển thị trên thẻ bài viết (draft + scheduledAt).
  // Còn hạn: hệ thống sẽ tự động đăng lúc đó (quét mỗi 60s). Đã quá hạn nhưng vẫn draft: đang chờ lượt quét kế tiếp.
  const scheduledStatusText = (post: PostResponse) => {
    if (post.status !== 'draft' || !post.scheduledAt) return null
    const scheduledDate = new Date(post.scheduledAt)
    if (scheduledDate.getTime() <= Date.now()) return 'Đang chờ đăng tự động'
    const time = scheduledDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    const date = scheduledDate.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    return `Hẹn giờ • sẽ đăng lúc ${time} ${date}`
  }

  const openRevisions = async () => {
    if (!selectedId) return
    setShowRevisions(true)
    setRevisionsLoading(true)
    try {
      const result = await listPostRevisions(selectedId)
      setRevisions(result.items)
    } catch {
      toast.error('Không thể tải lịch sử phiên bản.')
    } finally {
      setRevisionsLoading(false)
    }
  }

  const restoreRevision = async (version: number) => {
    if (!selectedId) return
    setRestoringVersion(version)
    try {
      const result = await restorePostRevision(selectedId, version)
      setForm(toInput(result.item))
      setShowRevisions(false)
      await loadData()
      toast.success(`Đã khôi phục phiên bản ${version}.`)
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      toast.error(
        code === 'REVISION_INCOMPATIBLE' ? 'Phiên bản này không còn tương thích.' : 'Không thể khôi phục phiên bản.',
      )
    } finally {
      setRestoringVersion(null)
    }
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return posts
      .filter((post) => statusFilter === 'all' || post.status === statusFilter)
      .filter((post) => typeFilter === 'all' || post.type === typeFilter)
      .filter((post) => categoryFilter === 'all' || post.categories.some((category) => category.id === categoryFilter))
      .filter((post) => {
        if (!query) return true
        return `${post.title} ${post.slug} ${post.excerpt ?? ''}`.toLowerCase().includes(query)
      })
      .sort((a, b) => {
        const left = new Date(a.updatedAt).getTime()
        const right = new Date(b.updatedAt).getTime()
        return sortOrder === 'newest' ? right - left : left - right
      })
  }, [posts, search, statusFilter, typeFilter, categoryFilter, sortOrder])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, typeFilter, categoryFilter, sortOrder])

  // Debounce autosave: 2s sau lần chỉnh sửa cuối cùng.
  useEffect(() => {
    if (!creating && selectedId === null) return
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current)
    autosaveTimer.current = window.setTimeout(() => {
      void autoSave()
    }, 2000)
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, creating, selectedId])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length)

  const editingPost = posts.find((post) => post.id === selectedId) ?? null
  const editingStatus = editingPost?.status ?? 'draft'
  const coverUrl = images.find((image) => image.id === form.coverMediaId)?.publicUrl ?? null
  const mediaMap = new Map(images.map((img) => [img.id, img.publicUrl]))
  const categoryOptions = categories.map((category) => ({ value: category.id, label: category.name }))

  const stats = useMemo(
    () => [
      { key: 'all', label: 'Tổng bài viết', value: posts.length, note: 'Tất cả nội dung' },
      {
        key: 'published',
        label: 'Đã đăng',
        value: posts.filter((post) => post.status === 'published').length,
        note: 'Hiển thị công khai',
      },
      {
        key: 'draft',
        label: 'Nháp',
        value: posts.filter((post) => post.status === 'draft').length,
        note: 'Chưa xuất bản',
      },
      {
        key: 'archived',
        label: 'Ẩn',
        value: posts.filter((post) => post.status === 'archived').length,
        note: 'Đang ẩn khỏi site',
      },
    ],
    [posts],
  )

  const wordCount = useMemo(() => {
    if (!form.body) return 0
    const text = form.body
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return text ? text.split(' ').length : 0
  }, [form.body])
  const readMinutes = Math.max(1, Math.ceil(wordCount / 200))
  const hasEditor = creating || selectedId !== null
  const postValidationError = validatePost(form)
  const canPublish = !postValidationError

  useEscapeAndSave({ active: hasEditor, onSave: () => void savePost(), onEscape: closeEditor })

  const authorName = editingPost?.authorName ?? currentUser?.fullName ?? 'Administrator'
  const savedTime = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  const revisionsModal = showRevisions ? (
    <ModalShell onOverlayClick={() => setShowRevisions(false)} header={<h2>Lịch sử phiên bản</h2>}>
      {revisionsLoading ? (
        <p className="admin-info">Đang tải...</p>
      ) : revisions.length === 0 ? (
        <p>Chưa có phiên bản nào.</p>
      ) : (
        <ol className="revision-list">
          {revisions.map((revision) => (
            <li key={revision.version}>
              <div>
                <strong>Phiên bản {revision.version}</strong>
                <span>{new Date(revision.createdAt).toLocaleString('vi-VN')}</span>
                <small>
                  {revision.changeNote ?? 'Không có ghi chú'}
                  {revision.editorName ? ` · ${revision.editorName}` : ''}
                </small>
              </div>
              <button
                type="button"
                className="secondary-button"
                disabled={restoringVersion !== null}
                onClick={() => void restoreRevision(revision.version)}
              >
                {restoringVersion === revision.version ? 'Đang khôi phục…' : 'Khôi phục'}
              </button>
            </li>
          ))}
        </ol>
      )}
    </ModalShell>
  ) : null

  if (hasEditor) {
    return (
      <>
        <ContentEditorPage
          standalone
          title={creating ? 'Bài viết mới' : 'Chỉnh sửa bài viết'}
          status={<StatusBadge status={editingStatus} />}
          eyebrow={
            <span className="editor-breadcrumb">
              <button type="button" onClick={closeEditor}>
                <ArrowLeft size={16} /> Tin tức
              </button>
              <span>›</span>
              {creating ? 'Bài viết mới' : 'Chỉnh sửa bài viết'}
            </span>
          }
          actions={
            <>
              <span
                className={`editor-autosave${autoSaving ? ' is-saving' : savedTime ? '' : ' is-idle'}`}
                aria-live="polite"
              >
                <CheckCircle2 size={14} />
                {autoSaving ? 'Đang lưu…' : savedTime ? `Tự động lưu: ${savedTime}` : 'Chưa lưu tự động'}
              </span>
              <button
                type="button"
                className="secondary-button btn-icon save-draft-button"
                disabled={isSaving}
                onClick={() => void savePost()}
              >
                <FileText size={15} /> Lưu nháp
              </button>
              <button
                type="button"
                className="btn-primary btn-icon"
                disabled={isSaving || !canPublish}
                title={!canPublish ? (postValidationError ?? undefined) : undefined}
                onClick={() => void publish()}
              >
                <Send size={15} /> Xuất bản ngay
              </button>
              <ActionMenu
                items={
                  [
                    { label: 'Xem trước', icon: Eye, onClick: () => previewPost(form.slug) },
                    ...(form.scheduledAt
                      ? [
                          {
                            label: 'Đặt lịch đăng',
                            icon: CalendarClock,
                            disabled: isSaving || !canPublish,
                            onClick: () => void schedule(),
                          },
                        ]
                      : []),
                    ...(selectedId
                      ? [
                          {
                            label: 'Lịch sử',
                            icon: History,
                            disabled: isSaving,
                            onClick: () => void openRevisions(),
                          },
                        ]
                      : []),
                    { divider: true } as const,
                    ...(selectedId && editingStatus === 'published'
                      ? [
                          {
                            label: 'Gỡ xuất bản',
                            icon: EyeOff,
                            disabled: isSaving,
                            onClick: () => void unpublish(selectedId),
                          },
                        ]
                      : []),
                    ...(selectedId
                      ? [
                          {
                            label: 'Ẩn',
                            icon: EyeOff,
                            tone: 'danger' as const,
                            disabled: isSaving,
                            onClick: () => void archive(selectedId),
                          },
                        ]
                      : []),
                  ] satisfies (ActionMenuItem | { divider: true })[]
                }
              />
            </>
          }
          onSubmit={() => void savePost()}
          main={
            <>
              <BasicInfoCard>
                <div className="form-row-2col">
                  <label>
                    Loại bài
                    <select
                      value={form.type}
                      onChange={(event) => patchForm('type', event.target.value as PostInput['type'])}
                    >
                      <option value="news">Tin tức</option>
                      <option value="promotion">Khuyến mãi</option>
                    </select>
                  </label>
                  <label>
                    Tiêu đề <span className="field-counter">{form.title.length}/220</span>
                    <input
                      required
                      maxLength={220}
                      placeholder="Nhập tiêu đề bài viết"
                      value={form.title}
                      onChange={(event) => {
                        const title = event.target.value
                        setForm((current) => ({ ...current, title, ...(creating ? { slug: slugify(title) } : {}) }))
                      }}
                    />
                  </label>
                </div>
                <div className="form-row-2col">
                  <label>
                    Đường dẫn
                    <input
                      required
                      maxLength={180}
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                      value={form.slug}
                      onChange={(event) => patchForm('slug', slugify(event.target.value))}
                    />
                  </label>
                  <label>
                    Tóm tắt <span className="field-counter">{(form.excerpt ?? '').length}/600</span>
                    <textarea
                      maxLength={600}
                      rows={3}
                      value={form.excerpt ?? ''}
                      onChange={(event) => patchForm('excerpt', event.target.value || null)}
                    />
                  </label>
                </div>

                {form.type === 'promotion' ? (
                  <div className="content-subsection">
                    <div className="form-row-2col">
                      <label>
                        Nhãn nổi bật
                        <input
                          maxLength={60}
                          placeholder="VD: Giảm 20%"
                          value={form.badgeText ?? ''}
                          onChange={(event) => patchForm('badgeText', event.target.value || null)}
                        />
                      </label>
                      <label>
                        Nhãn nút CTA
                        <input
                          maxLength={80}
                          placeholder="VD: Nhận ưu đãi"
                          value={form.ctaLabel ?? ''}
                          onChange={(event) => patchForm('ctaLabel', event.target.value || null)}
                        />
                      </label>
                    </div>
                    <label className="full-field">
                      Link nút CTA
                      <input
                        type="url"
                        placeholder="https://..."
                        value={form.ctaUrl ?? ''}
                        onChange={(event) => patchForm('ctaUrl', event.target.value || null)}
                      />
                    </label>
                    <div className="form-row-2col">
                      <DateTimePicker
                        label="Bắt đầu khuyến mãi"
                        value={form.promotionStartAt}
                        onChange={(next) => patchForm('promotionStartAt', next)}
                      />
                      <DateTimePicker
                        label="Kết thúc khuyến mãi"
                        value={form.promotionEndAt}
                        onChange={(next) => patchForm('promotionEndAt', next)}
                      />
                    </div>
                  </div>
                ) : null}
              </BasicInfoCard>

              <ContentBodyEditor wordCount={wordCount}>
                <RichTextEditor
                  value={form.body}
                  placeholder="Soạn nội dung bài viết..."
                  onChange={(html) => patchForm('body', html)}
                />
                <label className="full-field">
                  Checklist / điểm nổi bật
                  <textarea
                    rows={4}
                    value={form.checklist.join('\n')}
                    onChange={(event) =>
                      patchForm(
                        'checklist',
                        event.target.value
                          .split('\n')
                          .map((item) => item.trim())
                          .filter(Boolean),
                      )
                    }
                  />
                </label>
              </ContentBodyEditor>

              <CategoryTagSelector
                categories={categories}
                selectedCategoryIds={form.categoryIds}
                onToggleCategory={toggleCategory}
                onRemoveCategory={(id) => void removeCategory(id)}
                newCategory={newCategory}
                onNewCategoryChange={setNewCategory}
                onAddCategory={() => void addCategory()}
                tags={form.tags}
                tagInput={tagInput}
                onTagInputChange={setTagInput}
                onTagKeyDown={onTagKey}
                onTagBlur={commitTag}
                onRemoveTag={(tag) =>
                  patchForm(
                    'tags',
                    form.tags.filter((value) => value !== tag),
                  )
                }
              />

              <SeoMetaCard
                title={form.seoTitle || form.title || 'Tiêu đề bài viết'}
                description={
                  form.seoDescription || form.excerpt || 'Mô tả ngắn hiển thị trên kết quả tìm kiếm Google...'
                }
                url={`https://iorder.vn/tin-tuc/${form.slug || 'slug-bai-viet'}`}
              >
                <div className="form-row-2col">
                  <label>
                    Tiêu đề SEO <span className="field-counter">{(form.seoTitle ?? '').length}/70</span>
                    <input
                      maxLength={70}
                      value={form.seoTitle ?? ''}
                      onChange={(event) => patchForm('seoTitle', event.target.value || null)}
                    />
                  </label>
                  <label>
                    Mô tả SEO <span className="field-counter">{(form.seoDescription ?? '').length}/180</span>
                    <input
                      maxLength={180}
                      value={form.seoDescription ?? ''}
                      onChange={(event) => patchForm('seoDescription', event.target.value || null)}
                    />
                  </label>
                </div>
                <label className="full-field">
                  Canonical URL
                  <input
                    type="url"
                    placeholder="https://..."
                    value={form.canonicalUrl ?? ''}
                    onChange={(event) => patchForm('canonicalUrl', event.target.value || null)}
                  />
                </label>
              </SeoMetaCard>
            </>
          }
          sidebar={
            <>
              <PublishSidebar
                status={editingStatus}
                updatedAt={editingPost?.updatedAt ?? null}
                publishedAt={editingPost?.publishedAt ?? null}
                author={authorName}
                scheduledAt={form.scheduledAt}
                onScheduledAtChange={(value) => patchForm('scheduledAt', value)}
                isSaving={isSaving}
                canPublish={canPublish}
                onSaveDraft={() => void savePost()}
                hideActions
              />
              <CoverImageCard
                coverUrl={coverUrl}
                images={images}
                value={form.coverMediaId}
                onChange={(id) => patchForm('coverMediaId', id)}
                onUploaded={(asset) => setImages((prev) => [asset, ...prev])}
                onRemove={() => patchForm('coverMediaId', null)}
                pickerOpen={showCoverPicker}
                onTogglePicker={() => setShowCoverPicker((value) => !value)}
              />
              <DisplaySettingCard
                wordCount={wordCount}
                readMinutes={readMinutes}
                updatedAt={editingPost?.updatedAt ?? null}
              >
                <label className="full-field">
                  Chủ đề
                  <input
                    maxLength={120}
                    placeholder="Ví dụ: Nhà hàng - Cafe"
                    value={form.category ?? ''}
                    onChange={(event) => patchForm('category', event.target.value || null)}
                  />
                </label>
              </DisplaySettingCard>
            </>
          }
        />
        {revisionsModal}
      </>
    )
  }

  return (
    <section className="admin-card content-manager">
      <ContentListPage
        title="Bài viết"
        description="Tạo tin tức hoặc bài khuyến mãi, lưu nháp rồi xuất bản."
        actionLabel="Bài viết mới"
        onCreate={newPost}
        stats={stats}
        search={search}
        onSearch={setSearch}
        status={statusFilter}
        onStatus={setStatusFilter}
        sort={sortOrder}
        onSort={setSortOrder}
        {...(categoryOptions.length > 0
          ? { categoryOptions, categoryValue: categoryFilter, onCategoryChange: setCategoryFilter }
          : {})}
        extraFilters={
          <label className="content-select">
            <span>Loại bài</span>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as PostKindFilter)}>
              <option value="all">Tất cả loại bài</option>
              <option value="news">Tin tức</option>
              <option value="promotion">Khuyến mãi</option>
            </select>
          </label>
        }
      >
        {filtered.length === 0 ? (
          <div className="admin-empty admin-empty--inline">
            <p>Không có bài viết nào khớp với bộ lọc.</p>
          </div>
        ) : null}

        <ContentCardsGrid
          addLabel="Thêm bài viết mới"
          addDescription="Tạo tin tức hoặc khuyến mãi để hiển thị trên website"
          onCreate={newPost}
        >
          {pageItems.map((post) => {
            const thumb = post.coverUrl ?? (post.coverMediaId ? mediaMap.get(post.coverMediaId) : null) ?? null
            const scheduleText = scheduledStatusText(post)
            return (
              <ContentItemCard
                key={post.id}
                title={post.title}
                slug={post.slug}
                summary={scheduleText ?? post.excerpt}
                status={post.status}
                updatedAt={post.updatedAt}
                viewCount={post.viewCount}
                coverUrl={thumb}
                fallback={<ImageIcon size={24} aria-hidden="true" />}
                marker={
                  <>
                    <span className={`kind-badge ${post.type === 'promotion' ? 'kind-customer' : 'kind-partner'}`}>
                      {post.type === 'promotion' ? 'Khuyến mãi' : 'Tin tức'}
                    </span>
                    {scheduleText ? (
                      <span className="kind-badge kind-schedule">
                        <CalendarClock size={12} /> {scheduleText}
                      </span>
                    ) : null}
                  </>
                }
                onEdit={() => selectPost(post)}
                onDuplicate={() => void duplicatePost(post)}
                onPreview={() => previewPost(post.slug)}
                menuActions={
                  [
                    post.status === 'published'
                      ? { label: 'Gỡ xuất bản', onClick: () => void unpublish(post.id) }
                      : { label: 'Xuất bản', onClick: () => void quickPublish(post.id) },
                    post.status === 'published' ? { label: 'Ẩn bài', onClick: () => void archive(post.id) } : null,
                    { label: 'Xóa', onClick: () => void removePost(post.id), danger: true },
                  ].filter(Boolean) as Array<{ label: string; onClick: () => void; danger?: boolean }>
                }
              />
            )
          })}
        </ContentCardsGrid>

        <div className="post-pagination">
          <span>
            Hiển thị {rangeStart} - {rangeEnd} của {filtered.length} bài viết
          </span>
          <div className="post-pages">
            {Array.from({ length: pageCount }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`post-page${pageNumber === currentPage ? ' is-active' : ''}`}
                onClick={() => setPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
            <button
              type="button"
              className="post-page"
              disabled={currentPage >= pageCount}
              onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
              aria-label="Trang sau"
            >
              ›
            </button>
          </div>
        </div>
      </ContentListPage>
    </section>
  )
}
