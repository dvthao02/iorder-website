import { homepageInputSchema, type HomepageBlock, type HomepageInput, type MediaAsset } from '@iorder/contracts'
import { useEffect, useState } from 'react'

import { checkApiHealth, getHomepage, listMedia, publishHomepage, saveHomepage } from './api'

const PUBLIC_SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL ?? 'http://127.0.0.1:5173/'

const defaultInput: HomepageInput = {
  title: 'Trang chủ', seoTitle: null, seoDescription: null, canonicalUrl: null, blocks: [],
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
  title: 'Tiêu đề', description: 'Mô tả', heading: 'Tiêu đề nhóm', body: 'Nội dung', items: 'Danh sách mục',
  href: 'Liên kết', websiteUrl: 'Website', buttonLabel: 'Nhãn nút', buttonUrl: 'Liên kết nút', primaryLabel: 'Nhãn nút chính',
  primaryUrl: 'Liên kết nút chính', imageMediaId: 'Ảnh', mediaId: 'Tệp', limit: 'Số bài', seoTitle: 'Tiêu đề SEO', seoDescription: 'Mô tả SEO', canonicalUrl: 'Canonical URL',
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
  const itemIndex = itemIndexPosition > 0 && Number.isInteger(Number(path[itemIndexPosition])) ? Number(path[itemIndexPosition]) + 1 : null
  const field = path.at(-1) ?? 'data'
  const location = block ? `${labels[block.type]} #${blockIndex! + 1}${itemIndex ? `, mục #${itemIndex}` : ''}` : 'Thông tin trang chủ'
  const fieldName = fieldLabels[field] ?? field

  let reason = 'không hợp lệ'
  if (issue.code === 'too_small') reason = field === 'items' ? 'phải có ít nhất một mục' : 'không được để trống'
  if (issue.code === 'too_big') reason = 'vượt quá độ dài hoặc số lượng cho phép'
  if (issue.message.toLowerCase().includes('url')) reason = 'phải là đường dẫn bắt đầu bằng / hoặc URL đầy đủ'
  if (field === 'imageMediaId' || field === 'mediaId' || field === 'avatarMediaId') reason = 'chưa chọn ảnh hoặc tệp hợp lệ'

  return `${location}: ${fieldName} ${reason}.`
}

function newBlock(type: HomepageBlock['type'], mediaId = ''): HomepageBlock {
  if (type === 'home_hero') return { type, isEnabled: true, data: { eyebrow: null, title: 'Giải pháp cho doanh nghiệp', description: 'Nhập mô tả banner', imageMediaId: null, primaryLabel: 'Liên hệ', primaryUrl: '/lien-he', secondaryLabel: null, secondaryUrl: null, points: [], slides: [] } }
  if (type === 'home_stats') return { type, isEnabled: true, data: { stats: [{ value: '500+', label: 'Khách hàng tin dùng', note: null }], partnersHeading: 'Khách hàng & đối tác', partners: [] } }
  if (type === 'home_features') return { type, isEnabled: true, data: { eyebrow: 'NỀN TẢNG', heading: 'Một nền tảng cho toàn bộ vận hành cửa hàng', intro: null, items: [{ title: 'Tính năng mới', description: 'Mô tả tính năng', href: null }] } }
  if (type === 'home_industries') return { type, isEnabled: true, data: { eyebrow: 'THEO NGÀNH HÀNG', heading: 'Phù hợp nhiều mô hình kinh doanh', intro: null, groups: [{ title: 'Nhóm ngành', iconKey: 'store', items: [{ title: 'Ngành mới', description: 'Mô tả ngành', href: '/nganh-hang' }] }] } }
  if (type === 'home_ecosystem_services') return { type, isEnabled: true, data: { eyebrow: 'TRIỂN KHAI TRỌN GÓI', heading: 'Không chỉ phần mềm — triển khai trọn gói', intro: null, groups: [{ iconKey: 'check', label: 'Nhóm', title: 'Nội dung mới', description: 'Mô tả nội dung', href: '/', items: [] }] } }
  if (type === 'home_process') return { type, isEnabled: true, data: { eyebrow: 'QUY TRÌNH', heading: 'Quy trình triển khai rõ ràng', intro: 'Mô tả quy trình triển khai', buttonLabel: 'Liên hệ', buttonUrl: '/lien-he', featureMediaId: mediaId, steps: [{ title: 'Bước triển khai', description: 'Mô tả bước triển khai' }], models: [] } }
  if (type === 'home_testimonials') return { type, isEnabled: true, data: { eyebrow: 'KHÁCH HÀNG NÓI GÌ', heading: 'Khách hàng tin tưởng iOrder', items: [] } }
  if (type === 'home_featured_posts') return { type, isEnabled: true, data: { eyebrow: 'TIN TỨC IORDER', heading: 'Bài viết nổi bật', intro: null, postType: 'all', limit: 3, allLabel: 'Xem tất cả bài viết', allUrl: '/tin-tuc' } }
  if (type === 'home_faq') return { type, isEnabled: true, data: { eyebrow: 'CÂU HỎI THƯỜNG GẶP', heading: 'Giải đáp thắc mắc', items: [{ question: 'Câu hỏi 1?', answer: 'Câu trả lời 1.' }] } }
  return { type: 'home_cta', isEnabled: true, data: { title: 'Bạn cần tư vấn?', description: 'Liên hệ với iOrder để được hỗ trợ.', buttonLabel: 'Liên hệ', buttonUrl: '/lien-he' } }
}

