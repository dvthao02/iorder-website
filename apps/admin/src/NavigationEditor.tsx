import { useEffect, useState } from 'react'
import { deleteContentLink, deleteMenuItem, listLinkGroups, listMenus, seedDefaultMenus, upsertContentLink, upsertMenuItem } from './api'
import { toast } from './toast'
import { PageHeader, StatusDot, ToggleSwitch } from './ui'

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

function MenuItemRow({
  item,
  location,
  depth,
  onRefresh,
}: {
  item: MenuItem
  location: string
  depth: number
  onRefresh: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ label: item.label, url: item.url, target: item.target, icon: item.icon ?? '', sortOrder: item.sortOrder, isEnabled: item.isEnabled, parentId: item.parentId })
  const [busy, setBusy] = useState(false)

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
      setEditing(false)
      onRefresh()
      toast.success('Đã lưu mục menu.')
    } catch {
      toast.error('Không thể lưu mục menu.')
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

  return (
    <div className="nav-item" style={{ marginLeft: depth * 20 }}>
      {editing ? (
        <div className="nav-item-form">
          <input placeholder="Nhãn" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} />
          <input placeholder="URL hoặc đường dẫn" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
          <select value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}>
            <option value="_self">Cùng tab</option>
            <option value="_blank">Tab mới</option>
          </select>
          <input placeholder="Icon key (tuỳ chọn)" value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} style={{ width: 120 }} />
          <input type="number" placeholder="Thứ tự" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} style={{ width: 80 }} />
          <ToggleSwitch checked={form.isEnabled} onChange={(next) => setForm((f) => ({ ...f, isEnabled: next }))} label="Hiển thị" />
          <button type="button" className="btn-primary" onClick={() => void save()} disabled={busy}>Lưu</button>
          <button type="button" className="btn-secondary" onClick={() => setEditing(false)} disabled={busy}>Hủy</button>
        </div>
      ) : (
        <div className="nav-item-row">
          <StatusDot tone={item.isEnabled ? 'on' : 'muted'} />
          <span className={item.isEnabled ? '' : 'nav-disabled'}>
            <strong>{item.label}</strong> <small>→ {item.url}</small>
            {item.target === '_blank' && <small> ↗</small>}
          </span>
          <div className="nav-item-actions">
            <button type="button" className="btn-secondary" onClick={() => setEditing(true)}>Sửa</button>
            <button type="button" className="btn-danger" onClick={() => void remove()} disabled={busy}>Xóa</button>
          </div>
        </div>
      )}
      {item.children.map((child) => (
        <MenuItemRow key={child.id} item={child} location={location} depth={depth + 1} onRefresh={onRefresh} />
      ))}
      <AddMenuItemForm location={location} parentId={item.id} onDone={onRefresh} />
    </div>
  )
}

function AddMenuItemForm({ location, parentId, onDone }: { location: string; parentId: string | null; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ label: '', url: '', target: '_self', icon: '', sortOrder: 0, isEnabled: true })
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!form.label || !form.url) return
    setBusy(true)
    try {
      await upsertMenuItem(location, 'new', { label: form.label, url: form.url, target: form.target as '_self' | '_blank', icon: form.icon || null, sortOrder: form.sortOrder, isEnabled: form.isEnabled, parentId })
      setForm({ label: '', url: '', target: '_self', icon: '', sortOrder: 0, isEnabled: true })
      setOpen(false)
      onDone()
      toast.success('Đã thêm mục menu.')
    } catch {
      toast.error('Không thể thêm mục menu.')
    } finally {
      setBusy(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        className="btn-secondary"
        style={{ marginTop: 6, marginLeft: parentId ? 20 : 0 }}
        onClick={() => setOpen(true)}
      >
        + Thêm mục{parentId ? ' con' : ''}
      </button>
    )
  }

  return (
    <div className="nav-item-form" style={{ marginLeft: parentId ? 20 : 0 }}>
      <input placeholder="Nhãn *" value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} required />
      <input placeholder="URL hoặc đường dẫn *" value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} required />
      <select value={form.target} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))}>
        <option value="_self">Cùng tab</option>
        <option value="_blank">Tab mới</option>
      </select>
      <input type="number" placeholder="Thứ tự" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))} style={{ width: 80 }} />
      <button type="button" className="btn-primary" onClick={() => void save()} disabled={busy || !form.label || !form.url}>Thêm</button>
      <button type="button" className="btn-secondary" onClick={() => setOpen(false)} disabled={busy}>Hủy</button>
    </div>
  )
}

