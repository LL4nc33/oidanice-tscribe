/**
 * Sun/moon dark mode toggle button.
 *
 * WHY: Unicode sun/moon toggle -- no icon library dependencies, no borders.
 * A bare symbol keeps the monochrome e-reader aesthetic. The subtle
 * scale-on-hover animation provides the only affordance.
 *
 * Uses the useDarkMode hook internally. If you need the hook value in
 * a parent component, use useDarkMode directly and pass isDark/toggle
 * via props instead.
 *
 * @example
 * ```tsx
 * // Self-contained (manages its own state)
 * <DarkModeToggle />
 *
 * // Controlled (parent manages state via useDarkMode)
 * const [isDark, toggle] = useDarkMode()
 * <DarkModeToggle isDark={isDark} onToggle={toggle} />
 * ```
 */

import { useDarkMode } from '../hooks/useDarkMode'

export interface DarkModeToggleProps {
  /** Override: controlled dark state. If omitted, uses internal useDarkMode. */
  isDark?: boolean
  /** Override: controlled toggle handler. If omitted, uses internal useDarkMode. */
  onToggle?: () => void
  /** localStorage key for persistence. Only used in uncontrolled mode. */
  storageKey?: string
}

/** WHY: Supports both controlled and uncontrolled usage patterns.
 *  Controlled mode lets parent components like Layout share the isDark state.
 *  Uncontrolled mode is simpler for standalone usage. */
export function DarkModeToggle({
  isDark: controlledIsDark,
  onToggle: controlledToggle,
  storageKey,
}: DarkModeToggleProps = {}) {
  const [internalIsDark, internalToggle] = useDarkMode(storageKey)

  const isDark = controlledIsDark ?? internalIsDark
  const toggle = controlledToggle ?? internalToggle

  return (
    <button
      onClick={toggle}
      className="text-lg transition-transform duration-150 hover:scale-110"
      style={{ color: 'var(--text)', background: 'none', border: 'none' }}
      aria-label="Toggle dark mode"
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? '\u2600' : '\u263D'}
    </button>
  )
}
