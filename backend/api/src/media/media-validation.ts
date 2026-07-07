import { extname } from 'node:path'
import { imageSize } from 'image-size'

interface AllowedFileType {
  mimeTypes: string[]
  signature: (buffer: Buffer) => boolean
  kind: 'image' | 'document'
}

const startsWith = (bytes: number[]) => (buffer: Buffer) =>
  buffer.length >= bytes.length && bytes.every((byte, index) => buffer[index] === byte)

const zipSignature = (buffer: Buffer) =>
  startsWith([0x50, 0x4b, 0x03, 0x04])(buffer) ||
  startsWith([0x50, 0x4b, 0x05, 0x06])(buffer) ||
  startsWith([0x50, 0x4b, 0x07, 0x08])(buffer)

const compoundDocumentSignature = startsWith([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])

const allowedTypes: Record<string, AllowedFileType> = {
  '.jpg': { mimeTypes: ['image/jpeg'], signature: startsWith([0xff, 0xd8, 0xff]), kind: 'image' },
  '.jpeg': { mimeTypes: ['image/jpeg'], signature: startsWith([0xff, 0xd8, 0xff]), kind: 'image' },
  '.png': {
    mimeTypes: ['image/png'],
    signature: startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    kind: 'image',
  },
  '.gif': {
    mimeTypes: ['image/gif'],
    signature: (buffer) =>
      buffer.subarray(0, 6).toString('ascii') === 'GIF87a' || buffer.subarray(0, 6).toString('ascii') === 'GIF89a',
    kind: 'image',
  },
  '.webp': {
    mimeTypes: ['image/webp'],
    signature: (buffer) =>
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP',
    kind: 'image',
  },
  '.pdf': {
    mimeTypes: ['application/pdf'],
    signature: (buffer) => buffer.subarray(0, 5).toString('ascii') === '%PDF-',
    kind: 'document',
  },
  '.doc': {
    mimeTypes: ['application/msword', 'application/octet-stream'],
    signature: compoundDocumentSignature,
    kind: 'document',
  },
  '.xls': {
    mimeTypes: ['application/vnd.ms-excel', 'application/octet-stream'],
    signature: compoundDocumentSignature,
    kind: 'document',
  },
  '.docx': {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/octet-stream',
    ],
    signature: zipSignature,
    kind: 'document',
  },
  '.xlsx': {
    mimeTypes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/zip',
      'application/octet-stream',
    ],
    signature: zipSignature,
    kind: 'document',
  },
  '.zip': {
    mimeTypes: ['application/zip', 'application/x-zip-compressed', 'application/octet-stream'],
    signature: zipSignature,
    kind: 'document',
  },
  '.apk': {
    mimeTypes: ['application/vnd.android.package-archive', 'application/zip', 'application/octet-stream'],
    signature: zipSignature,
    kind: 'document',
  },
}

export interface ValidatedMediaFile {
  extension: string
  kind: 'image' | 'document'
  width: number | null
  height: number | null
}

export function validateMediaFile(filename: string, mimeType: string, buffer: Buffer): ValidatedMediaFile {
  const extension = extname(filename).toLowerCase()
  const allowed = allowedTypes[extension]

  if (!allowed || !allowed.mimeTypes.includes(mimeType) || !allowed.signature(buffer)) {
    throw new Error('UNSUPPORTED_MEDIA_TYPE')
  }

  let width: number | null = null
  let height: number | null = null

  if (allowed.kind === 'image') {
    try {
      const dimensions = imageSize(buffer)
      width = dimensions.width ?? null
      height = dimensions.height ?? null
    } catch {
      throw new Error('INVALID_IMAGE')
    }
  }

  return { extension, kind: allowed.kind, width, height }
}
