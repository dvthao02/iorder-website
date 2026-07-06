import { z } from 'zod'

import { contentIdSchema } from './content.js'

export const leadStatusSchema = z.enum(['new', 'contacted', 'closed'])

// Số điện thoại VN: 9-12 chữ số, có thể bắt đầu bằng +84 hoặc 0.
const PHONE_REGEX = /^(\+84|0)\d{8,11}$/

export const contactLeadInputSchema = z.object({
  name: z.string().trim().min(2).max(180),
  phone: z.string().trim().regex(PHONE_REGEX, 'Số điện thoại không hợp lệ'),
  email: z
    .union([z.literal(''), z.string().trim().email()])
    .nullable()
    .optional(),
  businessModel: z.string().trim().max(120).nullable().optional(),
  branches: z.string().trim().max(60).nullable().optional(),
  need: z.string().trim().max(200).nullable().optional(),
  message: z.string().trim().max(2000).nullable().optional(),
  // Honeypot: field ẩn khỏi người dùng thật — bot điền vào field này.
  website: z.string().trim().max(500).optional(),
})

export const contactLeadSchema = z.object({
  id: contentIdSchema,
  name: z.string(),
  phone: z.string(),
  email: z.string().nullable(),
  businessModel: z.string().nullable(),
  branches: z.string().nullable(),
  need: z.string().nullable(),
  message: z.string().nullable(),
  status: leadStatusSchema,
  createdAt: z.string().datetime(),
  handledAt: z.string().datetime().nullable(),
  handledBy: contentIdSchema.nullable(),
})

export const leadListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: leadStatusSchema.optional(),
})

export const updateLeadStatusInputSchema = z.object({
  status: leadStatusSchema,
})

export type LeadStatus = z.infer<typeof leadStatusSchema>
export type ContactLeadInput = z.infer<typeof contactLeadInputSchema>
export type ContactLead = z.infer<typeof contactLeadSchema>
export type LeadListQuery = z.infer<typeof leadListQuerySchema>
export type UpdateLeadStatusInput = z.infer<typeof updateLeadStatusInputSchema>
