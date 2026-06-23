import { z } from 'zod'

export const cmsRoleSchema = z.enum(['admin', 'editor', 'author'])

export const loginInputSchema = z.object({
  username: z.string().trim().toLowerCase().min(1).max(80),
  password: z.string().min(1).max(200),
})

export const authUserSchema = z.object({
  id: z.string().uuid(),
  username: z.string(),
  fullName: z.string(),
  roles: z.array(cmsRoleSchema),
})

export const authSessionResponseSchema = z.object({
  user: authUserSchema,
})

export type CmsRole = z.infer<typeof cmsRoleSchema>
export type LoginInput = z.infer<typeof loginInputSchema>
export type AuthUser = z.infer<typeof authUserSchema>
export type AuthSessionResponse = z.infer<typeof authSessionResponseSchema>
