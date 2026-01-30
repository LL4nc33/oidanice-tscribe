/**
 * Kindle-styled badge for status labels and tags.
 *
 * WHY: Status indicators need to stand out without color.
 * Default variant uses border, "solid" inverts like a pressed button.
 *
 * @example
 * ```tsx
 * <Badge>Draft</Badge>
 * <Badge variant="solid">Active</Badge>
 * ```
 */

import { HTMLAttributes, forwardRef } from 'react'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual variant. 'outline' uses border, 'solid' inverts colors. */
  variant?: 'outline' | 'solid'
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  function Badge({ variant = 'outline', className = '', style, children, ...props }, ref) {
    const variantStyles: React.CSSProperties =
      variant === 'solid'
        ? {
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-contrast)',
            border: '1px solid var(--accent)',
          }
        : {
            backgroundColor: 'transparent',
            color: 'var(--text)',
            border: '1px solid var(--border)',
          }

    return (
      <span
        ref={ref}
        className={`inline-block font-mono text-xs px-2 py-0.5 ${className}`}
        style={{ ...variantStyles, ...style }}
        {...props}
      >
        {children}
      </span>
    )
  }
)
