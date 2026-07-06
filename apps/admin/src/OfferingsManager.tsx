import type { MediaAsset, OfferingContent, OfferingInput, OfferingResponse } from '@iorder/contracts'
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Coffee,
  Copy,
  Eye,
  EyeOff,
  Factory,
  FileText,
  GripVertical,
  Layers,
  Minus,
  Package,
  Plus,
  Receipt,
  Server,
  Shield,
  Star,
  Store,
  Utensils,
  Wifi,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'

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
  archiveOffering,
  createOffering,
  deleteOffering,
  listMedia,
  listOfferings,
  publishOffering,
  unpublishOffering,
  updateOffering,
} from './api'
import { openPublicSite, publicSiteUrl } from './public-site'
import { RichTextEditor } from './RichTextEditor'
import { toast } from './toast'
import { ActionMenu, type ActionMenuItem, ToggleSwitch, useEscapeAndSave } from './ui'

const TYPES = [
  { key: 'software', label: 'Phần mềm' },
  { key: 'solution', label: 'Giải pháp' },
  { key: 'service', label: 'Dịch vụ' },
  { key: 'industry', label: 'Ngành hàng' },
] as const

type OfferingType = (typeof TYPES)[number]['key']
const MANAGED_TYPES = TYPES

const TYPE_COLORS: Record<OfferingType, string> = {
  software: '#2563eb',
  solution: '#7c3aed',
  service: '#0891b2',
  industry: '#16a34a',
}

const TYPE_ICONS: Record<OfferingType, LucideIcon> = {
  software: Package,
  solution: Layers,
  service: Wrench,
  industry: Factory,
}

const TYPE_PREFIX: Record<OfferingType, string> = {
  software: '/phan-mem',
  solution: '/giai-phap',
  service: '/dich-vu',
  industry: '/nganh-hang',
}

const FORM_COPY: Record<
  OfferingType,
  {
    headerDescription: string
    titleLabel: string
    summaryLabel: string
    summaryPlaceholder: string
    iconLabel: string
    sortLabel: string
    descriptionLabel: string
    categoryLabel: string
    categoryPlaceholder: string
  }
> = {
  software: {
    headerDescription: 'Chỉnh sửa nội dung, hiển thị, SEO và trạng thái xuất bản.',
    titleLabel: 'Tiêu đề',
    summaryLabel: 'Mô tả ngắn',
    summaryPlaceholder: 'Hiển thị dưới tiêu đề trên trang listing...',
    iconLabel: 'Biểu tượng',
    sortLabel: 'Thứ tự hiển thị',
    descriptionLabel: 'Mô tả chi tiết',
    categoryLabel: 'Danh mục / nhóm nội dung',
    categoryPlaceholder: 'Ví dụ: POS, CRM, quản lý bán hàng...',
  },
  solution: {
    headerDescription: 'Chỉnh sửa nội dung, hiển thị, SEO và trạng thái xuất bản.',
    titleLabel: 'Tiêu đề',
    summaryLabel: 'Mô tả ngắn',
    summaryPlaceholder: 'Hiển thị dưới tiêu đề trên trang listing...',
    iconLabel: 'Biểu tượng',
    sortLabel: 'Thứ tự hiển thị',
    descriptionLabel: 'Mô tả chi tiết',
    categoryLabel: 'Danh mục / nhóm nội dung',
    categoryPlaceholder: 'Ví dụ: Hạ tầng, phần mềm, bảo mật...',
  },
  service: {
    headerDescription: 'Chỉnh sửa nội dung, hiển thị, SEO và trạng thái xuất bản.',
    titleLabel: 'Tiêu đề',
    summaryLabel: 'Mô tả ngắn',
    summaryPlaceholder: 'Hiển thị dưới tiêu đề trên trang listing...',
    iconLabel: 'Biểu tượng',
    sortLabel: 'Thứ tự hiển thị',
    descriptionLabel: 'Mô tả chi tiết',
    categoryLabel: 'Danh mục / nhóm nội dung',
    categoryPlaceholder: 'Ví dụ: IT, website, chữ ký số...',
  },
  industry: {
    headerDescription:
      'Quản lý ngành hàng hiển thị tại section Theo ngành hàng trên trang chủ và trang chi tiết /nganh-hang.',
    titleLabel: 'Tên ngành hàng',
    summaryLabel: 'Mô tả trên trang chủ',
    summaryPlaceholder: 'Tóm tắt ngành hàng hiển thị trong section Theo ngành hàng...',
    iconLabel: 'Biểu tượng đại diện',
    sortLabel: 'Thứ tự trong nhóm',
    descriptionLabel: 'Mô tả trang chi tiết ngành',
    categoryLabel: 'Nhóm trên trang chủ',
    categoryPlaceholder: 'Ví dụ: Bán buôn, bán lẻ; Ăn uống, giải trí; Dịch vụ, lưu trú, làm đẹp...',
  },
}

