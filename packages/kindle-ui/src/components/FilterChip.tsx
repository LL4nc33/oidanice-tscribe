/**
 * Toggle chip for filtering or selecting options.
 *
 * WHY: Filter chips let users toggle between states (e.g., job status
 * filters in TScribe). Active state inverts colors like btn-kindle.
 * Inactive state uses a subtle border. Icons are optional -- when
 * present, they appear before the label for quick visual scanning.
 *
 * @example
 * ```tsx
 * <FilterChip active={showAll} onClick={() => setShowAll(!showAll)}>
 *   All
 * </FilterChip>
 *
 * <FilterChip active={isDownloading} icon={<DownloadIcon />} onClick={toggle}>
 *   Downloading
 * </FilterChip>
 * ```
 */

import { ButtonHTMLAttributes, ReactNode, forwardRef } from 'react'

export interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Whether the chip is in active (selected) state. */
  active?: boolean
  /** Optional icon rendered before the label. */
  icon?: ReactNode
}

/** WHY: Chip uses inline styles for theme variable colors so it works
 *  without Tailwind. The active state uses the same inversion pattern
 *  as btn-kindle for visual consistency across the design system. */
export const FilterChip = forwardRef<HTMLButtonElement, FilterChipProps>(
  function FilterChip({ active = false, icon, className = '', children, ...props }, ref) {
    return (
      <button
        ref={ref}
        className={`inline-flex items-center gap-1.5 px-3 py-1 font-mono text-xs transition-colors duration-150 ${className}`}
        style={{
          backgroundColor: active ? 'var(--text)' : 'var(--bg)',
          color: active ? 'var(--bg)' : 'var(--text)',
          border: '1px solid var(--border)',
        }}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        {children}
      </button>
    )
  }
)
