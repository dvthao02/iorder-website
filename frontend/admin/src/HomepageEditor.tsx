import {
  DEFAULT_SECTION_APPEARANCE,
  HOMEPAGE_SECTION_ORDER,
  SECTION_BACKGROUND_COLORS,
  homepageInputSchema,
  type HomepageBlock,
  type HomepageInput,
  type HomepageRevisionSummary,
  type MediaAsset,
  type SectionAppearance,
} from '@iorder/contracts'
import {
  ArrowLeft,
  Eye,
  EyeOff,
  GripVertical,
  History,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Maximize2,
  Minimize2,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
  UploadCloud,
} from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import {
  autosaveHomepage,
  checkApiHealth,
  checkpointHomepage,
  createHomepagePreview,
  getHomepage,
  listHomepageRevisions,
  listMedia,
  publishHomepage,
  restoreHomepageRevision,
} from './api'
import { slugByKey } from './sidebar/navigation'
import { toast } from './toast'
import {
  EditorFooter,
  ImagePicker,
  ModalShell,
  PageHeader,
  StatusDot,
  ToggleSwitch,
  useDragReorder,
  useEscapeAndSave,
} from './ui'

const defaultInput: HomepageInput = {
  title: 'Trang chủ',
  seoTitle: null,
  seoDescription: null,
  canonicalUrl: null,
  blocks: [],
}

const RECOVERY_KEY = 'iorder-cms-homepage-recovery-v2'

const backgroundColorLabels: Record<(typeof SECTION_BACKGROUND_COLORS)[number], string> = {
  '#ffffff': 'Trắng',
  '#f6fbff': 'Xanh rất nhạt',
  '#eaf6ff': 'Xanh nhạt',
  '#0a1628': 'Navy tối',
  '#0f2236': 'Navy thẻ',
}

const labels: Record<HomepageBlock['type'], string> = {
  home_hero: 'Banner chính',
  home_stats: 'Số liệu + Logo đối tác',
  home_features: 'Tính năng nền tảng',
  home_industries: 'Ngành hàng',
  home_ecosystem_services: 'Dịch vụ trọn gói',
  home_process: 'Quy trình triển khai',
  home_testimonials: 'Khách hàng nói gì',
  home_featured_posts: 'Bài viết nổi bật',
  home_faq: 'Câu hỏi thường gặp',
  home_cta: 'Kêu gọi hành động',
}

const fieldLabels: Record<string, string> = {
  title: 'Tiêu đề',
  description: 'Mô tả',
  heading: 'Tiêu đề nhóm',
  body: 'Nội dung',
  items: 'Danh sách mục',
  href: 'Liên kết',
  websiteUrl: 'Website',
  buttonLabel: 'Nhãn nút',
  buttonUrl: 'Liên kết nút',
  primaryLabel: 'Nhãn nút chính',
  primaryUrl: 'Liên kết nút chính',
  imageMediaId: 'Ảnh',
  mediaId: 'Tệp',
  limit: 'Số bài',
  seoTitle: 'Tiêu đề SEO',
  seoDescription: 'Mô tả SEO',
  canonicalUrl: 'Canonical URL',
}

function validateHomepage(input: HomepageInput) {
  const parsed = homepageInputSchema.safeParse(input)
  if (parsed.success) return null

  const issue = parsed.error.issues[0]
  if (!issue) return 'Dữ liệu trang chủ chưa hợp lệ.'
  const path = issue.path.map(String)
  const blockIndex = path[0] === 'blocks' && Number.isInteger(Number(path[1])) ? Number(path[1]) : null
  const block = blockIndex === null ? null : input.blocks[blockIndex]
  const itemIndexPosition = path.findIndex((part) => part === 'items' || part === 'slides') + 1
  const itemIndex =
    itemIndexPosition > 0 && Number.isInteger(Number(path[itemIndexPosition]))
      ? Number(path[itemIndexPosition]) + 1
      : null
  const field = path.at(-1) ?? 'data'
  const location = block
    ? `${labels[block.type]} #${blockIndex! + 1}${itemIndex ? `, mục #${itemIndex}` : ''}`
    : 'Thông tin trang chủ'
  const fieldName = fieldLabels[field] ?? field

  let reason = 'không hợp lệ'
  if (issue.code === 'too_small') reason = field === 'items' ? 'phải có ít nhất một mục' : 'không được để trống'
  if (issue.code === 'too_big') reason = 'vượt quá độ dài hoặc số lượng cho phép'
  if (issue.message.toLowerCase().includes('url')) reason = 'phải là đường dẫn bắt đầu bằng / hoặc URL đầy đủ'
  if (field === 'imageMediaId' || field === 'mediaId' || field === 'avatarMediaId')
    reason = 'chưa chọn ảnh hoặc tệp hợp lệ'

  return `${location}: ${fieldName} ${reason}.`
}

function newBlock(type: HomepageBlock['type'], mediaId = ''): HomepageBlock {
  const appearance = { ...DEFAULT_SECTION_APPEARANCE }
  if (type === 'home_hero')
    return {
      type,
      isEnabled: false,
      appearance,
      data: {
        eyebrow: null,
        title: 'Giải pháp cho doanh nghiệp',
        description: 'Nhập mô tả banner',
        imageMediaId: null,
        primaryLabel: 'Liên hệ',
        primaryUrl: '/lien-he',
        secondaryLabel: null,
        secondaryUrl: null,
        points: [],
        slides: [],
      },
    }
  if (type === 'home_stats')
    return {
      type,
      isEnabled: false,
      appearance,
      data: {
        stats: [{ value: '500+', label: 'Khách hàng tin dùng', note: null }],
        partnersHeading: 'Khách hàng & đối tác',
        partners: [],
        partnersLimit: 12,
      },
    }
  if (type === 'home_features')
    return {
      type,
      isEnabled: false,
      appearance,
      data: {
        eyebrow: 'NỀN TẢNG',
        heading: 'Một nền tảng cho toàn bộ vận hành cửa hàng',
        intro: null,
        items: [{ title: 'Tính năng mới', description: 'Mô tả tính năng', href: null, mediaId: null }],
      },
    }
  if (type === 'home_industries')
    return {
      type,
      isEnabled: false,
      appearance,
      data: {
        eyebrow: 'THEO NGÀNH HÀNG',
        heading: 'Phù hợp nhiều mô hình kinh doanh',
        intro: null,
        groups: [
          {
            title: 'Nhóm ngành',
            iconKey: 'store',
            items: [{ title: 'Ngành mới', description: 'Mô tả ngành', href: '/nganh-hang' }],
          },
        ],
      },
    }
  if (type === 'home_ecosystem_services')
    return {
      type,
      isEnabled: false,
      appearance,
      data: {
        eyebrow: 'TRIỂN KHAI TRỌN GÓI',
        heading: 'Không chỉ phần mềm — triển khai trọn gói',
        intro: null,
        groups: [
          {
            iconKey: 'check',
            label: 'Nhóm',
            title: 'Nội dung mới',
            description: 'Mô tả nội dung',
            href: '/',
            items: [],
          },
        ],
      },
    }
  if (type === 'home_process')
    return {
      type,
      isEnabled: false,
      appearance,
      data: {
        eyebrow: 'QUY TRÌNH',
        heading: 'Quy trình triển khai rõ ràng',
        intro: 'Mô tả quy trình triển khai',
        buttonLabel: 'Liên hệ',
        buttonUrl: '/lien-he',
        featureMediaId: mediaId,
        steps: [{ title: 'Bước triển khai', description: 'Mô tả bước triển khai' }],
        models: [],
      },
    }
  if (type === 'home_testimonials')
    return {
      type,
      isEnabled: false,
      appearance,
      data: { eyebrow: 'KHÁCH HÀNG NÓI GÌ', heading: 'Khách hàng tin tưởng iOrder', items: [], limit: 6 },
    }
  if (type === 'home_featured_posts')
    return {
      type,
      isEnabled: false,
      appearance,
      data: {
        eyebrow: 'TIN TỨC IORDER',
        heading: 'Bài viết nổi bật',
        intro: null,
        postType: 'all',
        limit: 3,
        allLabel: 'Xem tất cả bài viết',
        allUrl: '/tin-tuc',
      },
    }
  if (type === 'home_faq')
    return {
      type,
      isEnabled: false,
      appearance,
      data: {
        eyebrow: 'CÂU HỎI THƯỜNG GẶP',
        heading: 'Giải đáp thắc mắc',
        items: [{ question: 'Câu hỏi 1?', answer: 'Câu trả lời 1.' }],
      },
    }
  return {
    type: 'home_cta',
    isEnabled: false,
    appearance,
    data: {
      title: 'Bạn cần tư vấn?',
      description: 'Liên hệ với iOrder để được hỗ trợ.',
      buttonLabel: 'Liên hệ',
      buttonUrl: '/lien-he',
    },
  }
}