const ICONS: Record<string, LucideIcon> = {
  building2: Building2,
  coffee: Coffee,
  receipt: Receipt,
  server: Server,
  shield: Shield,
  store: Store,
  utensils: Utensils,
  wifi: Wifi,
  wrench: Wrench,
}

const ICON_OPTIONS: Array<{ key: string; label: string; icon: LucideIcon }> = [
  { key: 'receipt', label: 'Hóa đơn', icon: Receipt },
  { key: 'store', label: 'Cửa hàng', icon: Store },
  { key: 'utensils', label: 'Nhà hàng', icon: Utensils },
  { key: 'coffee', label: 'Cafe', icon: Coffee },
  { key: 'server', label: 'Hệ thống', icon: Server },
  { key: 'shield', label: 'Bảo mật', icon: Shield },
  { key: 'building2', label: 'Doanh nghiệp', icon: Building2 },
  { key: 'wifi', label: 'Kết nối', icon: Wifi },
  { key: 'wrench', label: 'Dịch vụ', icon: Wrench },
]

const emptyContent = (): OfferingContent => ({
  description: '',
  tags: [],
  bestFor: null,
  keyValue: null,
  metrics: [],
  features: [],
  benefits: [],
  faq: [],
  items: [],
  category: null,
})

const emptyInput = (type: OfferingType): OfferingInput => ({
  type,
  title: '',
  slug: '',
  summary: null,
  icon: null,
  coverMediaId: null,
  sortOrder: 0,
  isFeatured: false,
  seoTitle: null,
  seoDescription: null,
  canonicalUrl: null,
  contentJson: emptyContent(),
})

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function toOfferingInput(item: OfferingResponse): OfferingInput {
  return {
    type: item.type,
    title: item.title,
    slug: item.slug,
    summary: item.summary,
    icon: item.icon,
    coverMediaId: item.coverMediaId,
    sortOrder: item.sortOrder,
    isFeatured: item.isFeatured,
    seoTitle: item.seoTitle,
    seoDescription: item.seoDescription,
    canonicalUrl: item.canonicalUrl,
    contentJson: item.contentJson,
  }
}

function ListEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string
  items: string[]
  onChange: (next: string[]) => void
  placeholder?: string
}) {
  return (
    <div className="list-editor">
      <div className="list-editor-head">
        <span className="list-editor-label">{label}</span>
        <button type="button" className="list-editor-add" onClick={() => onChange([...items, ''])}>
          <Plus size={13} /> Thêm
        </button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="list-editor-row">
          <GripVertical size={14} className="list-editor-grip" />
          <input
            value={item}
            placeholder={placeholder}
            onChange={(event) =>
              onChange(items.map((value, itemIndex) => (itemIndex === index ? event.target.value : value)))
            }
          />
          <button
            type="button"
            className="list-editor-remove"
            onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
          >
            <Minus size={14} />
          </button>
        </div>
      ))}
      {items.length === 0 ? <p className="list-editor-empty">Chưa có mục nào.</p> : null}
    </div>
  )
}

function FaqEditor({ items, onChange }: { items: [string, string][]; onChange: (next: [string, string][]) => void }) {
  return (
    <div className="list-editor">
      <div className="list-editor-head">
        <span className="list-editor-label">Câu hỏi thường gặp</span>
        <button type="button" className="list-editor-add" onClick={() => onChange([...items, ['', '']])}>
          <Plus size={13} /> Thêm câu hỏi
        </button>
      </div>
      {items.map(([question, answer], index) => (
        <div key={index} className="faq-editor-row">
          <div className="faq-editor-num">#{index + 1}</div>
          <div className="faq-editor-fields">
            <input
              value={question}
              placeholder="Câu hỏi?"
              onChange={(event) =>
                onChange(items.map((pair, itemIndex) => (itemIndex === index ? [event.target.value, pair[1]] : pair)))
              }
            />
            <textarea
              rows={2}
              value={answer}
              placeholder="Câu trả lời..."
              onChange={(event) =>
                onChange(items.map((pair, itemIndex) => (itemIndex === index ? [pair[0], event.target.value] : pair)))
              }
            />
          </div>
          <button
            type="button"
            className="list-editor-remove"
            onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
          >
            <Minus size={14} />
          </button>
        </div>
      ))}
      {items.length === 0 ? <p className="list-editor-empty">Chưa có câu hỏi nào.</p> : null}
    </div>
  )
}

