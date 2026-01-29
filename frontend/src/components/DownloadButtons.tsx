/**
 * Download format buttons component.
 *
 * WHY: Separate buttons for each format because users need different
 * formats for different tools - SRT for video editors, VTT for web
 * players, TXT for reading, JSON for programmatic access.
 */

import { getDownloadUrl } from '../api/client'

/** WHY: Supported download formats with labels.
 *  Each format serves a different use case. */
const FORMATS = [
  { value: 'srt', label: 'SRT' },
  { value: 'vtt', label: 'VTT' },
  { value: 'txt', label: 'TXT' },
  { value: 'json', label: 'JSON' },
]

interface DownloadButtonsProps {
  jobId: string
}

/** WHY: Uses anchor tags with download attribute to trigger the browser's
 *  native file download. No JavaScript fetch needed - the browser
 *  handles the download dialog automatically. */
export function DownloadButtons({ jobId }: DownloadButtonsProps) {
  return (
    <div className="space-y-2">
      <h3
        className="font-serif text-sm uppercase tracking-widest"
        style={{ color: 'var(--text-secondary)' }}
      >
        Download
      </h3>

      <div className="flex gap-2 flex-wrap">
        {FORMATS.map((format) => (
          <a
            key={format.value}
            href={getDownloadUrl(jobId, format.value)}
            download
            className="font-mono text-xs px-4 py-2 transition-colors inline-block text-center"
            style={{
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg)',
              color: 'var(--text)',
              textDecoration: 'none',
              minWidth: '60px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--text)'
              e.currentTarget.style.color = 'var(--bg)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg)'
              e.currentTarget.style.color = 'var(--text)'
            }}
          >
            {format.label}
          </a>
        ))}
      </div>
    </div>
  )
}
