import { ApplicationError } from '../../shared/errors/index.js'

export class PartnerNotFoundError extends ApplicationError {
  constructor() {
    super('PARTNER_NOT_FOUND', 'Partner does not exist', 404)
    Object.setPrototypeOf(this, PartnerNotFoundError.prototype)
  }
}

export class PartnerNameExistsError extends ApplicationError {
  constructor() {
    super('NAME_EXISTS', 'A partner with this name already exists', 409)
    Object.setPrototypeOf(this, PartnerNameExistsError.prototype)
  }
}

export class PartnerLogoNotFoundError extends ApplicationError {
  constructor() {
    super('LOGO_MEDIA_NOT_FOUND', 'Referenced logo media does not exist', 400)
    Object.setPrototypeOf(this, PartnerLogoNotFoundError.prototype)
  }
}
