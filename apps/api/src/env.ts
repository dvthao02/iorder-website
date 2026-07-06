import { z } from 'zod'

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_HOST: z.string().min(1).default('127.0.0.1'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  ADMIN_ORIGIN: z.string().url().default('http://127.0.0.1:5174'),
  PUBLIC_ORIGIN: z.string().url().default('http://127.0.0.1:5173'),
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32),
  CMS_PREVIEW_SECRET: z.string().min(32).optional(),
  SESSION_TTL_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  MEDIA_STORAGE_PATH: z.string().min(1).default('../../storage/media'),
  MEDIA_PUBLIC_BASE_URL: z.string().url().default('http://127.0.0.1:4000/media'),
  MEDIA_MAX_FILE_SIZE_MB: z.coerce.number().int().min(1).max(100).default(20),
  HOMEPAGE_SLUG: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .default('home'),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ENVIRONMENT: z.string().min(1).optional(),
  SENTRY_RELEASE: z.string().min(1).optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0),
  // Tin cậy proxy phía trước (nginx) để lấy IP thật từ X-Forwarded-For.
  // Giá trị: 'true' | 'false' | số hop | danh sách IP/subnet cách nhau dấu phẩy.
  TRUST_PROXY: z.string().default('false'),
  // Tùy chọn: danh sách URL DB iOrder app (cách nhau dấu phẩy) để đếm số cửa hàng thực tế
  IORDER_APP_DB_URLS: z.string().optional(),
  // Scheduler tự động publish bài viết hẹn giờ (Posts.scheduledAt).
  POST_SCHEDULER_ENABLED: z
    .string()
    .default('true')
    .transform((value) => value.trim().toLowerCase() !== 'false'),
  POST_SCHEDULER_INTERVAL_MS: z.coerce.number().int().min(1000).default(60_000),
})

export type ApiEnv = z.infer<typeof envSchema>

export function readEnv(source: NodeJS.ProcessEnv = process.env): ApiEnv {
  const merged = { ...source }
  // Railway injects PORT; use it when API_PORT is missing or an unresolved template
  if (merged.PORT && (!merged.API_PORT || merged.API_PORT.includes('{'))) {
    merged.API_PORT = merged.PORT
  }
  return envSchema.parse(merged)
}
