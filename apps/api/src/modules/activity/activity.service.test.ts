import { describe, expect, it, vi } from 'vitest'

import type { ActivityRepository } from './activity.repository.js'
import { ActivityService } from './activity.service.js'

function fakeLog(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'log-1',
    userId: 'user-1',
    action: 'post.publish',
    entityType: 'post',
    entityId: 'post-1',
    beforeData: null,
    afterData: null,
    ipHash: null,
    createdAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  } as any
}

function makeRepository(overrides: Partial<Record<keyof ActivityRepository, unknown>> = {}) {
  const base = {
    list: vi.fn().mockResolvedValue({ items: [], total: 0 }),
    ...overrides,
  }
  return base as unknown as ActivityRepository
}

describe('ActivityService.list', () => {
  it('returns serialized items with pagination metadata', async () => {
    const repository = makeRepository({
      list: vi.fn().mockResolvedValue({
        items: [{ log: fakeLog(), userName: 'Nguyễn Văn A' }],
        total: 1,
      }),
    })
    const service = new ActivityService(repository)

    const result = await service.list({ page: 1, limit: 20 })

    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({
      id: 'log-1',
      action: 'post.publish',
      entityType: 'post',
      userName: 'Nguyễn Văn A',
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    expect(result.total).toBe(1)
    expect(result.page).toBe(1)
    expect(result.limit).toBe(20)
  })

  it('maps a null userName to null (system action)', async () => {
    const repository = makeRepository({
      list: vi.fn().mockResolvedValue({
        items: [{ log: fakeLog({ userId: null, action: 'post.publish.scheduled' }), userName: null }],
        total: 1,
      }),
    })
    const service = new ActivityService(repository)

    const result = await service.list({ page: 1, limit: 20 })

    expect(result.items[0]?.userName).toBeNull()
  })

  it('forwards filter and pagination params to the repository', async () => {
    const repository = makeRepository()
    const service = new ActivityService(repository)

    await service.list({ page: 2, limit: 10, entityType: 'post', action: 'post.publish', userId: 'user-1' })

    expect(repository.list).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      entityType: 'post',
      action: 'post.publish',
      userId: 'user-1',
    })
  })
})
