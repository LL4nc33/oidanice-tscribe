# @oidanice/ink-ui

Kindle-inspired monochrome design system for React + Tailwind CSS.

> "Intentionally minimal -- like a Kindle, not like a prototype."

## Installation

```bash
npm install @oidanice/ink-ui
```

Peer dependencies: `react >=18.0.0`, `tailwindcss >=3.0.0`

## Setup

### 1. Add the Tailwind preset

```js
// tailwind.config.js
const kindlePreset = require('@oidanice/ink-ui/preset')

module.exports = {
  presets: [kindlePreset],
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
    // Include ink-ui components in Tailwind's content scan
    './node_modules/@oidanice/ink-ui/dist/**/*.{js,mjs}',
  ],
}
```

### 2. Import the CSS

```ts
// main.tsx or index.tsx
import '@oidanice/ink-ui/css'
```

This loads the CSS variables, base styles, form element classes, progress bar, divider, and scrollbar styling.

### 3. Use components

```tsx
import { Layout, Button, Card, Input, DarkModeToggle } from '@oidanice/ink-ui'

function App() {
  return (
    <Layout
      title="My App"
      headerRight={<DarkModeToggle />}
      footer={<span>powered by ink-ui</span>}
    >
      <Card>
        <h2 className="font-serif text-xl mb-4">Welcome</h2>
        <Input label="Name" placeholder="Enter your name..." />
        <Button onClick={() => alert('clicked')}>Click me</Button>
      </Card>
    </Layout>
  )
}
```

### CSS-only Usage (without React)

ink-ui works without React. Import the CSS and use the classes directly:

```html
<link rel="stylesheet" href="node_modules/@oidanice/ink-ui/kindle.css" />

<button class="btn-kindle px-4 py-2">Click me</button>
<input class="input-kindle" placeholder="Enter text..." />
<select class="select-kindle">
  <option>Option 1</option>
</select>
<textarea class="textarea-kindle" placeholder="Notes..."></textarea>
<div class="progress-kindle">
  <div class="progress-kindle-bar" style="width: 60%"></div>
</div>
<hr class="divider-kindle" />
```

## Accent Color Customization

By default, ink-ui is fully monochrome. To add a brand accent color:

```css
:root {
  --accent: #2563eb;           /* your brand blue */
  --accent-contrast: #ffffff;  /* text on accent backgrounds */
}

.dark {
  --accent: #60a5fa;
  --accent-contrast: #000000;
}
```

The accent color is used by focus rings, solid badges, and progress bars. Without customization, `--accent` defaults to `--text` (monochrome).

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

All colors flow from 7 CSS custom properties:

| Variable | Light | Dark | Purpose |
|----------|-------|------|---------|
| `--bg` | `#ffffff` | `#000000` | Primary background |
| `--text` | `#000000` | `#ffffff` | Primary text |
| `--border` | `#000000` | `#ffffff` | Border color |
| `--bg-secondary` | `#f5f5f5` | `#111111` | Card/section backgrounds |
| `--text-secondary` | `#333333` | `#cccccc` | Muted text, metadata |
| `--accent` | `var(--text)` | `var(--text)` | Focus rings, progress, badges |
| `--accent-contrast` | `var(--bg)` | `var(--bg)` | Text on accent backgrounds |

### Tailwind color tokens

The preset provides `kindle-*` color tokens plus CSS-variable-based utilities:

| Token | Value | Usage |
|-------|-------|-------|
| `kindle-white` | `#ffffff` | Pure white |
| `kindle-paper` | `#f5f5f5` | Paper background |
| `kindle-light` | `#e5e5e5` | Light gray |
| `kindle-mid` | `#999999` | Medium gray |
| `kindle-dark` | `#333333` | Dark gray |
| `kindle-ink` | `#000000` | Pure black |
| `bg-accent` | `var(--accent)` | Accent background |
| `text-accent` | `var(--accent)` | Accent text |
| `border-accent` | `var(--accent)` | Accent border |

## Components

### Button

Monochrome button that inverts on hover.

```tsx
import { Button } from '@oidanice/ink-ui'

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
import { Card } from '@oidanice/ink-ui'

<Card>Content here</Card>
<Card as="section" className="mt-4">Section card</Card>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `as` | `ElementType` | `'div'` | HTML element to render |
| ...rest | `HTMLAttributes` | -- | Standard HTML props |

### Input

Monochrome text input with optional label.

```tsx
import { Input } from '@oidanice/ink-ui'

<Input placeholder="Enter URL..." />
<Input label="Name" value={name} onChange={e => setName(e.target.value)} />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | -- | Label above the input |
| ...rest | `InputHTMLAttributes` | -- | Standard input props |

### Select

Styled native select with custom chevron.

