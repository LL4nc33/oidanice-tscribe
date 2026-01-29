/**
 * Recent jobs list component.
 *
 * WHY: Displays all jobs in a clean list with horizontal rules between items,
 * mimicking the chapter/bookmark list on a Kindle. Click to select a job
 * for detailed viewing.
 */

import type { JobListItem } from '../types'
import { JobStatus } from '../types'

interface JobListProps {
  jobs: JobListItem[]
  selectedId: string | null
  onSelect: (id: string) => void
}

/** WHY: Compact status indicator for list rows - single character saves space. */
function statusIndicator(status: JobStatus): string {
  switch (status) {
    case JobStatus.QUEUED:
      return '...'
    case JobStatus.DOWNLOADING:
      return '>>>'
    case JobStatus.TRANSCRIBING:
      return '|||'
    case JobStatus.DONE:
      return '[x]'
    case JobStatus.FAILED:
      return '[!]'
  }
}

/** WHY: Short date format for the list to save horizontal space. */
function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function JobList({ jobs, selectedId, onSelect }: JobListProps) {
  if (jobs.length === 0) {
    return (
      <div className="py-8 text-center font-serif" style={{ color: 'var(--text-secondary)' }}>
        No transcriptions yet. Paste a URL above to get started.
      </div>
    )
  }

  return (
    <div>
      <h3
        className="font-serif text-sm mb-3 uppercase tracking-widest"
        style={{ color: 'var(--text-secondary)' }}
      >
        Recent Transcriptions
      </h3>

      <div style={{ borderTop: '1px solid var(--border)' }}>
        {jobs.map((job) => {
          const isSelected = job.id === selectedId
          const isActive =
            job.status === JobStatus.QUEUED ||
            job.status === JobStatus.DOWNLOADING ||
            job.status === JobStatus.TRANSCRIBING

          return (
            <button
              key={job.id}
              onClick={() => onSelect(job.id)}
              className="w-full text-left px-3 py-3 flex items-center gap-3 transition-colors"
              style={{
                borderBottom: '1px solid var(--border)',
                backgroundColor: isSelected ? 'var(--text)' : 'var(--bg)',
                color: isSelected ? 'var(--bg)' : 'var(--text)',
              }}
            >
              {/* WHY: Monospace status indicator aligns neatly in the list. */}
              <span className="font-mono text-xs shrink-0 w-8">
                {statusIndicator(job.status)}
              </span>

              {/* WHY: Title truncated with flex-1 to prevent overflow. */}
              <span className="font-serif text-sm flex-1 truncate">
                {job.title || job.url}
              </span>

              {/* WHY: Progress shown inline for active jobs so user sees
                  progress without clicking into detail view. */}
              {isActive && job.progress > 0 && (
                <span className="font-mono text-xs shrink-0">
                  {job.progress}%
                </span>
              )}

              <span
                className="font-mono text-xs shrink-0"
                style={{ color: isSelected ? 'var(--bg)' : 'var(--text-secondary)' }}
              >
                {shortDate(job.created_at)}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
