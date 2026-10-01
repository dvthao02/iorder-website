import { Clock3, Search, type LucideIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

import { navigationGroups } from './sidebar/navigation'
import { ModalShell } from './ui'

type NavigationItem = {
  key: string
  label: string
  group: string
  icon: LucideIcon
}

const groupLabelById = new Map(navigationGroups.map((group) => [group.id, group.label || 'Tổng quan']))

export function ContentQuickSwitcher({
  items,
  recentKeys,
  onNavigate,
  onClose,
}: {
  items: readonly NavigationItem[]
  recentKeys: string[]
  onNavigate: (key: string) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const normalizedQuery = query.trim().toLocaleLowerCase('vi-VN')
  const recentItems = useMemo(
    () => recentKeys.map((key) => items.find((item) => item.key === key)).filter((item): item is NavigationItem => !!item),
    [items, recentKeys],
  )
  const matches = useMemo(
    () =>
      items.filter((item) => {
        if (!normalizedQuery) return true
        const groupLabel = groupLabelById.get(item.group) ?? ''
        return `${item.label} ${groupLabel}`.toLocaleLowerCase('vi-VN').includes(normalizedQuery)
      }),
    [items, normalizedQuery],
  )

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  const open = (key: string) => {
    onNavigate(key)
    onClose()
  }

  return (
    <ModalShell
      as="div"
      size="lg"
      onOverlayClick={onClose}
      header={
        <>
          <div>
            <h2>Đi nhanh trong Content Studio</h2>
            <p>Tìm phân hệ bạn cần quản lý.</p>
          </div>
          <button type="button" className="modal-close" aria-label="Đóng tìm nhanh" onClick={onClose}>
            ×
          </button>
        </>
      }
      footer={<small className="quick-switcher-hint">Nhấn Esc để đóng · Ctrl/Cmd + K để mở lại</small>}
    >
      <div className="quick-switcher">
        <label className="quick-switcher-input">
          <Search size={18} aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            placeholder="Tìm Trang chủ, thiết bị, thư viện…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        {!normalizedQuery && recentItems.length > 0 ? (
          <QuickSwitcherSection label="Gần đây" icon={<Clock3 size={15} />} items={recentItems} onOpen={open} />
        ) : null}
        <QuickSwitcherSection
          label={normalizedQuery ? `Kết quả (${matches.length})` : 'Tất cả phân hệ'}
          items={matches}
          onOpen={open}
          emptyMessage="Không tìm thấy phân hệ phù hợp."
        />
      </div>
    </ModalShell>
  )
}

function QuickSwitcherSection({
  label,
  icon,
  items,
  onOpen,
  emptyMessage,
}: {
  label: string
  icon?: ReactNode
  items: NavigationItem[]
  onOpen: (key: string) => void
  emptyMessage?: string
}) {
  return (
    <section className="quick-switcher-section" aria-label={label}>
      <h3>
        {icon}
        {label}
      </h3>
      {items.length ? (
        <div className="quick-switcher-results">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <button key={item.key} type="button" onClick={() => onOpen(item.key)}>
                <Icon size={18} />
                <span>
                  <strong>{item.label}</strong>
                  <small>{groupLabelById.get(item.group) ?? 'Content Studio'}</small>
                </span>
              </button>
            )
          })}
        </div>
      ) : (
        <p className="quick-switcher-empty">{emptyMessage ?? 'Chưa có mục nào.'}</p>
      )}
    </section>
  )
}
