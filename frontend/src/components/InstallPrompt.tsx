/**
 * PWA install prompt component.
 *
 * WHY: Browsers handle PWA install differently. Chrome/Edge fire a
 * beforeinstallprompt event we can capture. Safari/iOS has no install
 * API — users must manually "Add to Home Screen". This component
 * detects the browser and shows the appropriate instruction.
 *
 * Hidden when: already installed (standalone), dismissed by user,
 * or on desktop (only shown on mobile/tablet for cleaner UX).
 */

import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISSED_KEY = 'tscribe-install-dismissed'

/** WHY: Detect iOS/iPadOS — they have no install prompt API.
 *  Must check both iPhone and iPad (iPadOS reports as Macintosh). */
function isIOS(): boolean {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

/** WHY: Detect if running as installed PWA (standalone or fullscreen). */
function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone === true)
  )
}

/** WHY: Only show on mobile/tablet — desktop users can find the install
 *  icon in the address bar themselves. */
function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) || navigator.maxTouchPoints > 1
}

function detectBrowser(): 'safari' | 'chrome' | 'firefox' | 'samsung' | 'other' {
  const ua = navigator.userAgent
  if (/SamsungBrowser/i.test(ua)) return 'samsung'
  if (/CriOS|Chrome/i.test(ua) && !/Edg/i.test(ua)) return 'chrome'
  if (/FxiOS|Firefox/i.test(ua)) return 'firefox'
  if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) return 'safari'
  return 'other'
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    // Don't show if already installed, not mobile, or previously dismissed
    if (isStandalone() || !isMobile() || localStorage.getItem(DISMISSED_KEY)) return

    const browser = detectBrowser()

    // Chrome/Edge/Samsung: capture the native install event
    const handlePrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handlePrompt)

    // Safari/Firefox: no event, show manual instructions after short delay
    if (browser === 'safari' || browser === 'firefox') {
      const timer = setTimeout(() => setVisible(true), 2000)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('beforeinstallprompt', handlePrompt)
      }
    }

    // Also show after delay for Chrome if event hasn't fired yet
    const fallback = setTimeout(() => {
      if (!deferredPrompt) setVisible(true)
    }, 3000)

    return () => {
      clearTimeout(fallback)
      window.removeEventListener('beforeinstallprompt', handlePrompt)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleInstall = useCallback(async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setInstalled(true)
        setTimeout(() => setVisible(false), 2000)
      }
      setDeferredPrompt(null)
    }
  }, [deferredPrompt])

  const handleDismiss = useCallback(() => {
    setVisible(false)
    localStorage.setItem(DISMISSED_KEY, '1')
  }, [])

  if (!visible || isStandalone()) return null

  const browser = detectBrowser()
  const hasNativePrompt = !!deferredPrompt

  return (
    <div
      className="font-mono text-xs px-4 py-3 flex items-start gap-3"
      style={{
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--bg-secondary)',
      }}
    >
      <div className="flex-1">
        {installed ? (
          <span>installed ✓</span>
        ) : hasNativePrompt ? (
          <>
            <button
              onClick={handleInstall}
              className="btn-kindle px-3 py-1 font-mono text-xs"
            >
              install app
            </button>
            <span className="ml-2" style={{ color: 'var(--text-secondary)' }}>
              add TScribe to your home screen
            </span>
          </>
        ) : isIOS() && browser === 'safari' ? (
          <span>
            tap{' '}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', verticalAlign: 'middle' }}>
              <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/>
            </svg>{' '}
            then <strong>Add to Home Screen</strong>
          </span>
        ) : isIOS() ? (
          <span>
            open in <strong>Safari</strong> to install as app
          </span>
        ) : browser === 'firefox' ? (
          <span>
            tap <strong>⋮</strong> then <strong>Install</strong>
          </span>
        ) : browser === 'samsung' ? (
          <span>
            tap <strong>⋮</strong> then <strong>Add page to → Home screen</strong>
          </span>
        ) : (
          <span>
            tap <strong>⋮</strong> then <strong>Add to Home screen</strong>
          </span>
        )}
      </div>
      {!installed && (
        <button
          onClick={handleDismiss}
          className="text-sm"
          style={{ color: 'var(--text-secondary)', background: 'none', border: 'none' }}
          aria-label="Dismiss install prompt"
        >
          ✕
        </button>
      )}
    </div>
  )
}
