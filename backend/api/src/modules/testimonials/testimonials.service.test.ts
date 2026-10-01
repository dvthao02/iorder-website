import { describe, expect, it, vi } from 'vitest'

import { TestimonialAvatarNotFoundError, TestimonialNotFoundError } from './testimonials.errors.js'
import type { TestimonialsRepository } from './testimonials.repository.js'
import { TestimonialsService } from './testimonials.service.js'

const testimonial = {
  id: '00000000-0000-4000-8000-000000000020',
  authorName: 'Nguyễn An',
  authorRole: 'Giám đốc',
  company: 'Công ty ABC',
  quote: 'Sản phẩm rất dễ dùng.',
  rating: 5,
  avatarMediaId: '00000000-0000-4000-8000-000000000021',
  sortOrder: 0,
  isEnabled: true,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
}
const input = {
  authorName: testimonial.authorName,
  authorRole: testimonial.authorRole,
  company: testimonial.company,
  quote: testimonial.quote,
  rating: testimonial.rating,
  avatarMediaId: testimonial.avatarMediaId,
  sortOrder: testimonial.sortOrder,
  isEnabled: testimonial.isEnabled,
}

function makeRepository(overrides: Record<string, unknown> = {}) {
  return {
    avatarExists: vi.fn().mockResolvedValue(true),
    create: vi.fn().mockResolvedValue(testimonial),
    findById: vi.fn().mockResolvedValue({ item: testimonial, avatarUrl: 'https://cdn.example/avatar.jpg' }),
    update: vi.fn(),
    delete: vi.fn().mockResolvedValue(undefined),
    insertAuditLog: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('TestimonialsService mutations', () => {
  it('rejects a testimonial pointing at an unavailable avatar', async () => {
    const repository = makeRepository({ avatarExists: vi.fn().mockResolvedValue(false) })
    const service = new TestimonialsService(repository as unknown as TestimonialsRepository)

    await expect(service.create(input, 'editor-1')).rejects.toBeInstanceOf(TestimonialAvatarNotFoundError)
    expect(repository.create).not.toHaveBeenCalled()
  })

  it('writes an audit record when a testimonial is created', async () => {
    const repository = makeRepository()
    const service = new TestimonialsService(repository as unknown as TestimonialsRepository)

    const result = await service.create(input, 'editor-1')

    expect(result.statusCode).toBe(201)
    expect(repository.insertAuditLog).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'editor-1', action: 'testimonial.create', entityId: testimonial.id,
    }))
  })

  it('does not delete a testimonial that cannot be found', async () => {
    const repository = makeRepository({ findById: vi.fn().mockResolvedValue(null) })
    const service = new TestimonialsService(repository as unknown as TestimonialsRepository)

    await expect(service.delete(testimonial.id, 'editor-1')).rejects.toBeInstanceOf(TestimonialNotFoundError)
    expect(repository.delete).not.toHaveBeenCalled()
  })
})
