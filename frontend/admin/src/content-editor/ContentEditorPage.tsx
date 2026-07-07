import type { FormEvent, KeyboardEvent, ReactNode } from 'react'
import { useEffect, useId, useState } from 'react'
import type { MediaAsset } from '@iorder/contracts'
import {
  ArrowDownUp,
  CalendarClock,
  CheckCircle2,
  Copy,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Image as ImageIcon,
  LayoutGrid,
  List,
  MoreVertical,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'

import { DateTimePicker, ImagePicker, StatusDot, ToggleSwitch } from '../ui'

export type ContentStatus = 'all' | 'published' | 'draft' | 'archived'

type StatusTone = 'on' | 'muted' | 'warn' | 'danger'
type StatusMeta = { label: string; tone: StatusTone; icon: typeof FileText }

const DEFAULT_STATUS_META: StatusMeta = { label: 'Tất cả', tone: 'muted', icon: FileText }

const STATUS_META: Record<string, StatusMeta> = {
  all: DEFAULT_STATUS_META,
  published: { label: 'Đã đăng', tone: 'on', icon: CheckCircle2 },
  draft: { label: 'Nháp', tone: 'warn', icon: Edit3 },
  archived: { label: 'Ẩn', tone: 'muted', icon: EyeOff },
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const meta = STATUS_META[status] ?? { label: status, tone: 'muted' as const }
  return (
    <span className={`content-status-badge is-${status}`}>
      <StatusDot tone={meta.tone} />
      {label ?? meta.label}
    </span>
  )
}

export function ContentHeader({
  eyebrow,
  title,
  description,
  status,
  actions,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  status?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="content-header">
      <div className="content-header-copy">
        {eyebrow ? <div className="content-header-eyebrow">{eyebrow}</div> : null}
        <div className="content-header-title-row">
          <h1>{title}</h1>
          {status ? <div className="content-header-status">{status}</div> : null}
        </div>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="content-header-actions">{actions}</div> : null}
    </header>
  )
}

function ContentCard({
  title,
  step,
  icon,
  children,
  footer,
}: {
  title: ReactNode
  step?: ReactNode
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section className="content-form-card">
      <div className="content-form-card-head">
        <div className="content-form-card-title">
          {step ? <span className="content-step">{step}</span> : null}
          {icon ? <span className="content-card-icon">{icon}</span> : null}
          <h2>{title}</h2>
        </div>
        {footer ? <div className="content-form-card-meta">{footer}</div> : null}
      </div>
      <div className="content-form-card-body">{children}</div>
    </section>
  )
}

export function BasicInfoCard({ children }: { children: ReactNode }) {
  return (
    <ContentCard title="Thông tin cơ bản" step="1">
      {children}
    </ContentCard>
  )
}

export function ContentBodyEditor({ children, wordCount }: { children: ReactNode; wordCount?: number }) {
  return (
    <ContentCard title="Nội dung" step="2" footer={wordCount !== undefined ? `${wordCount} từ` : undefined}>
      {children}
    </ContentCard>
  )
}

