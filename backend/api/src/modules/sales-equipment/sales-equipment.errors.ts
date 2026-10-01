import { ApplicationError } from '../../shared/errors/index.js'

export class SalesEquipmentNotFoundError extends ApplicationError {
  constructor() {
    super('NOT_FOUND', 'Sales equipment does not exist', 404)
    Object.setPrototypeOf(this, SalesEquipmentNotFoundError.prototype)
  }
}

export class SalesEquipmentSlugExistsError extends ApplicationError {
  constructor() {
    super('SLUG_EXISTS', 'Sales equipment slug already exists', 409)
    Object.setPrototypeOf(this, SalesEquipmentSlugExistsError.prototype)
  }
}

export class SalesEquipmentCoverNotFoundError extends ApplicationError {
  constructor() {
    super('COVER_NOT_FOUND', 'Referenced cover media does not exist', 422)
    Object.setPrototypeOf(this, SalesEquipmentCoverNotFoundError.prototype)
  }
}

export class SalesEquipmentRevisionNotFoundError extends ApplicationError {
  constructor() {
    super('REVISION_NOT_FOUND', 'Sales equipment revision does not exist', 404)
    Object.setPrototypeOf(this, SalesEquipmentRevisionNotFoundError.prototype)
  }
}
