import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Route, Routes } from 'react-router-dom'

import { AdminApp } from './AdminApp'
import { AdminErrorBoundary } from './observability/error-boundary'
import './styles.css'

const root = document.getElementById('root')

if (!root) {
  throw new Error('Admin root element was not found')
}

createRoot(root).render(
  <StrictMode>
    <AdminErrorBoundary>
      <BrowserRouter basename="/admin">
        <Routes>
          <Route path="/" element={<AdminApp />} />
          <Route path="/:section" element={<AdminApp />} />
          <Route path="/:section/*" element={<AdminApp />} />
        </Routes>
      </BrowserRouter>
    </AdminErrorBoundary>
  </StrictMode>,
)
