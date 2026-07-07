import { ApplicationError } from '../../shared/errors/index.js'

export class MenuNotFoundError extends ApplicationError {
  constructor() {
    super('MENU_NOT_FOUND', 'Menu does not exist', 404)
    Object.setPrototypeOf(this, MenuNotFoundError.prototype)
  }
}

export class MenuNotFoundPublicError extends ApplicationError {
  constructor() {
    super('NOT_FOUND', 'Menu does not exist', 404)
    Object.setPrototypeOf(this, MenuNotFoundPublicError.prototype)
  }
}

export class MenuItemNotFoundError extends ApplicationError {
  constructor() {
    super('ITEM_NOT_FOUND', 'Menu item does not exist', 404)
    Object.setPrototypeOf(this, MenuItemNotFoundError.prototype)
  }
}

export class MenuLocationTakenError extends ApplicationError {
  constructor() {
    super('LOCATION_TAKEN', 'A menu already exists at this location', 409)
    Object.setPrototypeOf(this, MenuLocationTakenError.prototype)
  }
}

export class LinkGroupNotFoundError extends ApplicationError {
  constructor() {
    super('GROUP_NOT_FOUND', 'Link group does not exist', 404)
    Object.setPrototypeOf(this, LinkGroupNotFoundError.prototype)
  }
}

export class ContentLinkNotFoundError extends ApplicationError {
  constructor() {
    super('LINK_NOT_FOUND', 'Content link does not exist', 404)
    Object.setPrototypeOf(this, ContentLinkNotFoundError.prototype)
  }
}
