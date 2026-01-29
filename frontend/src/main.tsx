/**
 * React entry point.
 *
 * WHY: StrictMode enables additional development warnings for
 * deprecated APIs and side-effect detection. Mounts into the
 * #root div defined in index.html.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ErrorBoundary } from './components/ErrorBoundary'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// WHY: Register service worker for PWA install support and app-shell caching.
// Only in production to avoid caching issues during development.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js')
}
