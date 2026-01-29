/**
 * Content card container with secondary background and border.
 *
 * WHY: Cards group related content with a subtle background shift
 * (--bg-secondary) and a 1px border. No rounded corners, no shadows --
 * the e-reader aesthetic uses flat rectangles with clear boundaries.
 *
 * @example
 * ```tsx
 * <Card>
 *   <h2>Transcript</h2>
 *   <p>Content goes here...</p>
 * </Card>
 *
 * <Card as="section" className="mt-4">
 *   <p>Custom section card</p>
 * </Card>
 * ```
 */

import { HTMLAttributes, ElementType, forwardRef } from 'react'

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** The HTML element to render. Defaults to 'div'. */
  as?: ElementType
}

/** WHY: Polymorphic `as` prop lets this be a div, section, article, etc.
 *  Semantic HTML matters for accessibility and SEO. */
export const Card = forwardRef<HTMLElement, CardProps>(
  function Card({ as: Component = 'div', className = '', style, children, ...props }, ref) {
    return (
      <Component
        ref={ref}
        className={`p-4 ${className}`}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border)',
          ...style,
        }}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
