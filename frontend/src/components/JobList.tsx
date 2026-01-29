/**
 * Recent jobs list component with delete, clear-all, and platform filtering.
 *
 * WHY: Displays all jobs in a clean list with horizontal rules between items,
 * mimicking the chapter/bookmark list on a Kindle. Click to select a job
 * for detailed viewing. Platform filter chips enable quick narrowing by source.
 */

import { useState, useMemo } from 'react'
import type { JobListItem } from '../types'
import { JobStatus } from '../types'

// -- Platform detection & icons -------------------------------------------------

/** WHY: Union type constrains platform values so the icon map is exhaustive. */
type Platform = 'all' | 'youtube' | 'tiktok' | 'instagram' | 'facebook' | 'x' | 'other'

/** WHY: Derive platform from the job URL hostname so filtering is purely
 *  client-side with no backend changes. */
function detectPlatform(url: string): Exclude<Platform, 'all'> {
  try {
    const host = new URL(url).hostname.replace('www.', '')
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube'
    if (host.includes('tiktok.com')) return 'tiktok'
    if (host.includes('instagram.com')) return 'instagram'
    if (host.includes('facebook.com') || host.includes('fb.watch')) return 'facebook'
    if (host.includes('twitter.com') || host.includes('x.com')) return 'x'
  } catch {
    // WHY: Gracefully handle malformed URLs -- treat as "other".
  }
  return 'other'
}

/** WHY: Inline SVG icons keep the monochrome aesthetic (currentColor) and avoid
 *  external asset dependencies. Each icon is 14x14 for chip-sized display. */
