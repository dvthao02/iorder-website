import type { ContentPageInput, ContentPageResponse } from '@iorder/contracts'
import { ArrowLeft, Eye, EyeOff, FileStack, Send } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import {
  BasicInfoCard,
  ContentBodyEditor,
  ContentCardsGrid,
  ContentEditorPage,
  ContentItemCard,
  ContentListPage,
  PublishSidebar,
  SeoMetaCard,
  StatusBadge,
} from './content-editor/ContentEditorPage'
import {
  createContentPage,
  deleteContentPage,
  listContentPages,
  publishContentPage,
  unpublishContentPage,
  updateContentPage,
} from './api'
import { openPublicSite } from './public-site'
import { RichTextEditor } from './RichTextEditor'
import { toast } from './toast'
import { ActionMenu, type ActionMenuItem, useEscapeAndSave } from './ui'

const PAGE_SIZE = 8

type PageStatusFilter = 'all' | 'draft' | 'published'

const emptyPage: ContentPageInput = {
  slug: '',
  title: '',
  lead: null,
  body: '',
  seoTitle: null,
  seoDescription: null,
  status: 'draft',
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9/]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}

function validateContentPage(form: ContentPageInput): string | null {
  if (form.title.trim().length < 2) return 'Tiêu đề phải có ít nhất 2 ký tự.'
  if (form.slug.trim().length < 3) return 'Đường dẫn (slug) phải có ít nhất 3 ký tự.'
  if (!/^[a-z0-9-]+(\/[a-z0-9-]+)*$/.test(form.slug))
    return 'Đường dẫn (slug) không hợp lệ (chỉ chữ thường, số, gạch ngang, phân tách bằng "/").'
  const bodyText = form.body.replace(/<[^>]+>/g, ' ').trim()
  if (!bodyText) return 'Nội dung trang không được để trống.'
  return null
}

function toInput(page: ContentPageResponse): ContentPageInput {
  return {
    slug: page.slug,
    title: page.title,
    lead: page.lead,
    body: page.body,
    seoTitle: page.seoTitle,
    seoDescription: page.seoDescription,
    status: page.status,
  }
}

