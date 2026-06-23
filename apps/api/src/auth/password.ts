import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64
const SCRYPT_N = 32_768
const SCRYPT_R = 8
const SCRYPT_P = 1
const SCRYPT_MAX_MEMORY = 64 * 1024 * 1024

function deriveKey(
  password: string,
  salt: Buffer,
  options: { N: number; r: number; p: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, {
      ...options,
      maxmem: SCRYPT_MAX_MEMORY,
    }, (error, derivedKey) => {
      if (error) {
        reject(error)
        return
      }

      resolve(derivedKey)
    })
  })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const derivedKey = await deriveKey(password, salt, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  })

  return [
    'scrypt',
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString('base64url'),
    derivedKey.toString('base64url'),
  ].join('$')
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [algorithm, nValue, rValue, pValue, saltValue, hashValue] = encodedHash.split('$')

  if (
    algorithm !== 'scrypt'
    || !nValue
    || !rValue
    || !pValue
    || !saltValue
    || !hashValue
  ) {
    return false
  }

  const N = Number(nValue)
  const r = Number(rValue)
  const p = Number(pValue)

  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return false
  }

  const expectedHash = Buffer.from(hashValue, 'base64url')

  if (expectedHash.length !== KEY_LENGTH) {
    return false
  }

  try {
    const actualHash = await deriveKey(password, Buffer.from(saltValue, 'base64url'), { N, r, p })
    return timingSafeEqual(actualHash, expectedHash)
  } catch {
    return false
  }
}