// Giữ nguyên thứ tự đã lưu (do kéo-thả sắp xếp); chỉ bổ sung section còn thiếu vào cuối theo thứ tự mặc định.
function fixedBlocks(blocks: HomepageBlock[], mediaId = '') {
  const byType = new Map(blocks.map((block) => [block.type, block]))
  const presentTypes = blocks.map((block) => block.type).filter((type) => byType.has(type))
  const missingTypes = HOMEPAGE_SECTION_ORDER.filter((type) => !byType.has(type))
  return [...presentTypes, ...missingTypes].map((type) => byType.get(type) ?? newBlock(type, mediaId))
}

/** Nhóm các trường liên quan trong một khung viền nhẹ, có tiêu đề nhỏ in hoa. */
function FieldGroup({ title, hint, children }: { title: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="block-fieldset">
      <p className="block-fieldset-title">{title}</p>
      {hint ? <small className="field-hint">{hint}</small> : null}
      {children}
    </div>
  )
}

/** Một dòng trong danh sách lặp lại: input(s)/select(s) truyền qua children + nút xoá icon ở cuối. */
function ListItemRow({
  children,
  onRemove,
  disabled = false,
}: {
  children: ReactNode
  onRemove: () => void
  disabled?: boolean
}) {
  return (
    <div className="list-item-row">
      {children}
      <button
        type="button"
        className="icon-button danger"
        title="Xóa"
        aria-label="Xóa"
        disabled={disabled}
        onClick={onRemove}
      >
        <Trash2 size={16} />
      </button>
    </div>
  )
}

/**
 * Trường chọn ảnh dùng chung cho các block trang chủ: thay cho <select> liệt kê tên file.
 * Hiển thị thumbnail ảnh đang chọn + nút mở thư viện (ModalShell + ImagePicker có sẵn trong ./ui,
 * ImagePicker tự xử lý cả chọn ảnh có sẵn lẫn upload ảnh mới từ máy).
 */
