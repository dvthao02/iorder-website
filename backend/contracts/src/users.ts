import { z } from 'zod'

import { cmsRoleSchema } from './auth.js'
import { contentIdSchema } from './content.js'

export const userStatusSchema = z.enum(['active', 'disabled'])

export const userSummarySchema = z.object({
  id: contentIdSchema,
  username: z.string(),
  email: z.string().nullable(),
  fullName: z.string(),
  status: userStatusSchema,
  roles: z.array(cmsRoleSchema),
  lastLoginAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
})

export const createUserInputSchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(80),
  email: z.string().trim().toLowerCase().email().max(320).nullable().default(null),
  fullName: z.string().trim().min(1).max(180),
  password: z.string().min(10).max(200),
  roles: z.array(cmsRoleSchema).min(1),
})

export const updateUserInputSchema = z.object({
  fullName: z.string().trim().min(1).max(180),
  email: z.string().trim().toLowerCase().email().max(320).nullable().default(null),
  roles: z.array(cmsRoleSchema).min(1),
  status: userStatusSchema,
})

export const resetPasswordInputSchema = z.object({
  password: z.string().min(10).max(200),
})

export const changePasswordInputSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(10).max(200),
})

export type UserStatus = z.infer<typeof userStatusSchema>
export type UserSummary = z.infer<typeof userSummarySchema>
export type CreateUserInput = z.infer<typeof createUserInputSchema>
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordInputSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordInputSchema>
