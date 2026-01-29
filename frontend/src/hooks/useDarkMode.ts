/**
 * Dark mode toggle hook with localStorage persistence.
 *
 * WHY: E-Reader aesthetic supports both paper-white and e-ink-dark modes.
 * Default is light (Kindle default is white paper). Persists preference
 * so users don't have to toggle every visit.
 */

import { useState, useEffect } from 'react'

/** WHY: Reads saved preference or defaults to light mode.
 *  Runs once at hook initialization to avoid flicker. */
function getInitialMode(): boolean {
  const saved = localStorage.getItem('tscribe-dark-mode')
  if (saved !== null) {
    return saved === 'true'
  }
  return false
}

export function useDarkMode(): [boolean, () => void] {
  const [isDark, setIsDark] = useState(getInitialMode)

  /** WHY: Syncs the dark class on the html element so Tailwind's
   *  dark: variants and our CSS custom properties both respond. */
  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('tscribe-dark-mode', String(isDark))
  }, [isDark])

  const toggle = () => setIsDark((prev) => !prev)

  return [isDark, toggle]
}
