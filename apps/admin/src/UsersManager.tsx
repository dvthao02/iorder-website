import type { CmsRole, CreateUserInput, UpdateUserInput, UserStatus, UserSummary } from '@iorder/contracts'
import { Pencil, Plus, ShieldOff } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { createUser, disableUser, listUsers, resetUserPassword, updateUser } from './api'
import { toast } from './toast'
import { ModalShell, PageHeader, StatusDot, useEscapeAndSave } from './ui'

const ROLE_LABEL: Record<CmsRole, string> = {
  admin: 'Quản trị viên',
  editor: 'Biên tập viên',
  author: 'Tác giả',
}

const STATUS_LABEL: Record<UserStatus, string> = {
  active: 'Đang hoạt động',
  disabled: 'Đã vô hiệu hóa',
}

const ALL_ROLES: CmsRole[] = ['admin', 'editor', 'author']

const emptyCreateForm: CreateUserInput = {
  username: '',
  email: null,
  fullName: '',
  password: '',
  roles: ['editor'],
}

function emptyUpdateForm(user: UserSummary): UpdateUserInput {
  return {
    fullName: user.fullName,
    email: user.email,
    roles: user.roles,
    status: user.status,
  }
}

function formatDateTime(value: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleString('vi-VN')
}

export function UsersManager() {
  const [items, setItems] = useState<UserSummary[]>([])
  const [loading, setLoading] = useState(true)

  const [createOpen, setCreateOpen] = useState(false)
  const [createForm, setCreateForm] = useState<CreateUserInput>(emptyCreateForm)
  const [isCreating, setIsCreating] = useState(false)
  const createFormRef = useRef<HTMLFormElement>(null)

  const [editingUser, setEditingUser] = useState<UserSummary | null>(null)
  const [editForm, setEditForm] = useState<UpdateUserInput | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const editFormRef = useRef<HTMLFormElement>(null)

  const [resettingUser, setResettingUser] = useState<UserSummary | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const resetFormRef = useRef<HTMLFormElement>(null)

  const loadData = async () => {
    const result = await listUsers()
    setItems(result.items)
  }

  useEffect(() => {
    void loadData()
      .catch(() => toast.error('Không thể tải danh sách người dùng.'))
      .finally(() => setLoading(false))
  }, [])

  useEscapeAndSave({
    active: createOpen,
    onSave: () => createFormRef.current?.requestSubmit(),
    onEscape: () => setCreateOpen(false),
  })
  useEscapeAndSave({
    active: Boolean(editingUser),
    onSave: () => editFormRef.current?.requestSubmit(),
    onEscape: () => setEditingUser(null),
  })
  useEscapeAndSave({
    active: Boolean(resettingUser),
    onSave: () => resetFormRef.current?.requestSubmit(),
    onEscape: () => setResettingUser(null),
  })

  const openCreate = () => {
    setCreateForm(emptyCreateForm)
    setCreateOpen(true)
  }

  const openEdit = (user: UserSummary) => {
    setEditingUser(user)
    setEditForm(emptyUpdateForm(user))
  }

  const openResetPassword = (user: UserSummary) => {
    setResettingUser(user)
    setResetPassword('')
  }

  const toggleRole = (roles: CmsRole[], role: CmsRole): CmsRole[] =>
    roles.includes(role) ? roles.filter((item) => item !== role) : [...roles, role]

  const submitCreate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsCreating(true)
    try {
      await createUser(createForm)
      await loadData()
      setCreateOpen(false)
      toast.success('Đã tạo người dùng mới.')
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      toast.error(code === 'DUPLICATE_USERNAME' ? 'Tên đăng nhập đã tồn tại.' : 'Không thể tạo người dùng.')
    } finally {
      setIsCreating(false)
    }
  }

  const submitEdit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!editingUser || !editForm) return
    setIsSaving(true)
    try {
      await updateUser(editingUser.id, editForm)
      await loadData()
      setEditingUser(null)
      toast.success('Đã cập nhật người dùng.')
    } catch (error) {
      const code = error instanceof Error ? error.message : ''
      toast.error(code === 'SELF_MODIFICATION_FORBIDDEN' ? 'Không thể tự sửa tài khoản của mình.' : 'Không thể lưu.')
    } finally {
      setIsSaving(false)
    }
  }

  const submitResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!resettingUser) return
    setIsResetting(true)
    try {
      await resetUserPassword(resettingUser.id, resetPassword)
      setResettingUser(null)
      toast.success('Đã đặt lại mật khẩu. Người dùng cần đăng nhập lại.')
    } catch {
      toast.error('Không thể đặt lại mật khẩu.')
    } finally {
      setIsResetting(false)
    }
  }

  const handleDisable = (user: UserSummary) => {
    toast.warning(`Đã vô hiệu hóa "${user.fullName}". Người dùng sẽ bị đăng xuất khỏi mọi phiên.`)
    disableUser(user.id)
      .then(() => loadData())
      .catch((error: unknown) => {
        const code = error instanceof Error ? error.message : ''
        toast.error(
          code === 'SELF_MODIFICATION_FORBIDDEN'
            ? 'Không thể tự vô hiệu hóa tài khoản của mình.'
            : 'Không thể vô hiệu hóa.',
        )
      })
  }

  return (
    <section className="admin-card content-manager">
      <PageHeader
        title={<>Người dùng</>}
        description={<>Quản lý tài khoản truy cập CMS, vai trò và trạng thái đăng nhập.</>}
        actions={
          <button className="btn-primary btn-icon" type="button" onClick={openCreate}>
            <Plus size={16} /> Thêm user
          </button>
        }
      />

      {loading && <p className="admin-info">Đang tải...</p>}

      {!loading && items.length === 0 && (
        <div className="admin-empty">
          <Plus size={36} />
          <p>Chưa có người dùng nào.</p>
          <button type="button" className="btn-primary btn-icon" onClick={openCreate}>
            <Plus size={15} /> Thêm user đầu tiên
          </button>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Tên đăng nhập</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Đăng nhập gần nhất</th>
                <th className="col-actions">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((user) => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.fullName}</strong>
                  </td>
                  <td>@{user.username}</td>
                  <td>{user.email ?? <span className="muted">—</span>}</td>
                  <td>
                    {user.roles.map((role) => (
                      <span key={role} className="kind-badge kind-partner" style={{ marginRight: 4 }}>
                        {ROLE_LABEL[role]}
                      </span>
                    ))}
                  </td>
                  <td>
                    <span className="status-pill">
                      <StatusDot tone={user.status === 'active' ? 'on' : 'muted'} />
                      {STATUS_LABEL[user.status]}
                    </span>
                  </td>
                  <td>{formatDateTime(user.lastLoginAt)}</td>
                  <td className="col-actions">
                    <button
                      type="button"
                      className="row-action icon-only"
                      title="Sửa"
                      aria-label={`Sửa ${user.fullName}`}
                      onClick={() => openEdit(user)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button type="button" className="row-action" onClick={() => openResetPassword(user)}>
                      Reset mật khẩu
                    </button>
                    {user.status === 'active' ? (
                      <button
                        type="button"
                        className="row-action icon-only is-danger"
                        title="Vô hiệu hóa"
                        aria-label={`Vô hiệu hóa ${user.fullName}`}
                        onClick={() => handleDisable(user)}
                      >
                        <ShieldOff size={16} />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {createOpen ? (
        <ModalShell
          as="form"
          formRef={createFormRef}
          onSubmit={submitCreate}
          onOverlayClick={() => setCreateOpen(false)}
          header={
            <>
              <button type="button" className="modal-back" onClick={() => setCreateOpen(false)}>
                ← Trở về
              </button>
              <h2>Thêm user</h2>
            </>
          }
          footer={
            <>
              <button type="button" className="secondary-button" onClick={() => setCreateOpen(false)}>
                Hủy
              </button>
              <button className="btn-primary" disabled={isCreating} type="submit">
                {isCreating ? 'Đang lưu...' : 'Lưu'}
              </button>
            </>
          }
        >
          <div className="form-row-2col">
            <label>
              Tên đăng nhập
              <input
                required
                maxLength={80}
                value={createForm.username}
                onChange={(event) => setCreateForm((current) => ({ ...current, username: event.target.value }))}
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={createForm.email ?? ''}
                onChange={(event) => setCreateForm((current) => ({ ...current, email: event.target.value || null }))}
              />
            </label>
          </div>

          <label>
            Họ tên
            <input
              required
              maxLength={180}
              value={createForm.fullName}
              onChange={(event) => setCreateForm((current) => ({ ...current, fullName: event.target.value }))}
            />
          </label>

          <label>
            Mật khẩu
            <input
              required
              type="password"
              minLength={10}
              value={createForm.password}
              onChange={(event) => setCreateForm((current) => ({ ...current, password: event.target.value }))}
            />
          </label>

          <fieldset className="form-row-2col">
            <legend>Vai trò</legend>
            {ALL_ROLES.map((role) => (
              <label key={role} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={createForm.roles.includes(role)}
                  onChange={() => setCreateForm((current) => ({ ...current, roles: toggleRole(current.roles, role) }))}
                />
                {ROLE_LABEL[role]}
              </label>
            ))}
          </fieldset>
        </ModalShell>
      ) : null}

      {editingUser && editForm ? (
        <ModalShell
          as="form"
          formRef={editFormRef}
          onSubmit={submitEdit}
          onOverlayClick={() => setEditingUser(null)}
          header={
            <>
              <button type="button" className="modal-back" onClick={() => setEditingUser(null)}>
                ← Trở về
              </button>
              <h2>Sửa: {editingUser.fullName}</h2>
            </>
          }
          footer={
            <>
              <button type="button" className="secondary-button" onClick={() => setEditingUser(null)}>
                Hủy
              </button>
              <button className="btn-primary" disabled={isSaving} type="submit">
                {isSaving ? 'Đang lưu...' : 'Lưu'}
              </button>
            </>
          }
        >
          <div className="form-row-2col">
            <label>
              Họ tên
              <input
                required
                maxLength={180}
                value={editForm.fullName}
                onChange={(event) =>
                  setEditForm((current) => (current ? { ...current, fullName: event.target.value } : current))
                }
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={editForm.email ?? ''}
                onChange={(event) =>
                  setEditForm((current) => (current ? { ...current, email: event.target.value || null } : current))
                }
              />
            </label>
          </div>

          <fieldset className="form-row-2col">
            <legend>Vai trò</legend>
            {ALL_ROLES.map((role) => (
              <label key={role} className="checkbox-row">
                <input
                  type="checkbox"
                  checked={editForm.roles.includes(role)}
                  onChange={() =>
                    setEditForm((current) =>
                      current ? { ...current, roles: toggleRole(current.roles, role) } : current,
                    )
                  }
                />
                {ROLE_LABEL[role]}
              </label>
            ))}
          </fieldset>

          <label>
            Trạng thái
            <select
              value={editForm.status}
              onChange={(event) =>
                setEditForm((current) => (current ? { ...current, status: event.target.value as UserStatus } : current))
              }
            >
              <option value="active">Đang hoạt động</option>
              <option value="disabled">Đã vô hiệu hóa</option>
            </select>
          </label>
        </ModalShell>
      ) : null}

      {resettingUser ? (
        <ModalShell
          as="form"
          formRef={resetFormRef}
          onSubmit={submitResetPassword}
          onOverlayClick={() => setResettingUser(null)}
          header={
            <>
              <button type="button" className="modal-back" onClick={() => setResettingUser(null)}>
                ← Trở về
              </button>
              <h2>Reset mật khẩu: {resettingUser.fullName}</h2>
            </>
          }
          footer={
            <>
              <button type="button" className="secondary-button" onClick={() => setResettingUser(null)}>
                Hủy
              </button>
              <button className="btn-primary" disabled={isResetting} type="submit">
                {isResetting ? 'Đang lưu...' : 'Đặt lại'}
              </button>
            </>
          }
        >
          <label>
            Mật khẩu mới
            <input
              required
              type="password"
              minLength={10}
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
            />
          </label>
          <p className="muted">Người dùng sẽ bị đăng xuất khỏi mọi phiên đang hoạt động sau khi đặt lại.</p>
        </ModalShell>
      ) : null}
    </section>
  )
}
