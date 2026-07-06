import { ApplicationError } from '../../shared/errors/index.js'

export class ContentPageNotFoundError extends ApplicationError {
  constructor() {
    super('NOT_FOUND', 'Content page does not exist', 404)
    Object.setPrototypeOf(this, ContentPageNotFoundError.prototype)
  }
}

export class ContentPageSlugExistsError extends ApplicationError {
  constructor() {
    super('SLUG_EXISTS', 'A content page with this slug already exists', 409)
    Object.setPrototypeOf(this, ContentPageSlugExistsError.prototype)
  }
}