function LinkGroupSection({ group, onRefresh }: { group: LinkGroup; onRefresh: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ label: '', url: '', type: 'external', target: '_self', sortOrder: 0, isEnabled: true })
  const [adding, setAdding] = useState(false)
  const [newForm, setNewForm] = useState({ label: '', url: '', type: 'external', target: '_self', sortOrder: 0, isEnabled: true })
  const [busy, setBusy] = useState(false)

  const startEdit = (link: ContentLink) => {
    setEditingId(link.id)
    setEditForm({ label: link.label, url: link.url, type: link.type, target: link.target, sortOrder: link.sortOrder, isEnabled: link.isEnabled })
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

  return (
    <div className="link-group-section">
      <h4>{group.name} <small>({group.code})</small></h4>
      {group.links.map((link) =>
        editingId === link.id ? (
          <div key={link.id} className="nav-item-form">
            <input placeholder="Nhãn" value={editForm.label} onChange={(e) => setEditForm((f) => ({ ...f, label: e.target.value }))} />
            <input placeholder="URL" value={editForm.url} onChange={(e) => setEditForm((f) => ({ ...f, url: e.target.value }))} />
            <select value={editForm.type} onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}>
              <option value="internal">Nội bộ</option>
              <option value="external">Bên ngoài</option>
              <option value="email">Email</option>
              <option value="phone">Điện thoại</option>
            </select>
            <ToggleSwitch checked={editForm.isEnabled} onChange={(next) => setEditForm((f) => ({ ...f, isEnabled: next }))} label="Hiển thị" />
            <button type="button" className="btn-primary" onClick={() => void saveLink()} disabled={busy}>Lưu</button>
            <button type="button" className="btn-secondary" onClick={() => setEditingId(null)} disabled={busy}>Hủy</button>
          </div>
        ) : (
          <div key={link.id} className="nav-item-row">
            <StatusDot tone={link.isEnabled ? 'on' : 'muted'} />
            <span className={link.isEnabled ? '' : 'nav-disabled'}>
              <strong>{link.label}</strong> <small>→ {link.url}</small>
            </span>
            <div className="nav-item-actions">
              <button type="button" className="btn-secondary" onClick={() => startEdit(link)}>Sửa</button>
              <button type="button" className="btn-danger" onClick={() => void removeLink(link.id)}>Xóa</button>
            </div>
          </div>
        )
      )}
      {adding ? (
        <div className="nav-item-form">
          <input placeholder="Nhãn *" value={newForm.label} onChange={(e) => setNewForm((f) => ({ ...f, label: e.target.value }))} />
          <input placeholder="URL *" value={newForm.url} onChange={(e) => setNewForm((f) => ({ ...f, url: e.target.value }))} />
          <select value={newForm.type} onChange={(e) => setNewForm((f) => ({ ...f, type: e.target.value }))}>
            <option value="internal">Nội bộ</option>
            <option value="external">Bên ngoài</option>
            <option value="email">Email</option>
            <option value="phone">Điện thoại</option>
          </select>
          <button type="button" className="btn-primary" onClick={() => void addLink()} disabled={busy}>Thêm</button>
          <button type="button" className="btn-secondary" onClick={() => setAdding(false)}>Hủy</button>
        </div>
      ) : (
        <button type="button" className="btn-secondary" style={{ marginTop: 8 }} onClick={() => setAdding(true)}>+ Thêm liên kết</button>
      )}
    </div>
  )
}

export function NavigationEditor() {
  const [menus, setMenus] = useState<Menu[]>([])
  const [linkGroups, setLinkGroups] = useState<LinkGroup[]>([])
  const [activeTab, setActiveTab] = useState<'menus' | 'links'>('menus')
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const [menusRes, groupsRes] = await Promise.all([listMenus(), listLinkGroups()])
      setMenus(menusRes.items as Menu[])
      setLinkGroups(groupsRes.items as LinkGroup[])
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

  useEffect(() => { void load() }, [])

  return (
    <div className="admin-module">
      <PageHeader
        title="Menu &amp; Điều hướng"
        description="Sắp xếp menu điều hướng và các nhóm liên kết hiển thị trên website."
      />

      <div className="tab-nav">
        <button type="button" className={activeTab === 'menus' ? 'is-active' : ''} onClick={() => setActiveTab('menus')}>Menu điều hướng</button>
        <button type="button" className={activeTab === 'links' ? 'is-active' : ''} onClick={() => setActiveTab('links')}>Nhóm liên kết</button>
      </div>

      {loading && <p className="admin-info">Đang tải...</p>}

      {activeTab === 'menus' && !loading && (
        <div>
          {menus.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: '#f8fafc', borderRadius: 12, border: '1px dashed #c8d8e8' }}>
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
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 12 }}>Tạo Menu chính (main-nav) và Footer (footer-nav) với các mục điều hướng cơ bản.</p>
            </div>
          )}
          {menus.map((menu) => (
            <div key={menu.id} className="menu-section">
              <h3>{menu.name} <small>({menu.location})</small></h3>
              {menu.items.map((item) => (
                <MenuItemRow key={item.id} item={item} location={menu.location} depth={0} onRefresh={() => void load()} />
              ))}
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
