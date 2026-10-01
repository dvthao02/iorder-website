import { ApplicationError } from '../../shared/errors/index.js'

// Reserved for settings records that become addressable individually.
// Keeping a domain error lets routes retain the shared error contract as this module grows.
export class SettingNotFoundError extends ApplicationError {
  constructor(key: string) {
    super('SETTING_NOT_FOUND', `Setting does not exist: ${key}`, 404)
    Object.setPrototypeOf(this, SettingNotFoundError.prototype)
  }
}
