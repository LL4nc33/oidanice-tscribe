/**
 * Main layout wrapper with header and footer.
 *
 * WHY: Consistent page structure with Kindle/E-Reader aesthetic.
 * Header contains the brand title in serif font and dark mode toggle.
 * Footer provides OidaNice credit. All styling is black/white only.
 */

import { ReactNode } from 'react'
import { useDarkMode } from '../hooks/useDarkMode'
import { InstallPrompt } from './InstallPrompt'

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
        className="px-6 py-6 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <h1 className="font-serif text-2xl font-light tracking-wider leading-tight">
          TScribe
        </h1>

        {/* WHY: Unicode sun/moon toggle — no icon dependencies, no borders.
            Bare symbol keeps the monochrome e-reader aesthetic. */}
        <button
          onClick={toggleDark}
          className="text-lg transition-transform duration-150 hover:scale-110"
          style={{ color: 'var(--text)', background: 'none', border: 'none' }}
          aria-label="Toggle dark mode"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? '☀' : '☽'}
        </button>
      </header>

      <InstallPrompt />

      {/* WHY: flex-1 ensures the main content stretches to fill available space. */}
      <main className="flex-1 px-6 py-8 max-w-4xl w-full mx-auto">
        {children}
      </main>

      {/* WHY: Footer with thin top border mirrors the header for symmetry.
          Powered-by style credits the tech stack and links to the repo. */}
      <footer
        className="px-6 py-3 text-center font-mono text-xs flex items-center justify-center gap-1"
        style={{
          borderTop: '1px solid var(--border)',
          color: 'var(--text-secondary)',
        }}
      >
        <span>powered by faster-whisper</span>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>built by</span>
        <a
          href="https://github.com/LL4nc33/oidanice-tscribe"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-kindle"
          style={{
            display: 'inline',
            border: 'none',
            padding: 0,
            textDecoration: 'underline',
            textUnderlineOffset: '2px',
          }}
        >
          OidaNice
        </a>
        <span style={{ opacity: 0.4 }}>·</span>
        <span>v0.0.4</span>
      </footer>
    </div>
  )
}
