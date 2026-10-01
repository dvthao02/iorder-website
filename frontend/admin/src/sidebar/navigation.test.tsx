import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SidebarNav } from './SidebarNav'
import { keyBySlug, navigation, slugByKey } from './navigation'

describe('Content Studio navigation', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('keeps every existing module slug mapped to its original manager key', () => {
    expect(slugByKey).toMatchObject({
      homepage: 'trang-chu',
      software: 'phan-mem',
      solutions: 'giai-phap',
      services: 'dich-vu',
      industries: 'nganh-hang',
      'sales-equipment': 'thiet-bi',
      posts: 'tin-tuc',
      guides: 'huong-dan',
      'content-pages': 'trang-noi-dung',
      media: 'thu-vien',
      partners: 'doi-tac',
      testimonials: 'danh-gia',
      downloads: 'ho-tro-cai-dat',
      navigation: 'menu',
      leads: 'khach-lien-he',
      settings: 'cai-dat',
    })
    expect(keyBySlug['thiet-bi']).toBe('sales-equipment')
    expect(keyBySlug['huong-dan']).toBe('guides')
    expect(keyBySlug['cai-dat']).toBe('settings')

    expect(navigation.find((item) => item.key === 'downloads')?.group).toBe('shared')
    expect(navigation.find((item) => item.key === 'leads')?.group).toBe('leads')
  })

  it('keeps administration-only navigation hidden from editors and opens the active group', () => {
    localStorage.setItem('admin.sidebar.collapsedGroups', JSON.stringify(['site']))

    render(
      <SidebarNav
        activeKey="software"
        badges={{}}
        onNavigate={vi.fn()}
        roles={['editor']}
      />,
    )

    expect(screen.getByTitle('Phần mềm').classList.contains('is-active')).toBe(true)
    expect(screen.getByText('Liên hệ khách hàng')).not.toBeNull()
    expect(screen.queryByText('SEO & điều hướng')).toBeNull()
    expect(screen.queryByTitle('Điều hướng website')).toBeNull()
    expect(screen.queryByText('Cấu hình & hệ thống')).toBeNull()
    expect(screen.queryByTitle('Cấu hình website')).toBeNull()
  })
})
