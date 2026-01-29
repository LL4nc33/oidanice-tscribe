/**
 * Single job status display component.
 *
 * WHY: Shows the current state of a transcription job with text-based
 * status badges (no colors - only borders and fill for contrast).
 * Progress percentage gives feedback for active jobs.
 */

import type { Job } from '../types'
import { JobStatus as Status } from '../types'

interface JobStatusProps {
  job: Job
}

/** WHY: Maps status enum to human-readable labels with Unicode circle indicators.
 *  Circle fill level conveys progress visually without color. */
function statusLabel(status: Status): string {
  switch (status) {
    case Status.QUEUED:
      return '\u25CB queued'
    case Status.DOWNLOADING:
      return '\u25D4 downloading'
    case Status.TRANSCRIBING:
      return '\u25D1 transcribing'
    case Status.DONE:
      return '\u25CF done'
    case Status.FAILED:
      return '\u2715 failed'
  }
}

/** WHY: Determines if the status badge should be inverted (filled)
 *  to visually distinguish terminal states from active ones. */
function isInvertedStatus(status: Status): boolean {
  return status === Status.DONE || status === Status.FAILED
}

/** WHY: Formats ISO date string to a readable local time.
 *  Short format keeps the Kindle clean aesthetic. */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** WHY: Formats duration in seconds to a human-readable "Xm Ys" string. */
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

/** WHY: Calculates wall-clock processing time from created_at to completed_at.
 *  Shows how long the user actually waited, not media duration. */
function formatProcessingTime(createdAt: string, completedAt: string): string {
  const diffMs = new Date(completedAt).getTime() - new Date(createdAt).getTime()
  const diffSec = Math.max(0, Math.floor(diffMs / 1000))
  return formatDuration(diffSec)
}

export function JobStatusDisplay({ job }: JobStatusProps) {
  const inverted = isInvertedStatus(job.status)

  return (
    <div className="space-y-3">
      {/* WHY: Title and status on the same line for compact display. */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="font-serif text-base font-medium leading-tight truncate flex-1">
          {job.title || 'Untitled'}
        </h2>

        <span
          className="font-mono text-xs px-2 py-1 whitespace-nowrap"
          style={{
            border: '1px solid var(--border)',
            backgroundColor: inverted ? 'var(--text)' : 'var(--bg)',
            color: inverted ? 'var(--bg)' : 'var(--text)',
          }}
        >
          {statusLabel(job.status)}
        </span>
      </div>

      {/* WHY: URL displayed in mono font at reduced size - it's reference info,
          not the primary focus. Truncated to avoid layout breakage. */}
      <p
        className="font-mono text-xs truncate"
        style={{ color: 'var(--text-secondary)' }}
      >
        {job.url}
      </p>

      {/* WHY: Progress bar only shown for active jobs. Uses a simple
          bordered box with a filled portion - no color needed. */}
      {(job.status === Status.DOWNLOADING || job.status === Status.TRANSCRIBING) && (
        <div className="flex items-center gap-3">
          <div
            className="h-1.5 flex-1 rounded-sm"
            style={{ backgroundColor: 'var(--secondary)' }}
          >
            <div
              className="h-full rounded-sm transition-all duration-500 ease-out"
              style={{
                width: `${job.progress}%`,
                backgroundColor: 'var(--text)',
              }}
            />
          </div>
          <span className="font-mono text-xs whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
            {job.progress}%
          </span>
        </div>
      )}

      {/* WHY: Metadata row shows timestamps and duration in compact format. */}
      <div className="flex gap-4 flex-wrap font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
        <span>Created: {formatDate(job.created_at)}</span>
        {job.completed_at && <span>Completed: {formatDate(job.completed_at)}</span>}
        {job.duration_seconds && <span>Duration: {formatDuration(job.duration_seconds)}</span>}
        {job.detected_language && <span>Language: {job.detected_language}</span>}
      </div>

      {/* WHY: Source and processing time shown only for completed jobs.
          Tells users whether subtitles (fast) or whisper (slow) was used,
          and how long they waited. */}
      {job.status === Status.DONE && (job.source || job.completed_at) && (
        <div className="font-mono text-xs" style={{ color: 'var(--text-secondary)' }}>
          {job.source && <span>via {job.source}</span>}
          {job.source && job.completed_at && <span> </span>}
          {job.completed_at && (
            <span>&middot; {formatProcessingTime(job.created_at, job.completed_at)}</span>
          )}
        </div>
      )}

      {/* WHY: Error message in a bordered box with bold text.
          No red color - the FAILED badge and bold text are sufficient. */}
      {job.status === Status.FAILED && job.error && (
        <div
          className="px-4 py-3 font-mono text-sm"
          style={{ border: '2px solid var(--border)' }}
        >
          <p className="font-bold mb-1">Error</p>
          <p>{job.error}</p>
        </div>
      )}
    </div>
  )
}
