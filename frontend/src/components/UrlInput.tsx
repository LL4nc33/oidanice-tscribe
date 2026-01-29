/**
 * URL input form for creating transcription jobs.
 *
 * WHY: Paste detection enables a quick workflow - user copies a URL,
 * opens the app, and it auto-pastes into the input. Clean, minimal
 * Kindle-style borders with no color accents.
 */

import { useState, useEffect, useRef, FormEvent } from 'react'
import type { CreateJobRequest } from '../types'

/** WHY: Common languages for the optional language override.
 *  Auto-detect (empty string) is default because faster-whisper
 *  handles most content well without hints. */
const LANGUAGES = [
  { value: '', label: 'Auto-detect' },
  { value: 'en', label: 'English' },
  { value: 'de', label: 'Deutsch' },
  { value: 'es', label: 'Espanol' },
  { value: 'fr', label: 'Francais' },
  { value: 'it', label: 'Italiano' },
  { value: 'pt', label: 'Portugues' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ar', label: 'Arabic' },
]

interface UrlInputProps {
  onSubmit: (data: CreateJobRequest) => Promise<void>
}

export function UrlInput({ onSubmit }: UrlInputProps) {
  const [url, setUrl] = useState('')
  const [language, setLanguage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /** WHY: Auto-focus the input on mount for immediate typing/pasting. */
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  /** WHY: Paste detection reads clipboard on focus for quick workflow.
   *  Only auto-fills if the clipboard contains a URL-like string and
   *  the input is currently empty. */
  useEffect(() => {
    const handleFocus = async () => {
      if (url) return
      try {
        const text = await navigator.clipboard.readText()
        if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
          setUrl(text.trim())
        }
      } catch {
        // WHY: Clipboard access may be denied - silently ignore.
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [url])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setSubmitting(true)
    setError(null)

    try {
      const data: CreateJobRequest = { url: url.trim() }
      if (language) {
        data.language = language
      }
      await onSubmit(data)
      setUrl('')
      setLanguage('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job')
    } finally {
      setSubmitting(false)
    }
  }

  /** WHY: Input styles use inline var() references for theme-aware borders
   *  and backgrounds without adding Tailwind color classes. */
  const inputStyle = {
    border: '1px solid var(--border)',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* WHY: Vertical stack - input full-width, button full-width below.
          This gives the form a clean, spacious feel on all screen sizes. */}
      <input
        ref={inputRef}
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Paste video or audio URL..."
        className="w-full px-4 py-2 font-serif text-base leading-relaxed outline-none"
        style={inputStyle}
        disabled={submitting}
        required
      />

      <button
        type="submit"
        disabled={submitting || !url.trim()}
        className="w-full py-2 font-serif text-base transition-opacity disabled:opacity-40"
        style={{
          border: '1px solid var(--border)',
          backgroundColor: 'var(--text)',
          color: 'var(--bg)',
        }}
      >
        {submitting ? 'Sending...' : 'Transcribe'}
      </button>

      {/* WHY: Language select is secondary - smaller and below the main input.
          Most users will use auto-detect. */}
      <div className="flex items-center gap-3">
        <label className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
          Language:
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-2 py-1 font-mono text-xs outline-none"
          style={inputStyle}
          disabled={submitting}
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* WHY: Error display uses a bordered box instead of color for the
          monochrome aesthetic. Bold text draws attention without red. */}
      {error && (
        <p
          className="font-serif text-sm px-3 py-2 font-bold"
          style={{ border: '1px solid var(--border)' }}
        >
          Error: {error}
        </p>
      )}
    </form>
  )
}
