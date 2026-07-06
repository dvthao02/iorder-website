import { z } from 'zod'

import { contentIdSchema } from './content.js'

export const auditLogEntrySchema = z.object({
  id: contentIdSchema,
  action: z.string(),
  entityType: z.string(),
  entityId: contentIdSchema.nullable(),
  userName: z.string().nullable(),
  beforeData: z.unknown().nullable(),
  afterData: z.unknown().nullable(),
  createdAt: z.string().datetime(),
})

export const activityListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  entityType: z.string().trim().min(1).max(120).optional(),
  action: z.string().trim().min(1).max(120).optional(),
  userId: contentIdSchema.optional(),
})

export const activityListResponseSchema = z.object({
  items: z.array(auditLogEntrySchema),
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  limit: z.number().int().min(1),
})

export type AuditLogEntry = z.infer<typeof auditLogEntrySchema>
export type ActivityListQuery = z.infer<typeof activityListQuerySchema>
export type ActivityListResponse = z.infer<typeof activityListResponseSchema>
