/**
 * Kindle-styled textarea.
 *
 * WHY: Multi-line text input with the same monochrome styling.
 * Vertical resize only, minimum height for usability.
 *
 * @example
 * ```tsx
 * <TextArea label="Notes" rows={6} placeholder="Add notes..." />
 * ```
 */

import { TextareaHTMLAttributes, forwardRef } from 'react'

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Optional label displayed above the textarea. */
  label?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea({ label, className = '', id, ...props }, ref) {
    const textareaId = id || (label ? `kindle-textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined)

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block font-mono text-xs mb-1"
            style={{ color: 'var(--text-secondary)' }}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`textarea-kindle ${className}`}
          {...props}
        />
      </div>
    )
  }
)
