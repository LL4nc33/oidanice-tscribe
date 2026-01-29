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
        className="font-mono text-xs uppercase tracking-[0.2em] leading-tight"
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
            className="btn-kindle font-mono text-xs px-5 py-2.5 inline-block text-center"
            style={{
              textDecoration: 'none',
              minWidth: '60px',
            }}
          >
            {format.label}
          </a>
        ))}
      </div>
    </div>
  )
}
