import { ApplicationError } from '../../shared/errors/index.js'

export class OfferingNotFoundError extends ApplicationError {
  constructor() {
    super('NOT_FOUND', 'Offering does not exist', 404)
    Object.setPrototypeOf(this, OfferingNotFoundError.prototype)
  }
}

export class OfferingSlugExistsError extends ApplicationError {
  constructor() {
    super('SLUG_EXISTS', 'An offering with this slug already exists for this type', 409)
    Object.setPrototypeOf(this, OfferingSlugExistsError.prototype)
  }
}

export class OfferingCoverNotFoundError extends ApplicationError {
  constructor() {
    super('COVER_NOT_FOUND', 'Referenced cover media does not exist', 422)
    Object.setPrototypeOf(this, OfferingCoverNotFoundError.prototype)
  }
}
