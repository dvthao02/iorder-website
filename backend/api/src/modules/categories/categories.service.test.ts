import { describe, expect, it, vi } from 'vitest'

import { CategoryNotFoundError } from './categories.errors.js'
import type { CategoriesRepository } from './categories.repository.js'
import { CategoriesService } from './categories.service.js'

const category = {
  id: '00000000-0000-4000-8000-000000000060',
  name: 'Hướng dẫn',
  slug: 'huong-dan',
  description: null,
  parentId: null,
  sortOrder: 0,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}
const input = { name: category.name, description: category.description, parentId: category.parentId, sortOrder: category.sortOrder }

function makeRepository(overrides: Record<string, unknown> = {}) {
  return {
    uniqueSlug: vi.fn().mockResolvedValue(category.slug),
    create: vi.fn().mockResolvedValue(category),
    findById: vi.fn().mockResolvedValue(category),
    update: vi.fn().mockResolvedValue(category),
    delete: vi.fn().mockResolvedValue(undefined),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('CategoriesService mutations', () => {
  it('creates a category with a generated unique slug and audit log', async () => {
    const repository = makeRepository()
    const service = new CategoriesService(repository as unknown as CategoriesRepository)
    const result = await service.create(input, 'editor-1')
    expect(result.statusCode).toBe(201)
    expect(repository.uniqueSlug).toHaveBeenCalledWith('huong-dan')
    expect(repository.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'category.create', entityId: category.id }))
  })

  it('does not update a category that cannot be found', async () => {
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
    const service = new CategoriesService(repository as unknown as CategoriesRepository)
    await expect(service.update(category.id, input, 'editor-1')).rejects.toBeInstanceOf(CategoryNotFoundError)
    expect(repository.update).not.toHaveBeenCalled()
  })

  it('records the original category when deleting', async () => {
    const repository = makeRepository()
    const service = new CategoriesService(repository as unknown as CategoriesRepository)
    await service.delete(category.id, 'editor-1')
    expect(repository.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({ action: 'category.delete', beforeData: expect.objectContaining({ id: category.id }) }))
  })
})
