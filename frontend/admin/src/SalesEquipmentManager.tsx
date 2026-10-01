import type {
  EquipmentSpecificationGroup,
  MediaAsset,
  SalesEquipmentCategory,
  SalesEquipmentInput,
  SalesEquipmentResponse,
  SalesEquipmentRevisionSummary,
} from '@iorder/contracts'
import { ArrowLeft, Archive, EyeOff, History, MonitorSmartphone, Send, Star, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import {
  archiveSalesEquipment,
  createSalesEquipment,
  deleteSalesEquipment,
  listMedia,
  listSalesEquipment,
  listSalesEquipmentRevisions,
  publishSalesEquipment,
  restoreSalesEquipmentRevision,
  unpublishSalesEquipment,
  updateSalesEquipment,
} from './api'
import {
  BasicInfoCard,
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
} from './content-editor/ContentEditorPage'
import { toast } from './toast'
import { ActionMenu, ModalShell, useEscapeAndSave } from './ui'

const CATEGORIES: Array<{ value: SalesEquipmentCategory; label: string }> = [
  { value: 'pos', label: 'Máy POS' },
  { value: 'printer', label: 'Máy in' },
  { value: 'scanner', label: 'Máy quét' },
  { value: 'cash_drawer', label: 'Két tiền' },
  { value: 'accessory', label: 'Phụ kiện' },
]
const emptyInput: SalesEquipmentInput = {
  category: 'pos',
  name: '',
  slug: '',
  modelCode: null,
  coverMediaId: null,
  priceVnd: 0,
  warrantyMonths: 12,
  summary: null,
  specificationGroups: [],
  sortOrder: 0,
  isFeatured: false,
  seoTitle: null,
  seoDescription: null,
  canonicalUrl: null,
}

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
}
function formatDateTime(value: string) {
  return new Date(value).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
}
function toInput(item: SalesEquipmentResponse): SalesEquipmentInput {
  const {
    category,
    name,
    slug,
    modelCode,
    coverMediaId,
    priceVnd,
    warrantyMonths,
    summary,
    specificationGroups,
    sortOrder,
    isFeatured,
    seoTitle,
    seoDescription,
    canonicalUrl,
  } = item
  return {
    category,
    name,
    slug,
    modelCode,
    coverMediaId,
    priceVnd,
    warrantyMonths,
    summary,
    specificationGroups,
    sortOrder,
    isFeatured,
    seoTitle,
    seoDescription,
    canonicalUrl,
  }
}
function validate(form: SalesEquipmentInput) {
  if (form.name.trim().length < 2) return 'Tên thiết bị cần có ít nhất 2 ký tự.'
  if (form.slug.length < 2 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug))
    return 'Đường dẫn chỉ gồm chữ thường, số và dấu gạch ngang.'
  if (form.priceVnd < 0 || form.warrantyMonths < 0) return 'Giá và thời hạn bảo hành không được âm.'
  if (form.canonicalUrl && !/^https?:\/\/.+/.test(form.canonicalUrl))
    return 'Canonical URL phải bắt đầu bằng http:// hoặc https://.'
  if (
    form.specificationGroups.some(
      (group) => !group.title.trim() || !group.items.length || group.items.some((item) => !item.trim()),
    )
  )
    return 'Mỗi nhóm thông số cần có tên và ít nhất một thông số.'
  return null
}

