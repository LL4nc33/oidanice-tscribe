/**
 * Kindle-styled select dropdown.
 *
 * WHY: Native select element with custom styling matching the
 * monochrome theme. Custom chevron arrow, no border-radius.
 *
 * @example
 * ```tsx
 * <Select label="Format" value={format} onChange={e => setFormat(e.target.value)}>
 *   <option value="txt">Plain Text</option>
 *   <option value="srt">SRT Subtitles</option>
 * </Select>
 * ```
 */

import { SelectHTMLAttributes, forwardRef } from 'react'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  /** Optional label displayed above the select. */
  label?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, className = '', id, children, ...props }, ref) {
    const selectId = id || (label ? `kindle-select-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block font-mono text-xs mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`select-kindle ${className}`}
          {...props}
        >
          {children}
        </select>
      </div>
    )
  }
)
