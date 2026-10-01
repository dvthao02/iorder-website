import type { OfferingResponse } from '@iorder/contracts'
import { useEffect, useState } from 'react'
import {
  deleteContentLink,
  deleteMenuItem,
  listLinkGroups,
  listMenus,
  listOfferings,
  seedDefaultMenus,
  upsertContentLink,
  upsertMenuItem,
} from './api'
import { toast } from './toast'
import { ModalShell, PageHeader, ToggleSwitch, useEscapeAndSave } from './ui'

// Mục header nào hiển thị danh sách con lấy từ Offerings (Phần mềm & Giải pháp), theo đúng loại + đường dẫn công khai.
const OFFERING_MENU_MAP: Record<string, { type: string; prefix: string }> = {
  '/phan-mem': { type: 'software', prefix: '/phan-mem' },
  '/giai-phap': { type: 'solution', prefix: '/giai-phap' },
  '/dich-vu': { type: 'service', prefix: '/dich-vu' },
}

function OfferingPreviewList({ items, prefix }: { items: OfferingResponse[]; prefix: string }) {
  if (items.length === 0) return <p className="menu-item-hint">Chưa có nội dung nào đã xuất bản.</p>
  return (
    <div className="menu-offering-preview">
      {items.map((item) => (
        <span key={item.id} className="menu-offering-chip">
          <strong>{item.title}</strong>{' '}
          <small>
            → {prefix}/{item.slug}
          </small>
        </span>
      ))}
    </div>
  )
}

type MenuItem = {
  id: string
  menuId: string
  parentId: string | null
  label: string
  url: string
  target: string
  icon: string | null
  sortOrder: number
  isEnabled: boolean
  children: MenuItem[]
}

type Menu = {
  id: string
  name: string
  location: string
  items: MenuItem[]
}

type ContentLink = {
  id: string
  groupId: string
  label: string
  url: string
  type: string
  target: string
  icon: string | null
  sortOrder: number
  isEnabled: boolean
}

type LinkGroup = {
  id: string
  code: string
  name: string
  links: ContentLink[]
}

function flattenMenuItems(items: MenuItem[]): MenuItem[] {
  return items.flatMap((item) => [item, ...flattenMenuItems(item.children)])
}

function descendantIds(item: MenuItem): Set<string> {
  return new Set(flattenMenuItems(item.children).map((child) => child.id))
}

