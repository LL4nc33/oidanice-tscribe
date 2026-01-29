/** @type {import('tailwindcss').Config} */

// WHY: Kindle/E-Reader aesthetic uses ONLY black, white, and grays.
// No color palette - enforces the high-contrast monochrome design.
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
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
        // WHY: Serif for UI text (Kindle reading feel), mono for transcripts
        serif: ['Georgia', 'Times New Roman', 'serif'],
        mono: ['Courier New', 'Courier', 'monospace'],
      },
    },
  },
  plugins: [],
}
