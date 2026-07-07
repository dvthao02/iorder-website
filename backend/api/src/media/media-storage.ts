import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, resolve, sep } from 'node:path'
import { randomUUID } from 'node:crypto'

export interface StoredMedia {
  storageKey: string
  publicUrl: string
}

export interface MediaStorage {
  put(buffer: Buffer, extension: string): Promise<StoredMedia>
  delete(storageKey: string): Promise<void>
}

export class LocalMediaStorage implements MediaStorage {
  constructor(
    private readonly rootPath: string,
    private readonly publicBaseUrl: string,
  ) {}

  async put(buffer: Buffer, extension: string): Promise<StoredMedia> {
    const now = new Date()
    const storageKey = [
      now.getUTCFullYear().toString(),
      String(now.getUTCMonth() + 1).padStart(2, '0'),
      `${randomUUID()}${extension}`,
    ].join('/')
    const destination = this.resolveKey(storageKey)

    await mkdir(dirname(destination), { recursive: true })
    await writeFile(destination, buffer, { flag: 'wx' })

    return {
      storageKey,
      publicUrl: `${this.publicBaseUrl.replace(/\/$/, '')}/${storageKey}`,
    }
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
}