function MenuItemRow({
  item,
  location,
  depth,
  parentChoices,
  onRefresh,
}: {
  item: MenuItem
  location: string
  depth: number
  parentChoices: MenuItem[]
  onRefresh: () => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({
    label: item.label,
    url: item.url,
    target: item.target,
    icon: item.icon ?? '',
    sortOrder: item.sortOrder,
    isEnabled: item.isEnabled,
    parentId: item.parentId,
  })
  const [busy, setBusy] = useState(false)
  const validParentChoices = parentChoices.filter((candidate) => candidate.id !== item.id && !descendantIds(item).has(candidate.id))

  const save = async () => {
    setBusy(true)
    try {
      await upsertMenuItem(location, item.id, {
        label: form.label,
        url: form.url,
        target: form.target as '_self' | '_blank',
        icon: form.icon || null,
        sortOrder: form.sortOrder,
        isEnabled: form.isEnabled,
        parentId: form.parentId,
      })
      setModalOpen(false)
      onRefresh()
      toast.success('Đã lưu mục menu.')
    } catch {
      toast.error('Không thể lưu mục menu.')
    } finally {
      setBusy(false)
    }
  }

  const quickToggle = async (enabled: boolean) => {
    setBusy(true)
    try {
      await upsertMenuItem(location, item.id, {
        label: item.label,
        url: item.url,
        target: item.target as '_self' | '_blank',
        icon: item.icon,
        sortOrder: item.sortOrder,
        isEnabled: enabled,
        parentId: item.parentId,
      })
      onRefresh()
    } catch {
      toast.error('Không thể đổi trạng thái.')
    } finally {
      setBusy(false)
    }
  }

  const remove = async () => {
    setBusy(true)
    try {
      await deleteMenuItem(location, item.id)
      onRefresh()
      toast.warning('Đã xóa mục menu.')
    } catch {
      toast.error('Không thể xóa mục menu.')
    } finally {
      setBusy(false)
    }
  }

  useEscapeAndSave({
    active: modalOpen,
    onSave: () => void save(),
    onEscape: () => setModalOpen(false),
  })

  return (
    <div className="nav-item" style={{ marginLeft: depth * 20 }}>
      <div className="nav-item-row">
        <ToggleSwitch
          checked={item.isEnabled}
          onChange={(next) => void quickToggle(next)}
          label=""
          hint=""
          disabled={busy}
        />
        <span className={item.isEnabled ? '' : 'nav-disabled'}>
          <strong>{item.label}</strong> <small>→ {item.url}</small>
          {item.target === '_blank' && <small> ↗</small>}
        </span>
        <div className="nav-item-actions">
          <button type="button" className="btn-secondary btn-icon" onClick={() => setModalOpen(true)} disabled={busy}>Sửa</button>
          <button type="button" className="btn-danger btn-icon" onClick={() => void remove()} disabled={busy}>Xóa</button>
        </div>
      </div>
      {item.children.map((child) => (
        <MenuItemRow key={child.id} item={child} location={location} depth={depth + 1} parentChoices={parentChoices} onRefresh={onRefresh} />
      ))}
      <AddMenuItemForm location={location} parentId={item.id} onDone={onRefresh} />
      {modalOpen ? (
        <ModalShell
          as="form"
          size="lg"
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
          onOverlayClick={() => setModalOpen(false)}
          header={
            <>
              <h2>Sửa mục menu</h2>
              <button type="button" className="modal-close" onClick={() => setModalOpen(false)}>
                ×
              </button>
            </>
          }
          footer={
            <>
              <button type="button" className="secondary-button" onClick={() => setModalOpen(false)} disabled={busy}>
                Hủy
              </button>
              <button type="submit" className="primary-button" disabled={busy || !form.label.trim() || !form.url.trim()}>
                {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
              </button>
            </>
          }
        >
          <div className="form-grid two-columns">
            <label className="form-field">
              <span className="field-label">Nhãn hiển thị</span>
              <input required maxLength={180} value={form.label} onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))} />
            </label>
            <label className="form-field">
              <span className="field-label">Đường dẫn</span>
              <input required maxLength={1000} placeholder="/lien-he hoặc https://..." value={form.url} onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))} />
            </label>
            <label className="form-field">
              <span className="field-label">Kiểu mở</span>
              <select value={form.target} onChange={(event) => setForm((current) => ({ ...current, target: event.target.value }))}>
                <option value="_self">Cùng cửa sổ</option>
                <option value="_blank">Mở tab mới</option>
              </select>
            </label>
            <label className="form-field">
              <span className="field-label">Mục cha</span>
              <select value={form.parentId ?? ''} onChange={(event) => setForm((current) => ({ ...current, parentId: event.target.value || null }))}>
                <option value="">Không có (mục cấp cao)</option>
                {validParentChoices.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span className="field-label">Thứ tự hiển thị</span>
              <input type="number" min={0} value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} />
            </label>
          </div>
          <ToggleSwitch checked={form.isEnabled} onChange={(isEnabled) => setForm((current) => ({ ...current, isEnabled }))} label="Hiển thị trên website" hint={form.isEnabled ? 'Mục đang hiện công khai.' : 'Mục đang ẩn khỏi website.'} />
        </ModalShell>
      ) : null}
    </div>
  )
}

