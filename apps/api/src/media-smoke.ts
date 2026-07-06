import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import { createDatabase } from '@iorder/database'
import { auditLogs, mediaAssets, roles, userRoles, users } from '@iorder/database'
import { config } from 'dotenv'
import { eq } from 'drizzle-orm'

import { buildApp } from './app.js'
import { hashPassword } from './auth/password.js'
import { readEnv } from './env.js'

const currentDirectory = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(currentDirectory, '../../../.env') })

const storagePath = await mkdtemp(join(tmpdir(), 'iorder-media-smoke-'))
const env = readEnv({
  ...process.env,
  NODE_ENV: 'test',
  MEDIA_STORAGE_PATH: storagePath,
  MEDIA_PUBLIC_BASE_URL: 'http://127.0.0.1:4000/media',
  MEDIA_MAX_FILE_SIZE_MB: '1',
})
const database = createDatabase(env.DATABASE_URL)
const app = await buildApp(env)
const username = `media-smoke-${Date.now()}`
const password = 'media-smoke-password-123'
let userId: string | null = null
let assetId: string | null = null

function multipartBody(options: {
  filename: string
  mimeType: string
  buffer: Buffer
  altText?: string
  caption?: string
}) {
  const boundary = `iorder-${randomUUID()}`
  const field = (name: string, value: string) =>
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`)
  const body = Buffer.concat([
    field('altText', options.altText ?? ''),
    field('caption', options.caption ?? ''),
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${options.filename}"\r\nContent-Type: ${options.mimeType}\r\n\r\n`,
    ),
    options.buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ])

  return {
    body,
    contentType: `multipart/form-data; boundary=${boundary}`,
  }
}

try {
  const [adminRole] = await database.db.select({ id: roles.id }).from(roles).where(eq(roles.code, 'admin')).limit(1)

  if (!adminRole) {
    throw new Error('Admin role is missing. Run the core database seed first.')
  }

  const [user] = await database.db
    .insert(users)
    .values({
      username,
      fullName: 'Media Smoke User',
      passwordHash: await hashPassword(password),
      status: 'active',
    })
    .returning({ id: users.id })

  if (!user) {
    throw new Error('Smoke user could not be created')
  }

  userId = user.id
  await database.db.insert(userRoles).values({ userId, roleId: adminRole.id })

  const unauthenticatedList = await app.inject({ method: 'GET', url: '/api/admin/media' })

  if (unauthenticatedList.statusCode !== 401) {
    throw new Error(`Unauthenticated media list returned ${unauthenticatedList.statusCode}`)
  }

  const loginResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/auth/login',
    payload: { username, password },
  })
  const setCookie = loginResponse.headers['set-cookie']
  const rawCookie = Array.isArray(setCookie) ? setCookie[0] : setCookie
  const cookie = rawCookie?.split(';', 1)[0]

  if (loginResponse.statusCode !== 200 || !cookie) {
    throw new Error(`Media smoke login failed: ${loginResponse.statusCode}`)
  }

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
    'base64',
  )
  const validUpload = multipartBody({
    filename: 'pixel.png',
    mimeType: 'image/png',
    buffer: png,
    altText: 'Smoke pixel',
    caption: 'Temporary media smoke asset',
  })
  const uploadResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/media',
    headers: {
      cookie,
      'content-type': validUpload.contentType,
    },
    payload: validUpload.body,
  })

  if (uploadResponse.statusCode !== 201) {
    throw new Error(`Valid media upload returned ${uploadResponse.statusCode}: ${uploadResponse.body}`)
  }

  const uploaded = uploadResponse.json<{ item: { id: string; publicUrl: string; width: number; height: number } }>()
    .item
  assetId = uploaded.id

  if (uploaded.width !== 1 || uploaded.height !== 1) {
    throw new Error('Uploaded image dimensions were not detected')
  }

  const publicFileResponse = await app.inject({
    method: 'GET',
    url: new URL(uploaded.publicUrl).pathname,
  })

  if (publicFileResponse.statusCode !== 200 || !publicFileResponse.rawPayload.equals(png)) {
    throw new Error('Stored media file was not publicly readable')
  }

  const listResponse = await app.inject({
    method: 'GET',
    url: '/api/admin/media?kind=image',
    headers: { cookie },
  })

  if (listResponse.statusCode !== 200 || !listResponse.body.includes(assetId)) {
    throw new Error(`Media list did not contain uploaded asset: ${listResponse.body}`)
  }

  const updateResponse = await app.inject({
    method: 'PATCH',
    url: `/api/admin/media/${assetId}`,
    headers: { cookie },
    payload: { altText: 'Updated smoke pixel', caption: null },
  })

  if (updateResponse.statusCode !== 200 || !updateResponse.body.includes('Updated smoke pixel')) {
    throw new Error(`Media metadata update failed: ${updateResponse.body}`)
  }

  const invalidUpload = multipartBody({
    filename: 'malware.exe',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from('MZ-not-an-allowed-file'),
  })
  const invalidResponse = await app.inject({
    method: 'POST',
    url: '/api/admin/media',
    headers: {
      cookie,
      'content-type': invalidUpload.contentType,
    },
    payload: invalidUpload.body,
  })

  if (invalidResponse.statusCode !== 415) {
    throw new Error(`Invalid media upload returned ${invalidResponse.statusCode} instead of 415`)
  }

  process.stdout.write('Media smoke test passed.\n')
} finally {
  await app.close()

  if (assetId) {
    await database.db.delete(auditLogs).where(eq(auditLogs.entityId, assetId))
    await database.db.delete(mediaAssets).where(eq(mediaAssets.id, assetId))
  }

  if (userId) {
    await database.db.delete(auditLogs).where(eq(auditLogs.userId, userId))
    await database.db.delete(users).where(eq(users.id, userId))
  }

  await database.close()
  await rm(storagePath, { recursive: true, force: true })
}
