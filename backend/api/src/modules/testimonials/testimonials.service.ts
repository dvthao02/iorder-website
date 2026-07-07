import type { TestimonialInput } from '@iorder/contracts'

import { TestimonialAvatarNotFoundError, TestimonialNotFoundError } from './testimonials.errors.js'
import { serializeTestimonial, type TestimonialsRepository } from './testimonials.repository.js'

export class TestimonialsService {
  constructor(private repository: TestimonialsRepository) {}

  async list() {
    const rows = await this.repository.list()
    return { items: rows.map((row) => serializeTestimonial(row.item, row.avatarUrl)), total: rows.length }
  }

  async create(input: TestimonialInput, editorId: string) {
    if (!(await this.repository.avatarExists(input.avatarMediaId))) throw new TestimonialAvatarNotFoundError()

    const created = await this.repository.create(input)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'testimonial.create',
      entityType: 'testimonial',
      entityId: created.id,
      afterData: serializeTestimonial(created),
    })
    const withAvatar = await this.repository.findById(created.id)
    return { statusCode: 201, item: serializeTestimonial(created, withAvatar?.avatarUrl ?? null) }
  }

  async update(id: string, input: TestimonialInput, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new TestimonialNotFoundError()
    if (!(await this.repository.avatarExists(input.avatarMediaId))) throw new TestimonialAvatarNotFoundError()

    const updated = await this.repository.update(id, input)
    if (!updated) throw new TestimonialNotFoundError()

    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'testimonial.update',
      entityType: 'testimonial',
      entityId: updated.id,
      beforeData: serializeTestimonial(existing.item),
      afterData: serializeTestimonial(updated),
    })
    const withAvatar = await this.repository.findById(updated.id)
    return { item: serializeTestimonial(updated, withAvatar?.avatarUrl ?? null) }
  }

  async delete(id: string, editorId: string) {
    const existing = await this.repository.findById(id)
    if (!existing) throw new TestimonialNotFoundError()

    await this.repository.delete(id)
    await this.repository.insertAuditLog({
      userId: editorId,
      action: 'testimonial.delete',
      entityType: 'testimonial',
      entityId: id,
      beforeData: serializeTestimonial(existing.item),
    })
  }

  async listPublic() {
    const rows = await this.repository.listPublic()
    return { items: rows.map((row) => serializeTestimonial(row.item, row.avatarUrl)) }
  }
}
