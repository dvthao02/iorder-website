import type { ReactNode } from 'react'
import * as Sentry from '@sentry/react'

function tracesSampleRate() {
  const value = Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? '0')
  return Number.isFinite(value) && value >= 0 && value <= 1 ? value : 0
}

export function initSentry() {
  if (!import.meta.env.VITE_SENTRY_DSN) return

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.VITE_SENTRY_ENVIRONMENT ?? import.meta.env.MODE,
    tracesSampleRate: tracesSampleRate(),
    integrations: [Sentry.browserTracingIntegration()],
    ...(import.meta.env.VITE_SENTRY_RELEASE ? { release: import.meta.env.VITE_SENTRY_RELEASE } : {}),
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.cookie
        delete event.request.headers.authorization
      }
      return event
    },
  })
}

export function AdminErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <Sentry.ErrorBoundary
      fallback={
        <main className="admin-shell" role="alert">
          <section className="admin-card">
            <h1>Khong tai duoc CMS</h1>
            <p>He thong da ghi nhan loi. Vui long tai lai trang sau it phut.</p>
          </section>
        </main>
      }
    >
      {children}
    </Sentry.ErrorBoundary>
  )
}