function PlatformIcon({ platform }: { platform: Exclude<Platform, 'all'> }) {
  const size = 14
  /** WHY: Filled brand icons use fill="currentColor" so they inherit the
   *  Kindle theme text color automatically in both light and dark modes. */
  const common = { width: size, height: size, viewBox: '0 0 24 24', xmlns: 'http://www.w3.org/2000/svg' } as const

  switch (platform) {
    case 'youtube':
      // WHY: Official YouTube play-button silhouette -- instantly recognisable.
      return (
        <svg {...common} fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    case 'tiktok':
      // WHY: TikTok musical-note silhouette -- matches the platform's brand identity.
      return (
        <svg {...common} fill="currentColor">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.71a8.21 8.21 0 0 0 4.76 1.52v-3.45a4.85 4.85 0 0 1-1-.09z" />
        </svg>
      )
    case 'instagram':
      // WHY: Instagram camera outline -- instantly recognisable brand shape.
      return (
        <svg {...common} fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
        </svg>
      )
    case 'facebook':
      // WHY: Facebook "f" letterform -- the classic brand icon.
      return (
        <svg {...common} fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    case 'x':
      // WHY: Official X (formerly Twitter) logo -- the bold letter X shape.
      return (
        <svg {...common} fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case 'other':
      // WHY: Chain-link icon for unrecognised platforms -- universal "link" metaphor.
      return (
        <svg {...common} fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
        </svg>
      )
  }
}

const PLATFORM_LABELS: Record<Exclude<Platform, 'all'>, string> = {
  youtube: 'YouTube',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  other: 'Other',
}

// -- Helpers from original component -------------------------------------------

/** WHY: Compact status indicator for list rows - Unicode circles convey
 *  progress visually (empty -> quarter -> half -> full) without color. */
function statusIndicator(status: JobStatus): string {
  switch (status) {
    case JobStatus.QUEUED:
      return '\u25CB'
    case JobStatus.DOWNLOADING:
      return '\u25D4'
    case JobStatus.TRANSCRIBING:
      return '\u25D1'
    case JobStatus.DONE:
      return '\u25CF'
    case JobStatus.FAILED:
      return '\u2715'
  }
}

/** WHY: Active statuses (downloading/transcribing) get a pulse animation
 *  so the user sees at a glance which jobs are in progress. */
function isAnimatedStatus(status: JobStatus): boolean {
  return status === JobStatus.DOWNLOADING || status === JobStatus.TRANSCRIBING
}

/** WHY: Short date format for the list to save horizontal space. */
function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

// -- Component -----------------------------------------------------------------

interface JobListProps {
  jobs: JobListItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  /** WHY: Callback to delete a single job by ID. Caller handles API call
   *  and refetching so this component stays presentational. */
  onDelete: (id: string) => Promise<void>
  /** WHY: Callback to clear all jobs. Caller iterates and deletes. */
  onClearAll: () => Promise<void>
}

export function JobList({ jobs, selectedId, onSelect, onDelete, onClearAll }: JobListProps) {
  const [activePlatform, setActivePlatform] = useState<Platform>('all')

  /** WHY: Derive which platforms exist in current jobs so we only show
   *  relevant filter chips. Memoised because job list changes infrequently. */
  const availablePlatforms = useMemo(() => {
    const set = new Set<Exclude<Platform, 'all'>>()
    for (const job of jobs) {
      set.add(detectPlatform(job.url))
    }
    return Array.from(set)
  }, [jobs])

  /** WHY: Client-side filter avoids backend round-trips. Falls back to
   *  showing all when no filter or when active filter has no matches. */
  const filteredJobs = useMemo(() => {
    if (activePlatform === 'all') return jobs
    return jobs.filter((job) => detectPlatform(job.url) === activePlatform)
  }, [jobs, activePlatform])

  if (jobs.length === 0) {
    return (
      <div className="py-8 text-center font-serif" style={{ color: 'var(--text-secondary)' }}>
        No transcriptions yet. Paste a URL above to get started.
      </div>
    )
  }

  /** WHY: Wraps delete with confirmation so accidental clicks are harmless. */
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    // WHY: Prevent the row's onClick from also firing (selecting the job).
    e.stopPropagation()
    if (!window.confirm('Delete this transcription?')) return
    await onDelete(id)
  }

  const handleClearAll = async () => {
    if (!window.confirm(`Delete all ${jobs.length} transcriptions?`)) return
    await onClearAll()
  }

  return (
    <div>
      {/* WHY: Header row with title left and clear-all right. */}
      <div className="flex items-baseline justify-between mb-3">
        <h3
          className="font-mono text-xs uppercase tracking-[0.2em] leading-tight"
          style={{ color: 'var(--text-secondary)' }}
        >
          Recent Transcriptions
        </h3>
        <button
          onClick={handleClearAll}
          className="font-mono text-xs btn-kindle px-2 py-0.5"
        >
          Clear All
        </button>
      </div>

      {/* WHY: Platform filter chips shown only when more than one platform exists,
       *  otherwise the filter bar adds no value and wastes vertical space. */}
      {availablePlatforms.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {/* WHY: "All" chip always first so there is an obvious way to reset. */}
          <FilterChip
            label="All"
            active={activePlatform === 'all'}
            onClick={() => setActivePlatform('all')}
          />
          {availablePlatforms.map((p) => (
            <FilterChip
              key={p}
              label={PLATFORM_LABELS[p]}
              icon={<PlatformIcon platform={p} />}
              active={activePlatform === p}
              onClick={() => setActivePlatform(p)}
            />
          ))}
        </div>
      )}

      <div style={{ borderTop: '1px solid var(--border)' }}>
        {filteredJobs.map((job) => {
          const isSelected = job.id === selectedId
          const isActive =
            job.status === JobStatus.QUEUED ||
            job.status === JobStatus.DOWNLOADING ||
            job.status === JobStatus.TRANSCRIBING

          return (
            <button
              key={job.id}
              onClick={() => onSelect(job.id)}
              className="w-full text-left px-3 py-3 flex items-center gap-3 transition-colors group"
              style={{
                borderBottom: '1px solid var(--border)',
                backgroundColor: isSelected ? 'var(--text)' : 'var(--bg)',
                color: isSelected ? 'var(--bg)' : 'var(--text)',
              }}
            >
              {/* WHY: Monospace status indicator aligns neatly in the list.
                  Active jobs pulse to show they are in progress. */}
              <span
                className="font-mono text-xs shrink-0 w-8"
                style={isAnimatedStatus(job.status) ? { animation: 'pulse-opacity 1.5s ease-in-out infinite' } : undefined}
              >
                {statusIndicator(job.status)}
              </span>

              {/* WHY: Title truncated with flex-1 to prevent overflow. */}
              <span className="font-serif text-base font-medium leading-tight flex-1 truncate">
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

              {/* WHY: Delete button is subtle (secondary color) until hover when
               *  it inverts to primary. Placed last so it doesn't shift layout. */}
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => handleDelete(e, job.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation()
                    handleDelete(e as unknown as React.MouseEvent, job.id)
                  }
                }}
                className="shrink-0 w-6 h-6 flex items-center justify-center font-mono text-xs transition-colors"
                style={{
                  color: isSelected ? 'var(--bg)' : 'var(--text-secondary)',
                  opacity: 0.4,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1'
                  e.currentTarget.style.color = isSelected ? 'var(--bg)' : 'var(--text)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0.4'
                  e.currentTarget.style.color = isSelected ? 'var(--bg)' : 'var(--text-secondary)'
                }}
                aria-label="Delete transcription"
              >
                {'\u2715'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// -- Filter chip sub-component -------------------------------------------------

/** WHY: Extracted as a sub-component to keep the JSX readable and to
 *  encapsulate the active/inactive styling logic in one place. */
function FilterChip({
  label,
  icon,
  active,
  onClick,
}: {
  label: string
  icon?: React.ReactNode
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className="font-mono text-xs px-2.5 py-1 flex items-center gap-1.5 transition-colors"
      style={{
        border: '1px solid var(--border)',
        backgroundColor: active ? 'var(--text)' : 'var(--bg)',
        color: active ? 'var(--bg)' : 'var(--text)',
      }}
    >
      {icon}
      <span className={icon && !active ? 'hidden sm:inline' : ''}>{label}</span>
    </button>
  )
}
