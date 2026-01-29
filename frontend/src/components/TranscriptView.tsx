/**
 * Transcript display component.
 *
 * WHY: Monospace font for transcript text ensures readability and
 * consistent alignment of timestamps. Scrollable container prevents
 * long transcripts from pushing the page layout.
 */

import { useState } from 'react'

interface TranscriptViewProps {
  text: string
}

/** WHY: Separate component for the transcript content area.
 *  Includes copy-to-clipboard and a clean scrollable display. */
export function TranscriptView({ text }: TranscriptViewProps) {
  const [copied, setCopied] = useState(false)

  /** WHY: Uses the Clipboard API for copy - supported in all modern browsers.
   *  Shows a brief "Copied" confirmation text instead of a color flash. */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    } catch {
      // WHY: Fallback for older browsers or restricted contexts.
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  return (
    <div className="space-y-2">
      {/* WHY: Header row with label and copy button for quick access. */}
      <div className="flex items-center justify-between">
        <h3
          className="font-mono text-xs uppercase tracking-[0.2em] leading-tight"
          style={{ color: 'var(--text-secondary)' }}
        >
          Transcript
        </h3>

        <button
          onClick={handleCopy}
          className="btn-kindle font-mono text-xs px-3 py-1"
          style={copied ? {
            backgroundColor: 'var(--text)',
            color: 'var(--bg)',
          } : undefined}
        >
          {copied ? 'copied \u2713' : 'copy'}
        </button>
      </div>

      {/* WHY: Max height with overflow-y creates a scrollable transcript area
          that doesn't dominate the page. Border gives it a "text frame" feel
          like a Kindle reading pane. */}
      <div
        className="max-h-[60vh] overflow-y-auto p-4"
        style={{
          border: '1px solid var(--border)',
          backgroundColor: 'var(--bg-secondary)',
        }}
      >
        <pre className="font-mono text-sm whitespace-pre-wrap leading-relaxed">
          {text}
        </pre>
      </div>
    </div>
  )
}
