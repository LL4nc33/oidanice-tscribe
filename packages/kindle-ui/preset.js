/**
 * Kindle UI -- Tailwind CSS Preset
 *
 * WHY: Encapsulates the entire Kindle/E-Reader design system as a
 * Tailwind preset. Any project can import this to get the monochrome
 * color palette, font stacks, and utility classes without copying config.
 *
 * Usage in tailwind.config.js:
 *   const kindlePreset = require('@oidanice/ink-ui/preset')
 *   module.exports = { presets: [kindlePreset] }
 *
 * "Intentionally minimal -- like a Kindle, not like a prototype."
 */

const plugin = require('tailwindcss/plugin')

/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',

  theme: {
    extend: {
      colors: {
        kindle: {
          white: '#ffffff',
          paper: '#f5f5f5',
          light: '#e5e5e5',
          mid: '#999999',
          dark: '#333333',
          ink: '#000000',
        },
      },
      fontFamily: {
        /* WHY: Serif for UI text (Kindle reading feel), mono for data/code */
        serif: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['Courier New', 'Courier', 'monospace'],
      },
      backgroundColor: {
        primary: 'var(--bg)',
        secondary: 'var(--bg-secondary)',
        accent: 'var(--accent)',
      },
      textColor: {
        primary: 'var(--text)',
        secondary: 'var(--text-secondary)',
        accent: 'var(--accent)',
        'accent-contrast': 'var(--accent-contrast)',
      },
      borderColor: {
        primary: 'var(--border)',
        accent: 'var(--accent)',
      },
      outlineColor: {
        accent: 'var(--accent)',
      },
    },
  },

  plugins: [
    plugin(function ({ addComponents }) {
      /**
       * WHY: These utility classes are defined as Tailwind components so
       * they can be used alongside Tailwind classes and overridden with
       * responsive/state variants if needed.
       */
      addComponents({
        '.btn-kindle': {
          backgroundColor: 'var(--bg)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          transition: 'background-color 0.15s, color 0.15s, transform 0.1s',
          '&:hover': {
            backgroundColor: 'var(--text)',
            color: 'var(--bg)',
          },
          '&:active': {
            transform: 'scale(0.95)',
          },
          '&:focus-visible': {
            outline: '2px solid var(--text)',
            outlineOffset: '2px',
          },
        },
        '.status-active': {
          animation: 'pulse-opacity 2s ease-in-out infinite',
        },
        '.input-kindle, .select-kindle, .textarea-kindle': {
          backgroundColor: 'var(--bg)',
          color: 'var(--text)',
          border: '1px solid var(--border)',
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: '0.875rem',
          padding: '0.5rem 0.75rem',
          width: '100%',
          transition: 'border-color 0.15s, outline-color 0.15s',
          '&:focus': {
            outline: '2px solid var(--accent)',
            outlineOffset: '2px',
            borderColor: 'var(--accent)',
          },
          '&:disabled': {
            opacity: '0.4',
            cursor: 'not-allowed',
          },
        },
        '.progress-kindle': {
          width: '100%',
          height: '4px',
          backgroundColor: 'var(--bg-secondary)',
          overflow: 'hidden',
        },
        '.divider-kindle': {
          border: 'none',
          borderTop: '1px solid var(--border)',
          margin: '1rem 0',
        },
      })
    }),
  ],
}
