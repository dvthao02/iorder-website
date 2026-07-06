import { ApplicationError } from '../../shared/errors/index.js'

export class CategoryNotFoundError extends ApplicationError {
  constructor() {
    super('CATEGORY_NOT_FOUND', 'Category does not exist', 404)
    Object.setPrototypeOf(this, CategoryNotFoundError.prototype)
  }
}
