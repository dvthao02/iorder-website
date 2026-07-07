import { ApplicationError } from '../../shared/errors/index.js'

export class ContentConflictError extends ApplicationError {
  currentVersion: number

  constructor(currentVersion: number) {
    super('CONTENT_CONFLICT', 'Homepage content has changed since it was loaded', 409, { currentVersion })
    this.currentVersion = currentVersion
    Object.setPrototypeOf(this, ContentConflictError.prototype)
  }
}

export class MediaReferenceNotFoundError extends ApplicationError {
  constructor() {
    super('MEDIA_REFERENCE_NOT_FOUND', 'One or more referenced media assets no longer exist', 400)
    Object.setPrototypeOf(this, MediaReferenceNotFoundError.prototype)
  }
}

export class HomepageNotFoundError extends ApplicationError {
  constructor() {
    super('HOMEPAGE_NOT_FOUND', 'Homepage does not exist', 404)
    Object.setPrototypeOf(this, HomepageNotFoundError.prototype)
  }
}

export class HomepageDraftRequiredError extends ApplicationError {
  constructor() {
    super('HOMEPAGE_DRAFT_REQUIRED', 'Homepage must have at least one block before publishing', 400)
    Object.setPrototypeOf(this, HomepageDraftRequiredError.prototype)
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
