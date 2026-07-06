import { ApplicationError } from '../../shared/errors/index.js'

export class PostNotFoundError extends ApplicationError {
  constructor() {
    super('POST_NOT_FOUND', 'Post does not exist', 404)
    Object.setPrototypeOf(this, PostNotFoundError.prototype)
  }
}

export class SlugExistsError extends ApplicationError {
  constructor() {
    super('SLUG_EXISTS', 'A post with this slug already exists', 409)
    Object.setPrototypeOf(this, SlugExistsError.prototype)
  }
}

export class CoverMediaNotFoundError extends ApplicationError {
  constructor() {
    super('COVER_MEDIA_NOT_FOUND', 'Referenced cover media does not exist', 400)
    Object.setPrototypeOf(this, CoverMediaNotFoundError.prototype)
  }
}

export class RevisionNotFoundError extends ApplicationError {
  constructor() {
    super('REVISION_NOT_FOUND', 'Revision does not exist', 404)
    Object.setPrototypeOf(this, RevisionNotFoundError.prototype)
  }
}

export class RevisionIncompatibleError extends ApplicationError {
  constructor() {
    super('REVISION_INCOMPATIBLE', 'Revision snapshot no longer matches the current schema', 409)
    Object.setPrototypeOf(this, RevisionIncompatibleError.prototype)
  }
}
