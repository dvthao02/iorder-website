import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { ContentQuickSwitcher } from './ContentQuickSwitcher'
import { navigation } from './sidebar/navigation'

describe('ContentQuickSwitcher', () => {
  const items = navigation.filter((item) => ['software', 'sales-equipment', 'media'].includes(item.key))

  it('shows recent modules and filters the available modules', () => {
    render(<ContentQuickSwitcher items={items} recentKeys={['media']} onNavigate={vi.fn()} onClose={vi.fn()} />)

    expect(screen.getByText('Gần đây')).not.toBeNull()
    expect(screen.getAllByText('Thư viện media').length).toBeGreaterThan(0)

    fireEvent.change(screen.getByPlaceholderText('Tìm Trang chủ, thiết bị, thư viện…'), {
      target: { value: 'thiết bị' },
    })

    expect(screen.getByText('Thiết bị')).not.toBeNull()
    expect(screen.queryByText('Phần mềm')).toBeNull()
  })

  it('opens a selected module and closes the switcher', () => {
    const onNavigate = vi.fn()
    const onClose = vi.fn()
    render(<ContentQuickSwitcher items={items} recentKeys={[]} onNavigate={onNavigate} onClose={onClose} />)

    fireEvent.click(screen.getByRole('button', { name: /Phần mềm/i }))

    expect(onNavigate).toHaveBeenCalledWith('software')
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
