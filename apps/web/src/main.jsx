import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import ScrollReveal from './components/ScrollReveal.jsx'
import { AppErrorBoundary, initSentry } from './observability/sentry.jsx'
import './styles/main.css'

initSentry()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <ScrollToTop />
        <ScrollReveal />
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>,
)
