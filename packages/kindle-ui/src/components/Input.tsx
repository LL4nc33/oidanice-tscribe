/**
 * Kindle-styled text input.
 *
 * WHY: Form inputs need the same monochrome aesthetic as the rest of
 * the design system. Mono font for data entry, accent-colored focus
 * ring, no border-radius.
 *
 * @example
 * ```tsx
 * <Input placeholder="Enter URL..." />
 * <Input label="Name" value={name} onChange={e => setName(e.target.value)} />
 * ```
 */

import { InputHTMLAttributes, forwardRef } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Optional label displayed above the input. */
  label?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, className = '', id, ...props }, ref) {
    const inputId = id || (label ? `kindle-input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block font-mono text-xs mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`input-kindle ${className}`}
          {...props}
        />
      </div>
    )
  }
)