```tsx
import { Select } from '@oidanice/ink-ui'

<Select label="Format" value={format} onChange={e => setFormat(e.target.value)}>
  <option value="txt">Plain Text</option>
  <option value="srt">SRT Subtitles</option>
</Select>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | -- | Label above the select |
| ...rest | `SelectHTMLAttributes` | -- | Standard select props |

### TextArea

Multi-line text input with vertical resize.

```tsx
import { TextArea } from '@oidanice/ink-ui'

<TextArea label="Notes" rows={6} placeholder="Add notes..." />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | -- | Label above the textarea |
| ...rest | `TextareaHTMLAttributes` | -- | Standard textarea props |

### Badge

Status label / tag with outline or solid variant.

```tsx
import { Badge } from '@oidanice/ink-ui'

<Badge>Draft</Badge>
<Badge variant="solid">Active</Badge>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'outline' \| 'solid'` | `'outline'` | Visual style |
| ...rest | `HTMLAttributes` | -- | Standard span props |

### Progress

Flat progress bar with determinate and indeterminate states.

```tsx
import { Progress } from '@oidanice/ink-ui'

<Progress value={75} />
<Progress />                          {/* indeterminate */}
<Progress value={50} label="Transcribing..." />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | -- | 0-100, omit for indeterminate |
| `label` | `string` | -- | Label above the bar |
| ...rest | `HTMLAttributes` | -- | Standard div props |

### Divider

Thin horizontal rule matching header/footer borders.

```tsx
import { Divider } from '@oidanice/ink-ui'

<Divider />
<Divider spacing="lg" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `spacing` | `'sm' \| 'md' \| 'lg'` | `'md'` | Vertical spacing |
| ...rest | `HTMLAttributes` | -- | Standard hr props |

### FilterChip

Toggle chip for filtering or options.

```tsx
import { FilterChip } from '@oidanice/ink-ui'

<FilterChip active={isActive} onClick={toggle}>
  Active Jobs
</FilterChip>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `active` | `boolean` | `false` | Selected state (inverts colors) |
| `icon` | `ReactNode` | -- | Icon before label |
| ...rest | `ButtonHTMLAttributes` | -- | Standard button props |

### Layout

Full-page layout with header, optional sidebar, content, and footer.

```tsx
import { Layout, DarkModeToggle } from '@oidanice/ink-ui'

<Layout
  title="My App"
  headerRight={<DarkModeToggle />}
  sidebar={<nav>...</nav>}
  sidebarPosition="left"
  footer={<span>built by OidaNice</span>}
>
  <p>Page content</p>
</Layout>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | -- | Header title (serif) |
| `headerLeft` | `ReactNode` | -- | Left header content (alternative to title) |
| `headerRight` | `ReactNode` | -- | Right side of header |
| `banner` | `ReactNode` | -- | Between header and content |
| `sidebar` | `ReactNode` | -- | Sidebar content |
| `sidebarPosition` | `'left' \| 'right'` | `'left'` | Sidebar placement |
| `footer` | `ReactNode` | -- | Footer content |
| `maxWidth` | `string` | `'max-w-4xl'` | Tailwind max-width class |
| `className` | `string` | -- | Root element class |

### DarkModeToggle

Sun/moon toggle. Works standalone or controlled.

```tsx
import { DarkModeToggle, useDarkMode } from '@oidanice/ink-ui'

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
| `storageKey` | `string` | `'ink-ui-dark-mode'` | localStorage key |

### InstallPrompt

PWA install prompt with cross-browser detection.

```tsx
import { InstallPrompt } from '@oidanice/ink-ui'

<InstallPrompt dismissedKey="myapp-install-dismissed" />
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `dismissedKey` | `string` | `'ink-ui-install-dismissed'` | localStorage dismiss key |

## Hooks

### useDarkMode

```tsx
import { useDarkMode } from '@oidanice/ink-ui'

const [isDark, toggleDark] = useDarkMode()
// isDark: boolean - current dark mode state
// toggleDark: () => void - toggle function
```

Manages the `dark` class and `data-theme` attribute on `<html>`, persists to localStorage, and falls back to `prefers-color-scheme` on first visit.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `storageKey` | `string` | `'ink-ui-dark-mode'` | localStorage key |

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
  presets: [require('@oidanice/ink-ui/preset')],
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

TScribe (oidanice-tscribe) is the reference application for this design system. To adopt ink-ui in TScribe:

1. Install `@oidanice/ink-ui` as a dependency
2. Replace `tailwind.config.js` theme with the preset
3. Replace `index.css` with `import '@oidanice/ink-ui/css'`
4. Import components from `@oidanice/ink-ui` instead of local `components/`

The visual output is identical -- ink-ui extracts and formalizes what TScribe already uses.

## License

AGPL-3.0
