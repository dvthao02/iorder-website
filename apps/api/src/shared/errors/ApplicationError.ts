export class ApplicationError extends Error {
  code: string
  statusCode: number
  details?: unknown

  constructor(code: string, message: string, statusCode: number = 500, details?: unknown) {
    super(message)
    this.code = code
    this.statusCode = statusCode
    this.details = details
    Object.setPrototypeOf(this, ApplicationError.prototype)
  }

  toJSON(): { error: string; message: string; details?: unknown } {
    return this.details !== undefined
      ? { error: this.code, message: this.message, details: this.details }
      : { error: this.code, message: this.message }
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, 400, details)
    Object.setPrototypeOf(this, ValidationError.prototype)
  }
}

export class NotFoundError extends ApplicationError {
  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with id ${id} not found` : `${resource} not found`
    super('NOT_FOUND', message, 404)
    Object.setPrototypeOf(this, NotFoundError.prototype)
  }
}

export class ConflictError extends ApplicationError {
  constructor(message: string, details?: unknown) {
    super('CONFLICT', message, 409, details)
    Object.setPrototypeOf(this, ConflictError.prototype)
  }
}

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401)
    Object.setPrototypeOf(this, UnauthorizedError.prototype)
  }
}

export class ForbiddenError extends ApplicationError {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, 403)
    Object.setPrototypeOf(this, ForbiddenError.prototype)
  }
}

export class InternalServerError extends ApplicationError {
  constructor(message: string = 'Internal server error') {
    super('INTERNAL_SERVER_ERROR', message, 500)
    Object.setPrototypeOf(this, InternalServerError.prototype)
  }
}
