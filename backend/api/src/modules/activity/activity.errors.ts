import { ApplicationError } from '../../shared/errors/index.js'

// activity là module chỉ-đọc (không có mutation), nên hiện chưa có domain error nào được throw
// trong service. Giữ file này để khớp module standard và làm chỗ mở rộng khi có nhu cầu
// (vd giới hạn quyền xem log theo entityType trong tương lai).
export class ActivityQueryInvalidError extends ApplicationError {
  constructor(details?: unknown) {
    super('ACTIVITY_QUERY_INVALID', 'Activity query parameters are invalid', 400, details)
    Object.setPrototypeOf(this, ActivityQueryInvalidError.prototype)
  }
}
