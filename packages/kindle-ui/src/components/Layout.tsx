/**
 * Page layout with header, main content area, and footer.
 *
 * WHY: Consistent page structure with Kindle/E-Reader aesthetic.
 * Header contains the brand title in serif font. Footer provides credits.
 * Thin 1px borders separate sections -- mimicking the subtle framing
 * of a physical e-reader screen.
 *
 * This is an opinionated layout. For custom layouts, compose your own
 * using the CSS variables and individual components.
 *
 * @example
 * ```tsx
 * <Layout
 *   title="My App"
 *   headerRight={<DarkModeToggle />}
 *   footer={<span>built by OidaNice</span>}
 * >
 *   <p>Page content here</p>
 * </Layout>
 * ```
 */

import { ReactNode } from 'react'

export interface LayoutProps {
  /** Page content rendered in the main area. */
  children: ReactNode
  /** Brand title displayed in the header. */
  title?: string
  /** Element rendered on the right side of the header (e.g., DarkModeToggle). */
  headerRight?: ReactNode
  /** Content rendered between header and main (e.g., InstallPrompt). */
  banner?: ReactNode
  /** Footer content. If omitted, no footer is rendered. */
  footer?: ReactNode
  /** Max width class for the main content area. Defaults to 'max-w-4xl'. */
  maxWidth?: string
}

/** WHY: Layout enforces the chrome around app content. The min-h-screen +
 *  flex-col + flex-1 pattern ensures the footer stays at the bottom even
 *  on short pages. */
export function Layout({
  children,
  title,
  headerRight,
  banner,
  footer,
  maxWidth = 'max-w-4xl',
}: LayoutProps) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--bg)', color: 'var(--text)' }}
    >
      {/* WHY: Header uses a thin bottom border for clean Kindle-style separation. */}
      <header
        className="px-6 py-6 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        {title && (
          <h1 className="font-serif text-2xl font-light tracking-wider leading-tight">
            {title}
          </h1>
        )}
        {headerRight}
      </header>

      {banner}

      {/* WHY: flex-1 ensures the main content stretches to fill available space. */}
      <main className={`flex-1 px-6 py-8 ${maxWidth} w-full mx-auto`}>
        {children}
      </main>

      {/* WHY: Footer with thin top border mirrors the header for symmetry. */}
      {footer && (
        <footer
          className="px-6 py-3 text-center font-mono text-xs flex items-center justify-center gap-1"
          style={{
            borderTop: '1px solid var(--border)',
            color: 'var(--text-secondary)',
          }}
        >
          {footer}
        </footer>
      )}
    </div>
  )
}