export function CategoryTagSelector({
  children,
  categories,
  selectedCategoryIds,
  onToggleCategory,
  onRemoveCategory,
  newCategory,
  onNewCategoryChange,
  onAddCategory,
  tags,
  tagInput,
  onTagInputChange,
  onTagKeyDown,
  onTagBlur,
  onRemoveTag,
}: {
  children?: ReactNode
  categories?: Array<{ id: string; name: string }>
  selectedCategoryIds?: string[]
  onToggleCategory?: (id: string) => void
  onRemoveCategory?: (id: string) => void
  newCategory?: string
  onNewCategoryChange?: (value: string) => void
  onAddCategory?: () => void
  tags?: string[]
  tagInput?: string
  onTagInputChange?: (value: string) => void
  onTagKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void
  onTagBlur?: () => void
  onRemoveTag?: (tag: string) => void
}) {
  return (
    <ContentCard title="Tổ chức nội dung" step="3">
      <div className="content-stack">
        {children}
        {categories ? (
          <div className="form-field">
            <span className="field-label">Chuyên mục</span>
            <div className="cat-list">
              {categories.length === 0 ? <small className="field-hint">Chưa có chuyên mục.</small> : null}
              {categories.map((category) => (
                <span
                  key={category.id}
                  className={`cat-chip${selectedCategoryIds?.includes(category.id) ? ' is-on' : ''}`}
                >
                  <label>
                    <input
                      type="checkbox"
                      checked={selectedCategoryIds?.includes(category.id) ?? false}
                      onChange={() => onToggleCategory?.(category.id)}
                    />
                    {category.name}
                  </label>
                  {onRemoveCategory ? (
                    <button
                      type="button"
                      className="cat-del"
                      title="Xóa chuyên mục"
                      onClick={() => onRemoveCategory(category.id)}
                    >
                      ×
                    </button>
                  ) : null}
                </span>
              ))}
            </div>
            {onAddCategory ? (
              <div className="cat-add">
                <input
                  placeholder="Thêm chuyên mục mới..."
                  value={newCategory ?? ''}
                  onChange={(event) => onNewCategoryChange?.(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      onAddCategory()
                    }
                  }}
                />
                <button type="button" className="secondary-button" onClick={onAddCategory}>
                  Thêm
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
        {tags ? (
          <div className="form-field">
            <span className="field-label">Tags</span>
            <div className="tag-input">
              {tags.map((tag) => (
                <span key={tag} className="tag-chip">
                  {tag}
                  {onRemoveTag ? (
                    <button type="button" onClick={() => onRemoveTag(tag)}>
                      ×
                    </button>
                  ) : null}
                </span>
              ))}
              <input
                placeholder="Nhập tag rồi Enter..."
                value={tagInput ?? ''}
                onChange={(event) => onTagInputChange?.(event.target.value)}
                onKeyDown={onTagKeyDown}
                onBlur={onTagBlur}
              />
            </div>
          </div>
        ) : null}
      </div>
    </ContentCard>
  )
}

export function SeoMetaCard({
  children,
  title,
  description,
  url,
}: {
  children: ReactNode
  title: string
  description: string
  url: string
}) {
  return (
    <ContentCard title="SEO" step="4">
      <div className="content-seo-grid">
        <div className="content-stack">{children}</div>
        <div className="seo-preview">
          <p className="seo-preview-label">Xem trước Google</p>
          <div className="seo-preview-card">
            <p className="seo-preview-url">{url}</p>
            <p className="seo-preview-title">{title}</p>
            <p className="seo-preview-desc">{description}</p>
          </div>
        </div>
      </div>
    </ContentCard>
  )
}

export function PublishSidebar({
  status,
  updatedAt,
  publishedAt,
  author,
  scheduledAt,
  onScheduledAtChange,
  onSchedule,
  isSaving,
  canPublish,
  onSaveDraft,
  onPublish,
  onArchive,
  onPreview,
  extra,
  hideActions,
}: {
  status: string
  updatedAt?: string | null
  publishedAt?: string | null
  author?: ReactNode
  scheduledAt?: Date | null
  onScheduledAtChange?: (value: Date | null) => void
  onSchedule?: () => void
  isSaving?: boolean
  canPublish?: boolean
  onSaveDraft: () => void
  onPublish?: () => void
  onArchive?: () => void
  onPreview?: () => void
  extra?: ReactNode
  hideActions?: boolean
}) {
  // Chỉ cho hẹn giờ khi CHƯA đăng: bài đã published mà sửa ngày đăng sẽ bị autosave
  // đẩy thay đổi lên trang public ngay — muốn đổi lịch phải Gỡ xuất bản trước.
  const schedulable = Boolean(onScheduledAtChange) && status !== 'published'
  return (
    <aside className="content-sidebar-card">
      <div className="content-sidebar-head">
        <h2>Xuất bản</h2>
      </div>
      <dl className="content-info-list">
        <div>
          <dt>Trạng thái</dt>
          <dd>
            <StatusBadge status={status} />
          </dd>
        </div>
        <div className={schedulable ? 'content-info-field' : undefined}>
          <dt>Ngày đăng</dt>
          <dd>
            {schedulable ? (
              <DateTimePicker value={scheduledAt ?? null} onChange={(next) => onScheduledAtChange?.(next)} />
            ) : publishedAt ? (
              formatDateTime(publishedAt)
            ) : (
              'Chưa đăng'
            )}
          </dd>
        </div>
        <div>
          <dt>Tác giả</dt>
          <dd>{author ?? 'Administrator'}</dd>
        </div>
        <div>
          <dt>Cập nhật</dt>
          <dd>{updatedAt ? formatDateTime(updatedAt) : 'Chưa lưu'}</dd>
        </div>
      </dl>
      {extra ? <div className="content-sidebar-extra">{extra}</div> : null}
      {hideActions ? null : (
        <div className="content-sidebar-actions">
          <button type="button" className="secondary-button btn-icon" disabled={isSaving} onClick={onSaveDraft}>
            <FileText size={15} /> Lưu nháp
          </button>
          {onPreview ? (
            <button type="button" className="secondary-button btn-icon" onClick={onPreview}>
              <Eye size={15} /> Xem trước
            </button>
          ) : null}
          {onSchedule ? (
            <button
              type="button"
              className="secondary-button btn-icon"
              disabled={isSaving || !canPublish || !scheduledAt}
              onClick={onSchedule}
            >
              <CalendarClock size={15} /> Đặt lịch đăng
            </button>
          ) : null}
          {onPublish ? (
            <button
              type="button"
              className="btn-primary btn-icon"
              disabled={isSaving || !canPublish}
              onClick={onPublish}
            >
              <CheckCircle2 size={15} /> Xuất bản ngay
            </button>
          ) : null}
          {onArchive ? (
            <button type="button" className="secondary-button btn-icon" disabled={isSaving} onClick={onArchive}>
              <EyeOff size={15} /> Ẩn nội dung
            </button>
          ) : null}
        </div>
      )}
    </aside>
  )
}

export function CoverImageCard({
  coverUrl,
  images,
  value,
  onChange,
  onUploaded,
  onRemove,
  pickerOpen,
  onTogglePicker,
  fallback,
}: {
  coverUrl?: string | null
  images: MediaAsset[]
  value: string | null
  onChange: (id: string | null) => void
  onUploaded: (asset: MediaAsset) => void
  onRemove: () => void
  pickerOpen: boolean
  onTogglePicker: () => void
  fallback?: ReactNode
}) {
  return (
    <aside className="content-sidebar-card">
      <div className="content-sidebar-head">
        <h2>Ảnh bìa</h2>
      </div>
      <div className="content-cover-preview">
        {coverUrl ? <img src={coverUrl} alt="Ảnh bìa" /> : (fallback ?? <ImageIcon size={28} aria-hidden="true" />)}
      </div>
      <div className="content-cover-actions">
        <button type="button" className="secondary-button btn-icon" onClick={onTogglePicker}>
          <ImageIcon size={15} /> Thay đổi ảnh
        </button>
        {value ? (
          <button type="button" className="secondary-button btn-icon is-danger-soft" onClick={onRemove}>
            <Trash2 size={15} /> Xóa ảnh
          </button>
        ) : null}
      </div>
      {pickerOpen ? (
        <ImagePicker
          label="Chọn ảnh bìa"
          ariaLabel="Chọn ảnh bìa"
          images={images}
          value={value}
          onChange={onChange}
          onUploaded={onUploaded}
        />
      ) : null}
    </aside>
  )
}

export function DisplaySettingCard({
  wordCount,
  readMinutes,
  updatedAt,
  visible,
  onVisibleChange,
  children,
}: {
  wordCount?: number
  readMinutes?: number
  updatedAt?: string | null
  visible?: boolean
  onVisibleChange?: (next: boolean) => void
  children?: ReactNode
}) {
  return (
    <aside className="content-sidebar-card">
      <div className="content-sidebar-head">
        <h2>Thông tin</h2>
      </div>
      <dl className="content-info-list">
        {readMinutes !== undefined ? (
          <div>
            <dt>Thời gian đọc</dt>
            <dd>{readMinutes} phút</dd>
          </div>
        ) : null}
        {wordCount !== undefined ? (
          <div>
            <dt>Số từ</dt>
            <dd>{wordCount}</dd>
          </div>
        ) : null}
        <div>
          <dt>Cập nhật lần cuối</dt>
          <dd>{updatedAt ? formatDateTime(updatedAt) : 'Chưa lưu'}</dd>
        </div>
      </dl>
      {visible !== undefined && onVisibleChange ? (
        <ToggleSwitch
          checked={visible}
          onChange={onVisibleChange}
          label="Hiển thị công khai"
          hint={visible ? 'Đang hiển thị trên website' : 'Đang ẩn khỏi website'}
        />
      ) : null}
      {children}
    </aside>
  )
}

export function ContentEditorPage({
  title,
  description,
  eyebrow,
  status,
  actions,
  main,
  sidebar,
  footer,
  standalone,
  onSubmit,
}: {
  title: ReactNode
  description?: ReactNode
  eyebrow?: ReactNode
  status?: ReactNode
  actions?: ReactNode
  main: ReactNode
  sidebar: ReactNode
  footer?: ReactNode
  standalone?: boolean
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
}) {
  // Khi editor mở: ẩn tiêu đề/mô tả module trên topbar (CSS bám body class) —
  // tránh 2 tầng header lặp: "Phần mềm / mô tả" rồi ngay dưới "Chỉnh sửa phần mềm / mô tả".
  useEffect(() => {
    document.body.classList.add('cms-editor-open')
    return () => document.body.classList.remove('cms-editor-open')
  }, [])

  return (
    <form
      className={`content-editor-page${standalone ? ' is-standalone' : ''}`}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit?.(event)
      }}
    >
      <ContentHeader eyebrow={eyebrow} title={title} description={description} status={status} actions={actions} />
      <div className="content-editor-grid">
        <div className="content-editor-main">{main}</div>
        <div className="content-editor-sidebar">{sidebar}</div>
      </div>
      {footer ? <div className="content-editor-footer">{footer}</div> : null}
    </form>
  )
}

export function ContentListPage({
  actionLabel,
  onCreate,
  stats,
  search,
  onSearch,
  status,
  onStatus,
  categoryValue,
  categoryOptions,
  onCategoryChange,
  extraFilters,
  sort,
  onSort,
  viewMode,
  onViewMode,
  children,
}: {
  title: ReactNode
  description?: ReactNode
  actionLabel: string
  onCreate: () => void
  stats: Array<{ key: string; label: string; value: number; note: string; status?: string }>
  search: string
  onSearch: (value: string) => void
  status: ContentStatus
  onStatus: (value: ContentStatus) => void
  categoryValue?: string
  categoryOptions?: Array<{ value: string; label: string }>
  onCategoryChange?: (value: string) => void
  extraFilters?: ReactNode
  sort: 'newest' | 'oldest'
  onSort: (value: 'newest' | 'oldest') => void
  viewMode?: 'grid' | 'list'
  onViewMode?: (value: 'grid' | 'list') => void
  children: ReactNode
}) {
  const filters: ContentStatus[] = ['all', 'published', 'draft', 'archived']

  return (
    <section className="content-list-page">
      <div className="content-stats-grid">
        {stats.map((item) => {
          const meta = STATUS_META[item.status ?? item.key] ?? DEFAULT_STATUS_META
          const Icon = meta.icon
          return (
            <button
              key={item.key}
              type="button"
              className="content-stat-card"
              onClick={() => onStatus(item.key as ContentStatus)}
            >
              <span className={`content-stat-icon is-${item.status ?? item.key}`}>
                <Icon size={19} />
              </span>
              <span>
                <small>{item.label}</small>
                <strong>{item.value}</strong>
                <em>{item.note}</em>
              </span>
            </button>
          )
        })}
      </div>

      <div className="content-list-toolbar">
        <label className="content-search">
          <Search size={17} aria-hidden="true" />
          <input
            type="search"
            placeholder="Tìm theo tiêu đề, slug..."
            value={search}
            onChange={(event) => onSearch(event.target.value)}
          />
        </label>
        <div className="content-filter-row" aria-label="Lọc trạng thái">
          {filters.map((key) => (
            <button
              key={key}
              type="button"
              className={`content-filter-pill${status === key ? ' is-active' : ''}`}
              onClick={() => onStatus(key)}
            >
              {(STATUS_META[key] ?? DEFAULT_STATUS_META).label}
              <span>{stats.find((item) => item.key === key)?.value ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="content-toolbar-actions">
          {categoryOptions && onCategoryChange ? (
            <label className="content-select">
              <span>Danh mục</span>
              <select value={categoryValue ?? 'all'} onChange={(event) => onCategoryChange(event.target.value)}>
                <option value="all">Tất cả danh mục</option>
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {extraFilters}
          <label className="content-select">
            <ArrowDownUp size={15} aria-hidden="true" />
            <select value={sort} onChange={(event) => onSort(event.target.value as 'newest' | 'oldest')}>
              <option value="newest">Sắp xếp mới nhất</option>
              <option value="oldest">Sắp xếp cũ nhất</option>
            </select>
          </label>
          {viewMode && onViewMode ? (
            <div className="content-view-toggle">
              <button
                type="button"
                className={viewMode === 'grid' ? 'is-active' : ''}
                title="Xem dạng lưới"
                onClick={() => onViewMode('grid')}
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                className={viewMode === 'list' ? 'is-active' : ''}
                title="Xem dạng danh sách"
                onClick={() => onViewMode('list')}
              >
                <List size={16} />
              </button>
            </div>
          ) : null}
          <button type="button" className="btn-primary btn-icon content-create-button" onClick={onCreate}>
            <Plus size={16} /> {actionLabel}
          </button>
        </div>
      </div>

      {children}
    </section>
  )
}

export function ContentCardsGrid({
  children,
  addLabel,
  addDescription,
  onCreate,
  isList = false,
}: {
  children: ReactNode
  addLabel: string
  addDescription: string
  onCreate: () => void
  isList?: boolean
}) {
  return (
    <div className={`content-cards-grid${isList ? ' is-list' : ''}`}>
      {children}
      <button type="button" className="content-add-card" onClick={onCreate}>
        <span>
          <Plus size={24} />
        </span>
        <strong>{addLabel}</strong>
        <small>{addDescription}</small>
      </button>
    </div>
  )
}

export function ContentItemCard({
  title,
  summary,
  status,
  updatedAt,
  viewCount,
  coverUrl,
  fallback,
  marker,
  categoryLabel,
  onEdit,
  onDuplicate,
  onPreview,
  menuActions,
}: {
  title: string
  slug?: string
  summary?: string | null
  status: string
  updatedAt?: string | null
  viewCount?: number
  coverUrl?: string | null
  fallback?: ReactNode
  marker?: ReactNode
  categoryLabel?: string | null
  onEdit: () => void
  onDuplicate: () => void
  onPreview: () => void
  menuActions?: Array<{ label: string; onClick: () => void; danger?: boolean }>
}) {
  const menuId = useId()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const closeOtherMenus = (event: Event) => {
      if ((event as CustomEvent<string>).detail !== menuId) setOpen(false)
    }

    window.addEventListener('content-card-menu-open', closeOtherMenus)
    return () => window.removeEventListener('content-card-menu-open', closeOtherMenus)
  }, [menuId])

  const toggleMenu = () => {
    setOpen((value) => {
      if (value) return false
      window.dispatchEvent(new CustomEvent('content-card-menu-open', { detail: menuId }))
      return true
    })
  }

  return (
    <article className="content-item-card">
      <button type="button" className={`content-item-thumb${!coverUrl ? ' is-fallback' : ''}`} onClick={onEdit}>
        {coverUrl ? <img src={coverUrl} alt="" loading="lazy" /> : (fallback ?? <ImageIcon size={24} />)}
        {marker ? <span className="content-item-marker">{marker}</span> : null}
      </button>
      <div className="content-item-body">
        <button type="button" className="content-item-title" onClick={onEdit}>
          {title}
        </button>
        {categoryLabel ? <span className="content-item-category-chip">{categoryLabel}</span> : null}
        {summary ? <p className="content-item-summary">{summary}</p> : null}
      </div>
      <div className="content-item-foot">
        <StatusBadge status={status} />
        <span className="content-item-meta">
          <span className="content-item-views">
            <Eye size={13} />
            {formatCount(viewCount ?? 0)} lượt
          </span>
          <span className="content-item-date">
            <CalendarClock size={13} />
            {updatedAt ? formatDate(updatedAt) : 'Chưa lưu'}
          </span>
        </span>
      </div>
      <div className="content-item-actions">
        <button type="button" title="Sửa" onClick={onEdit}>
          <Edit3 size={15} />
        </button>
        <button type="button" title="Nhân bản" onClick={onDuplicate}>
          <Copy size={15} />
        </button>
        <button type="button" title="Xem trước" onClick={onPreview}>
          <Eye size={15} />
        </button>
        {menuActions?.length ? (
          <span className="content-card-menu-wrap">
            <button type="button" title="Thêm thao tác" onClick={toggleMenu}>
              <MoreVertical size={15} />
            </button>
            {open ? (
              <>
                <span className="menu-backdrop" onClick={() => setOpen(false)} />
                <span className="card-menu content-card-menu" role="menu">
                  {menuActions.map((action) => (
                    <button
                      key={action.label}
                      type="button"
                      role="menuitem"
                      className={action.danger ? 'card-menu-danger' : undefined}
                      onClick={() => {
                        setOpen(false)
                        action.onClick()
                      }}
                    >
                      {action.danger ? <Trash2 size={13} /> : null}
                      {action.label}
                    </button>
                  ))}
                </span>
              </>
            ) : null}
          </span>
        ) : null}
      </div>
    </article>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatCount(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
