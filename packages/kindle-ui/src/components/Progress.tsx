/**
 * Kindle-styled progress bar.
 *
 * WHY: Progress indication without color -- uses accent variable
 * which defaults to monochrome. Supports determinate (value) and
 * indeterminate (no value) states.
 *
 * @example
 * ```tsx
 * <Progress value={75} />
 * <Progress /> {/* indeterminate *\/}
 * <Progress value={50} label="Transcribing..." />
 * ```
 */

import { HTMLAttributes, forwardRef } from 'react'

export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  /** Progress value 0-100. Omit for indeterminate state. */
  value?: number
  /** Optional label displayed above the bar. */
  label?: string
}

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  function Progress({ value, label, className = '', ...props }, ref) {
    const isIndeterminate = value === undefined

    return (
      <div ref={ref} className={`w-full ${className}`} {...props}>
        {label && (
          <div
            className="font-mono text-xs mb-1 flex justify-between"
            style={{ color: 'var(--text-secondary)' }}
          >
            <span>{label}</span>
            {!isIndeterminate && <span>{Math.round(value)}%</span>}
          </div>
        )}
        <div
          className="progress-kindle"
          role="progressbar"
          aria-valuenow={isIndeterminate ? undefined : value}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="progress-kindle-bar"
            {...(isIndeterminate ? { 'data-indeterminate': '' } : {})}
            style={isIndeterminate ? undefined : { width: `${Math.min(100, Math.max(0, value))}%` }}
          />
        </div>
      </div>
    )
  }
)
