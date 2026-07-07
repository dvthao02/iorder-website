import { ApplicationError } from '../../shared/errors/index.js'
import type { MediaUsageItem } from './media.repository.js'

export class MediaNotFoundError extends ApplicationError {
  constructor() {
    super('MEDIA_NOT_FOUND', 'Media asset does not exist', 404)
    Object.setPrototypeOf(this, MediaNotFoundError.prototype)
  }
}

export class MediaInUseError extends ApplicationError {
  constructor(usage: MediaUsageItem[]) {
    super('MEDIA_IN_USE', 'Media asset is still referenced elsewhere', 409, { usage })
    Object.setPrototypeOf(this, MediaInUseError.prototype)
  }
}

export class FileRequiredError extends ApplicationError {
  constructor() {
    super('FILE_REQUIRED', 'A file must be uploaded', 400)
    Object.setPrototypeOf(this, FileRequiredError.prototype)
  }
}

export class FileTooLargeError extends ApplicationError {
  constructor() {
    super('FILE_TOO_LARGE', 'Uploaded file exceeds the maximum allowed size', 413)
    Object.setPrototypeOf(this, FileTooLargeError.prototype)
  }
}

export class InvalidMediaMetadataError extends ApplicationError {
  constructor() {
    super('INVALID_MEDIA_METADATA', 'Media metadata is invalid', 400)
    Object.setPrototypeOf(this, InvalidMediaMetadataError.prototype)
  }
}

export class InvalidMediaFileError extends ApplicationError {
  constructor(code: string) {
    super(code, 'Uploaded file failed validation', 415)
    Object.setPrototypeOf(this, InvalidMediaFileError.prototype)
  }
}
