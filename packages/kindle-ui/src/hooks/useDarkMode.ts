/**
 * Dark mode toggle hook with localStorage persistence.
 *
 * WHY: E-Reader aesthetic supports both paper-white and e-ink-dark modes.
 * Default is light (Kindle default is white paper). Persists preference
 * so users don't have to toggle every visit.
 *
 * The hook manages both the `dark` class on `<html>` (for Tailwind's
 * dark: variants) and `data-theme` attribute (for non-Tailwind consumers).
 *
 * @param storageKey - localStorage key for persistence. Defaults to 'ink-ui-dark-mode'.
 * @returns Tuple of [isDark, toggleDark]
 *
 * @example
 * ```tsx
 * const [isDark, toggleDark] = useDarkMode()
 * return <button onClick={toggleDark}>{isDark ? 'Light' : 'Dark'}</button>
 * ```
 */

import { useState, useEffect, useCallback } from 'react'

/** WHY: Reads saved preference or falls back to system preference, then light.
 *  Runs once at hook initialization to avoid FOUC (flash of unstyled content). */
function getInitialMode(storageKey: string): boolean {
  if (typeof window === 'undefined') return false

  const saved = localStorage.getItem(storageKey)
  if (saved !== null) {
    return saved === 'true'
  }

  // Fall back to system preference
  if (window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  }

  return false
}

export function useDarkMode(
  storageKey: string = 'ink-ui-dark-mode'
): [boolean, () => void] {
  const [isDark, setIsDark] = useState(() => getInitialMode(storageKey))

  /** WHY: Syncs the dark class on the html element so Tailwind's
   *  dark: variants and our CSS custom properties both respond.
   *  Also sets data-theme for non-Tailwind consumers of kindle.css. */
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
    } else {
      root.classList.remove('dark')
      root.removeAttribute('data-theme')
    }
    localStorage.setItem(storageKey, String(isDark))
  }, [isDark, storageKey])

  const toggle = useCallback(() => setIsDark((prev) => !prev), [])

  return [isDark, toggle]
}
