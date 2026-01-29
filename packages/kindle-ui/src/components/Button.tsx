/**
 * Kindle-styled button component.
 *
 * WHY: The btn-kindle class inverts foreground/background on hover,
 * mimicking a physical e-ink button press. This component wraps that
 * behavior in a typed React component with sensible defaults.
 *
 * No border-radius, no shadows, no gradients. Just clean inversion.
 *
 * @example
 * ```tsx
 * <Button onClick={handleSave}>Save transcript</Button>
 * <Button variant="ghost" onClick={handleCancel}>Cancel</Button>
 * ```
 */

import { ButtonHTMLAttributes, forwardRef } from 'react'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant. 'default' uses btn-kindle inversion, 'ghost' has no border. */
  variant?: 'default' | 'ghost'
}

/** WHY: forwardRef allows parent components to attach refs for focus
 *  management, which is critical for accessible keyboard navigation. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button({ variant = 'default', className = '', children, ...props }, ref) {
    const base =
      variant === 'ghost'
        ? 'bg-transparent border-none transition-transform duration-100 active:scale-95'
        : 'btn-kindle'

    return (
      <button
        ref={ref}
        className={`${base} px-4 py-2 font-mono text-sm ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)