export function ContentPagesManager() {
  const [pages, setPages] = useState<ContentPageResponse[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<ContentPageInput>(emptyPage)
  const [isSaving, setIsSaving] = useState(false)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PageStatusFilter>('all')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [page, setPage] = useState(1)

  const loadData = async () => {
    const result = await listContentPages()
    setPages(result.items)
    return result.items
  }

  useEffect(() => {
    void loadData()
      .catch(() => toast.error('Không thể tải danh sách trang nội dung.'))
      .finally(() => setLoading(false))
  }, [])

  const patchForm = <Key extends keyof ContentPageInput>(key: Key, value: ContentPageInput[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const selectPage = (item: ContentPageResponse) => {
    setSelectedId(item.id)
    setCreating(false)
    setForm(toInput(item))
  }

  const newPage = () => {
    setSelectedId(null)
    setCreating(true)
    setForm(emptyPage)
  }

  const closeEditor = () => {
    setSelectedId(null)
    setCreating(false)
    void loadData().catch(() => undefined)
  }

  const savePage = async () => {
    const validationError = validateContentPage(form)
    if (validationError) {
      toast.error(validationError)
      return
    }
    setIsSaving(true)
    try {
      const result = selectedId ? await updateContentPage(selectedId, form) : await createContentPage(form)
      setSelectedId(result.item.id)
      setCreating(false)
      setForm(toInput(result.item))
      await loadData()
      toast.success('Đã lưu bản nháp.')
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      toast.error(code === 'SLUG_EXISTS' ? 'Đường dẫn đã tồn tại.' : 'Không thể lưu trang nội dung.')
    } finally {
      setIsSaving(false)
    }
  }

  const publish = async () => {
    const validationError = validateContentPage(form)
    if (validationError) {
      toast.error(validationError)
      return
    }
    setIsSaving(true)
    try {
      const saved = selectedId ? await updateContentPage(selectedId, form) : await createContentPage(form)
      setSelectedId(saved.item.id)
      const result = await publishContentPage(saved.item.id)
      setCreating(false)
      setForm(toInput(result.item))
      await loadData()
      toast.success('Đã xuất bản trang nội dung.')
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      toast.error(code === 'SLUG_EXISTS' ? 'Đường dẫn đã tồn tại.' : 'Không thể xuất bản.')
    } finally {
      setIsSaving(false)
    }
  }

  const unpublish = async (id: string) => {
    try {
      const result = await unpublishContentPage(id)
      setPages((current) => current.map((item) => (item.id === id ? result.item : item)))
      if (id === selectedId) setForm(toInput(result.item))
      toast.success('Đã gỡ xuất bản. Trang chuyển về bản nháp.')
    } catch {
      toast.error('Không thể gỡ xuất bản.')
    }
  }

  const quickPublish = async (id: string) => {
    try {
      const result = await publishContentPage(id)
      if (id === selectedId) setForm(toInput(result.item))
      await loadData()
      toast.success('Đã xuất bản trang nội dung.')
    } catch {
      toast.error('Không thể xuất bản.')
    }
  }

  const removePage = async (id: string) => {
    try {
      await deleteContentPage(id)
      if (id === selectedId) closeEditor()
      await loadData()
      toast.warning('Đã xóa trang nội dung. Thao tác này không thể hoàn tác.')
    } catch {
      toast.error('Không thể xóa trang nội dung.')
    }
  }

  const previewPage = (slug: string) => {
    if (slug) openPublicSite(`/${slug}`)
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return pages
      .filter((item) => statusFilter === 'all' || item.status === statusFilter)
      .filter((item) => {
        if (!query) return true
        return `${item.title} ${item.slug}`.toLowerCase().includes(query)
      })
      .sort((a, b) => {
        const left = new Date(a.updatedAt).getTime()
        const right = new Date(b.updatedAt).getTime()
        return sortOrder === 'newest' ? right - left : left - right
      })
  }, [pages, search, statusFilter, sortOrder])

  useEffect(() => {
    setPage(1)
  }, [search, statusFilter, sortOrder])

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const editingPage = pages.find((item) => item.id === selectedId) ?? null
  const editingStatus = editingPage?.status ?? 'draft'
  const contentPageValidationError = validateContentPage(form)
  const canPublish = !contentPageValidationError
  const hasEditor = creating || selectedId !== null

  const wordCount = useMemo(() => {
    if (!form.body) return 0
    const text = form.body
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    return text ? text.split(' ').length : 0
  }, [form.body])

  useEscapeAndSave({ active: hasEditor, onSave: () => void savePage(), onEscape: closeEditor })

  const stats = useMemo(
    () => [
      { key: 'all', label: 'Tổng số trang', value: pages.length, note: 'Tất cả nội dung' },
      {
        key: 'published',
        label: 'Đã đăng',
        value: pages.filter((item) => item.status === 'published').length,
        note: 'Hiển thị công khai',
      },
      {
        key: 'draft',
        label: 'Nháp',
        value: pages.filter((item) => item.status === 'draft').length,
        note: 'Chưa xuất bản',
      },
    ],
    [pages],
  )

  if (hasEditor) {
    return (
      <ContentEditorPage
        standalone
        title={creating ? 'Trang nội dung mới' : 'Chỉnh sửa trang nội dung'}
        status={<StatusBadge status={editingStatus} />}
        eyebrow={
          <span className="editor-breadcrumb">
            <button type="button" onClick={closeEditor}>
              <ArrowLeft size={16} /> Trang nội dung
            </button>
            <span>›</span>
            {creating ? 'Trang nội dung mới' : 'Chỉnh sửa trang nội dung'}
          </span>
        }
        actions={
          <>
            <button
              type="button"
              className="btn-primary btn-icon"
              disabled={isSaving || !canPublish}
              title={!canPublish ? (contentPageValidationError ?? undefined) : undefined}
              onClick={() => void publish()}
            >
              <Send size={15} /> Xuất bản ngay
            </button>
            <ActionMenu
              items={
                [
                  { label: 'Xem trước', icon: Eye, onClick: () => previewPage(form.slug) },
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
                          label: 'Xóa',
                          icon: EyeOff,
                          tone: 'danger' as const,
                          disabled: isSaving,
                          onClick: () => void removePage(selectedId),
                        },
                      ]
                    : []),
                ] satisfies (ActionMenuItem | { divider: true })[]
              }
            />
          </>
        }
        onSubmit={() => void savePage()}
        main={
          <>
            <BasicInfoCard>
              <div className="form-row-2col">
                <label>
                  Tiêu đề <span className="field-counter">{form.title.length}/220</span>
                  <input
                    required
                    maxLength={220}
                    placeholder="Nhập tiêu đề trang"
                    value={form.title}
                    onChange={(event) => {
                      const title = event.target.value
                      setForm((current) => ({ ...current, title, ...(creating ? { slug: slugify(title) } : {}) }))
                    }}
                  />
                </label>
                <label>
                  Đường dẫn (không dấu "/" đầu) <span className="field-counter">{form.slug.length}/200</span>
                  <input
                    required
                    maxLength={200}
                    placeholder="vd: ho-tro/faq"
                    pattern="[a-z0-9-]+(?:/[a-z0-9-]+)*"
                    value={form.slug}
                    onChange={(event) => patchForm('slug', slugify(event.target.value))}
                  />
                </label>
              </div>
              <label className="full-field">
                Giới thiệu ngắn (lead) <span className="field-counter">{(form.lead ?? '').length}/2000</span>
                <textarea
                  maxLength={2000}
                  rows={3}
                  value={form.lead ?? ''}
                  onChange={(event) => patchForm('lead', event.target.value || null)}
                />
              </label>
            </BasicInfoCard>

            <ContentBodyEditor wordCount={wordCount}>
              <RichTextEditor
                value={form.body}
                placeholder="Soạn nội dung trang..."
                onChange={(html) => patchForm('body', html)}
              />
            </ContentBodyEditor>

            <SeoMetaCard
              title={form.seoTitle || form.title || 'Tiêu đề trang'}
              description={form.seoDescription || form.lead || 'Mô tả ngắn hiển thị trên kết quả tìm kiếm Google...'}
              url={`https://iorder.vn/${form.slug || 'duong-dan'}`}
            >
              <div className="form-row-2col">
                <label>
                  Tiêu đề SEO <span className="field-counter">{(form.seoTitle ?? '').length}/220</span>
                  <input
                    maxLength={220}
                    value={form.seoTitle ?? ''}
                    onChange={(event) => patchForm('seoTitle', event.target.value || null)}
                  />
                </label>
                <label>
                  Mô tả SEO <span className="field-counter">{(form.seoDescription ?? '').length}/320</span>
                  <input
                    maxLength={320}
                    value={form.seoDescription ?? ''}
                    onChange={(event) => patchForm('seoDescription', event.target.value || null)}
                  />
                </label>
              </div>
            </SeoMetaCard>
          </>
        }
        sidebar={
          <PublishSidebar
            status={editingStatus}
            updatedAt={editingPage?.updatedAt ?? null}
            publishedAt={editingPage?.publishedAt ?? null}
            isSaving={isSaving}
            canPublish={canPublish}
            onSaveDraft={() => void savePage()}
            hideActions
          />
        }
      />
    )
  }

  return (
    <section className="admin-card content-manager">
      <ContentListPage
        title="Trang nội dung"
        description="Quản lý các trang nội dung tĩnh (FAQ, hướng dẫn, hỗ trợ...) hiển thị trên website."
        actionLabel="Trang mới"
        onCreate={newPage}
        stats={stats}
        search={search}
        onSearch={setSearch}
        status={statusFilter === 'all' ? 'all' : statusFilter}
        onStatus={(value) => setStatusFilter(value === 'archived' ? 'all' : (value as PageStatusFilter))}
        sort={sortOrder}
        onSort={setSortOrder}
      >
        {loading ? <p className="admin-info">Đang tải...</p> : null}

        {!loading && filtered.length === 0 ? (
          <div className="admin-empty admin-empty--inline">
            <p>Không có trang nội dung nào khớp với bộ lọc.</p>
          </div>
        ) : null}

        {!loading ? (
          <ContentCardsGrid addLabel="Thêm trang mới" addDescription="Tạo trang nội dung tĩnh mới" onCreate={newPage}>
            {pageItems.map((item) => (
              <ContentItemCard
                key={item.id}
                title={item.title}
                slug={item.slug}
                summary={item.lead}
                status={item.status}
                updatedAt={item.updatedAt}
                fallback={<FileStack size={24} aria-hidden="true" />}
                onEdit={() => selectPage(item)}
                onDuplicate={() => selectPage(item)}
                onPreview={() => previewPage(item.slug)}
                menuActions={
                  [
                    item.status === 'published'
                      ? { label: 'Gỡ xuất bản', onClick: () => void unpublish(item.id) }
                      : { label: 'Xuất bản', onClick: () => void quickPublish(item.id) },
                    { label: 'Xóa', onClick: () => void removePage(item.id), danger: true },
                  ].filter(Boolean) as Array<{ label: string; onClick: () => void; danger?: boolean }>
                }
              />
            ))}
          </ContentCardsGrid>
        ) : null}

        {!loading && filtered.length > 0 ? (
          <div className="post-pagination">
            <span>
              Hiển thị {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filtered.length)} của{' '}
              {filtered.length} trang
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
            </div>
          </div>
        ) : null}
      </ContentListPage>
    </section>
  )
}