function TagInput({ tags, onChange }: { tags: string[]; onChange: (next: string[]) => void }) {
  const [input, setInput] = useState('')

  const add = () => {
    const value = input.trim()
    if (value && !tags.includes(value)) onChange([...tags, value])
    setInput('')
  }

  return (
    <div className="tag-input-wrap">
      {tags.map((tag) => (
        <span key={tag} className="tag-chip">
          {tag}
          <button type="button" onClick={() => onChange(tags.filter((value) => value !== tag))}>
            ×
          </button>
        </span>
      ))}
      <input
        className="tag-input-field"
        value={input}
        placeholder="Thêm tag, nhấn Enter..."
        onChange={(event) => setInput(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            add()
          }
        }}
        onBlur={add}
      />
    </div>
  )
}

function OfferingIconFallback({
  icon,
  title,
  type,
  className = 'content-item-fallback',
  size = 22,
}: {
  icon: string | null
  title: string
  type: OfferingType
  className?: string
  size?: number
}) {
  const Icon = icon ? ICONS[icon] : undefined
  return (
    <span className={className} style={{ background: TYPE_COLORS[type] }}>
      {Icon ? <Icon size={size} strokeWidth={2.2} /> : <span>{title[0]?.toUpperCase() || '?'}</span>}
    </span>
  )
}

function OfferingCardCoverFallback({ type }: { type: OfferingType }) {
  const Icon = TYPE_ICONS[type]
  return (
    <span className={`card-cover-fallback card-cover-fallback--${type}`}>
      <Icon size={26} strokeWidth={2} />
    </span>
  )
}

