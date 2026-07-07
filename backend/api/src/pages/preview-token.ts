import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

interface HomepagePreviewPayload {
  scope: 'homepage'
  exp: number
  nonce: string
}

function signature(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url')
}

export function createHomepagePreviewToken(secret: string, ttlSeconds = 600) {
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000)
  const payload: HomepagePreviewPayload = {
    scope: 'homepage',
    exp: Math.floor(expiresAt.getTime() / 1000),
    nonce: randomBytes(12).toString('base64url'),
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  return { token: `${encoded}.${signature(encoded, secret)}`, expiresAt }
}

export function verifyHomepagePreviewToken(token: string, secret: string) {
  const [encoded, suppliedSignature] = token.split('.')
  if (!encoded || !suppliedSignature) return false

  const expectedSignature = signature(encoded, secret)
  const supplied = Buffer.from(suppliedSignature)
  const expected = Buffer.from(expectedSignature)
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as HomepagePreviewPayload
    return payload.scope === 'homepage' && Number.isFinite(payload.exp) && payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}