export function HomepageEditor({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState<HomepageInput>(defaultInput)
  const [status, setStatus] = useState('draft')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking')
  const [loaded, setLoaded] = useState(false)
  const [savedSignature, setSavedSignature] = useState('')
  const [images, setImages] = useState<MediaAsset[]>([])

  useEffect(() => {
    Promise.all([getHomepage(), listMedia('image')]).then(([{ item }, imageResult]) => {
      if (item) {
        const loadedForm = { title: item.title, seoTitle: item.seoTitle, seoDescription: item.seoDescription, canonicalUrl: item.canonicalUrl, blocks: item.blocks }
        setForm(loadedForm)
        setSavedSignature(JSON.stringify(loadedForm))
        setStatus(item.status)
      } else {
        setSavedSignature(JSON.stringify(defaultInput))
      }
      setImages(imageResult.items)
      setLoaded(true)
    }).catch(() => { setMessage('Không thể tải nội dung trang chủ.'); setLoaded(true) })
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
          setMessage((current) => current.startsWith('Không kết nối được CMS API') ? 'CMS API đã kết nối lại. Bạn có thể lưu và xuất bản.' : current)
        }
      } catch {
        consecutiveFailures += 1
        if (active) setApiStatus(consecutiveFailures >= 3 ? 'offline' : 'checking')
      }
    }
    void probe()
    const timer = window.setInterval(() => void probe(), 3000)
    return () => { active = false; window.clearInterval(timer) }
  }, [])

  const formSignature = JSON.stringify(form)
  const hasUnsavedChanges = loaded && formSignature !== savedSignature

  const updateBlock = (index: number, data: Record<string, unknown>) => setForm((current) => ({
    ...current, blocks: current.blocks.map((block, position) => position === index ? ({ ...block, data: { ...block.data, ...data } } as HomepageBlock) : block),
  }))
  const move = (index: number, offset: number) => setForm((current) => {
    const blocks = [...current.blocks]; const target = index + offset
    if (target < 0 || target >= blocks.length) return current
    ;[blocks[index], blocks[target]] = [blocks[target]!, blocks[index]!]
    return { ...current, blocks }
  })
  const updateItems = (index: number, items: unknown[]) => updateBlock(index, { items })

  const save = async () => {
    const validationError = validateHomepage(form)
    if (validationError) { setMessage(validationError); return }
    setApiStatus('checking')
    setBusy(true); setMessage('')
    try { const result = await saveHomepage(form); setApiStatus('online'); setStatus(result.item.status); setSavedSignature(formSignature); setMessage('Đã lưu bản nháp. Website công khai chưa thay đổi cho đến khi xuất bản.') }
    catch (error) { const offline = error instanceof Error && error.message === 'API_UNAVAILABLE'; setApiStatus(offline ? 'offline' : 'online'); setMessage(offline ? 'Không kết nối được CMS API tại cổng 4000. Nội dung chưa được lưu.' : 'Dữ liệu block chưa hợp lệ hoặc không thể lưu.') }
    finally { setBusy(false) }
  }
  const publish = async () => {
    const validationError = validateHomepage(form)
    if (validationError) { setMessage(validationError); return }
    setApiStatus('checking')
    setBusy(true); setMessage('')
    try {
      await saveHomepage(form)
      const result = await publishHomepage()
      setApiStatus('online')
      setStatus(result.item.status)
      setSavedSignature(formSignature)
      setMessage('Đã lưu và xuất bản trang chủ. Mở lại website để kiểm tra nội dung mới.')
    }
    catch (error) {
      const code = error instanceof Error ? error.message : ''
      setApiStatus(code === 'API_UNAVAILABLE' ? 'offline' : 'online')
      setMessage(code === 'API_UNAVAILABLE'
        ? 'Không kết nối được CMS API tại cổng 4000. Hãy chờ dịch vụ khởi động rồi thử lại.'
        : code === 'MEDIA_REFERENCE_NOT_FOUND'
        ? 'Một ảnh hoặc tài liệu đã bị xóa khỏi thư viện. Hãy chọn lại tệp trong block liên quan.'
        : `Không thể xuất bản trang chủ${code ? ` (${code})` : ''}.`)
    }
    finally { setBusy(false) }
  }

  return <section className="admin-card content-manager">
    <button className="text-button" type="button" onClick={onBack}>← Tổng quan</button>
    <p className="admin-kicker">Nội dung website</p>
    <div className="manager-heading"><div><h1>Trang chủ</h1><p>Trạng thái: {status} · {hasUnsavedChanges ? 'Có thay đổi chưa lưu' : 'Không có thay đổi mới'} · <span className={`api-state is-${apiStatus}`}>API {apiStatus === 'online' ? 'online' : apiStatus === 'offline' ? 'offline' : 'đang kiểm tra'}</span></p></div><div className="post-actions"><button disabled={busy || !hasUnsavedChanges} type="button" onClick={() => void save()}>Lưu nháp</button><button className="publish-button" disabled={busy || form.blocks.length === 0} type="button" onClick={() => void publish()}>{busy ? 'Đang xuất bản...' : 'Lưu & xuất bản'}</button><a className="secondary-button preview-link" href={PUBLIC_SITE_URL} target="_blank" rel="noreferrer">Xem website ↗</a></div></div>
    {message ? <p className={`publish-notice ${apiStatus === 'offline' ? 'is-error' : ''}`} role="status">{message}</p> : null}
    <div className="post-form homepage-meta">
      <label>Tiêu đề SEO<input maxLength={70} value={form.seoTitle ?? ''} onChange={(e) => setForm({ ...form, seoTitle: e.target.value || null })} /><small>Hiển thị trên tab trình duyệt và công cụ tìm kiếm.</small></label>
      <label>Mô tả SEO<textarea maxLength={180} value={form.seoDescription ?? ''} onChange={(e) => setForm({ ...form, seoDescription: e.target.value || null })} /><small>Phần mô tả dành cho Google và chia sẻ mạng xã hội.</small></label>
    </div>
    <div className="block-add-row">{(Object.keys(labels) as HomepageBlock['type'][]).map((type) => <button className="secondary-button" disabled={form.blocks.some((block) => block.type === type)} key={type} type="button" onClick={() => setForm({ ...form, blocks: [...form.blocks, newBlock(type, images[0]?.id)] })}>+ {labels[type]}</button>)}</div>
    <div className="block-list">{form.blocks.map((block, index) => <article className="block-card" key={`${block.type}-${index}`}>
      <div className="block-card-heading"><strong>{index + 1}. {labels[block.type]}</strong><div><button type="button" onClick={() => move(index, -1)}>↑</button><button type="button" onClick={() => move(index, 1)}>↓</button><button type="button" onClick={() => setForm({ ...form, blocks: form.blocks.filter((_, i) => i !== index) })}>Xóa</button></div></div>
      <label className="inline-check"><input checked={block.isEnabled} type="checkbox" onChange={(e) => setForm({ ...form, blocks: form.blocks.map((item, i) => i === index ? { ...item, isEnabled: e.target.checked } : item) })} /> Hiển thị block</label>
      {'eyebrow' in block.data ? <label>Nhãn nhỏ / eyebrow<input value={block.data.eyebrow ?? ''} onChange={(e) => updateBlock(index, { eyebrow: e.target.value || null })} /></label> : null}
      {'heading' in block.data ? <label>Tiêu đề<input value={String(block.data.heading)} onChange={(e) => updateBlock(index, { heading: e.target.value })} /></label> : null}
      {'title' in block.data ? <label>Tiêu đề<input value={String(block.data.title)} onChange={(e) => updateBlock(index, { title: e.target.value })} /></label> : null}
      {'description' in block.data ? <label>Mô tả<textarea value={String(block.data.description)} onChange={(e) => updateBlock(index, { description: e.target.value })} /></label> : null}
      {'intro' in block.data ? <label>Đoạn giới thiệu<textarea value={block.data.intro ?? ''} onChange={(e) => updateBlock(index, { intro: e.target.value || null })} /></label> : null}

      {/* home_hero */}
      {block.type === 'home_hero' ? (
        <><div className="form-row">
            <label>Nút chính<input value={block.data.primaryLabel} onChange={(e) => updateBlock(index, { primaryLabel: e.target.value })} /></label>
            <label>Liên kết<input value={block.data.primaryUrl} onChange={(e) => updateBlock(index, { primaryUrl: e.target.value })} /></label>
          </div>
          <div className="form-row">
            <label>Nút phụ<input value={block.data.secondaryLabel ?? ''} onChange={(e) => updateBlock(index, { secondaryLabel: e.target.value || null })} /></label>
            <label>Liên kết nút phụ<input value={block.data.secondaryUrl ?? ''} onChange={(e) => updateBlock(index, { secondaryUrl: e.target.value || null })} /></label>
          </div>
          <div className="nested-editor"><div className="nested-heading"><strong>Điểm nổi bật</strong><button type="button" onClick={() => updateBlock(index, { points: [...block.data.points, 'Điểm nổi bật mới'] })}>+ Thêm điểm</button></div>
            {block.data.points.map((point, itemIndex) => <div className="nested-row compact" key={itemIndex}><input value={point} onChange={(e) => updateBlock(index, { points: block.data.points.map((item, i) => i === itemIndex ? e.target.value : item) })} /><button type="button" onClick={() => updateBlock(index, { points: block.data.points.filter((_, i) => i !== itemIndex) })}>Xóa</button></div>)}
          </div>
          <div className="nested-editor"><div className="nested-heading"><strong>Ảnh carousel</strong><button type="button" onClick={() => updateBlock(index, { slides: [...block.data.slides, { title: 'Slide mới', description: 'Mô tả slide', imageMediaId: images[0]?.id ?? '' }] })} disabled={images.length === 0}>+ Thêm slide</button></div>
            {block.data.slides.map((slide, itemIndex) => <div className="nested-row" key={`${slide.imageMediaId}-${itemIndex}`}>
              <input aria-label="Tiêu đề slide" value={slide.title} onChange={(e) => updateBlock(index, { slides: block.data.slides.map((item, i) => i === itemIndex ? { ...item, title: e.target.value } : item) })} />
              <input aria-label="Mô tả slide" value={slide.description} onChange={(e) => updateBlock(index, { slides: block.data.slides.map((item, i) => i === itemIndex ? { ...item, description: e.target.value } : item) })} />
              <select aria-label="Ảnh slide" value={slide.imageMediaId} onChange={(e) => updateBlock(index, { slides: block.data.slides.map((item, i) => i === itemIndex ? { ...item, imageMediaId: e.target.value } : item) })}>{images.map((image) => <option key={image.id} value={image.id}>{image.originalName}</option>)}</select>
              <button type="button" onClick={() => updateBlock(index, { slides: block.data.slides.filter((_, i) => i !== itemIndex) })}>Xóa</button>
            </div>)}</div>
        </>
      ) : null}

      {/* home_stats */}
      {block.type === 'home_stats' ? <>
        <div className="nested-editor"><div className="nested-heading"><strong>Số liệu thống kê</strong><button type="button" onClick={() => updateBlock(index, { stats: [...block.data.stats, { value: '100+', label: 'Nhãn mới', note: null }] })}>+ Thêm số liệu</button></div>
          {block.data.stats.map((stat, itemIndex) => <div className="nested-row" key={itemIndex}>
            <input placeholder="Giá trị (vd: 500+)" value={stat.value} onChange={(e) => updateBlock(index, { stats: block.data.stats.map((item, i) => i === itemIndex ? { ...item, value: e.target.value } : item) })} />
            <input placeholder="Nhãn" value={stat.label} onChange={(e) => updateBlock(index, { stats: block.data.stats.map((item, i) => i === itemIndex ? { ...item, label: e.target.value } : item) })} />
            <input placeholder="Ghi chú (không bắt buộc)" value={stat.note ?? ''} onChange={(e) => updateBlock(index, { stats: block.data.stats.map((item, i) => i === itemIndex ? { ...item, note: e.target.value || null } : item) })} />
            <button type="button" onClick={() => updateBlock(index, { stats: block.data.stats.filter((_, i) => i !== itemIndex) })}>Xóa</button>
          </div>)}
        </div>
        <label>Nhãn phần đối tác<input value={block.data.partnersHeading ?? ''} onChange={(e) => updateBlock(index, { partnersHeading: e.target.value || null })} /></label>
        <div className="nested-editor"><div className="nested-heading"><strong>Logo đối tác</strong><button disabled={images.length === 0} type="button" onClick={() => updateBlock(index, { partners: [...block.data.partners, { name: images[0]?.originalName ?? 'Đối tác mới', mediaId: images[0]?.id ?? '', websiteUrl: null }] })}>+ Thêm đối tác</button></div>
          {block.data.partners.map((partner, itemIndex) => <div className="nested-row" key={`${partner.mediaId}-${itemIndex}`}>
            <input value={partner.name} onChange={(e) => updateBlock(index, { partners: block.data.partners.map((item, i) => i === itemIndex ? { ...item, name: e.target.value } : item) })} />
            <select value={partner.mediaId} onChange={(e) => updateBlock(index, { partners: block.data.partners.map((item, i) => i === itemIndex ? { ...item, mediaId: e.target.value } : item) })}>{images.map((image) => <option key={image.id} value={image.id}>{image.originalName}</option>)}</select>
            <input placeholder="Website" value={partner.websiteUrl ?? ''} onChange={(e) => updateBlock(index, { partners: block.data.partners.map((item, i) => i === itemIndex ? { ...item, websiteUrl: e.target.value || null } : item) })} />
            <button type="button" onClick={() => updateBlock(index, { partners: block.data.partners.filter((_, i) => i !== itemIndex) })}>Xóa</button>
          </div>)}
        </div>
      </> : null}

      {/* home_features */}
      {block.type === 'home_features' ? <div className="nested-editor"><div className="nested-heading"><strong>Các tính năng</strong><button type="button" onClick={() => updateItems(index, [...block.data.items, { title: 'Mục mới', description: 'Mô tả', href: null }])}>+ Thêm mục</button></div>{block.data.items.map((item, itemIndex) => <div className="nested-row" key={itemIndex}><input value={item.title} onChange={(e) => updateItems(index, block.data.items.map((value, i) => i === itemIndex ? { ...value, title: e.target.value } : value))} /><input value={item.description} onChange={(e) => updateItems(index, block.data.items.map((value, i) => i === itemIndex ? { ...value, description: e.target.value } : value))} /><input placeholder="Link (không bắt buộc)" value={item.href ?? ''} onChange={(e) => updateItems(index, block.data.items.map((value, i) => i === itemIndex ? { ...value, href: e.target.value || null } : value))} /><button type="button" onClick={() => updateItems(index, block.data.items.filter((_, i) => i !== itemIndex))}>Xóa</button></div>)}</div> : null}

      {/* home_industries */}
      {block.type === 'home_industries' ? <div className="nested-editor"><div className="nested-heading"><strong>Nhóm ngành hàng</strong><button type="button" onClick={() => updateBlock(index, { groups: [...block.data.groups, { title: 'Nhóm ngành mới', iconKey: 'store', items: [{ title: 'Ngành mới', description: 'Mô tả ngành', href: '/nganh-hang' }] }] })}>+ Thêm nhóm</button></div>{block.data.groups.map((group, groupIndex) => <div className="nested-group" key={groupIndex}><div className="nested-row"><input value={group.title} onChange={(e) => updateBlock(index, { groups: block.data.groups.map((item, i) => i === groupIndex ? { ...item, title: e.target.value } : item) })} /><select value={group.iconKey} onChange={(e) => updateBlock(index, { groups: block.data.groups.map((item, i) => i === groupIndex ? { ...item, iconKey: e.target.value } : item) })}><option value="store">Cửa hàng</option><option value="utensils">Ăn uống</option><option value="shield">Dịch vụ</option><option value="smartphone">Di động</option><option value="server">Hạ tầng</option><option value="headphones">Hỗ trợ</option></select><button type="button" disabled={block.data.groups.length === 1} onClick={() => updateBlock(index, { groups: block.data.groups.filter((_, i) => i !== groupIndex) })}>Xóa nhóm</button></div>{group.items.map((item, itemIndex) => <div className="nested-row" key={itemIndex}><input value={item.title} onChange={(e) => updateBlock(index, { groups: block.data.groups.map((value, i) => i === groupIndex ? { ...value, items: value.items.map((entry, j) => j === itemIndex ? { ...entry, title: e.target.value } : entry) } : value) })} /><input value={item.description} onChange={(e) => updateBlock(index, { groups: block.data.groups.map((value, i) => i === groupIndex ? { ...value, items: value.items.map((entry, j) => j === itemIndex ? { ...entry, description: e.target.value } : entry) } : value) })} /><input value={item.href} onChange={(e) => updateBlock(index, { groups: block.data.groups.map((value, i) => i === groupIndex ? { ...value, items: value.items.map((entry, j) => j === itemIndex ? { ...entry, href: e.target.value } : entry) } : value) })} /><button type="button" disabled={group.items.length === 1} onClick={() => updateBlock(index, { groups: block.data.groups.map((value, i) => i === groupIndex ? { ...value, items: value.items.filter((_, j) => j !== itemIndex) } : value) })}>Xóa</button></div>)}<button className="secondary-button" type="button" onClick={() => updateBlock(index, { groups: block.data.groups.map((value, i) => i === groupIndex ? { ...value, items: [...value.items, { title: 'Ngành mới', description: 'Mô tả ngành', href: '/nganh-hang' }] } : value) })}>+ Thêm ngành</button></div>)}</div> : null}

      {/* home_ecosystem_services */}
      {block.type === 'home_ecosystem_services' ? <div className="nested-editor"><div className="nested-heading"><strong>Nhóm dịch vụ</strong><button type="button" onClick={() => updateBlock(index, { groups: [...block.data.groups, { iconKey: 'check', label: 'Nhóm', title: 'Nội dung mới', description: 'Mô tả nội dung', href: '/', items: [] }] })}>+ Thêm nhóm</button></div>{block.data.groups.map((group, groupIndex) => <div className="nested-group" key={groupIndex}><div className="nested-row"><input placeholder="Nhãn" value={group.label} onChange={(e) => updateBlock(index, { groups: block.data.groups.map((item, i) => i === groupIndex ? { ...item, label: e.target.value } : item) })} /><input placeholder="Tiêu đề" value={group.title} onChange={(e) => updateBlock(index, { groups: block.data.groups.map((item, i) => i === groupIndex ? { ...item, title: e.target.value } : item) })} /><input placeholder="Link" value={group.href} onChange={(e) => updateBlock(index, { groups: block.data.groups.map((item, i) => i === groupIndex ? { ...item, href: e.target.value } : item) })} /><button type="button" disabled={block.data.groups.length === 1} onClick={() => updateBlock(index, { groups: block.data.groups.filter((_, i) => i !== groupIndex) })}>Xóa nhóm</button></div><textarea value={group.description} onChange={(e) => updateBlock(index, { groups: block.data.groups.map((item, i) => i === groupIndex ? { ...item, description: e.target.value } : item) })} />{group.items.map((item, itemIndex) => <div className="nested-row compact" key={itemIndex}><input value={item.title} onChange={(e) => updateBlock(index, { groups: block.data.groups.map((value, i) => i === groupIndex ? { ...value, items: value.items.map((entry, j) => j === itemIndex ? { ...entry, title: e.target.value } : entry) } : value) })} /><input value={item.href} onChange={(e) => updateBlock(index, { groups: block.data.groups.map((value, i) => i === groupIndex ? { ...value, items: value.items.map((entry, j) => j === itemIndex ? { ...entry, href: e.target.value } : entry) } : value) })} /><button type="button" onClick={() => updateBlock(index, { groups: block.data.groups.map((value, i) => i === groupIndex ? { ...value, items: value.items.filter((_, j) => j !== itemIndex) } : value) })}>Xóa</button></div>)}<button className="secondary-button" type="button" onClick={() => updateBlock(index, { groups: block.data.groups.map((value, i) => i === groupIndex ? { ...value, items: [...value.items, { title: 'Liên kết mới', href: '/' }] } : value) })}>+ Thêm liên kết</button></div>)}</div> : null}

      {/* home_process */}
      {block.type === 'home_process' ? <><div className="form-row"><label>Nhãn nút<input value={block.data.buttonLabel} onChange={(e) => updateBlock(index, { buttonLabel: e.target.value })} /></label><label>Liên kết nút<input value={block.data.buttonUrl} onChange={(e) => updateBlock(index, { buttonUrl: e.target.value })} /></label></div><label>Ảnh nổi bật<select value={block.data.featureMediaId} onChange={(e) => updateBlock(index, { featureMediaId: e.target.value })}>{images.map((image) => <option key={image.id} value={image.id}>{image.originalName}</option>)}</select></label><div className="nested-editor"><div className="nested-heading"><strong>Các bước triển khai</strong><button type="button" onClick={() => updateBlock(index, { steps: [...block.data.steps, { title: 'Bước mới', description: 'Mô tả bước' }] })}>+ Thêm bước</button></div>{block.data.steps.map((step, itemIndex) => <div className="nested-row" key={itemIndex}><input value={step.title} onChange={(e) => updateBlock(index, { steps: block.data.steps.map((item, i) => i === itemIndex ? { ...item, title: e.target.value } : item) })} /><input value={step.description} onChange={(e) => updateBlock(index, { steps: block.data.steps.map((item, i) => i === itemIndex ? { ...item, description: e.target.value } : item) })} /><button type="button" disabled={block.data.steps.length === 1} onClick={() => updateBlock(index, { steps: block.data.steps.filter((_, i) => i !== itemIndex) })}>Xóa</button></div>)}</div><div className="nested-editor"><div className="nested-heading"><strong>Mô hình triển khai</strong><button type="button" disabled={images.length === 0} onClick={() => updateBlock(index, { models: [...block.data.models, { title: 'Mô hình mới', description: 'Mô tả mô hình', mediaId: images[0]?.id ?? '' }] })}>+ Thêm mô hình</button></div>{block.data.models.map((model, itemIndex) => <div className="nested-row" key={itemIndex}><input value={model.title} onChange={(e) => updateBlock(index, { models: block.data.models.map((item, i) => i === itemIndex ? { ...item, title: e.target.value } : item) })} /><input value={model.description} onChange={(e) => updateBlock(index, { models: block.data.models.map((item, i) => i === itemIndex ? { ...item, description: e.target.value } : item) })} /><select value={model.mediaId} onChange={(e) => updateBlock(index, { models: block.data.models.map((item, i) => i === itemIndex ? { ...item, mediaId: e.target.value } : item) })}>{images.map((image) => <option key={image.id} value={image.id}>{image.originalName}</option>)}</select><button type="button" onClick={() => updateBlock(index, { models: block.data.models.filter((_, i) => i !== itemIndex) })}>Xóa</button></div>)}</div></> : null}

      {/* home_testimonials */}
      {block.type === 'home_testimonials' ? <div className="nested-editor"><div className="nested-heading"><strong>Đánh giá khách hàng</strong><button type="button" onClick={() => updateItems(index, [...block.data.items, { quote: 'Nội dung đánh giá', name: 'Tên khách hàng', role: null, company: null, avatarMediaId: null }])}>+ Thêm đánh giá</button></div>{block.data.items.map((item, itemIndex) => <div className="nested-row" key={itemIndex}><textarea aria-label="Nội dung" value={item.quote} onChange={(e) => updateItems(index, block.data.items.map((value, i) => i === itemIndex ? { ...value, quote: e.target.value } : value))} /><input placeholder="Tên" value={item.name} onChange={(e) => updateItems(index, block.data.items.map((value, i) => i === itemIndex ? { ...value, name: e.target.value } : value))} /><input placeholder="Chức vụ" value={item.role ?? ''} onChange={(e) => updateItems(index, block.data.items.map((value, i) => i === itemIndex ? { ...value, role: e.target.value || null } : value))} /><input placeholder="Công ty" value={item.company ?? ''} onChange={(e) => updateItems(index, block.data.items.map((value, i) => i === itemIndex ? { ...value, company: e.target.value || null } : value))} /><button type="button" onClick={() => updateItems(index, block.data.items.filter((_, i) => i !== itemIndex))}>Xóa</button></div>)}</div> : null}

      {/* home_featured_posts */}
      {block.type === 'home_featured_posts' ? <><div className="form-row"><label>Loại bài<select value={block.data.postType} onChange={(e) => updateBlock(index, { postType: e.target.value })}><option value="all">Tất cả</option><option value="news">Tin tức</option><option value="promotion">Khuyến mãi</option></select></label><label>Số bài<input min={1} max={12} type="number" value={block.data.limit} onChange={(e) => updateBlock(index, { limit: Number(e.target.value) })} /></label></div><div className="form-row"><label>Nhãn xem tất cả<input value={block.data.allLabel} onChange={(e) => updateBlock(index, { allLabel: e.target.value })} /></label><label>Link xem tất cả<input value={block.data.allUrl} onChange={(e) => updateBlock(index, { allUrl: e.target.value })} /></label></div></> : null}

      {/* home_faq */}
      {block.type === 'home_faq' ? <div className="nested-editor"><div className="nested-heading"><strong>Câu hỏi thường gặp</strong><button type="button" onClick={() => updateItems(index, [...block.data.items, { question: 'Câu hỏi mới?', answer: 'Câu trả lời' }])}>+ Thêm câu hỏi</button></div>{block.data.items.map((item, itemIndex) => <div className="nested-row" key={itemIndex}><input placeholder="Câu hỏi" value={item.question} onChange={(e) => updateItems(index, block.data.items.map((value, i) => i === itemIndex ? { ...value, question: e.target.value } : value))} /><textarea placeholder="Câu trả lời" value={item.answer} onChange={(e) => updateItems(index, block.data.items.map((value, i) => i === itemIndex ? { ...value, answer: e.target.value } : value))} /><button type="button" disabled={block.data.items.length === 1} onClick={() => updateItems(index, block.data.items.filter((_, i) => i !== itemIndex))}>Xóa</button></div>)}</div> : null}

      {/* home_cta */}
      {block.type === 'home_cta' ? (
        <div className="form-row">
          <label>Nhãn nút<input value={block.data.buttonLabel} onChange={(e) => updateBlock(index, { buttonLabel: e.target.value })} /></label>
          <label>Liên kết<input value={block.data.buttonUrl} onChange={(e) => updateBlock(index, { buttonUrl: e.target.value })} /></label>
        </div>
      ) : null}
    </article>)}</div>
  </section>
}
