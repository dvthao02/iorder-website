import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().min(1).default('127.0.0.1'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  ADMIN_ORIGIN: z.string().url().default('http://127.0.0.1:5174'),
  PUBLIC_ORIGIN: z.string().url().default('http://127.0.0.1:5173'),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  MEDIA_STORAGE_PATH: z.string().min(1).default('../../storage/media'),
  MEDIA_PUBLIC_BASE_URL: z.string().url().default('http://127.0.0.1:4000/media'),
  MEDIA_MAX_FILE_SIZE_MB: z.coerce.number().int().min(1).max(100).default(20),
  HOMEPAGE_SLUG: z.string().regex(/^[a-z0-9-]+$/).default('home'),
  // Tùy chọn: danh sách URL DB iOrder app (cách nhau dấu phẩy) để đếm số cửa hàng thực tế
  IORDER_APP_DB_URLS: z.string().optional(),
})

export type ApiEnv = z.infer<typeof envSchema>

export function readEnv(source: NodeJS.ProcessEnv = process.env): ApiEnv {
  return envSchema.parse(source)
}
