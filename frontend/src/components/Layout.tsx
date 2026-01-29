/**
 * Main layout wrapper with header and footer.
 *
 * WHY: Consistent page structure with Kindle/E-Reader aesthetic.
 * Header contains the brand title in serif font and dark mode toggle.
 * Footer provides OidaNice credit. All styling is black/white only.
 */

import { ReactNode } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'

interface LayoutProps {
  children: ReactNode
}

/** WHY: Layout provides the chrome around the app content.
 *  Thin top/bottom borders mimic the subtle framing of an e-reader screen. */
export function Layout({ children }: LayoutProps) {
  const [isDark, toggleDark] = useDarkMode()

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* WHY: Header uses a thin bottom border for clean Kindle-style separation. */}
      <header
        className="px-6 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h1 className="font-serif text-2xl tracking-wide">
          TScribe
        </h1>

        {/* WHY: Text-based sun/moon toggle avoids icon dependencies.
            ASCII characters give the e-reader feel. */}
        <button
          onClick={toggleDark}
          className="font-serif text-sm px-3 py-1 transition-colors"
          style={{
            border: '1px solid var(--border)',
            backgroundColor: 'var(--bg)',
            color: 'var(--text)',
          }}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? '[ sun ]' : '[ moon ]'}
        </button>
      </header>

      {/* WHY: flex-1 ensures the main content stretches to fill available space. */}
      <main className="flex-1 px-6 py-8 max-w-4xl w-full mx-auto">
        {children}
      </main>

      {/* WHY: Footer with thin top border mirrors the header for symmetry. */}
      <footer
        className="px-6 py-3 text-center font-serif text-sm"
        style={{
          borderTop: '1px solid var(--border)',
          color: 'var(--text-secondary)',
        }}
      >
        OidaNice
      </footer>
    </div>
  )
}
