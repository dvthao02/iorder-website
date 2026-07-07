import { ApplicationError } from '../../shared/errors/index.js'

export class UserNotFoundError extends ApplicationError {
  constructor() {
    super('USER_NOT_FOUND', 'User does not exist', 404)
    Object.setPrototypeOf(this, UserNotFoundError.prototype)
  }
}

export class DuplicateUsernameError extends ApplicationError {
  constructor() {
    super('DUPLICATE_USERNAME', 'Username is already taken', 409)
    Object.setPrototypeOf(this, DuplicateUsernameError.prototype)
  }
}

export class SelfModificationForbiddenError extends ApplicationError {
  constructor() {
    super('SELF_MODIFICATION_FORBIDDEN', 'You cannot modify your own account through this action', 400)
    Object.setPrototypeOf(this, SelfModificationForbiddenError.prototype)
  }
}

export class InvalidCurrentPasswordError extends ApplicationError {
  constructor() {
    super('INVALID_CURRENT_PASSWORD', 'Current password is incorrect', 401)
    Object.setPrototypeOf(this, InvalidCurrentPasswordError.prototype)
  }
}
