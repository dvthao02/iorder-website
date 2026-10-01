import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { AdminApp } from './AdminApp'
import { AdminErrorBoundary } from './observability/error-boundary'
import './styles.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Admin root element was not found')
}

const router = createBrowserRouter(
  [
    { path: '/', element: <AdminApp /> },
    { path: '/:section', element: <AdminApp /> },
    { path: '/:section/*', element: <AdminApp /> },
  ],
  { basename: '/admin' },
)

createRoot(root).render(
  <StrictMode>
    <AdminErrorBoundary>
      <RouterProvider router={router} />
    </AdminErrorBoundary>
  </StrictMode>,
)
