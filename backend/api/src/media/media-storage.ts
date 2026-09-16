import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { randomUUID } from 'node:crypto'
import * as Minio from 'minio'

export interface StoredMedia {
  storageKey: string
  publicUrl: string
}

export interface MediaStorage {
  put(buffer: Buffer, extension: string, mimeType: string): Promise<StoredMedia>
  delete(storageKey: string): Promise<void>
}

export interface KeyedMediaStorage extends MediaStorage {
  putAt(storageKey: string, buffer: Buffer, mimeType: string): Promise<StoredMedia>
}

export class LocalMediaStorage implements KeyedMediaStorage {
  constructor(
    private readonly rootPath: string,
    private readonly publicBaseUrl: string,
  ) {}

  async put(buffer: Buffer, extension: string, _mimeType: string): Promise<StoredMedia> {
    const storageKey = createStorageKey(extension)
    const destination = this.resolveKey(storageKey)

    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, buffer, { flag: 'wx' })

    return this.storedMedia(storageKey)
  }

  async putAt(storageKey: string, buffer: Buffer, _mimeType: string): Promise<StoredMedia> {
    const destination = this.resolveKey(storageKey)

    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, buffer)

    return this.storedMedia(storageKey)
  }

  async delete(storageKey: string): Promise<void> {
    await rm(this.resolveKey(storageKey), { force: true })
  }

  private resolveKey(storageKey: string): string {
    const normalizedRoot = resolve(this.rootPath)
    const resolvedPath = resolve(normalizedRoot, storageKey)

    if (!resolvedPath.startsWith(`${normalizedRoot}${sep}`)) {
      throw new Error('Invalid media storage key')
    }

    return resolvedPath
  }

  private storedMedia(storageKey: string): StoredMedia {
    return {
      storageKey,
      publicUrl: `${this.publicBaseUrl.replace(/\/$/, '')}/${storageKey}`,
    }
  }
}

export interface MinioMediaStorageOptions {
  endpoint: string
  port: number
  useSSL: boolean
  accessKey: string
  secretKey: string
  bucket: string
  publicBaseUrl: string
}

export class MinioMediaStorage implements KeyedMediaStorage {
  private readonly client: Minio.Client

  constructor(private readonly options: MinioMediaStorageOptions) {
    this.client = new Minio.Client({
      endPoint: options.endpoint,
      port: options.port,
      useSSL: options.useSSL,
      accessKey: options.accessKey,
      secretKey: options.secretKey,
    })
  }

  async put(buffer: Buffer, extension: string, mimeType: string): Promise<StoredMedia> {
    const storageKey = createStorageKey(extension)
    return this.putAt(storageKey, buffer, mimeType)
  }

  async putAt(storageKey: string, buffer: Buffer, mimeType: string): Promise<StoredMedia> {
    await this.client.putObject(this.options.bucket, storageKey, buffer, buffer.length, {
      'Content-Type': mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    })

    return {
      storageKey,
      publicUrl: `${this.options.publicBaseUrl.replace(/\/$/, '')}/${storageKey}`,
    }
  }

  async delete(storageKey: string): Promise<void> {
    await this.client.removeObject(this.options.bucket, storageKey)
  }
}

function createStorageKey(extension: string): string {
  const now = new Date()
  return [
    now.getUTCFullYear().toString(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    `${randomUUID()}${extension}`,
  ].join('/')
}
