# @oidanice/kindle-ui

Kindle-inspired monochrome design system for React + Tailwind CSS.

> "Intentionally minimal -- like a Kindle, not like a prototype."

## Installation

```bash
npm install @oidanice/kindle-ui
```

Peer dependencies: `react >=18.0.0`, `tailwindcss >=3.0.0`

## Setup

### 1. Add the Tailwind preset

```js
// tailwind.config.js
const kindlePreset = require('@oidanice/kindle-ui/preset')

module.exports = {
  presets: [kindlePreset],
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    // Include kindle-ui components in Tailwind's content scan
    './node_modules/@oidanice/kindle-ui/dist/**/*.{js,mjs}',
  ],
}
```

### 2. Import the CSS

```ts
// main.tsx or index.tsx
import '@oidanice/kindle-ui/css'
```

This loads the CSS variables, base styles, `.btn-kindle`, `.status-active`, and scrollbar styling.

### 3. Use components

```tsx
import { Layout, Button, Card, DarkModeToggle } from '@oidanice/kindle-ui'

function App() {
  return (
    <Layout
      title="My App"
      headerRight={<DarkModeToggle />}
      footer={<span>powered by kindle-ui</span>}
    >
      <Card>
        <h2 className="font-serif text-xl mb-4">Welcome</h2>
        <Button onClick={() => alert('clicked')}>Click me</Button>
      </Card>
    </Layout>
  )
}
```

## Design Principles

| Principle | Rule |
|-----------|------|
| **Monochrome only** | Black, white, and grays. No color. Ever. |
| **Serif for titles** | Georgia / Times New Roman for UI text |
| **Mono for data** | Courier New for code, timestamps, metadata |
| **No decoration** | No border-radius, no shadows, no gradients |
| **Inversion for interaction** | Hover inverts foreground/background |
| **Minimal motion** | Only opacity pulse and scale-on-press |

## CSS Variables Reference

All colors flow from 5 CSS custom properties:

| Variable | Light | Dark | Purpose |
|----------|-------|------|---------|
| `--bg` | `#ffffff` | `#000000` | Primary background |
| `--text` | `#000000` | `#ffffff` | Primary text |
| `--border` | `#000000` | `#ffffff` | Border color |
| `--bg-secondary` | `#f5f5f5` | `#111111` | Card/section backgrounds |
| `--text-secondary` | `#333333` | `#cccccc` | Muted text, metadata |

### Tailwind color tokens

The preset also provides `kindle-*` color tokens:

| Token | Value | Usage |
|-------|-------|-------|
| `kindle-white` | `#ffffff` | Pure white |
| `kindle-paper` | `#f5f5f5` | Paper background |
| `kindle-light` | `#e5e5e5` | Light gray |
| `kindle-mid` | `#999999` | Medium gray |
| `kindle-dark` | `#333333` | Dark gray |
| `kindle-ink` | `#000000` | Pure black |

## Components

### Button

Monochrome button that inverts on hover.

```tsx
import { Button } from '@oidanice/kindle-ui'

<Button onClick={handleSave}>Save</Button>
<Button variant="ghost" onClick={handleCancel}>Cancel</Button>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'ghost'` | `'default'` | Visual style |
| ...rest | `ButtonHTMLAttributes` | -- | Standard button props |

### Card

Flat container with secondary background and border.

```tsx
import { Card } from '@oidanice/kindle-ui'

<Card>Content here</Card>
<Card as="section" className="mt-4">Section card</Card>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `as` | `ElementType` | `'div'` | HTML element to render |
| ...rest | `HTMLAttributes` | -- | Standard HTML props |

### FilterChip

Toggle chip for filtering or options.

```tsx
import { FilterChip } from '@oidanice/kindle-ui'

<FilterChip active={isActive} onClick={toggle}>
  Active Jobs
</FilterChip>

<FilterChip active={false} icon={<SearchIcon />} onClick={search}>
  Search
</FilterChip>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `active` | `boolean` | `false` | Selected state (inverts colors) |
| `icon` | `ReactNode` | -- | Icon before label |
| ...rest | `ButtonHTMLAttributes` | -- | Standard button props |

### Layout

Full-page layout with header, content, and footer.

```tsx
import { Layout, DarkModeToggle } from '@oidanice/kindle-ui'

<Layout
  title="My App"
  headerRight={<DarkModeToggle />}
  banner={<InstallPrompt />}
  footer={<span>built by OidaNice</span>}
  maxWidth="max-w-3xl"
>
  <p>Page content</p>
</Layout>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | -- | Header title (serif) |
| `headerRight` | `ReactNode` | -- | Right side of header |
| `banner` | `ReactNode` | -- | Between header and content |
| `footer` | `ReactNode` | -- | Footer content |
| `maxWidth` | `string` | `'max-w-4xl'` | Tailwind max-width class |

### DarkModeToggle

Sun/moon toggle. Works standalone or controlled.

```tsx
import { DarkModeToggle, useDarkMode } from '@oidanice/kindle-ui'

// Uncontrolled (self-contained)
<DarkModeToggle />

// Controlled (share state with parent)
const [isDark, toggle] = useDarkMode()
<DarkModeToggle isDark={isDark} onToggle={toggle} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isDark` | `boolean` | -- | Controlled dark state |
| `onToggle` | `() => void` | -- | Controlled toggle handler |
| `storageKey` | `string` | `'kindle-ui-dark-mode'` | localStorage key |

### InstallPrompt

PWA install prompt with cross-browser detection.

```tsx
import { InstallPrompt } from '@oidanice/kindle-ui'

<InstallPrompt dismissedKey="myapp-install-dismissed" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dismissedKey` | `string` | `'kindle-ui-install-dismissed'` | localStorage dismiss key |

## Hooks

### useDarkMode

```tsx
import { useDarkMode } from '@oidanice/kindle-ui'

const [isDark, toggleDark] = useDarkMode()
// isDark: boolean - current dark mode state
// toggleDark: () => void - toggle function
```

Manages the `dark` class and `data-theme` attribute on `<html>`, persists to localStorage, and falls back to `prefers-color-scheme` on first visit.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `storageKey` | `string` | `'kindle-ui-dark-mode'` | localStorage key |

## Customization

Override CSS variables in your own stylesheet:

```css
/* Make the "paper" slightly warmer */
:root {
  --bg: #faf8f5;
  --bg-secondary: #f0ede8;
}

.dark {
  --bg: #0a0a0a;
  --bg-secondary: #1a1a1a;
}
```

Override Tailwind tokens in your config:

```js
module.exports = {
  presets: [require('@oidanice/kindle-ui/preset')],
  theme: {
    extend: {
      colors: {
        kindle: {
          paper: '#faf8f5', // warmer paper
        },
      },
    },
  },
}
```

## Usage with TScribe

TScribe (oidanice-tscribe) is the reference application for this design system. To adopt kindle-ui in TScribe:

1. Install `@oidanice/kindle-ui` as a dependency
2. Replace `tailwind.config.js` theme with the preset
3. Replace `index.css` with `import '@oidanice/kindle-ui/css'`
4. Import components from `@oidanice/kindle-ui` instead of local `components/`

The visual output is identical -- kindle-ui extracts and formalizes what TScribe already uses.

## License

AGPL-3.0
