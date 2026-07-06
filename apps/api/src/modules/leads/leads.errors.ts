import { ApplicationError } from '../../shared/errors/index.js'

export class LeadNotFoundError extends ApplicationError {
  constructor() {
    super('LEAD_NOT_FOUND', 'Lead does not exist', 404)
    Object.setPrototypeOf(this, LeadNotFoundError.prototype)
  }
}

export class LeadRateLimitedError extends ApplicationError {
  constructor() {
    super('RATE_LIMITED', 'Too many contact requests from this IP, please try again later', 429)
    Object.setPrototypeOf(this, LeadRateLimitedError.prototype)
  }
}