function MediaPickerField({
  images,
  value,
  onChange,
  onUploaded,
  label,
}: {
  images: MediaAsset[]
  value: string | null
  onChange: (id: string | null) => void
  onUploaded: (asset: MediaAsset) => void
  label?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = value ? images.find((image) => image.id === value) : undefined

  return (
    <div className="media-picker-field">
      {label ? <span className="field-label">{label}</span> : null}
      <div className="media-picker-field-row">
        <div className="media-picker-field-thumb">
          {selected ? (
            <img src={selected.publicUrl} alt={selected.originalName} />
          ) : (
            <span className="media-picker-field-empty">
              <ImageIcon size={20} />
            </span>
          )}
        </div>
        <div className="media-picker-field-info">
          <span className="media-picker-field-name">{selected ? selected.originalName : 'Chưa chọn ảnh'}</span>
          <div className="media-picker-field-actions">
            <button type="button" className="secondary-button" onClick={() => setOpen(true)}>
              Chọn ảnh
            </button>
            {value ? (
              <button type="button" className="secondary-button" onClick={() => onChange(null)}>
                Bỏ chọn
              </button>
            ) : null}
          </div>
        </div>
      </div>
      {open ? (
        <ModalShell size="lg" onOverlayClick={() => setOpen(false)} header={<h3>{label ?? 'Chọn ảnh'}</h3>}>
          <ImagePicker
            label="Thư viện ảnh"
            images={images}
            value={value}
            onChange={(id) => {
              onChange(id)
              setOpen(false)
            }}
            onUploaded={onUploaded}
          />
        </ModalShell>
      ) : null}
    </div>
  )
}

export function HomepageEditor() {
  const [form, setForm] = useState<HomepageInput>(defaultInput)
  const [status, setStatus] = useState('draft')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [autosaveState, setAutosaveState] = useState<'idle' | 'pending' | 'saving' | 'saved' | 'offline' | 'conflict'>(
    'idle',
  )
  const [loaded, setLoaded] = useState(false)
  const [savedSignature, setSavedSignature] = useState('')
  const [draftVersion, setDraftVersion] = useState(0)
  const [images, setImages] = useState<MediaAsset[]>([])
  const [selectedType, setSelectedType] = useState<HomepageBlock['type'] | null>(null)
  const [revisions, setRevisions] = useState<HomepageRevisionSummary[]>([])
  const [showRevisions, setShowRevisions] = useState(false)
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('light')
  const [showPreview, setShowPreview] = useState(false)
  const [previewFullscreen, setPreviewFullscreen] = useState(false)
  const [sectionView, setSectionView] = useState<'grid' | 'list'>(() =>
    localStorage.getItem('admin.homepage.sectionView') === 'list' ? 'list' : 'grid',
  )

  const { rowProps: sectionDragProps } = useDragReorder(async (from, to) => {
    const next = [...form.blocks]
    const [moved] = next.splice(from, 1)
    if (!moved) return
    next.splice(to, 0, moved)
    setForm((f) => ({ ...f, blocks: next }))
  })
  const [previewPos, setPreviewPos] = useState<{ x: number; y: number } | null>(null)
  const [previewSize, setPreviewSize] = useState<{ w: number; h: number } | null>(null)
  const dragRef = useRef<{ dx: number; dy: number } | null>(null)
  const resizeRef = useRef<{ x: number; y: number; w: number; h: number } | null>(null)
  const autosaveInFlight = useRef(false)
  const previewIframeRef = useRef<HTMLIFrameElement | null>(null)

  useEffect(() => {
    Promise.all([getHomepage(), listMedia('image'), listHomepageRevisions()])
      .then(([{ item }, imageResult, revisionResult]) => {
        const mediaId = imageResult.items[0]?.id ?? ''
        if (item) {
          const serverForm: HomepageInput = {
            title: item.title,
            seoTitle: item.seoTitle,
            seoDescription: item.seoDescription,
            canonicalUrl: item.canonicalUrl,
            blocks: fixedBlocks(item.blocks, mediaId),
          }
          let loadedForm = serverForm
          try {
            const recovery = JSON.parse(window.localStorage.getItem(RECOVERY_KEY) ?? 'null') as {
              form?: unknown
              baseVersion?: number
            } | null
            const parsedRecovery = homepageInputSchema.safeParse(recovery?.form)
            if (
              parsedRecovery.success &&
              recovery?.baseVersion === item.draftVersion &&
              JSON.stringify(parsedRecovery.data) !== JSON.stringify(serverForm)
            ) {
              loadedForm = parsedRecovery.data
              setMessage('Đã khôi phục nội dung chưa kịp đồng bộ từ trình duyệt này.')
            }
          } catch {
            /* Ignore malformed local recovery. */
          }
          setForm(loadedForm)
          setSavedSignature(JSON.stringify(serverForm))
          setStatus(item.status)
          setDraftVersion(item.draftVersion)
        } else {
          const emptyForm = { ...defaultInput, blocks: fixedBlocks([], mediaId) }
          setForm(emptyForm)
          setSavedSignature(JSON.stringify(defaultInput))
        }
        setImages(imageResult.items)
        setRevisions(revisionResult.items)
        setLoaded(true)
      })
      .catch(() => {
        setMessage('Không thể tải nội dung trang chủ.')
        setLoaded(true)
      })
  }, [])

  useEffect(() => {
    let active = true
    let consecutiveFailures = 0
    const probe = async () => {
      try {
        await checkApiHealth()
        if (!active) return
        const wasOffline = consecutiveFailures >= 3
        consecutiveFailures = 0
        setApiStatus('online')
        if (wasOffline) {
          setMessage((current) =>
            current.startsWith('Không kết nối được CMS API')
              ? 'CMS API đã kết nối lại. Bạn có thể lưu và xuất bản.'
              : current,
          )
        }
      } catch {
        consecutiveFailures += 1
        if (active) setApiStatus(consecutiveFailures >= 3 ? 'offline' : 'checking')
      }
    }
    void probe()
    // 8s đủ để hiện trạng thái API khi rảnh; lúc đang lưu, autosave tự phát hiện offline ngay.
    const timer = window.setInterval(() => void probe(), 8000)
    return () => {
      active = false
      window.clearInterval(timer)
    }
  }, [])

  const formSignature = JSON.stringify(form)
  const hasUnsavedChanges = loaded && formSignature !== savedSignature
  const updateBlock = (index: number, data: Record<string, unknown>) =>
    setForm((current) => ({
      ...current,
      blocks: current.blocks.map((block, position) =>
        position === index ? ({ ...block, data: { ...block.data, ...data } } as HomepageBlock) : block,
      ),
    }))
  const updateAppearance = (index: number, appearance: Partial<SectionAppearance>) =>
    setForm((current) => ({
      ...current,
      blocks: current.blocks.map((block, position) =>
        position === index
          ? ({ ...block, appearance: { ...block.appearance, ...appearance } } as HomepageBlock)
          : block,
      ),
    }))
  const updateItems = (index: number, items: unknown[]) => updateBlock(index, { items })

  /** Thêm ảnh vừa upload từ MediaPickerField vào danh sách media chung để mọi picker khác thấy ngay. */
  const handleMediaUploaded = (asset: MediaAsset) =>
    setImages((current) => (current.some((image) => image.id === asset.id) ? current : [asset, ...current]))

  useEffect(() => {
    if (!loaded || !hasUnsavedChanges || autosaveInFlight.current) return undefined
    const validationError = validateHomepage(form)
    try {
      window.localStorage.setItem(
        RECOVERY_KEY,
        JSON.stringify({ form, baseVersion: draftVersion, savedAt: new Date().toISOString() }),
      )
    } catch {
      /* Storage can be unavailable. */
    }
    if (validationError) {
      setAutosaveState('pending')
      return undefined
    }
    setAutosaveState('pending')
    const timer = window.setTimeout(async () => {
      autosaveInFlight.current = true
      setAutosaveState('saving')
      try {
        const signature = JSON.stringify(form)
        const result = await autosaveHomepage(form, draftVersion)
        setDraftVersion(result.item.draftVersion)
        setStatus(result.item.status)
        setSavedSignature(signature)
        setApiStatus('online')
        setAutosaveState('saved')
        try {
          window.localStorage.removeItem(RECOVERY_KEY)
        } catch {
          /* Ignore. */
        }
        setPreviewUrl((current) => (current ? `${current.split('&refresh=')[0]}&refresh=${Date.now()}` : current))
      } catch (error) {
        const code = error instanceof Error ? error.message : ''
        if (code === 'CONTENT_CONFLICT') {
          setAutosaveState('conflict')
          setMessage('Nội dung đã được thay đổi ở tab khác. Hãy tải lại trang trước khi tiếp tục để tránh ghi đè.')
        } else {
          setAutosaveState('offline')
          setApiStatus(code === 'API_UNAVAILABLE' ? 'offline' : 'online')
          setMessage(
            code === 'MEDIA_REFERENCE_NOT_FOUND'
              ? 'Một ảnh đang dùng không còn tồn tại trong thư viện.'
              : 'Chưa thể đồng bộ bản nháp. Bản phục hồi vẫn được giữ trong trình duyệt.',
          )
        }
      } finally {
        autosaveInFlight.current = false
      }
    }, 2000)
    return () => window.clearTimeout(timer)
  }, [draftVersion, form, hasUnsavedChanges, loaded])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasUnsavedChanges])

  // Live preview: gửi bản nháp đang gõ cho iframe preview qua postMessage, debounce ~300ms.
  // Đây chỉ là lớp "nhìn tức thì" — autosave + đổi refresh param vẫn là lưới an toàn (ảnh mới
  // upload cần server resolve URL nên chỉ hiện sau khi autosave xong và iframe reload).
  useEffect(() => {
    if (!showPreview || !previewUrl) return undefined
    const timer = window.setTimeout(() => {
      previewIframeRef.current?.contentWindow?.postMessage({ type: 'iorder-cms-draft', payload: form }, '*')
    }, 300)
    return () => window.clearTimeout(timer)
  }, [form, showPreview, previewUrl])

  const ensureAutosaved = async () => {
    const validationError = validateHomepage(form)
    if (validationError) {
      setMessage(validationError)
      return null
    }
    if (!hasUnsavedChanges) return draftVersion
    const signature = JSON.stringify(form)
    const result = await autosaveHomepage(form, draftVersion)
    setDraftVersion(result.item.draftVersion)
    setSavedSignature(signature)
    setAutosaveState('saved')
    try {
      window.localStorage.removeItem(RECOVERY_KEY)
    } catch {
      /* Ignore. */
    }
    return result.item.draftVersion
  }

  const save = async () => {
    setBusy(true)
    setMessage('')
    try {
      const version = await ensureAutosaved()
      if (version === null) return
      await checkpointHomepage(version, 'Mốc lưu thủ công')
      setRevisions((await listHomepageRevisions()).items)
      setMessage('Đã lưu một phiên bản để có thể khôi phục về sau.')
      toast.success('Đã lưu phiên bản trang chủ.')
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      const text =
        code === 'CONTENT_CONFLICT' ? 'Có thay đổi từ tab khác. Hãy tải lại trang.' : 'Không thể lưu phiên bản lúc này.'
      setMessage(text)
      toast.error(text)
    } finally {
      setBusy(false)
    }
  }

  useEscapeAndSave({ active: true, onSave: () => void save() })

  const publish = async () => {
    setApiStatus('checking')
    setBusy(true)
    setMessage('')
    try {
      const version = await ensureAutosaved()
      if (version === null) return
      const result = await publishHomepage(version, 'Xuất bản từ trình biên tập trang chủ')
      setApiStatus('online')
      setStatus(result.item.status)
      setDraftVersion(result.item.draftVersion)
      setRevisions((await listHomepageRevisions()).items)
      setMessage('Đã lưu và xuất bản trang chủ. Mở lại website để kiểm tra nội dung mới.')
      toast.success('Đã xuất bản trang chủ.')
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      setApiStatus(code === 'API_UNAVAILABLE' ? 'offline' : 'online')
      setMessage(
        code === 'API_UNAVAILABLE'
          ? 'Không kết nối được CMS API tại cổng 4000. Hãy chờ dịch vụ khởi động rồi thử lại.'
          : code === 'MEDIA_REFERENCE_NOT_FOUND'
            ? 'Một ảnh hoặc tài liệu đã bị xóa khỏi thư viện. Hãy chọn lại tệp trong block liên quan.'
            : `Không thể xuất bản trang chủ${code ? ` (${code})` : ''}.`,
      )
      toast.error('Không thể xuất bản trang chủ.')
    } finally {
      setBusy(false)
    }
  }

  const openPreview = async () => {
    setBusy(true)
    setMessage('')
    try {
      const version = await ensureAutosaved()
      if (version === null) return
      const preview = await createHomepagePreview()
      const url = new URL(preview.previewUrl)
      url.searchParams.set('cmsTheme', previewTheme)
      setPreviewUrl(url.toString())
    } catch {
      setMessage('Không thể tạo bản xem trước. Hãy kiểm tra kết nối CMS API.')
    } finally {
      setBusy(false)
    }
  }

  // Bật/tắt panel xem trước; mỗi lần bật đều tạo lại bản preview để phản ánh thay đổi mới nhất
  const togglePreview = () => {
    setShowPreview((current) => {
      const next = !current
      if (next) void openPreview()
      return next
    })
  }

  const restoreRevision = async (version: number) => {
    // Không cần confirm chặn màn hình: thao tác này chỉ đổi bản nháp (website công khai
    // không đổi) và bản thân nó tạo một revision mới nên luôn quay lui được.
    toast.warning(`Đang khôi phục phiên bản ${version} vào bản nháp — website công khai không thay đổi.`)
    setBusy(true)
    setMessage('')
    try {
      const result = await restoreHomepageRevision(version, draftVersion)
      const restored: HomepageInput = {
        title: result.item.title,
        seoTitle: result.item.seoTitle,
        seoDescription: result.item.seoDescription,
        canonicalUrl: result.item.canonicalUrl,
        blocks: fixedBlocks(result.item.blocks, images[0]?.id),
      }
      setForm(restored)
      setSavedSignature(JSON.stringify(restored))
      setDraftVersion(result.item.draftVersion)
      setStatus(result.item.status)
      setRevisions((await listHomepageRevisions()).items)
      setMessage(`Đã khôi phục phiên bản ${version} thành bản nháp mới.`)
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      setMessage(
        code === 'MEDIA_REFERENCE_NOT_FOUND'
          ? 'Phiên bản này tham chiếu ảnh không còn tồn tại.'
          : 'Không thể khôi phục phiên bản.',
      )
    } finally {
      setBusy(false)
    }
  }

  // Kéo thả cửa sổ xem trước bằng thanh tiêu đề (pointer capture → mượt, không cần listener toàn cục)
  const startPreviewDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (previewFullscreen || (e.target as HTMLElement).closest('button')) return
    const panel = e.currentTarget.parentElement as HTMLElement
    const rect = panel.getBoundingClientRect()
    dragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top }
    setPreviewPos({ x: rect.left, y: rect.top })
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPreviewDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    const x = Math.max(8, Math.min(window.innerWidth - 160, e.clientX - dragRef.current.dx))
    const y = Math.max(8, Math.min(window.innerHeight - 80, e.clientY - dragRef.current.dy))
    setPreviewPos({ x, y })
  }
  const endPreviewDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }
  // Kéo giãn kích thước cửa sổ preview bằng góc dưới-phải
  const startPreviewResize = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (previewFullscreen) return
    e.stopPropagation()
    const panel = e.currentTarget.parentElement as HTMLElement
    const rect = panel.getBoundingClientRect()
    resizeRef.current = { x: e.clientX, y: e.clientY, w: rect.width, h: rect.height }
    setPreviewSize({ w: rect.width, h: rect.height })
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  const onPreviewResize = (e: React.PointerEvent<HTMLSpanElement>) => {
    if (!resizeRef.current) return
    const w = Math.max(300, Math.min(window.innerWidth - 24, resizeRef.current.w + (e.clientX - resizeRef.current.x)))
    const h = Math.max(220, Math.min(window.innerHeight - 24, resizeRef.current.h + (e.clientY - resizeRef.current.y)))
    setPreviewSize({ w, h })
  }
  const endPreviewResize = (e: React.PointerEvent<HTMLSpanElement>) => {
    resizeRef.current = null
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* ignore */
    }
  }
  const defaultWidth = previewMode === 'mobile' ? 430 : previewMode === 'tablet' ? 812 : 1040
  const defaultHeight = previewMode === 'mobile' ? 760 : 640
  const floatingStyle: React.CSSProperties | undefined = previewFullscreen
    ? undefined
    : {
        ...(previewPos ? { left: previewPos.x, top: previewPos.y, right: 'auto' } : {}),
        width: previewSize?.w ?? defaultWidth,
        height: previewSize?.h ?? defaultHeight,
      }

  return (
    <section className="admin-card content-manager">
      <PageHeader
        title="Trang chủ"
        description={
          <>
            Trạng thái: {status} · Phiên bản nháp: {draftVersion} ·{' '}
            <span className={`autosave-state is-${autosaveState}`}>
              {autosaveState === 'saving'
                ? 'Đang tự lưu…'
                : autosaveState === 'pending'
                  ? 'Chờ tự lưu'
                  : autosaveState === 'saved'
                    ? 'Đã tự lưu'
                    : autosaveState === 'offline'
                      ? 'Chưa đồng bộ'
                      : autosaveState === 'conflict'
                        ? 'Xung đột dữ liệu'
                        : 'Đã tải'}
            </span>{' '}
            ·{' '}
            <span className={`api-state is-${apiStatus}`}>
              API {apiStatus === 'online' ? 'online' : apiStatus === 'offline' ? 'offline' : 'đang kiểm tra'}
            </span>
          </>
        }
      />
      {message ? (
        <p className={`publish-notice ${apiStatus === 'offline' ? 'is-error' : ''}`} role="status">
          {message}
        </p>
      ) : null}
      <details className="seo-disclosure">
        <summary>
          Tiêu đề &amp; mô tả SEO <span>{form.seoTitle ? '· đã có tiêu đề' : '· chưa đặt'}</span>
        </summary>
        <div className="post-form homepage-meta">
          <label>
            Tiêu đề SEO
            <input
              maxLength={70}
              value={form.seoTitle ?? ''}
              onChange={(e) => setForm({ ...form, seoTitle: e.target.value || null })}
            />
            <small>Hiển thị trên tab trình duyệt và công cụ tìm kiếm.</small>
          </label>
          <label>
            Mô tả SEO
            <textarea
              maxLength={180}
              value={form.seoDescription ?? ''}
              onChange={(e) => setForm({ ...form, seoDescription: e.target.value || null })}
            />
            <small>Phần mô tả dành cho Google và chia sẻ mạng xã hội.</small>
          </label>
        </div>
      </details>
      <div className="fixed-editor-layout no-preview">
        <aside
          className={`fixed-section-nav${sectionView === 'list' ? ' is-list' : ''}`}
          aria-label="Các khu vực trang chủ"
        >
          <div className="fixed-section-nav-head">
            <div className="fixed-section-nav-title">
              <strong>Cấu trúc cố định</strong>
              <button
                type="button"
                className="view-toggle-btn"
                title={sectionView === 'grid' ? 'Xem dạng danh sách' : 'Xem dạng lưới'}
                onClick={() =>
                  setSectionView((v) => {
                    const next = v === 'grid' ? 'list' : 'grid'
                    localStorage.setItem('admin.homepage.sectionView', next)
                    return next
                  })
                }
              >
                {sectionView === 'grid' ? <List size={14} /> : <LayoutGrid size={14} />}
              </button>
            </div>
            <small>Chọn khu vực để thay nội dung. Kéo để sắp xếp lại thứ tự hiển thị trên website.</small>
          </div>
          {form.blocks.map((block, index) => {
            const { className: dragCls, ...dragAttrs } = sectionDragProps(index)
            const toggleEnabled = () =>
              setForm((f) => ({
                ...f,
                blocks: f.blocks.map((b, i) => (i === index ? { ...b, isEnabled: !b.isEnabled } : b)),
              }))

            if (sectionView === 'list') {
              return (
                <div
                  key={block.type}
                  {...dragAttrs}
                  className={['section-list-row', block.type === selectedType ? 'is-active' : '', dragCls]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <GripVertical size={14} className="drag-handle-icon section-grip" />
                  <span className="section-num">{index + 1}</span>
                  <button type="button" className="section-list-name" onClick={() => setSelectedType(block.type)}>
                    <b>{labels[block.type]}</b>
                    <small>
                      <StatusDot tone={block.isEnabled ? 'on' : 'muted'} />{' '}
                      {block.isEnabled ? 'Đang hiển thị' : 'Đang ẩn'}
                    </small>
                  </button>
                  <div className="section-list-actions">
                    <button
                      type="button"
                      title="Chỉnh sửa"
                      className="section-act-btn"
                      onClick={() => setSelectedType(block.type)}
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      title={block.isEnabled ? 'Ẩn section' : 'Hiện section'}
                      className="section-act-btn"
                      onClick={toggleEnabled}
                    >
                      {block.isEnabled ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                  </div>
                </div>
              )
            }

            return (
              <button
                key={block.type}
                type="button"
                {...dragAttrs}
                className={[block.type === selectedType ? 'is-active' : '', dragCls].filter(Boolean).join(' ')}
                onClick={() => setSelectedType(block.type)}
              >
                <span>{index + 1}</span>
                <b>{labels[block.type]}</b>
                <small>{block.isEnabled ? 'Đang hiển thị' : 'Đang ẩn'}</small>
              </button>
            )
          })}
        </aside>
        {selectedType ? (
          <ModalShell
            as="div"
            size="lg"
            onOverlayClick={() => setSelectedType(null)}
            header={
              <button type="button" className="modal-back" onClick={() => setSelectedType(null)}>
                <ArrowLeft size={16} /> Trở về
              </button>
            }
            footer={
              <button
                type="button"
                className="btn-primary btn-icon"
                disabled={busy || autosaveState === 'conflict'}
                onClick={() => void save().then(() => setSelectedType(null))}
              >
                <Save size={15} /> Lưu
              </button>
            }
          >
            <div className="modal-scroll-panel">
              {form.blocks.map((block, index) =>
                block.type !== selectedType ? null : (
                  <article className="block-card" key={block.type}>
                    <div className="block-header-row">
                      <div className="block-header-row-title">
                        <strong>
                          {index + 1}. {labels[block.type]}
                        </strong>
                        <span className="fixed-structure-badge">Section cố định</span>
                      </div>
                      <ToggleSwitch
                        checked={block.isEnabled}
                        onChange={(next) =>
                          setForm({
                            ...form,
                            blocks: form.blocks.map((item, i) => (i === index ? { ...item, isEnabled: next } : item)),
                          })
                        }
                        hint="Hiển thị"
                      />
                    </div>
                    {block.type === 'home_hero' ? (
                      <p className="editor-hint">
                        🎞️ Banner dùng <strong>ảnh carousel</strong> bên dưới làm hình nền — thêm/sửa/xóa ảnh banner tại
                        mục “Ảnh carousel”. Banner không dùng ảnh nền section riêng.
                      </p>
                    ) : (
                      <fieldset className="appearance-editor">
                        <legend>Background của section</legend>
                        <div className="form-row">
                          <MediaPickerField
                            label="Ảnh nền desktop"
                            images={images}
                            value={block.appearance.backgroundMediaId ?? null}
                            onChange={(id) => updateAppearance(index, { backgroundMediaId: id })}
                            onUploaded={handleMediaUploaded}
                          />
                          <MediaPickerField
                            label="Ảnh nền mobile"
                            images={images}
                            value={block.appearance.mobileBackgroundMediaId ?? null}
                            onChange={(id) => updateAppearance(index, { mobileBackgroundMediaId: id })}
                            onUploaded={handleMediaUploaded}
                          />
                        </div>
                        <div className="form-row appearance-options">
                          <label>
                            Màu nền
                            <select
                              value={block.appearance.backgroundColor ?? ''}
                              onChange={(e) =>
                                updateAppearance(index, {
                                  backgroundColor: (e.target.value || null) as SectionAppearance['backgroundColor'],
                                })
                              }
                            >
                              <option value="">Mặc định</option>
                              {SECTION_BACKGROUND_COLORS.map((color) => (
                                <option key={color} value={color}>
                                  {backgroundColorLabels[color]}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Hiển thị ảnh
                            <select
                              value={block.appearance.backgroundFit}
                              onChange={(e) =>
                                updateAppearance(index, {
                                  backgroundFit: e.target.value as SectionAppearance['backgroundFit'],
                                })
                              }
                            >
                              <option value="cover">Phủ kín</option>
                              <option value="contain">Hiện toàn bộ</option>
                            </select>
                          </label>
                          <label>
                            Lớp phủ
                            <select
                              value={block.appearance.overlay}
                              onChange={(e) =>
                                updateAppearance(index, { overlay: e.target.value as SectionAppearance['overlay'] })
                              }
                            >
                              <option value="none">Không có</option>
                              <option value="light">Sáng</option>
                              <option value="dark-soft">Tối nhẹ</option>
                              <option value="dark-medium">Tối vừa</option>
                            </select>
                          </label>
                        </div>
                        <div className="form-row focal-controls">
                          <label>
                            Điểm lấy nét ngang: {block.appearance.focalPointX}%
                            <input
                              min={0}
                              max={100}
                              type="range"
                              value={block.appearance.focalPointX}
                              onChange={(e) => updateAppearance(index, { focalPointX: Number(e.target.value) })}
                            />
                          </label>
                          <label>
                            Điểm lấy nét dọc: {block.appearance.focalPointY}%
                            <input
                              min={0}
                              max={100}
                              type="range"
                              value={block.appearance.focalPointY}
                              onChange={(e) => updateAppearance(index, { focalPointY: Number(e.target.value) })}
                            />
                          </label>
                        </div>
                        <div className="appearance-actions">
                          <button
                            className="secondary-button"
                            type="button"
                            onClick={() => updateAppearance(index, { ...DEFAULT_SECTION_APPEARANCE })}
                          >
                            Khôi phục background mặc định
                          </button>
                          {block.appearance.backgroundMediaId && block.appearance.overlay === 'none' ? (
                            <small className="contrast-warning">Nên chọn lớp phủ nếu chữ khó đọc trên ảnh nền.</small>
                          ) : null}
                        </div>
                      </fieldset>
                    )}
                    {'eyebrow' in block.data ||
                    'heading' in block.data ||
                    'title' in block.data ||
                    'description' in block.data ||
                    'intro' in block.data ? (
                      <FieldGroup title="Nội dung">
                        {'eyebrow' in block.data ? (
                          <label>
                            <span className="field-label">Nhãn nhỏ / eyebrow</span>
                            <input
                              value={block.data.eyebrow ?? ''}
                              onChange={(e) => updateBlock(index, { eyebrow: e.target.value || null })}
                            />
                          </label>
                        ) : null}
                        {'heading' in block.data ? (
                          <label>
                            <span className="field-label">Tiêu đề</span>
                            <input
                              value={String(block.data.heading)}
                              onChange={(e) => updateBlock(index, { heading: e.target.value })}
                            />
                          </label>
                        ) : null}
                        {'title' in block.data ? (
                          <label>
                            <span className="field-label">Tiêu đề</span>
                            <input
                              value={String(block.data.title)}
                              onChange={(e) => updateBlock(index, { title: e.target.value })}
                            />
                          </label>
                        ) : null}
                        {'description' in block.data ? (
                          <label>
                            <span className="field-label">Mô tả</span>
                            <textarea
                              value={String(block.data.description)}
                              onChange={(e) => updateBlock(index, { description: e.target.value })}
                            />
                          </label>
                        ) : null}
                        {'intro' in block.data ? (
                          <label>
                            <span className="field-label">Đoạn giới thiệu</span>
                            <textarea
                              value={String(block.data.intro ?? '')}
                              onChange={(e) => updateBlock(index, { intro: e.target.value || null })}
                            />
                          </label>
                        ) : null}
                      </FieldGroup>
                    ) : null}

                    {/* home_hero */}
                    {block.type === 'home_hero' ? (
                      <>
                        <FieldGroup title="Nút kêu gọi">
                          <div className="block-fieldset-2col">
                            <div className="block-fieldset-pair">
                              <label>
                                <span className="field-label">Nút chính</span>
                                <input
                                  value={block.data.primaryLabel}
                                  onChange={(e) => updateBlock(index, { primaryLabel: e.target.value })}
                                />
                              </label>
                              <label>
                                <span className="field-label">Liên kết</span>
                                <input
                                  value={block.data.primaryUrl}
                                  onChange={(e) => updateBlock(index, { primaryUrl: e.target.value })}
                                />
                              </label>
                            </div>
                            <div className="block-fieldset-pair">
                              <label>
                                <span className="field-label">Nút phụ</span>
                                <input
                                  value={block.data.secondaryLabel ?? ''}
                                  onChange={(e) => updateBlock(index, { secondaryLabel: e.target.value || null })}
                                />
                              </label>
                              <label>
                                <span className="field-label">Liên kết nút phụ</span>
                                <input
                                  value={block.data.secondaryUrl ?? ''}
                                  onChange={(e) => updateBlock(index, { secondaryUrl: e.target.value || null })}
                                />
                              </label>
                            </div>
                          </div>
                        </FieldGroup>
                        <FieldGroup title="Điểm nổi bật">
                          {block.data.points.map((point, itemIndex) => (
                            <ListItemRow
                              key={itemIndex}
                              onRemove={() =>
                                updateBlock(index, { points: block.data.points.filter((_, i) => i !== itemIndex) })
                              }
                            >
                              <input
                                value={point}
                                onChange={(e) =>
                                  updateBlock(index, {
                                    points: block.data.points.map((item, i) =>
                                      i === itemIndex ? e.target.value : item,
                                    ),
                                  })
                                }
                              />
                            </ListItemRow>
                          ))}
                          <button
                            type="button"
                            className="secondary-button list-add-button"
                            onClick={() => updateBlock(index, { points: [...block.data.points, 'Điểm nổi bật mới'] })}
                          >
                            + Thêm điểm
                          </button>
                        </FieldGroup>
                        <FieldGroup
                          title="Ảnh carousel"
                          hint="Ảnh nền dùng cho banner — không dùng ảnh nền section riêng."
                        >
                          {block.data.slides.map((slide, itemIndex) => (
                            <ListItemRow
                              key={`${slide.imageMediaId}-${itemIndex}`}
                              onRemove={() =>
                                updateBlock(index, { slides: block.data.slides.filter((_, i) => i !== itemIndex) })
                              }
                            >
                              <input
                                aria-label="Tiêu đề slide"
                                value={slide.title}
                                onChange={(e) =>
                                  updateBlock(index, {
                                    slides: block.data.slides.map((item, i) =>
                                      i === itemIndex ? { ...item, title: e.target.value } : item,
                                    ),
                                  })
                                }
                              />
                              <input
                                aria-label="Mô tả slide"
                                value={slide.description}
                                onChange={(e) =>
                                  updateBlock(index, {
                                    slides: block.data.slides.map((item, i) =>
                                      i === itemIndex ? { ...item, description: e.target.value } : item,
                                    ),
                                  })
                                }
                              />
                              <MediaPickerField
                                label="Ảnh slide"
                                images={images}
                                value={slide.imageMediaId || null}
                                onChange={(id) =>
                                  updateBlock(index, {
                                    slides: block.data.slides.map((item, i) =>
                                      i === itemIndex ? { ...item, imageMediaId: id ?? '' } : item,
                                    ),
                                  })
                                }
                                onUploaded={handleMediaUploaded}
                              />
                            </ListItemRow>
                          ))}
                          <button
                            type="button"
                            className="secondary-button list-add-button"
                            disabled={images.length === 0}
                            onClick={() =>
                              updateBlock(index, {
                                slides: [
                                  ...block.data.slides,
                                  {
                                    title: 'Slide mới',
                                    description: 'Mô tả slide',
                                    imageMediaId: images[0]?.id ?? '',
                                  },
                                ],
                              })
                            }
                          >
                            + Thêm slide
                          </button>
                        </FieldGroup>
                      </>
                    ) : null}

                    {/* home_stats */}
                    {block.type === 'home_stats' ? (
                      <>
                        <FieldGroup title="Số liệu thống kê">
                          {block.data.stats.map((stat, itemIndex) => (
                            <ListItemRow
                              key={itemIndex}
                              onRemove={() =>
                                updateBlock(index, { stats: block.data.stats.filter((_, i) => i !== itemIndex) })
                              }
                            >
                              <input
                                placeholder="Giá trị (vd: 500+)"
                                value={stat.value}
                                onChange={(e) =>
                                  updateBlock(index, {
                                    stats: block.data.stats.map((item, i) =>
                                      i === itemIndex ? { ...item, value: e.target.value } : item,
                                    ),
                                  })
                                }
                              />
                              <input
                                placeholder="Nhãn"
                                value={stat.label}
                                onChange={(e) =>
                                  updateBlock(index, {
                                    stats: block.data.stats.map((item, i) =>
                                      i === itemIndex ? { ...item, label: e.target.value } : item,
                                    ),
                                  })
                                }
                              />
                              <input
                                placeholder="Ghi chú (không bắt buộc)"
                                value={stat.note ?? ''}
                                onChange={(e) =>
                                  updateBlock(index, {
                                    stats: block.data.stats.map((item, i) =>
                                      i === itemIndex ? { ...item, note: e.target.value || null } : item,
                                    ),
                                  })
                                }
                              />
                            </ListItemRow>
                          ))}
                          <button
                            type="button"
                            className="secondary-button list-add-button"
                            onClick={() =>
                              updateBlock(index, {
                                stats: [...block.data.stats, { value: '100+', label: 'Nhãn mới', note: null }],
                              })
                            }
                          >
                            + Thêm số liệu
                          </button>
                        </FieldGroup>
                        <FieldGroup
                          title="Đối tác"
                          hint={
                            <>
                              Logo đối tác quản lý tại mục <strong>“Đối tác &amp; Khách hàng”</strong> —{' '}
                              <Link to={`/${slugByKey.partners ?? 'doi-tac'}`}>đi tới trang đó</Link>.
                            </>
                          }
                        >
                          <label>
                            <span className="field-label">Nhãn phần đối tác</span>
                            <input
                              value={block.data.partnersHeading ?? ''}
                              onChange={(e) => updateBlock(index, { partnersHeading: e.target.value || null })}
                            />
                          </label>
                          <label>
                            <span className="field-label">Số lượng logo hiển thị</span>
                            <input
                              type="number"
                              min={1}
                              max={40}
                              value={block.data.partnersLimit}
                              onChange={(e) =>
                                updateBlock(index, {
                                  partnersLimit: Math.min(40, Math.max(1, Number(e.target.value) || 1)),
                                })
                              }
                            />
                          </label>
                        </FieldGroup>
                      </>
                    ) : null}

                    {/* home_features */}
                    {block.type === 'home_features' ? (
                      <FieldGroup title="Các tính năng">
                        {block.data.items.map((item, itemIndex) => (
                          <ListItemRow
                            key={itemIndex}
                            onRemove={() =>
                              updateItems(
                                index,
                                block.data.items.filter((_, i) => i !== itemIndex),
                              )
                            }
                          >
                            <input
                              value={item.title}
                              onChange={(e) =>
                                updateItems(
                                  index,
                                  block.data.items.map((value, i) =>
                                    i === itemIndex ? { ...value, title: e.target.value } : value,
                                  ),
                                )
                              }
                            />
                            <input
                              value={item.description}
                              onChange={(e) =>
                                updateItems(
                                  index,
                                  block.data.items.map((value, i) =>
                                    i === itemIndex ? { ...value, description: e.target.value } : value,
                                  ),
                                )
                              }
                            />
                            <input
                              placeholder="Link (không bắt buộc)"
                              value={item.href ?? ''}
                              onChange={(e) =>
                                updateItems(
                                  index,
                                  block.data.items.map((value, i) =>
                                    i === itemIndex ? { ...value, href: e.target.value || null } : value,
                                  ),
                                )
                              }
                            />
                            <MediaPickerField
                              label="Ảnh (bỏ trống dùng icon mặc định)"
                              images={images}
                              value={item.mediaId ?? null}
                              onChange={(id) =>
                                updateItems(
                                  index,
                                  block.data.items.map((value, i) =>
                                    i === itemIndex ? { ...value, mediaId: id } : value,
                                  ),
                                )
                              }
                              onUploaded={handleMediaUploaded}
                            />
                          </ListItemRow>
                        ))}
                        <button
                          type="button"
                          className="secondary-button list-add-button"
                          onClick={() =>
                            updateItems(index, [
                              ...block.data.items,
                              { title: 'Mục mới', description: 'Mô tả', href: null, mediaId: null },
                            ])
                          }
                        >
                          + Thêm mục
                        </button>
                      </FieldGroup>
                    ) : null}

                    {/* home_industries */}
                    {block.type === 'home_industries' ? (
                      <FieldGroup title="Nhóm ngành hàng">
                        {block.data.groups.map((group, groupIndex) => (
                          <div className="nested-group" key={groupIndex}>
                            <ListItemRow
                              disabled={block.data.groups.length === 1}
                              onRemove={() =>
                                updateBlock(index, { groups: block.data.groups.filter((_, i) => i !== groupIndex) })
                              }
                            >
                              <input
                                value={group.title}
                                onChange={(e) =>
                                  updateBlock(index, {
                                    groups: block.data.groups.map((item, i) =>
                                      i === groupIndex ? { ...item, title: e.target.value } : item,
                                    ),
                                  })
                                }
                              />
                              <select
                                value={group.iconKey}
                                onChange={(e) =>
                                  updateBlock(index, {
                                    groups: block.data.groups.map((item, i) =>
                                      i === groupIndex ? { ...item, iconKey: e.target.value } : item,
                                    ),
                                  })
                                }
                              >
                                <option value="store">Cửa hàng</option>
                                <option value="utensils">Ăn uống</option>
                                <option value="shield">Dịch vụ</option>
                                <option value="smartphone">Di động</option>
                                <option value="server">Hạ tầng</option>
                                <option value="headphones">Hỗ trợ</option>
                              </select>
                            </ListItemRow>
                            {group.items.map((item, itemIndex) => (
                              <ListItemRow
                                key={itemIndex}
                                disabled={group.items.length === 1}
                                onRemove={() =>
                                  updateBlock(index, {
                                    groups: block.data.groups.map((value, i) =>
                                      i === groupIndex
                                        ? { ...value, items: value.items.filter((_, j) => j !== itemIndex) }
                                        : value,
                                    ),
                                  })
                                }
                              >
                                <input
                                  value={item.title}
                                  onChange={(e) =>
                                    updateBlock(index, {
                                      groups: block.data.groups.map((value, i) =>
                                        i === groupIndex
                                          ? {
                                              ...value,
                                              items: value.items.map((entry, j) =>
                                                j === itemIndex ? { ...entry, title: e.target.value } : entry,
                                              ),
                                            }
                                          : value,
                                      ),
                                    })
                                  }
                                />
                                <input
                                  value={item.description}
                                  onChange={(e) =>
                                    updateBlock(index, {
                                      groups: block.data.groups.map((value, i) =>
                                        i === groupIndex
                                          ? {
                                              ...value,
                                              items: value.items.map((entry, j) =>
                                                j === itemIndex ? { ...entry, description: e.target.value } : entry,
                                              ),
                                            }
                                          : value,
                                      ),
                                    })
                                  }
                                />
                                <input
                                  value={item.href}
                                  onChange={(e) =>
                                    updateBlock(index, {
                                      groups: block.data.groups.map((value, i) =>
                                        i === groupIndex
                                          ? {
                                              ...value,
                                              items: value.items.map((entry, j) =>
                                                j === itemIndex ? { ...entry, href: e.target.value } : entry,
                                              ),
                                            }
                                          : value,
                                      ),
                                    })
                                  }
                                />
                              </ListItemRow>
                            ))}
                            <button
                              className="secondary-button list-add-button"
                              type="button"
                              onClick={() =>
                                updateBlock(index, {
                                  groups: block.data.groups.map((value, i) =>
                                    i === groupIndex
                                      ? {
                                          ...value,
                                          items: [
                                            ...value.items,
                                            { title: 'Ngành mới', description: 'Mô tả ngành', href: '/nganh-hang' },
                                          ],
                                        }
                                      : value,
                                  ),
                                })
                              }
                            >
                              + Thêm ngành
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="secondary-button list-add-button"
                          onClick={() =>
                            updateBlock(index, {
                              groups: [
                                ...block.data.groups,
                                {
                                  title: 'Nhóm ngành mới',
                                  iconKey: 'store',
                                  items: [{ title: 'Ngành mới', description: 'Mô tả ngành', href: '/nganh-hang' }],
                                },
                              ],
                            })
                          }
                        >
                          + Thêm nhóm
                        </button>
                      </FieldGroup>
                    ) : null}

                    {/* home_ecosystem_services */}
                    {block.type === 'home_ecosystem_services' ? (
                      <FieldGroup title="Nhóm dịch vụ">
                        {block.data.groups.map((group, groupIndex) => (
                          <div className="nested-group" key={groupIndex}>
                            <ListItemRow
                              disabled={block.data.groups.length === 1}
                              onRemove={() =>
                                updateBlock(index, { groups: block.data.groups.filter((_, i) => i !== groupIndex) })
                              }
                            >
                              <input
                                placeholder="Nhãn"
                                value={group.label}
                                onChange={(e) =>
                                  updateBlock(index, {
                                    groups: block.data.groups.map((item, i) =>
                                      i === groupIndex ? { ...item, label: e.target.value } : item,
                                    ),
                                  })
                                }
                              />
                              <input
                                placeholder="Tiêu đề"
                                value={group.title}
                                onChange={(e) =>
                                  updateBlock(index, {
                                    groups: block.data.groups.map((item, i) =>
                                      i === groupIndex ? { ...item, title: e.target.value } : item,
                                    ),
                                  })
                                }
                              />
                              <input
                                placeholder="Link"
                                value={group.href}
                                onChange={(e) =>
                                  updateBlock(index, {
                                    groups: block.data.groups.map((item, i) =>
                                      i === groupIndex ? { ...item, href: e.target.value } : item,
                                    ),
                                  })
                                }
                              />
                            </ListItemRow>
                            <textarea
                              value={group.description}
                              onChange={(e) =>
                                updateBlock(index, {
                                  groups: block.data.groups.map((item, i) =>
                                    i === groupIndex ? { ...item, description: e.target.value } : item,
                                  ),
                                })
                              }
                            />
                            {group.items.map((item, itemIndex) => (
                              <ListItemRow
                                key={itemIndex}
                                onRemove={() =>
                                  updateBlock(index, {
                                    groups: block.data.groups.map((value, i) =>
                                      i === groupIndex
                                        ? { ...value, items: value.items.filter((_, j) => j !== itemIndex) }
                                        : value,
                                    ),
                                  })
                                }
                              >
                                <input
                                  value={item.title}
                                  onChange={(e) =>
                                    updateBlock(index, {
                                      groups: block.data.groups.map((value, i) =>
                                        i === groupIndex
                                          ? {
                                              ...value,
                                              items: value.items.map((entry, j) =>
                                                j === itemIndex ? { ...entry, title: e.target.value } : entry,
                                              ),
                                            }
                                          : value,
                                      ),
                                    })
                                  }
                                />
                                <input
                                  value={item.href}
                                  onChange={(e) =>
                                    updateBlock(index, {
                                      groups: block.data.groups.map((value, i) =>
                                        i === groupIndex
                                          ? {
                                              ...value,
                                              items: value.items.map((entry, j) =>
                                                j === itemIndex ? { ...entry, href: e.target.value } : entry,
                                              ),
                                            }
                                          : value,
                                      ),
                                    })
                                  }
                                />
                              </ListItemRow>
                            ))}
                            <button
                              className="secondary-button list-add-button"
                              type="button"
                              onClick={() =>
                                updateBlock(index, {
                                  groups: block.data.groups.map((value, i) =>
                                    i === groupIndex
                                      ? { ...value, items: [...value.items, { title: 'Liên kết mới', href: '/' }] }
                                      : value,
                                  ),
                                })
                              }
                            >
                              + Thêm liên kết
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="secondary-button list-add-button"
                          onClick={() =>
                            updateBlock(index, {
                              groups: [
                                ...block.data.groups,
                                {
                                  iconKey: 'check',
                                  label: 'Nhóm',
                                  title: 'Nội dung mới',
                                  description: 'Mô tả nội dung',
                                  href: '/',
                                  items: [],
                                },
                              ],
                            })
                          }
                        >
                          + Thêm nhóm
                        </button>
                      </FieldGroup>
                    ) : null}

                    {/* home_process */}
                    {block.type === 'home_process' ? (
                      <>
                        <FieldGroup title="Nút kêu gọi &amp; ảnh nổi bật">
                          <div className="block-fieldset-2col">
                            <div className="block-fieldset-pair">
                              <label>
                                <span className="field-label">Nhãn nút</span>
                                <input
                                  value={block.data.buttonLabel}
                                  onChange={(e) => updateBlock(index, { buttonLabel: e.target.value })}
                                />
                              </label>
                              <label>
                                <span className="field-label">Liên kết nút</span>
                                <input
                                  value={block.data.buttonUrl}
                                  onChange={(e) => updateBlock(index, { buttonUrl: e.target.value })}
                                />
                              </label>
                            </div>
                            <MediaPickerField
                              label="Ảnh nổi bật"
                              images={images}
                              value={block.data.featureMediaId || null}
                              onChange={(id) => updateBlock(index, { featureMediaId: id ?? '' })}
                              onUploaded={handleMediaUploaded}
                            />
                          </div>
                        </FieldGroup>
                        <FieldGroup title="Các bước triển khai">
                          {block.data.steps.map((step, itemIndex) => (
                            <ListItemRow
                              key={itemIndex}
                              disabled={block.data.steps.length === 1}
                              onRemove={() =>
                                updateBlock(index, { steps: block.data.steps.filter((_, i) => i !== itemIndex) })
                              }
                            >
                              <input
                                value={step.title}
                                onChange={(e) =>
                                  updateBlock(index, {
                                    steps: block.data.steps.map((item, i) =>
                                      i === itemIndex ? { ...item, title: e.target.value } : item,
                                    ),
                                  })
                                }
                              />
                              <input
                                value={step.description}
                                onChange={(e) =>
                                  updateBlock(index, {
                                    steps: block.data.steps.map((item, i) =>
                                      i === itemIndex ? { ...item, description: e.target.value } : item,
                                    ),
                                  })
                                }
                              />
                            </ListItemRow>
                          ))}
                          <button
                            type="button"
                            className="secondary-button list-add-button"
                            onClick={() =>
                              updateBlock(index, {
                                steps: [...block.data.steps, { title: 'Bước mới', description: 'Mô tả bước' }],
                              })
                            }
                          >
                            + Thêm bước
                          </button>
                        </FieldGroup>
                        <FieldGroup title="Mô hình triển khai">
                          {block.data.models.map((model, itemIndex) => (
                            <ListItemRow
                              key={itemIndex}
                              onRemove={() =>
                                updateBlock(index, { models: block.data.models.filter((_, i) => i !== itemIndex) })
                              }
                            >
                              <input
                                value={model.title}
                                onChange={(e) =>
                                  updateBlock(index, {
                                    models: block.data.models.map((item, i) =>
                                      i === itemIndex ? { ...item, title: e.target.value } : item,
                                    ),
                                  })
                                }
                              />
                              <input
                                value={model.description}
                                onChange={(e) =>
                                  updateBlock(index, {
                                    models: block.data.models.map((item, i) =>
                                      i === itemIndex ? { ...item, description: e.target.value } : item,
                                    ),
                                  })
                                }
                              />
                              <MediaPickerField
                                label="Ảnh mô hình"
                                images={images}
                                value={model.mediaId || null}
                                onChange={(id) =>
                                  updateBlock(index, {
                                    models: block.data.models.map((item, i) =>
                                      i === itemIndex ? { ...item, mediaId: id ?? '' } : item,
                                    ),
                                  })
                                }
                                onUploaded={handleMediaUploaded}
                              />
                            </ListItemRow>
                          ))}
                          <button
                            type="button"
                            className="secondary-button list-add-button"
                            disabled={images.length === 0}
                            onClick={() =>
                              updateBlock(index, {
                                models: [
                                  ...block.data.models,
                                  {
                                    title: 'Mô hình mới',
                                    description: 'Mô tả mô hình',
                                    mediaId: images[0]?.id ?? '',
                                  },
                                ],
                              })
                            }
                          >
                            + Thêm mô hình
                          </button>
                        </FieldGroup>
                      </>
                    ) : null}

                    {/* home_testimonials */}
                    {block.type === 'home_testimonials' ? (
                      <FieldGroup
                        title="Hiển thị đánh giá"
                        hint={
                          <>
                            Nội dung đánh giá quản lý tại mục <strong>“Đánh giá khách hàng”</strong> —{' '}
                            <Link to={`/${slugByKey.testimonials ?? 'danh-gia'}`}>đi tới trang đó</Link>.
                          </>
                        }
                      >
                        <label>
                          <span className="field-label">Số lượng đánh giá hiển thị</span>
                          <input
                            type="number"
                            min={1}
                            max={12}
                            value={block.data.limit}
                            onChange={(e) =>
                              updateBlock(index, { limit: Math.min(12, Math.max(1, Number(e.target.value) || 1)) })
                            }
                          />
                        </label>
                      </FieldGroup>
                    ) : null}

                    {/* home_featured_posts */}
                    {block.type === 'home_featured_posts' ? (
                      <FieldGroup title="Cấu hình bài viết">
                        <div className="block-fieldset-2col">
                          <label>
                            <span className="field-label">Loại bài</span>
                            <select
                              value={block.data.postType}
                              onChange={(e) => updateBlock(index, { postType: e.target.value })}
                            >
                              <option value="all">Tất cả</option>
                              <option value="news">Tin tức</option>
                              <option value="promotion">Khuyến mãi</option>
                            </select>
                          </label>
                          <label>
                            <span className="field-label">Số bài</span>
                            <input
                              min={1}
                              max={12}
                              type="number"
                              value={block.data.limit}
                              onChange={(e) => updateBlock(index, { limit: Number(e.target.value) })}
                            />
                          </label>
                          <label>
                            <span className="field-label">Nhãn xem tất cả</span>
                            <input
                              value={block.data.allLabel}
                              onChange={(e) => updateBlock(index, { allLabel: e.target.value })}
                            />
                          </label>
                          <label>
                            <span className="field-label">Link xem tất cả</span>
                            <input
                              value={block.data.allUrl}
                              onChange={(e) => updateBlock(index, { allUrl: e.target.value })}
                            />
                          </label>
                        </div>
                      </FieldGroup>
                    ) : null}

                    {/* home_faq */}
                    {block.type === 'home_faq' ? (
                      <FieldGroup title="Câu hỏi thường gặp">
                        {block.data.items.map((item, itemIndex) => (
                          <ListItemRow
                            key={itemIndex}
                            disabled={block.data.items.length === 1}
                            onRemove={() =>
                              updateItems(
                                index,
                                block.data.items.filter((_, i) => i !== itemIndex),
                              )
                            }
                          >
                            <input
                              placeholder="Câu hỏi"
                              value={item.question}
                              onChange={(e) =>
                                updateItems(
                                  index,
                                  block.data.items.map((value, i) =>
                                    i === itemIndex ? { ...value, question: e.target.value } : value,
                                  ),
                                )
                              }
                            />
                            <textarea
                              placeholder="Câu trả lời"
                              value={item.answer}
                              onChange={(e) =>
                                updateItems(
                                  index,
                                  block.data.items.map((value, i) =>
                                    i === itemIndex ? { ...value, answer: e.target.value } : value,
                                  ),
                                )
                              }
                            />
                          </ListItemRow>
                        ))}
                        <button
                          type="button"
                          className="secondary-button list-add-button"
                          onClick={() =>
                            updateItems(index, [
                              ...block.data.items,
                              { question: 'Câu hỏi mới?', answer: 'Câu trả lời' },
                            ])
                          }
                        >
                          + Thêm câu hỏi
                        </button>
                      </FieldGroup>
                    ) : null}

                    {/* home_cta */}
                    {block.type === 'home_cta' ? (
                      <FieldGroup title="Nút kêu gọi">
                        <div className="block-fieldset-2col">
                          <label>
                            <span className="field-label">Nhãn nút</span>
                            <input
                              value={block.data.buttonLabel}
                              onChange={(e) => updateBlock(index, { buttonLabel: e.target.value })}
                            />
                          </label>
                          <label>
                            <span className="field-label">Liên kết</span>
                            <input
                              value={block.data.buttonUrl}
                              onChange={(e) => updateBlock(index, { buttonUrl: e.target.value })}
                            />
                          </label>
                        </div>
                      </FieldGroup>
                    ) : null}
                  </article>
                ),
              )}
            </div>
          </ModalShell>
        ) : null}
        {showPreview ? (
          <aside
            className={`homepage-preview-panel ${previewFullscreen ? 'is-fullscreen' : 'is-floating'}`}
            style={floatingStyle}
          >
            <div
              className="preview-toolbar"
              onPointerDown={startPreviewDrag}
              onPointerMove={onPreviewDrag}
              onPointerUp={endPreviewDrag}
            >
              <strong>⠿ Live preview</strong>
              <div className="preview-toolbar-group">
                <button
                  className={previewMode === 'desktop' ? 'is-active' : ''}
                  type="button"
                  onClick={() => setPreviewMode('desktop')}
                >
                  Desktop
                </button>
                <button
                  className={previewMode === 'tablet' ? 'is-active' : ''}
                  type="button"
                  onClick={() => setPreviewMode('tablet')}
                >
                  Tablet
                </button>
                <button
                  className={previewMode === 'mobile' ? 'is-active' : ''}
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                >
                  Mobile
                </button>
              </div>
              <div className="preview-toolbar-group">
                <button
                  className={previewTheme === 'light' ? 'is-active' : ''}
                  type="button"
                  onClick={() => setPreviewTheme('light')}
                >
                  Sáng
                </button>
                <button
                  className={previewTheme === 'dark' ? 'is-active' : ''}
                  type="button"
                  onClick={() => setPreviewTheme('dark')}
                >
                  Tối
                </button>
              </div>
              <button
                className="preview-win-btn"
                type="button"
                aria-label="Làm mới bản xem trước"
                title="Làm mới theo nội dung mới nhất"
                disabled={busy}
                onClick={() => void openPreview()}
              >
                <RefreshCw size={15} />
              </button>
              <button
                className="preview-win-btn"
                type="button"
                aria-label={previewFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
                onClick={() => setPreviewFullscreen((v) => !v)}
              >
                {previewFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              </button>
              <button
                className="preview-win-btn is-close"
                type="button"
                aria-label="Đóng xem trước"
                onClick={() => {
                  setPreviewFullscreen(false)
                  setShowPreview(false)
                }}
              >
                ✕
              </button>
            </div>
            {previewUrl ? (
              <div className={`preview-frame-wrap is-${previewMode}`}>
                <iframe
                  ref={previewIframeRef}
                  key={`${previewUrl}-${previewTheme}`}
                  src={`${previewUrl.split('&cmsTheme=')[0]}&cmsTheme=${previewTheme}`}
                  title="Xem trước bản nháp trang chủ"
                />
              </div>
            ) : (
              <div className="preview-placeholder">
                <p>Bản xem trước chỉ đọc nội dung đã autosave và không ảnh hưởng website công khai.</p>
                <button className="primary-cta" type="button" onClick={() => void openPreview()}>
                  Tạo bản xem trước
                </button>
              </div>
            )}
            {!previewFullscreen ? (
              <span
                className="preview-resize"
                onPointerDown={startPreviewResize}
                onPointerMove={onPreviewResize}
                onPointerUp={endPreviewResize}
                aria-hidden="true"
              />
            ) : null}
          </aside>
        ) : null}
      </div>
      {showRevisions ? (
        <aside className="revision-drawer" aria-label="Lịch sử phiên bản">
          <div className="revision-drawer-head">
            <div>
              <strong>Lịch sử phiên bản</strong>
              <small>Khôi phục luôn tạo bản nháp mới.</small>
            </div>
            <button type="button" onClick={() => setShowRevisions(false)}>
              Đóng
            </button>
          </div>
          {revisions.length === 0 ? (
            <p>Chưa có phiên bản nào.</p>
          ) : (
            <ol>
              {revisions.map((revision) => (
                <li key={revision.id}>
                  <div>
                    <strong>Phiên bản {revision.versionNumber}</strong>
                    <span>
                      {revision.isPublished ? 'Đã xuất bản' : 'Bản lưu'} ·{' '}
                      {new Date(revision.createdAt).toLocaleString('vi-VN')}
                    </span>
                    <small>
                      {revision.changeNote ?? 'Không có ghi chú'}
                      {revision.editorName ? ` · ${revision.editorName}` : ''}
                    </small>
                  </div>
                  <button disabled={busy} type="button" onClick={() => void restoreRevision(revision.versionNumber)}>
                    Khôi phục
                  </button>
                </li>
              ))}
            </ol>
          )}
        </aside>
      ) : null}

      <EditorFooter>
        <button
          className={`secondary-button ${showPreview ? 'is-active' : ''}`}
          disabled={busy || autosaveState === 'conflict'}
          type="button"
          onClick={togglePreview}
        >
          <Eye size={16} /> {showPreview ? 'Ẩn xem trước' : 'Xem trước'}
        </button>
        <button className="secondary-button" type="button" onClick={() => setShowRevisions((current) => !current)}>
          <History size={16} /> Lịch sử ({revisions.length})
        </button>
        <button
          className="secondary-button"
          disabled={busy || autosaveState === 'conflict'}
          type="button"
          onClick={() => void save()}
        >
          <Save size={16} /> Lưu phiên bản
        </button>
        <button
          className="publish-button"
          disabled={busy || form.blocks.length === 0 || autosaveState === 'conflict'}
          type="button"
          onClick={() => void publish()}
        >
          <UploadCloud size={16} /> {busy ? 'Đang xử lý...' : 'Xuất bản'}
        </button>
      </EditorFooter>
    </section>
  )
}