function AddMenuItemForm({
  location,
  parentId,
  onDone,
}: {
  location: string
  parentId: string | null
  onDone: () => void
}) {
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ label: '', url: '', target: '_self', icon: '', sortOrder: 0, isEnabled: true })
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!form.label || !form.url) return
    setBusy(true)
    try {
      await upsertMenuItem(location, 'new', {
        label: form.label,
        url: form.url,
        target: form.target as '_self' | '_blank',
        icon: form.icon || null,
        sortOrder: form.sortOrder,
        isEnabled: form.isEnabled,
        parentId,
      })
      setForm({ label: '', url: '', target: '_self', icon: '', sortOrder: 0, isEnabled: true })
      setModalOpen(false)
      onDone()
      toast.success('Đã thêm mục menu.')
    } catch {
      toast.error('Không thể thêm mục menu.')
    } finally {
      setBusy(false)
    }
  }

  useEscapeAndSave({
    active: modalOpen,
    onSave: () => void save(),
    onEscape: () => setModalOpen(false),
  })

  return (
    <div style={{ marginLeft: parentId ? 20 : 0 }}>
      <button type="button" className="btn-secondary" onClick={() => setModalOpen(true)}>
        + Thêm mục{parentId ? ' con' : ''}
      </button>
      {modalOpen ? (
        <ModalShell
          as="form"
          size="lg"
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
          onOverlayClick={() => setModalOpen(false)}
          header={
            <>
              <h2>{parentId ? 'Thêm mục con' : 'Thêm mục menu'}</h2>
              <button type="button" className="modal-close" onClick={() => setModalOpen(false)}>×</button>
            </>
          }
          footer={
            <>
              <button type="button" className="secondary-button" onClick={() => setModalOpen(false)} disabled={busy}>Hủy</button>
              <button type="submit" className="primary-button" disabled={busy || !form.label.trim() || !form.url.trim()}>{busy ? 'Đang thêm…' : 'Thêm mục'}</button>
            </>
          }
        >
          <p className="form-hint">{parentId ? 'Mục này sẽ được thêm dưới mục hiện tại.' : 'Tạo một mục ở cấp cao nhất của menu.'}</p>
          <div className="form-grid two-columns">
            <label className="form-field">
              <span className="field-label">Nhãn hiển thị</span>
              <input required maxLength={180} autoFocus value={form.label} onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))} />
            </label>
            <label className="form-field">
              <span className="field-label">Đường dẫn</span>
              <input required maxLength={1000} placeholder="/lien-he hoặc https://..." value={form.url} onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))} />
            </label>
            <label className="form-field">
              <span className="field-label">Kiểu mở</span>
              <select value={form.target} onChange={(event) => setForm((current) => ({ ...current, target: event.target.value }))}>
                <option value="_self">Cùng cửa sổ</option>
                <option value="_blank">Mở tab mới</option>
              </select>
            </label>
            <label className="form-field">
              <span className="field-label">Thứ tự hiển thị</span>
              <input type="number" min={0} value={form.sortOrder} onChange={(event) => setForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} />
            </label>
          </div>
          <ToggleSwitch checked={form.isEnabled} onChange={(isEnabled) => setForm((current) => ({ ...current, isEnabled }))} label="Hiển thị trên website" hint={form.isEnabled ? 'Mục sẽ hiển thị công khai.' : 'Mục được lưu nhưng đang ẩn khỏi website.'} />
        </ModalShell>
      ) : null}
    </div>
  )
}

