import { ApplicationError } from '../../shared/errors/index.js'

export class DownloadNotFoundError extends ApplicationError {
  constructor() {
    super('DOWNLOAD_NOT_FOUND', 'Download does not exist', 404)
    Object.setPrototypeOf(this, DownloadNotFoundError.prototype)
  }
}

export class DownloadFileNotFoundError extends ApplicationError {
  constructor() {
    super('FILE_MEDIA_NOT_FOUND', 'Referenced file media does not exist', 400)
    Object.setPrototypeOf(this, DownloadFileNotFoundError.prototype)
  }
}