function IconPicker({
  value,
  onChange,
  label,
}: {
  value: string | null
  onChange: (next: string | null) => void
  label: string
}) {
  return (
    <div className="form-field offering-icon-picker">
      <span className="field-label">{label}</span>
      <div className="icon-option-grid" role="radiogroup" aria-label={label}>
        {ICON_OPTIONS.map((option) => {
          const Icon = option.icon
          const selected = value === option.key
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={selected}
              className={`icon-option${selected ? ' is-active' : ''}`}
              title={option.label}
              onClick={() => onChange(selected ? null : option.key)}
            >
              <Icon size={18} />
              <span>{option.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ItemsEditor({
  items,
  onChange,
}: {
  items: Array<{ title: string; href: string }>
  onChange: (next: Array<{ title: string; href: string }>) => void
}) {
  return (
    <div className="list-editor">
      <div className="list-editor-head">
        <span className="list-editor-label">Liên kết / mục con</span>
        <button type="button" className="list-editor-add" onClick={() => onChange([...items, { title: '', href: '' }])}>
          <Plus size={13} /> Thêm
        </button>
      </div>
      {items.map((item, index) => (
        <div key={index} className="faq-editor-row">
          <div className="faq-editor-num">#{index + 1}</div>
          <div className="faq-editor-fields">
            <input
              value={item.title}
              placeholder="Tên mục"
              onChange={(event) =>
                onChange(
                  items.map((value, itemIndex) =>
                    itemIndex === index ? { ...value, title: event.target.value } : value,
                  ),
                )
              }
            />
            <input
              value={item.href}
              placeholder="/duong-dan-hoac-https://..."
              onChange={(event) =>
                onChange(
                  items.map((value, itemIndex) =>
                    itemIndex === index ? { ...value, href: event.target.value } : value,
                  ),
                )
              }
            />
          </div>
          <button
            type="button"
            className="list-editor-remove"
            onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}
          >
            <Minus size={14} />
          </button>
        </div>
      ))}
      {items.length === 0 ? <p className="list-editor-empty">Chưa có liên kết nào.</p> : null}
    </div>
  )
}

const INDUSTRY_DEFAULT_CATEGORIES = ['Bán buôn, bán lẻ', 'Ăn uống, giải trí', 'Dịch vụ, lưu trú, làm đẹp']

const NEW_CATEGORY_OPTION = '__new__'

function validateOffering(form: OfferingInput): string | null {
  if (form.title.trim().length < 2) return 'Tiêu đề phải có ít nhất 2 ký tự.'
  if (form.slug.trim().length < 3) return 'Slug phải có ít nhất 3 ký tự.'
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) return 'Slug không hợp lệ (chỉ chữ thường, số và dấu gạch ngang).'
  if (form.type === 'industry' && !(form.summary ?? '').trim())
    return 'Mô tả trên trang chủ là bắt buộc với ngành hàng.'
  // Mọi loại đều phải có mô tả chi tiết — trang public render trực tiếp nội dung này,
  // publish rỗng sẽ ra trang trống (giữ lại ràng buộc của điều kiện canPublish cũ).
  const descriptionText = String(form.contentJson.description ?? '')
    .replace(/<[^>]+>/g, ' ')
    .trim()
  if (!descriptionText) return 'Mô tả chi tiết không được để trống.'
  return null
}

function CategoryCombobox({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string | null
  onChange: (next: string | null) => void
  options: string[]
  placeholder?: string
}) {
  const hasValueInOptions = value ? options.includes(value) : false
  const [creatingNew, setCreatingNew] = useState(!hasValueInOptions && Boolean(value))

  const selectValue = creatingNew ? NEW_CATEGORY_OPTION : (value ?? '')

  return (
    <div className="form-field">
      <select
        value={selectValue}
        onChange={(event) => {
          const next = event.target.value
          if (next === NEW_CATEGORY_OPTION) {
            setCreatingNew(true)
            onChange(null)
          } else {
            setCreatingNew(false)
            onChange(next || null)
          }
        }}
      >
        <option value="">— Chọn nhóm —</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
        <option value={NEW_CATEGORY_OPTION}>➕ Nhóm mới…</option>
      </select>
      {creatingNew ? (
        <input
          maxLength={120}
          value={value ?? ''}
          autoFocus
          onChange={(event) => onChange(event.target.value || null)}
          placeholder={placeholder}
        />
      ) : null}
    </div>
  )
}

function OfferingForm({
  initial,
  current,
  images,
  items,
  onSave,
  onPublish,
  onArchive,
  onUnpublish,
  onCancel,
  onDuplicate,
}: {
  initial: OfferingInput
  current: OfferingResponse | null
  images: MediaAsset[]
  items: OfferingResponse[]
  onSave: (input: OfferingInput) => Promise<void>
  onPublish: (input: OfferingInput) => Promise<void>
  onArchive?: () => Promise<void>
  onUnpublish?: () => Promise<void>
  onCancel: () => void
  onDuplicate?: () => Promise<void>
}) {
  const [form, setForm] = useState<OfferingInput>(initial)
  const [saving, setSaving] = useState(false)
  const [showCover, setShowCover] = useState(false)
  const [availableImages, setAvailableImages] = useState(images)

  useEffect(() => setAvailableImages(images), [images])

  const set = (patch: Partial<OfferingInput>) => setForm((value) => ({ ...value, ...patch }))
  const setContent = (patch: Partial<OfferingContent>) =>
    setForm((value) => ({ ...value, contentJson: { ...value.contentJson, ...patch } }))

  const handleTitle = (title: string) => set({ title, slug: form.slug || slugify(title) })
  const coverImg = availableImages.find((image) => image.id === form.coverMediaId)
  const publicUrl = form.slug ? publicSiteUrl(`${TYPE_PREFIX[form.type]}/${form.slug}`) : ''
  const copy = FORM_COPY[form.type]
  const status = current?.status ?? 'draft'
  const descriptionText = form.contentJson.description.replace(/<[^>]+>/g, ' ').trim()
  const wordCount = descriptionText ? descriptionText.replace(/\s+/g, ' ').split(' ').filter(Boolean).length : 0

  const categoryOptionsForType = useMemo(() => {
    const names = new Set(
      items
        .filter((item) => item.type === form.type)
        .map((item) => item.contentJson.category)
        .filter((value): value is string => Boolean(value)),
    )
    if (form.type === 'industry' && names.size === 0) {
      return [...INDUSTRY_DEFAULT_CATEGORIES]
    }
    return Array.from(names)
  }, [items, form.type])

  const validationError = validateOffering(form)
  const canPublish = !validationError

  const saveDraft = async () => {
    const error = validateOffering(form)
    if (error) {
      toast.error(error)
      return
    }
    setSaving(true)
    try {
      await onSave(form)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể lưu nội dung.')
    } finally {
      setSaving(false)
    }
  }

  const publishNow = async () => {
    const error = validateOffering(form)
    if (error) {
      toast.error(error)
      return
    }
    setSaving(true)
    try {
      await onPublish(form)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Không thể xuất bản.')
    } finally {
      setSaving(false)
    }
  }

  useEscapeAndSave({ active: true, onSave: () => void saveDraft(), onEscape: onCancel })

  const typeLabel = MANAGED_TYPES.find((type) => type.key === form.type)?.label ?? 'Nội dung'

  return (
    <ContentEditorPage
      standalone
      title={current ? `Chỉnh sửa ${typeLabel.toLowerCase()}` : `Thêm ${typeLabel.toLowerCase()}`}
      description={copy.headerDescription}
      status={<StatusBadge status={status} />}
      eyebrow={
        <span className="editor-breadcrumb">
          <button type="button" onClick={onCancel}>
            <ArrowLeft size={16} /> {typeLabel}
          </button>
          <span>›</span>
          {current ? 'Chỉnh sửa' : 'Thêm mới'}
        </span>
      }
      actions={
        <>
          <button
            type="button"
            className="secondary-button btn-icon save-draft-button"
            disabled={saving}
            onClick={() => void saveDraft()}
          >
            <FileText size={15} /> Lưu nháp
          </button>
          <button
            type="button"
            className="btn-primary btn-icon"
            disabled={saving || !canPublish}
            title={!canPublish ? (validationError ?? undefined) : undefined}
            onClick={() => void publishNow()}
          >
            <CheckCircle2 size={15} /> Xuất bản ngay
          </button>
          <ActionMenu
            items={
              [
                ...(publicUrl
                  ? [
                      {
                        label: 'Xem trước',
                        icon: Eye,
                        onClick: () => window.open(publicUrl, '_blank', 'noopener'),
                      },
                    ]
                  : []),
                ...(onDuplicate
                  ? [
                      {
                        label: 'Nhân bản',
                        icon: Copy,
                        disabled: saving,
                        onClick: () => void onDuplicate(),
                      },
                    ]
                  : []),
                { divider: true } as const,
                ...(onUnpublish && status === 'published'
                  ? [
                      {
                        label: 'Gỡ xuất bản',
                        icon: EyeOff,
                        disabled: saving,
                        onClick: () => void onUnpublish(),
                      },
                    ]
                  : []),
                ...(onArchive
                  ? [
                      {
                        label: 'Ẩn',
                        icon: EyeOff,
                        tone: 'danger' as const,
                        disabled: saving,
                        onClick: () => void onArchive(),
                      },
                    ]
                  : []),
              ] satisfies (ActionMenuItem | { divider: true })[]
            }
          />
        </>
      }
      onSubmit={(event) => {
        event.preventDefault()
        void saveDraft()
      }}
      main={
        <>
          <BasicInfoCard>
            <div className="form-row-2col">
              <label>
                {copy.titleLabel} <span className="field-counter">{form.title.length}/220</span>
                <input
                  value={form.title}
                  onChange={(event) => handleTitle(event.target.value)}
                  required
                  maxLength={220}
                />
              </label>
              <label>
                Slug
                <input
                  value={form.slug}
                  onChange={(event) => set({ slug: slugify(event.target.value) })}
                  required
                  maxLength={180}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                />
              </label>
            </div>
            <label className="full-field">
              {copy.summaryLabel} <span className="field-counter">{(form.summary ?? '').length}/600</span>
              <textarea
                rows={3}
                value={form.summary ?? ''}
                onChange={(event) => set({ summary: event.target.value || null })}
                maxLength={600}
                placeholder={copy.summaryPlaceholder}
              />
            </label>
            <div className="form-row-2col">
              <IconPicker value={form.icon} label={copy.iconLabel} onChange={(icon) => set({ icon })} />
              <label className="sort-order-field">
                {copy.sortLabel}
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(event) => set({ sortOrder: Number(event.target.value) })}
                  min={0}
                />
              </label>
            </div>
            {form.type === 'industry' ? (
              <label className="full-field">
                {copy.categoryLabel}
                <CategoryCombobox
                  value={form.contentJson.category}
                  onChange={(category) => setContent({ category })}
                  options={categoryOptionsForType}
                  placeholder={copy.categoryPlaceholder}
                />
              </label>
            ) : null}
          </BasicInfoCard>

          <ContentBodyEditor wordCount={wordCount}>
            <div className="form-field">
              <span className="field-label">{copy.descriptionLabel}</span>
              <RichTextEditor
                value={form.contentJson.description}
                placeholder={`Soạn ${copy.descriptionLabel.toLowerCase()}...`}
                onChange={(html) => setContent({ description: html })}
              />
            </div>
            <div className="form-row-2col">
              <label>
                Phù hợp với
                <input
                  value={form.contentJson.bestFor ?? ''}
                  onChange={(event) => setContent({ bestFor: event.target.value || null })}
                  maxLength={300}
                  placeholder="Cửa hàng bán lẻ, nhà hàng..."
                />
              </label>
              <label>
                Giá trị cốt lõi
                <input
                  value={form.contentJson.keyValue ?? ''}
                  onChange={(event) => setContent({ keyValue: event.target.value || null })}
                  maxLength={300}
                  placeholder="Vận hành bán hàng tập trung"
                />
              </label>
            </div>
            <div className="form-field">
              <span className="field-label">Tags</span>
              <TagInput tags={form.contentJson.tags} onChange={(next) => setContent({ tags: next })} />
            </div>
            <ListEditor
              label="Số liệu nhanh"
              items={form.contentJson.metrics}
              onChange={(next) => setContent({ metrics: next })}
              placeholder="Tạo đơn ít bước"
            />
            <ListEditor
              label="Tính năng chính"
              items={form.contentJson.features}
              onChange={(next) => setContent({ features: next })}
              placeholder="Bán hàng tại quầy, gọi món..."
            />
            <ListEditor
              label="Lợi ích vận hành"
              items={form.contentJson.benefits}
              onChange={(next) => setContent({ benefits: next })}
              placeholder="Giảm thời gian đào tạo..."
            />
            <FaqEditor items={form.contentJson.faq} onChange={(next) => setContent({ faq: next })} />
            <ItemsEditor items={form.contentJson.items} onChange={(next) => setContent({ items: next })} />
          </ContentBodyEditor>

          {form.type !== 'industry' ? (
            <CategoryTagSelector>
              <label className="full-field">
                {copy.categoryLabel}
                <CategoryCombobox
                  value={form.contentJson.category}
                  onChange={(category) => setContent({ category })}
                  options={categoryOptionsForType}
                  placeholder={copy.categoryPlaceholder}
                />
              </label>
            </CategoryTagSelector>
          ) : null}

          <SeoMetaCard
            title={form.seoTitle || form.title || 'Tiêu đề trang'}
            description={form.seoDescription || form.summary || 'Mô tả trang sẽ hiển thị ở đây...'}
            url={`https://iorder.vn${TYPE_PREFIX[form.type]}/${form.slug || 'slug'}`}
          >
            <div className="form-row-2col">
              <label>
                Tiêu đề SEO <span className="field-counter">{(form.seoTitle ?? '').length}/70</span>
                <input
                  value={form.seoTitle ?? ''}
                  onChange={(event) => set({ seoTitle: event.target.value || null })}
                  maxLength={70}
                  placeholder={form.title}
                />
              </label>
              <label>
                Mô tả SEO <span className="field-counter">{(form.seoDescription ?? '').length}/180</span>
                <textarea
                  rows={3}
                  value={form.seoDescription ?? ''}
                  onChange={(event) => set({ seoDescription: event.target.value || null })}
                  maxLength={180}
                  placeholder={form.summary ?? ''}
                />
              </label>
            </div>
            <label className="full-field">
              Canonical URL
              <input
                value={form.canonicalUrl ?? ''}
                onChange={(event) => set({ canonicalUrl: event.target.value || null })}
                placeholder="https://..."
              />
            </label>
          </SeoMetaCard>
        </>
      }
      sidebar={
        <>
          <PublishSidebar
            status={status}
            updatedAt={current?.updatedAt ?? null}
            publishedAt={current?.publishedAt ?? null}
            isSaving={saving}
            canPublish={canPublish}
            onSaveDraft={() => void saveDraft()}
            hideActions
          />
          <CoverImageCard
            coverUrl={coverImg?.publicUrl ?? null}
            images={availableImages}
            value={form.coverMediaId}
            onChange={(id) => set({ coverMediaId: id })}
            onUploaded={(asset) => {
              setAvailableImages((prev) => [asset, ...prev])
              set({ coverMediaId: asset.id })
            }}
            onRemove={() => set({ coverMediaId: null })}
            pickerOpen={showCover}
            onTogglePicker={() => setShowCover((value) => !value)}
            fallback={
              <OfferingIconFallback
                icon={form.icon}
                title={form.title}
                type={form.type}
                className="content-cover-fallback"
                size={30}
              />
            }
          />
          <DisplaySettingCard
            readMinutes={Math.max(1, Math.ceil(wordCount / 200))}
            wordCount={wordCount}
            updatedAt={current?.updatedAt ?? null}
            visible={status === 'published'}
            onVisibleChange={(visible) => {
              if (visible) void publishNow()
              else if (onArchive) void onArchive()
            }}
          >
            <div className="content-sidebar-extra">
              <ToggleSwitch
                checked={form.isFeatured}
                onChange={(next) => set({ isFeatured: next })}
                label="Nổi bật"
                hint="Ưu tiên hiển thị ở vị trí nổi bật"
              />
            </div>
          </DisplaySettingCard>
        </>
      }
    />
  )
}

export function OfferingsManager({ type: activeType }: { type: OfferingType }) {
  const [items, setItems] = useState<OfferingResponse[]>([])
  const [images, setImages] = useState<MediaAsset[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<OfferingResponse | null | 'new'>(null)
  const [statusFilter, setStatusFilter] = useState<ContentStatus>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() =>
    localStorage.getItem('admin.offerings.view') === 'list' ? 'list' : 'grid',
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [res, mediaRes] = await Promise.all([listOfferings(activeType), listMedia('image')])
      setItems(res.items)
      setImages(mediaRes.items)
    } catch {
      toast.error('Không tải được danh sách. Kiểm tra kết nối API.')
    } finally {
      setLoading(false)
    }
  }, [activeType])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setEditing(null)
    setStatusFilter('all')
    setCategoryFilter('all')
    setSearch('')
  }, [activeType])

  const saveOffering = async (input: OfferingInput) => {
    if (editing === 'new') await createOffering(input)
    else if (editing) await updateOffering(editing.id, input)
    setEditing(null)
    await load()
    toast.success('Đã lưu nội dung.')
  }

  const publishOfferingInput = async (input: OfferingInput) => {
    const saved =
      editing === 'new' ? await createOffering(input) : editing ? await updateOffering(editing.id, input) : null
    if (!saved) return
    await publishOffering(saved.item.id)
    setEditing(null)
    await load()
    toast.success('Đã xuất bản.')
  }

  const handleDuplicate = async (item: OfferingResponse) => {
    try {
      const input = toOfferingInput(item)
      input.title = `Bản sao: ${item.title}`
      input.slug = `${item.slug}-copy-${Date.now().toString(36)}`
      const result = await createOffering(input)
      await load()
      setEditing(result.item)
      toast.success('Đã tạo bản sao.')
    } catch {
      toast.error('Không thể nhân bản.')
    }
  }

  const handleToggleFeatured = async (id: string) => {
    const item = items.find((value) => value.id === id)
    if (!item) return
    try {
      await updateOffering(id, { ...toOfferingInput(item), isFeatured: !item.isFeatured })
      await load()
      toast.success(item.isFeatured ? 'Đã bỏ đánh dấu nổi bật.' : 'Đã đánh dấu nổi bật.')
    } catch {
      toast.error('Không thể cập nhật.')
    }
  }

  const handlePublish = async (id: string) => {
    await publishOffering(id)
    await load()
    toast.success('Đã xuất bản.')
  }

  const handleUnpublish = async (id: string) => {
    try {
      const result = await unpublishOffering(id)
      setItems((current) => current.map((item) => (item.id === id ? result.item : item)))
      toast.success('Đã gỡ xuất bản. Nội dung chuyển về bản nháp.')
    } catch {
      toast.error('Không thể gỡ xuất bản.')
    }
  }

  const handleArchive = async (id: string) => {
    await archiveOffering(id)
    await load()
    toast.warning('Đã ẩn nội dung.')
  }

  const handleDelete = async (id: string) => {
    await deleteOffering(id)
    await load()
    toast.warning('Đã xóa nội dung.')
  }

  const moveItem = async (id: string, direction: 'up' | 'down') => {
    const ordered = [...items].sort((a, b) => a.sortOrder - b.sortOrder)
    const index = ordered.findIndex((item) => item.id === id)
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    const current = ordered[index]
    const target = ordered[swapIndex]
    if (!current || !target) return
    try {
      await Promise.all([
        updateOffering(current.id, { ...toOfferingInput(current), sortOrder: target.sortOrder }),
        updateOffering(target.id, { ...toOfferingInput(target), sortOrder: current.sortOrder }),
      ])
      await load()
    } catch {
      toast.error('Không thể đổi thứ tự.')
    }
  }

  const coverMap = new Map(images.map((image) => [image.id, image.publicUrl]))
  const typeLabel = TYPES.find((type) => type.key === activeType)?.label ?? ''

  const stats = useMemo(
    () => [
      {
        key: 'all',
        label: `Tổng ${typeLabel.toLowerCase()}`,
        value: items.length,
        note: `Tất cả ${typeLabel.toLowerCase()}`,
      },
      {
        key: 'published',
        label: 'Đã đăng',
        value: items.filter((item) => item.status === 'published').length,
        note: 'Hiển thị công khai',
      },
      {
        key: 'draft',
        label: 'Nháp',
        value: items.filter((item) => item.status === 'draft').length,
        note: 'Chưa xuất bản',
      },
      {
        key: 'archived',
        label: 'Ẩn',
        value: items.filter((item) => item.status === 'archived').length,
        note: 'Đang ẩn khỏi site',
      },
    ],
    [items, typeLabel],
  )

  const categoryOptions = useMemo(() => {
    const names = new Set(items.map((item) => item.contentJson.category).filter(Boolean) as string[])
    return Array.from(names).map((name) => ({ value: name, label: name }))
  }, [items])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    return items
      .filter((item) => statusFilter === 'all' || item.status === statusFilter)
      .filter((item) => categoryFilter === 'all' || item.contentJson.category === categoryFilter)
      .filter((item) => {
        if (!query) return true
        return `${item.title} ${item.slug} ${item.summary ?? ''} ${item.contentJson.description}`
          .toLowerCase()
          .includes(query)
      })
      .sort((a, b) => {
        const left = new Date(a.updatedAt).getTime()
        const right = new Date(b.updatedAt).getTime()
        return sortOrder === 'newest' ? right - left : left - right
      })
  }, [items, statusFilter, categoryFilter, search, sortOrder])

  const isReorderable = !search.trim() && statusFilter === 'all' && categoryFilter === 'all'

  if (editing !== null) {
    return (
      <OfferingForm
        images={images}
        items={items}
        current={editing === 'new' ? null : editing}
        initial={
          editing === 'new'
            ? emptyInput(activeType)
            : { ...editing, contentJson: editing.contentJson as OfferingContent }
        }
        onSave={saveOffering}
        onPublish={publishOfferingInput}
        onCancel={() => setEditing(null)}
        {...(editing !== 'new'
          ? {
              onArchive: async () => handleArchive((editing as OfferingResponse).id),
              onUnpublish: async () => handleUnpublish((editing as OfferingResponse).id),
              onDuplicate: async () => handleDuplicate(editing as OfferingResponse),
            }
          : {})}
      />
    )
  }

  return (
    <div className="admin-module">
      <ContentListPage
        title={typeLabel}
        description={`Quản lý ${typeLabel.toLowerCase()} hiển thị trên website.`}
        actionLabel={`Thêm ${typeLabel.toLowerCase()}`}
        onCreate={() => setEditing('new')}
        stats={stats}
        search={search}
        onSearch={setSearch}
        status={statusFilter}
        onStatus={setStatusFilter}
        sort={sortOrder}
        onSort={setSortOrder}
        viewMode={viewMode}
        onViewMode={(next) => {
          setViewMode(next)
          localStorage.setItem('admin.offerings.view', next)
        }}
        {...(categoryOptions.length > 0
          ? { categoryOptions, categoryValue: categoryFilter, onCategoryChange: setCategoryFilter }
          : {})}
      >
        {loading ? <p className="admin-info">Đang tải...</p> : null}
        {!loading && filtered.length === 0 ? (
          <div className="admin-empty admin-empty--inline">
            <p>Không có mục nào khớp với bộ lọc.</p>
          </div>
        ) : null}

        {!loading ? (
          <ContentCardsGrid
            addLabel={`Thêm ${typeLabel.toLowerCase()} mới`}
            addDescription={`Tạo nội dung ${typeLabel.toLowerCase()} để hiển thị trên website`}
            onCreate={() => setEditing('new')}
            isList={viewMode === 'list'}
          >
            {filtered.map((item, index) => {
              const coverUrl = item.coverMediaId ? (coverMap.get(item.coverMediaId) ?? null) : null
              return (
                <ContentItemCard
                  key={item.id}
                  title={item.title}
                  slug={item.slug}
                  summary={item.summary}
                  status={item.status}
                  updatedAt={item.updatedAt}
                  coverUrl={coverUrl}
                  fallback={<OfferingCardCoverFallback type={item.type} />}
                  categoryLabel={item.contentJson.category ?? null}
                  marker={
                    item.isFeatured ? (
                      <span className="content-featured-marker" title="Nổi bật">
                        <Star size={12} fill="currentColor" />
                      </span>
                    ) : null
                  }
                  onEdit={() => setEditing(item)}
                  onDuplicate={() => void handleDuplicate(item)}
                  onPreview={() => openPublicSite(`${TYPE_PREFIX[activeType]}/${item.slug}`)}
                  menuActions={
                    [
                      ...(isReorderable && index > 0
                        ? [{ label: 'Lên', onClick: () => void moveItem(item.id, 'up') }]
                        : []),
                      ...(isReorderable && index < filtered.length - 1
                        ? [{ label: 'Xuống', onClick: () => void moveItem(item.id, 'down') }]
                        : []),
                      {
                        label: item.isFeatured ? 'Bỏ nổi bật' : 'Đánh dấu nổi bật',
                        onClick: () => void handleToggleFeatured(item.id),
                      },
                      item.status === 'published'
                        ? { label: 'Gỡ xuất bản', onClick: () => void handleUnpublish(item.id) }
                        : { label: 'Xuất bản', onClick: () => void handlePublish(item.id) },
                      item.status === 'published'
                        ? { label: 'Ẩn nội dung', onClick: () => void handleArchive(item.id) }
                        : null,
                      { label: 'Xóa', onClick: () => void handleDelete(item.id), danger: true },
                    ].filter(Boolean) as Array<{ label: string; onClick: () => void; danger?: boolean }>
                  }
                />
              )
            })}
          </ContentCardsGrid>
        ) : null}
      </ContentListPage>
    </div>
  )
}
