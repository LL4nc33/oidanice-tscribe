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
