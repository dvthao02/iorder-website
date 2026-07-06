import { fireEvent, render, renderHook, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ActionMenu, DateTimePicker, ModalShell, useEscapeAndSave } from './ui'

function fireKeydown(init: KeyboardEventInit) {
  window.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, ...init }))
}

describe('useEscapeAndSave', () => {
  it('calls onSave on Ctrl+S and onEscape on Escape while active', () => {
    const onSave = vi.fn()
    const onEscape = vi.fn()
    renderHook(() => useEscapeAndSave({ active: true, onSave, onEscape }))

    fireKeydown({ key: 's', ctrlKey: true })
    expect(onSave).toHaveBeenCalledTimes(1)

    fireKeydown({ key: 'Escape' })
    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('does not attach any listener when active is false', () => {
    const onSave = vi.fn()
    const onEscape = vi.fn()
    renderHook(() => useEscapeAndSave({ active: false, onSave, onEscape }))

    fireKeydown({ key: 's', ctrlKey: true })
    fireKeydown({ key: 'Escape' })

    expect(onSave).not.toHaveBeenCalled()
    expect(onEscape).not.toHaveBeenCalled()
  })

  it('skips onEscape when not provided, without throwing', () => {
    const onSave = vi.fn()
    renderHook(() => useEscapeAndSave({ active: true, onSave }))

    expect(() => fireKeydown({ key: 'Escape' })).not.toThrow()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('always calls the latest onSave callback across re-renders (no stale closure)', () => {
    const firstSave = vi.fn()
    const secondSave = vi.fn()
    const { rerender } = renderHook(({ onSave }) => useEscapeAndSave({ active: true, onSave }), {
      initialProps: { onSave: firstSave },
    })

    rerender({ onSave: secondSave })
    fireKeydown({ key: 's', ctrlKey: true })

    expect(firstSave).not.toHaveBeenCalled()
    expect(secondSave).toHaveBeenCalledTimes(1)
  })

  it('removes the listener on unmount', () => {
    const onSave = vi.fn()
    const { unmount } = renderHook(() => useEscapeAndSave({ active: true, onSave }))
    unmount()

    fireKeydown({ key: 's', ctrlKey: true })
    expect(onSave).not.toHaveBeenCalled()
  })
})

describe('ModalShell', () => {
  it('renders header, children, and footer in the modal-head/body/foot regions', () => {
    render(
      <ModalShell as="div" onOverlayClick={() => {}} header={<span>Tiêu đề</span>} footer={<span>Chân trang</span>}>
        <span>Nội dung</span>
      </ModalShell>,
    )

    expect(screen.getByText('Tiêu đề').closest('.modal-head')).not.toBeNull()
    expect(screen.getByText('Nội dung').closest('.modal-body')).not.toBeNull()
    expect(screen.getByText('Chân trang').closest('.modal-foot')).not.toBeNull()
  })

  it('omits the modal-foot element entirely when footer is not provided', () => {
    const { container } = render(
      <ModalShell as="div" onOverlayClick={() => {}} header={<span>Tiêu đề</span>}>
        <span>Nội dung</span>
      </ModalShell>,
    )

    expect(container.querySelector('.modal-foot')).toBeNull()
  })

  it('calls onOverlayClick when clicking the backdrop but not when clicking inside the card', () => {
    const onOverlayClick = vi.fn()
    render(
      <ModalShell as="div" onOverlayClick={onOverlayClick} header={<span>Tiêu đề</span>} footer={<span>Foot</span>}>
        <button type="button">Trong card</button>
      </ModalShell>,
    )

    fireEvent.click(screen.getByText('Trong card'))
    expect(onOverlayClick).not.toHaveBeenCalled()

    fireEvent.click(document.querySelector('.modal-overlay')!)
    expect(onOverlayClick).toHaveBeenCalledTimes(1)
  })

  it('renders a <form> element and fires onSubmit when as="form"', () => {
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault())
    const { container } = render(
      <ModalShell
        as="form"
        onSubmit={onSubmit}
        onOverlayClick={() => {}}
        header={<span>Tiêu đề</span>}
        footer={<button type="submit">Lưu</button>}
      >
        <span>Nội dung</span>
      </ModalShell>,
    )

    expect(container.querySelector('form.modal-card')).not.toBeNull()
    fireEvent.click(screen.getByText('Lưu'))
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('applies the modal-card-lg class when size="lg"', () => {
    const { container } = render(
      <ModalShell as="div" size="lg" onOverlayClick={() => {}} header={<span>H</span>} footer={<span>F</span>}>
        <span>Body</span>
      </ModalShell>,
    )

    expect(container.querySelector('.modal-card.modal-card-lg')).not.toBeNull()
  })
})

describe('ActionMenu', () => {
  const buildItems = (onNormal = vi.fn(), onDisabled = vi.fn()) => [
    { label: 'Xem trước', onClick: onNormal },
    { divider: true as const },
    { label: 'Ẩn', onClick: onDisabled, disabled: true, tone: 'danger' as const },
  ]

  it('renders the trigger closed by default, with no menu items visible', () => {
    render(<ActionMenu items={buildItems()} />)

    expect(screen.queryByRole('menu')).toBeNull()
    expect(screen.queryByText('Xem trước')).toBeNull()
  })

  it('opens the menu and shows items when the trigger is clicked', () => {
    render(<ActionMenu items={buildItems()} />)

    fireEvent.click(screen.getByRole('button', { name: '' }))

    expect(screen.getByRole('menu')).not.toBeNull()
    expect(screen.getByText('Xem trước')).not.toBeNull()
  })

  it('calls onClick for a normal item and closes the menu', () => {
    const onNormal = vi.fn()
    render(<ActionMenu items={buildItems(onNormal)} />)

    fireEvent.click(screen.getByRole('button', { name: '' }))
    fireEvent.click(screen.getByText('Xem trước'))

    expect(onNormal).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('closes the menu when Escape is pressed while open', () => {
    render(<ActionMenu items={buildItems()} />)

    fireEvent.click(screen.getByRole('button', { name: '' }))
    expect(screen.getByRole('menu')).not.toBeNull()

    fireEvent.keyDown(document, { key: 'Escape' })

    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('closes the menu when clicking outside', () => {
    render(
      <div>
        <div data-testid="outside">Bên ngoài</div>
        <ActionMenu items={buildItems()} />
      </div>,
    )

    fireEvent.click(screen.getByRole('button', { name: '' }))
    expect(screen.getByRole('menu')).not.toBeNull()

    fireEvent.click(screen.getByTestId('outside'))

    expect(screen.queryByRole('menu')).toBeNull()
  })

  it('renders a divider that is not a clickable menuitem', () => {
    const { container } = render(<ActionMenu items={buildItems()} />)

    fireEvent.click(screen.getByRole('button', { name: '' }))

    const divider = container.querySelector('.action-menu-divider')
    expect(divider).not.toBeNull()
    expect(divider?.tagName).toBe('DIV')
    expect(screen.getAllByRole('menuitem')).toHaveLength(2)
  })

  it('does not call onClick when a disabled item is clicked', () => {
    const onDisabled = vi.fn()
    render(<ActionMenu items={buildItems(vi.fn(), onDisabled)} />)

    fireEvent.click(screen.getByRole('button', { name: '' }))
    fireEvent.click(screen.getByText('Ẩn'))

    expect(onDisabled).not.toHaveBeenCalled()
    expect(screen.getByRole('menu')).not.toBeNull()
  })
})

describe('DateTimePicker', () => {
  it('emits a Date built from the 24h HH:mm text input', () => {
    const onChange = vi.fn()
    const value = new Date(2026, 6, 5, 8, 0)
    const { container } = render(<DateTimePicker value={value} onChange={onChange} />)

    const timeInput = container.querySelector('.datetime-picker-time') as HTMLInputElement
    fireEvent.change(timeInput, { target: { value: '21:05' } })

    expect(onChange).toHaveBeenCalledTimes(1)
    const next = onChange.mock.calls[0]?.[0] as Date
    expect(next.getHours()).toBe(21)
    expect(next.getMinutes()).toBe(5)
  })

  it('flags invalid time text without emitting a change', () => {
    const onChange = vi.fn()
    const { container } = render(<DateTimePicker value={new Date(2026, 6, 5, 8, 0)} onChange={onChange} />)

    const timeInput = container.querySelector('.datetime-picker-time') as HTMLInputElement
    fireEvent.change(timeInput, { target: { value: '25:99' } })

    expect(onChange).not.toHaveBeenCalled()
    expect(timeInput.className).toContain('is-error')
  })

  it('clears to null via the Xóa button', () => {
    const onChange = vi.fn()
    render(<DateTimePicker value={new Date(2026, 6, 5, 8, 0)} onChange={onChange} />)

    fireEvent.click(screen.getByText('Xóa'))

    expect(onChange).toHaveBeenCalledWith(null)
  })
})
