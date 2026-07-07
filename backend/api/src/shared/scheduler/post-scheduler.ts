import type { PostsService } from '../../modules/posts/posts.service.js'
import type { ServiceLogger } from '../../modules/posts/posts.service.js'

export type PostSchedulerDeps = {
  postsService: PostsService
  logger?: ServiceLogger
  intervalMs?: number
  enabled?: boolean
}

export type PostScheduler = {
  stop: () => void
}

const DEFAULT_INTERVAL_MS = 60_000

// Scheduler nhẹ chạy trong tiến trình API: định kỳ quét và tự động publish các bài viết
// đã đến hạn hẹn giờ (Posts.scheduledAt). Không dùng cron/worker riêng — đủ cho quy mô hiện tại.
export function startPostScheduler(deps: PostSchedulerDeps): PostScheduler {
  const { postsService, logger, enabled = true, intervalMs = DEFAULT_INTERVAL_MS } = deps
  const log: ServiceLogger = logger ?? { error: () => {} }

  if (!enabled) {
    return { stop: () => {} }
  }

  let inFlight = false

  const tick = async () => {
    if (inFlight) return // Lần chạy trước chưa xong: bỏ qua lần trigger này để tránh chồng lấp.
    inFlight = true
    try {
      await postsService.publishDueScheduled(log)
    } catch (error) {
      // Không được để lỗi làm crash tiến trình API.
      log.error({ err: error }, 'Post scheduler tick failed')
    } finally {
      inFlight = false
    }
  }

  const timer = setInterval(() => {
    void tick()
  }, intervalMs)
  // Không giữ tiến trình sống chỉ vì timer này (hữu ích khi chạy trong test/CLI ngắn hạn).
  timer.unref?.()

  return {
    stop: () => clearInterval(timer),
  }
}
