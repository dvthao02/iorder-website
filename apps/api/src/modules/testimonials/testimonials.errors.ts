import { ApplicationError } from '../../shared/errors/index.js'

export class TestimonialNotFoundError extends ApplicationError {
  constructor() {
    super('TESTIMONIAL_NOT_FOUND', 'Testimonial does not exist', 404)
    Object.setPrototypeOf(this, TestimonialNotFoundError.prototype)
  }
}

export class TestimonialAvatarNotFoundError extends ApplicationError {
  constructor() {
    super('AVATAR_MEDIA_NOT_FOUND', 'Referenced avatar media does not exist', 400)
    Object.setPrototypeOf(this, TestimonialAvatarNotFoundError.prototype)
  }
}