export function SalesEquipmentManager() {
  const [items, setItems] = useState<SalesEquipmentResponse[]>([])
  const [images, setImages] = useState<MediaAsset[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState<SalesEquipmentInput>(emptyInput)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published' | 'archived'>('all')
  const [categoryFilter, setCategoryFilter] = useState<'all' | SalesEquipmentCategory>('all')
  const [search, setSearch] = useState('')
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [showCoverPicker, setShowCoverPicker] = useState(false)
  const [revisions, setRevisions] = useState<SalesEquipmentRevisionSummary[]>([])
  const [revisionsOpen, setRevisionsOpen] = useState(false)
  const [restoringVersion, setRestoringVersion] = useState<number | null>(null)

  const load = async () => {
    const [equipment, media] = await Promise.all([listSalesEquipment(), listMedia('image')])
    setItems(equipment.items)
    setImages(media.items)
  }
  useEffect(() => {
    void load()
      .catch(() => toast.error('Không thể tải thiết bị bán hàng.'))
      .finally(() => setLoading(false))
  }, [])
  const patch = <K extends keyof SalesEquipmentInput>(key: K, value: SalesEquipmentInput[K]) =>
    setForm((current) => ({ ...current, [key]: value }))
  const newEquipment = () => {
    setSelectedId(null)
    setCreating(true)
    setShowCoverPicker(false)
    setForm({ ...emptyInput, sortOrder: items.length })
  }
  const selectEquipment = (item: SalesEquipmentResponse) => {
    setSelectedId(item.id)
    setCreating(false)
    setShowCoverPicker(false)
    setForm(toInput(item))
  }
  const closeEditor = () => {
    setSelectedId(null)
    setCreating(false)
    setShowCoverPicker(false)
    setRevisionsOpen(false)
    void load().catch(() => undefined)
  }

  const save = async () => {
    const problem = validate(form)
    if (problem) return toast.error(problem)
    setSaving(true)
    try {
      const result = selectedId ? await updateSalesEquipment(selectedId, form) : await createSalesEquipment(form)
      setSelectedId(result.item.id)
      setCreating(false)
      setForm(toInput(result.item))
      await load()
      toast.success(selectedId ? 'Đã lưu thay đổi thiết bị.' : 'Đã tạo thiết bị ở trạng thái nháp.')
    } catch (error) {
      toast.error(
        error instanceof Error && error.message === 'SLUG_EXISTS'
          ? 'Đường dẫn này đã được dùng.'
          : 'Không thể lưu thiết bị. Kiểm tra ảnh bìa và các trường bắt buộc.',
      )
    } finally {
      setSaving(false)
    }
  }
  const publish = async () => {
    const problem = validate(form)
    if (problem) return toast.error(problem)
    setSaving(true)
    try {
      const saved = selectedId ? await updateSalesEquipment(selectedId, form) : await createSalesEquipment(form)
      const result = await publishSalesEquipment(saved.item.id)
      setSelectedId(result.item.id)
      setCreating(false)
      setForm(toInput(result.item))
      await load()
      toast.success('Đã xuất bản thiết bị trên website.')
    } catch {
      toast.error('Không thể xuất bản thiết bị.')
    } finally {
      setSaving(false)
    }
  }
  const updateStatus = async (id: string, action: 'archive' | 'unpublish') => {
    setSaving(true)
    try {
      const result = action === 'archive' ? await archiveSalesEquipment(id) : await unpublishSalesEquipment(id)
      if (id === selectedId) setForm(toInput(result.item))
      await load()
      toast.success(action === 'archive' ? 'Đã ẩn thiết bị khỏi website.' : 'Đã đưa thiết bị về bản nháp.')
    } catch {
      toast.error('Không thể cập nhật trạng thái thiết bị.')
    } finally {
      setSaving(false)
    }
  }
  const remove = async (id: string) => {
    try {
      await deleteSalesEquipment(id)
      if (id === selectedId) closeEditor()
      await load()
      toast.warning('Đã xóa thiết bị. Dữ liệu được lưu vết trong nhật ký CMS.')
    } catch {
      toast.error('Không thể xóa thiết bị.')
    }
  }
  const openRevisions = async () => {
    if (!selectedId) return
    try {
      setRevisions((await listSalesEquipmentRevisions(selectedId)).items)
      setRevisionsOpen(true)
    } catch {
      toast.error('Không thể tải lịch sử phiên bản.')
    }
  }
  const restoreRevision = async (version: number) => {
    if (!selectedId) return
    setRestoringVersion(version)
    try {
      const result = await restoreSalesEquipmentRevision(selectedId, version)
      setForm(toInput(result.item))
      setRevisionsOpen(false)
      await load()
      toast.success(`Đã khôi phục phiên bản ${version}. Thiết bị đang ở trạng thái nháp để kiểm tra lại.`)
    } catch {
      toast.error('Không thể khôi phục phiên bản này.')
    } finally {
      setRestoringVersion(null)
    }
  }
  const updateGroup = (index: number, next: EquipmentSpecificationGroup) =>
    patch(
      'specificationGroups',
      form.specificationGroups.map((group, current) => (current === index ? next : group)),
    )

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase('vi-VN')
    return items
      .filter((item) => statusFilter === 'all' || item.status === statusFilter)
      .filter((item) => categoryFilter === 'all' || item.category === categoryFilter)
      .filter(
        (item) =>
          !query ||
          `${item.name} ${item.modelCode ?? ''} ${item.summary ?? ''} ${item.slug}`
            .toLocaleLowerCase('vi-VN')
            .includes(query),
      )
      .sort((left, right) => {
        const diff = new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
        return sortOrder === 'newest' ? diff : -diff
      })
  }, [categoryFilter, items, search, sortOrder, statusFilter])
  const stats = useMemo(
    () => [
      { key: 'all', label: 'Tổng thiết bị', value: items.length, note: 'Toàn bộ danh mục' },
      {
        key: 'published',
        label: 'Đã đăng',
        value: items.filter((item) => item.status === 'published').length,
        note: 'Đang hiện công khai',
      },
      {
        key: 'draft',
        label: 'Nháp',
        value: items.filter((item) => item.status === 'draft').length,
        note: 'Chưa xuất bản',
      },
      {
        key: 'archived',
        label: 'Đã ẩn',
        value: items.filter((item) => item.status === 'archived').length,
        note: 'Không hiện công khai',
      },
    ],
    [items],
  )
  const editingItem = items.find((item) => item.id === selectedId) ?? null
  const hasEditor = creating || selectedId !== null
  const validationError = validate(form)
  const coverUrl = editingItem?.coverUrl ?? images.find((image) => image.id === form.coverMediaId)?.publicUrl ?? null
  useEscapeAndSave({ active: hasEditor, onSave: () => void save(), onEscape: closeEditor })

  if (hasEditor)
    return (
      <>
        <ContentEditorPage
          standalone
          title={creating ? 'Thiết bị mới' : 'Chỉnh sửa thiết bị'}
          status={<StatusBadge status={editingItem?.status ?? 'draft'} />}
          eyebrow={
            <span className="editor-breadcrumb">
              <button type="button" onClick={closeEditor}>
                <ArrowLeft size={16} /> Thiết bị
              </button>
              <span>›</span>
              {creating ? 'Thiết bị mới' : form.name || 'Chỉnh sửa thiết bị'}
            </span>
          }
          actions={
            <>
              <button
                type="button"
                className="btn-primary btn-icon"
                disabled={saving || Boolean(validationError)}
                onClick={() => void publish()}
                title={validationError ?? undefined}
              >
                <Send size={15} /> Xuất bản ngay
              </button>
              <ActionMenu
                items={[
                  ...(selectedId
                    ? [{ label: 'Lịch sử phiên bản', icon: History, onClick: () => void openRevisions() }]
                    : []),
                  ...(editingItem?.status === 'published' && selectedId
                    ? [
                        {
                          label: 'Gỡ xuất bản',
                          icon: EyeOff,
                          onClick: () => void updateStatus(selectedId, 'unpublish'),
                        },
                      ]
                    : []),
                  ...(selectedId
                    ? [
                        {
                          label: 'Ẩn thiết bị',
                          icon: Archive,
                          onClick: () => void updateStatus(selectedId, 'archive'),
                        },
                        { label: 'Xóa', icon: Trash2, tone: 'danger' as const, onClick: () => void remove(selectedId) },
                      ]
                    : []),
                ]}
              />
            </>
          }
          onSubmit={() => void save()}
          main={
            <>
              <BasicInfoCard>
                <div className="form-row-2col">
                  <label>
                    Tên thiết bị <span className="field-counter">{form.name.length}/220</span>
                    <input
                      required
                      maxLength={220}
                      placeholder="Ví dụ: Máy POS iOrder IOD86"
                      value={form.name}
                      onChange={(event) => {
                        const name = event.target.value
                        setForm((current) => ({ ...current, name, ...(creating ? { slug: slugify(name) } : {}) }))
                      }}
                    />
                  </label>
                  <label>
                    Đường dẫn <span className="field-counter">{form.slug.length}/200</span>
                    <input
                      required
                      maxLength={200}
                      placeholder="may-pos-iod86"
                      value={form.slug}
                      onChange={(event) => patch('slug', slugify(event.target.value))}
                    />
                  </label>
                </div>
                <div className="form-row-2col">
                  <label>
                    Danh mục
                    <select
                      value={form.category}
                      onChange={(event) => patch('category', event.target.value as SalesEquipmentCategory)}
                    >
                      {CATEGORIES.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Mã sản phẩm
                    <input
                      maxLength={80}
                      placeholder="IOD86"
                      value={form.modelCode ?? ''}
                      onChange={(event) => patch('modelCode', event.target.value || null)}
                    />
                  </label>
                </div>
                <div className="form-row-2col">
                  <label>
                    Giá niêm yết (VND)
                    <input
                      type="number"
                      min={0}
                      max={999999999999}
                      value={form.priceVnd}
                      onChange={(event) => patch('priceVnd', Number(event.target.value))}
                    />
                  </label>
                  <label>
                    Bảo hành (tháng)
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={form.warrantyMonths}
                      onChange={(event) => patch('warrantyMonths', Number(event.target.value))}
                    />
                  </label>
                </div>
                <label className="full-field">
                  Mô tả ngắn <span className="field-counter">{(form.summary ?? '').length}/600</span>
                  <textarea
                    maxLength={600}
                    rows={3}
                    placeholder="Tóm tắt lợi ích, điểm nổi bật của thiết bị..."
                    value={form.summary ?? ''}
                    onChange={(event) => patch('summary', event.target.value || null)}
                  />
                </label>
              </BasicInfoCard>
              <ContentBodyEditor
                wordCount={form.specificationGroups.reduce((count, group) => count + group.items.length, 0)}
              >
                <div className="content-card-intro">
                  <strong>Thông số kỹ thuật</strong>
                  <span>Chia theo nhóm để khách hàng dễ đối chiếu. Bỏ nhóm trống trước khi lưu.</span>
                </div>
                {form.specificationGroups.map((group, groupIndex) => (
                  <section key={groupIndex} className="admin-repeater">
                    <div className="form-row-2col">
                      <label>
                        Tên nhóm
                        <input
                          value={group.title}
                          placeholder="Ví dụ: Màn hình"
                          onChange={(event) => updateGroup(groupIndex, { ...group, title: event.target.value })}
                        />
                      </label>
                      <button
                        type="button"
                        className="secondary-button is-danger-soft"
                        onClick={() =>
                          patch(
                            'specificationGroups',
                            form.specificationGroups.filter((_, index) => index !== groupIndex),
                          )
                        }
                      >
                        Xóa nhóm
                      </button>
                    </div>
                    {group.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="form-row-2col">
                        <input
                          value={item}
                          placeholder="Ví dụ: Màn hình cảm ứng 15.6 inch"
                          onChange={(event) =>
                            updateGroup(groupIndex, {
                              ...group,
                              items: group.items.map((value, index) =>
                                index === itemIndex ? event.target.value : value,
                              ),
                            })
                          }
                        />
                        <button
                          type="button"
                          className="text-button danger"
                          disabled={group.items.length <= 1}
                          onClick={() =>
                            updateGroup(groupIndex, {
                              ...group,
                              items: group.items.filter((_, index) => index !== itemIndex),
                            })
                          }
                        >
                          Bỏ thông số
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => updateGroup(groupIndex, { ...group, items: [...group.items, ''] })}
                    >
                      + Thêm thông số
                    </button>
                  </section>
                ))}
                <button
                  type="button"
                  className="secondary-button"
                  disabled={form.specificationGroups.length >= 6}
                  onClick={() =>
                    patch('specificationGroups', [...form.specificationGroups, { title: '', items: [''] }])
                  }
                >
                  + Thêm nhóm thông số
                </button>
              </ContentBodyEditor>
              <SeoMetaCard
                title={form.seoTitle || form.name || 'Tên thiết bị'}
                description={form.seoDescription || form.summary || 'Mô tả hiển thị trên kết quả tìm kiếm...'}
                url={form.canonicalUrl || `https://iorder.vn/thiet-bi/${form.slug || 'duong-dan'}`}
              >
                <div className="form-row-2col">
                  <label>
                    Tiêu đề SEO <span className="field-counter">{(form.seoTitle ?? '').length}/70</span>
                    <input
                      maxLength={70}
                      value={form.seoTitle ?? ''}
                      onChange={(event) => patch('seoTitle', event.target.value || null)}
                    />
                  </label>
                  <label>
                    Mô tả SEO <span className="field-counter">{(form.seoDescription ?? '').length}/180</span>
                    <input
                      maxLength={180}
                      value={form.seoDescription ?? ''}
                      onChange={(event) => patch('seoDescription', event.target.value || null)}
                    />
                  </label>
                </div>
                <label className="full-field">
                  Canonical URL
                  <input
                    type="url"
                    placeholder="https://..."
                    value={form.canonicalUrl ?? ''}
                    onChange={(event) => patch('canonicalUrl', event.target.value || null)}
                  />
                </label>
              </SeoMetaCard>
            </>
          }
          sidebar={
            <>
              <PublishSidebar
                status={editingItem?.status ?? 'draft'}
                updatedAt={editingItem?.updatedAt ?? null}
                publishedAt={editingItem?.publishedAt ?? null}
                isSaving={saving}
                canPublish={!validationError}
                onSaveDraft={() => void save()}
                hideActions
              />
              <CoverImageCard
                coverUrl={coverUrl}
                images={images}
                value={form.coverMediaId}
                onChange={(id) => patch('coverMediaId', id)}
                onUploaded={(asset) => setImages((current) => [asset, ...current])}
                onRemove={() => patch('coverMediaId', null)}
                pickerOpen={showCoverPicker}
                onTogglePicker={() => setShowCoverPicker((current) => !current)}
                fallback={<MonitorSmartphone size={28} aria-hidden="true" />}
              />
              <DisplaySettingCard
                updatedAt={editingItem?.updatedAt ?? null}
                visible={form.isFeatured}
                onVisibleChange={(next) => patch('isFeatured', next)}
              >
                <label className="full-field">
                  Thứ tự hiển thị
                  <input
                    type="number"
                    min={0}
                    max={9999}
                    value={form.sortOrder}
                    onChange={(event) => patch('sortOrder', Number(event.target.value))}
                  />
                </label>
              </DisplaySettingCard>
            </>
          }
        />
        {revisionsOpen ? (
          <ModalShell
            onOverlayClick={() => setRevisionsOpen(false)}
            header={
              <>
                <h2>Lịch sử phiên bản</h2>
                <button type="button" className="modal-close" onClick={() => setRevisionsOpen(false)}>
                  ×
                </button>
              </>
            }
          >
            {revisions.length === 0 ? (
              <p className="admin-empty">Chưa có phiên bản nào.</p>
            ) : (
              revisions.map((revision) => (
                <div key={revision.versionNumber} className="nav-item-row">
                  <span>
                    <strong>Phiên bản {revision.versionNumber}</strong>
                    <small>
                      {' '}
                      · {revision.changeNote} · {formatDateTime(revision.createdAt)}
                    </small>
                  </span>
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={restoringVersion !== null}
                    onClick={() => void restoreRevision(revision.versionNumber)}
                  >
                    {restoringVersion === revision.versionNumber ? 'Đang khôi phục…' : 'Khôi phục'}
                  </button>
                </div>
              ))
            )}
          </ModalShell>
        ) : null}
      </>
    )

  return (
    <section className="admin-card content-manager">
      <ContentListPage
        title="Thiết bị bán hàng"
        description="Quản lý máy POS, máy in, máy quét, két tiền và phụ kiện hiển thị trên website."
        actionLabel="Thiết bị mới"
        onCreate={newEquipment}
        stats={stats}
        search={search}
        onSearch={setSearch}
        status={statusFilter}
        onStatus={setStatusFilter}
        categoryValue={categoryFilter}
        categoryOptions={CATEGORIES}
        onCategoryChange={(value) => setCategoryFilter(value as 'all' | SalesEquipmentCategory)}
        sort={sortOrder}
        onSort={setSortOrder}
      >
        {loading ? <p className="admin-info">Đang tải...</p> : null}
        {!loading && filtered.length === 0 ? (
          <div className="admin-empty admin-empty--inline">
            <p>Không có thiết bị nào khớp với bộ lọc.</p>
          </div>
        ) : null}
        {!loading ? (
          <ContentCardsGrid
            addLabel="Thêm thiết bị mới"
            addDescription="Tạo thiết bị, thông số kỹ thuật và thông tin SEO"
            onCreate={newEquipment}
          >
            {filtered.map((item) => (
              <ContentItemCard
                key={item.id}
                title={item.name}
                slug={item.slug}
                summary={`${new Intl.NumberFormat('vi-VN').format(item.priceVnd)}đ · Bảo hành ${item.warrantyMonths} tháng`}
                status={item.status}
                updatedAt={item.updatedAt}
                coverUrl={item.coverUrl}
                fallback={<MonitorSmartphone size={24} aria-hidden="true" />}
                marker={
                  <>
                    <span className="kind-badge kind-partner">
                      {CATEGORIES.find((category) => category.value === item.category)?.label}
                    </span>
                    {item.isFeatured ? (
                      <span className="kind-badge kind-customer">
                        <Star size={12} /> Nổi bật
                      </span>
                    ) : null}
                  </>
                }
                onEdit={() => selectEquipment(item)}
                onDuplicate={() => {
                  setSelectedId(null)
                  setCreating(true)
                  setForm({ ...toInput(item), name: `${item.name} (bản sao)`, slug: `${item.slug}-ban-sao` })
                }}
                onPreview={() => {
                  if (item.status === 'published')
                      window.open('/thiet-bi', '_blank', 'noopener,noreferrer')
                  else toast.warning('Hãy xuất bản thiết bị trước khi mở trang công khai.')
                }}
                menuActions={[
                  item.status === 'published'
                    ? { label: 'Gỡ xuất bản', onClick: () => void updateStatus(item.id, 'unpublish') }
                    : { label: 'Chỉnh sửa để xuất bản', onClick: () => selectEquipment(item) },
                  { label: 'Ẩn thiết bị', onClick: () => void updateStatus(item.id, 'archive') },
                  { label: 'Xóa', onClick: () => void remove(item.id), danger: true },
                ]}
              />
            ))}
          </ContentCardsGrid>
        ) : null}
      </ContentListPage>
    </section>
  )
}