function LinkGroupSection({ group, onRefresh }: { group: LinkGroup; onRefresh: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    label: '',
    url: '',
    type: 'external',
    target: '_self',
    sortOrder: 0,
    isEnabled: true,
  })
  const [adding, setAdding] = useState(false)
  const [newForm, setNewForm] = useState({
    label: '',
    url: '',
    type: 'external',
    target: '_self',
    sortOrder: 0,
    isEnabled: true,
  })
  const [busy, setBusy] = useState(false)

  const startEdit = (link: ContentLink) => {
    setAdding(false)
    setEditingId(link.id)
    setEditForm({
      label: link.label,
      url: link.url,
      type: link.type,
      target: link.target,
      sortOrder: link.sortOrder,
      isEnabled: link.isEnabled,
    })
  }

  const saveLink = async () => {
    if (!editingId) return
    setBusy(true)
    try {
      await upsertContentLink(group.code, editingId, { ...editForm, icon: null })
      setEditingId(null)
      onRefresh()
      toast.success('Đã lưu liên kết.')
    } catch {
      toast.error('Không thể lưu liên kết.')
    } finally {
      setBusy(false)
    }
  }

  const addLink = async () => {
    if (!newForm.label || !newForm.url) return
    setBusy(true)
    try {
      await upsertContentLink(group.code, 'new', { ...newForm, icon: null })
      setNewForm({ label: '', url: '', type: 'external', target: '_self', sortOrder: 0, isEnabled: true })
      setAdding(false)
      onRefresh()
      toast.success('Đã thêm liên kết.')
    } catch {
      toast.error('Không thể thêm liên kết.')
    } finally {
      setBusy(false)
    }
  }

  const removeLink = async (linkId: string) => {
    try {
      await deleteContentLink(group.code, linkId)
      onRefresh()
      toast.warning('Đã xóa liên kết.')
    } catch {
      toast.error('Không thể xóa liên kết.')
    }
  }

  const quickToggleLink = async (link: ContentLink, enabled: boolean) => {
    setBusy(true)
    try {
      await upsertContentLink(group.code, link.id, {
        label: link.label,
        url: link.url,
        type: link.type,
        target: link.target,
        sortOrder: link.sortOrder,
        isEnabled: enabled,
        icon: link.icon,
      })
      onRefresh()
    } catch {
      toast.error('Không thể đổi trạng thái.')
    } finally {
      setBusy(false)
    }
  }

  const closeLinkEditor = () => {
    setEditingId(null)
    setAdding(false)
  }

  useEscapeAndSave({
    active: Boolean(editingId) || adding,
    onSave: () => void (editingId ? saveLink() : addLink()),
    onEscape: closeLinkEditor,
  })

  return (
    <div className="link-group-section">
      <h4>
        {group.name} <small>({group.code})</small>
      </h4>
      {group.links.map((link) => (
        <div key={link.id} className="nav-item-row">
          <ToggleSwitch
            checked={link.isEnabled}
            onChange={(next) => void quickToggleLink(link, next)}
            label=""
            hint=""
            disabled={busy}
          />
          <span className={link.isEnabled ? '' : 'nav-disabled'}>
            <strong>{link.label}</strong> <small>→ {link.url}</small>
          </span>
          <div className="nav-item-actions">
            <button type="button" className="btn-secondary btn-icon" onClick={() => startEdit(link)} disabled={busy}>Sửa</button>
            <button type="button" className="btn-danger btn-icon" onClick={() => void removeLink(link.id)} disabled={busy}>Xóa</button>
          </div>
        </div>
      ))}
      <button type="button" className="btn-secondary" style={{ marginTop: 8 }} onClick={() => { setEditingId(null); setAdding(true) }} disabled={busy}>
          + Thêm liên kết
      </button>
      {editingId ? (
        <ModalShell
          as="form"
          size="lg"
          onSubmit={(event) => { event.preventDefault(); void saveLink() }}
          onOverlayClick={closeLinkEditor}
          header={<><h2>Sửa liên kết</h2><button type="button" className="modal-close" onClick={closeLinkEditor}>×</button></>}
          footer={<><button type="button" className="secondary-button" onClick={closeLinkEditor} disabled={busy}>Hủy</button><button type="submit" className="primary-button" disabled={busy || !editForm.label.trim() || !editForm.url.trim()}>{busy ? 'Đang lưu…' : 'Lưu thay đổi'}</button></>}
        >
          <p className="form-hint">Chọn đúng loại để liên kết hoạt động như mong muốn: nội bộ dùng đường dẫn bắt đầu bằng /; email dùng mailto:; điện thoại dùng tel:.</p>
          <div className="form-grid two-columns">
            <label className="form-field"><span className="field-label">Nhãn hiển thị</span><input required maxLength={180} autoFocus value={editForm.label} onChange={(event) => setEditForm((current) => ({ ...current, label: event.target.value }))} /></label>
            <label className="form-field"><span className="field-label">Đường dẫn</span><input required maxLength={1000} value={editForm.url} onChange={(event) => setEditForm((current) => ({ ...current, url: event.target.value }))} /></label>
            <label className="form-field"><span className="field-label">Loại liên kết</span><select value={editForm.type} onChange={(event) => setEditForm((current) => ({ ...current, type: event.target.value }))}><option value="internal">Nội bộ</option><option value="external">Bên ngoài</option><option value="email">Email</option><option value="phone">Điện thoại</option><option value="download">Tải xuống</option></select></label>
            <label className="form-field"><span className="field-label">Kiểu mở</span><select value={editForm.target} onChange={(event) => setEditForm((current) => ({ ...current, target: event.target.value }))}><option value="_self">Cùng cửa sổ</option><option value="_blank">Mở tab mới</option></select></label>
            <label className="form-field"><span className="field-label">Thứ tự hiển thị</span><input type="number" min={0} value={editForm.sortOrder} onChange={(event) => setEditForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} /></label>
          </div>
          <ToggleSwitch checked={editForm.isEnabled} onChange={(isEnabled) => setEditForm((current) => ({ ...current, isEnabled }))} label="Hiển thị trên website" hint={editForm.isEnabled ? 'Liên kết đang hiển thị công khai.' : 'Liên kết được lưu nhưng đang ẩn.'} />
        </ModalShell>
      ) : null}
      {adding ? (
        <ModalShell
          as="form"
          size="lg"
          onSubmit={(event) => { event.preventDefault(); void addLink() }}
          onOverlayClick={closeLinkEditor}
          header={<><h2>Thêm liên kết</h2><button type="button" className="modal-close" onClick={closeLinkEditor}>×</button></>}
          footer={<><button type="button" className="secondary-button" onClick={closeLinkEditor} disabled={busy}>Hủy</button><button type="submit" className="primary-button" disabled={busy || !newForm.label.trim() || !newForm.url.trim()}>{busy ? 'Đang thêm…' : 'Thêm liên kết'}</button></>}
        >
          <p className="form-hint">Với liên kết nội bộ, dùng đường dẫn bắt đầu bằng /. Email dùng mailto: và điện thoại dùng tel:.</p>
          <div className="form-grid two-columns">
            <label className="form-field"><span className="field-label">Nhãn hiển thị</span><input required maxLength={180} autoFocus value={newForm.label} onChange={(event) => setNewForm((current) => ({ ...current, label: event.target.value }))} /></label>
            <label className="form-field"><span className="field-label">Đường dẫn</span><input required maxLength={1000} placeholder="/lien-he, https://..., mailto:..." value={newForm.url} onChange={(event) => setNewForm((current) => ({ ...current, url: event.target.value }))} /></label>
            <label className="form-field"><span className="field-label">Loại liên kết</span><select value={newForm.type} onChange={(event) => setNewForm((current) => ({ ...current, type: event.target.value }))}><option value="internal">Nội bộ</option><option value="external">Bên ngoài</option><option value="email">Email</option><option value="phone">Điện thoại</option><option value="download">Tải xuống</option></select></label>
            <label className="form-field"><span className="field-label">Kiểu mở</span><select value={newForm.target} onChange={(event) => setNewForm((current) => ({ ...current, target: event.target.value }))}><option value="_self">Cùng cửa sổ</option><option value="_blank">Mở tab mới</option></select></label>
            <label className="form-field"><span className="field-label">Thứ tự hiển thị</span><input type="number" min={0} value={newForm.sortOrder} onChange={(event) => setNewForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))} /></label>
          </div>
          <ToggleSwitch checked={newForm.isEnabled} onChange={(isEnabled) => setNewForm((current) => ({ ...current, isEnabled }))} label="Hiển thị trên website" hint={newForm.isEnabled ? 'Liên kết sẽ hiển thị công khai ngay sau khi lưu.' : 'Liên kết sẽ được lưu ở trạng thái ẩn.'} />
        </ModalShell>
      ) : null}
    </div>
  )
}

