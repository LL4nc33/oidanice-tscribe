/**
 * Kindle-styled horizontal divider.
 *
 * WHY: Thin 1px line matching header/footer borders. Saves inline
 * styles for a common pattern.
 *
 * @example
 * ```tsx
 * <Divider />
 * <Divider spacing="lg" />
 * ```
 */

import { HTMLAttributes, forwardRef } from 'react'

export interface DividerProps extends HTMLAttributes<HTMLHRElement> {
  /** Vertical spacing. 'sm' = 0.5rem, 'md' = 1rem, 'lg' = 2rem. */
  spacing?: 'sm' | 'md' | 'lg'
}

const spacingMap = {
  sm: '0.5rem 0',
  md: '1rem 0',
  lg: '2rem 0',
} as const

export const Divider = forwardRef<HTMLHRElement, DividerProps>(
  function Divider({ spacing = 'md', className = '', style, ...props }, ref) {
    return (
      <hr
        ref={ref}
        className={`divider-kindle ${className}`}
        style={{ margin: spacingMap[spacing], ...style }}
        {...props}
      />
    )
  }
)