export function NavigationEditor() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [linkGroups, setLinkGroups] = useState<LinkGroup[]>([])
  const [offeringsByUrl, setOfferingsByUrl] = useState<Record<string, OfferingResponse[]>>({})
  const [activeTab, setActiveTab] = useState<'menus' | 'links'>('menus')
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [menusRes, groupsRes, ...offeringsRes] = await Promise.all([
        listMenus(),
        listLinkGroups(),
        ...Object.values(OFFERING_MENU_MAP).map((entry) => listOfferings(entry.type, 'published')),
      ])
      setMenus(menusRes.items as Menu[])
      setLinkGroups(groupsRes.items as LinkGroup[])
      setOfferingsByUrl(
        Object.fromEntries(
          Object.keys(OFFERING_MENU_MAP).map((url, index) => [
            url,
            [...(offeringsRes[index]?.items ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
          ]),
        ),
      )
    } catch {
      toast.error('Không tải được dữ liệu menu.')
    } finally {
      setLoading(false)
    }
  }

  const handleSeedDefaults = async () => {
    setSeeding(true)
    try {
      const res = await seedDefaultMenus()
      await load()
      toast.success(`Đã tạo: ${res.created.join(', ')}`)
    } catch {
      toast.error('Tạo menu mặc định thất bại.')
    } finally {
      setSeeding(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <div className="admin-module">
      <PageHeader
        title="Menu &amp; Điều hướng"
        description="Sắp xếp menu điều hướng và các nhóm liên kết hiển thị trên website."
        actions={
          <button type="button" className="btn-secondary" onClick={() => void handleSeedDefaults()} disabled={seeding}>
            {seeding ? 'Đang đồng bộ...' : '↺ Đồng bộ theo giao diện web'}
          </button>
        }
      />

      <div className="tab-nav">
        <button
          type="button"
          className={activeTab === 'menus' ? 'is-active' : ''}
          onClick={() => setActiveTab('menus')}
        >
          Menu điều hướng
        </button>
        <button
          type="button"
          className={activeTab === 'links' ? 'is-active' : ''}
          onClick={() => setActiveTab('links')}
        >
          Nhóm liên kết
        </button>
      </div>

      {loading && <p className="admin-info">Đang tải...</p>}

      {activeTab === 'menus' && !loading && (
        <div>
          {menus.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                background: '#f8fafc',
                borderRadius: 12,
                border: '1px dashed #c8d8e8',
              }}
            >
              <p style={{ color: '#64748b', marginBottom: 16 }}>Chưa có menu nào trong database.</p>
              <button
                type="button"
                className="btn-primary"
                onClick={() => void handleSeedDefaults()}
                disabled={seeding}
                style={{ padding: '10px 24px' }}
              >
                {seeding ? 'Đang tạo...' : '✨ Tạo menu mặc định'}
              </button>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12 }}>
                Tạo Menu chính (main-nav) và Footer (footer-nav) với các mục điều hướng cơ bản.
              </p>
            </div>
          )}
          {menus.map((menu) => (
            <div key={menu.id} className="menu-section">
              <h3>
                {menu.name} <small>({menu.location})</small>
              </h3>
              {menu.location === 'main-nav' && menu.items.length > 0 && (
                <p className="admin-info">
                  Các thẻ dưới đây khớp từng mục trên thanh điều hướng website (theo đúng thứ tự). Ẩn/hiện, đổi nhãn
                  hoặc thứ tự sẽ áp dụng ngay ngoài trang người dùng.
                </p>
              )}
              {menu.items.map((item, index) => {
                const offeringEntry = menu.location === 'main-nav' ? OFFERING_MENU_MAP[item.url] : undefined
                return (
                  <div key={item.id} className="menu-top-card">
                    <span className="menu-top-order">#{index + 1}</span>
                    <MenuItemRow item={item} location={menu.location} depth={0} parentChoices={flattenMenuItems(menu.items)} onRefresh={() => void load()} />
                    {offeringEntry && (
                      <>
                        <p className="menu-item-hint">
                          Danh sách con lấy tự động từ "Phần mềm &amp; Giải pháp" — sửa nội dung ở đó, không sửa ở đây:
                        </p>
                        <OfferingPreviewList items={offeringsByUrl[item.url] ?? []} prefix={offeringEntry.prefix} />
                      </>
                    )}
                  </div>
                )
              })}
              <AddMenuItemForm location={menu.location} parentId={null} onDone={() => void load()} />
            </div>
          ))}
        </div>
      )}

      {activeTab === 'links' && !loading && (
        <div>
          {linkGroups.length === 0 && <p className="admin-info">Chưa có nhóm liên kết. Chạy seed script để tạo.</p>}
          {linkGroups.map((group) => (
            <LinkGroupSection key={group.id} group={group} onRefresh={() => void load()} />
          ))}
        </div>
      )}
    </div>
  )
}
