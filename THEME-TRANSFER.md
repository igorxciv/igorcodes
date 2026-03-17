# Reuse Theme System From My Personal Site

Implement the same theme switcher design, theme tokens, and accessibility behavior from my Eleventy personal site in this Next.js blog.

## Goals

- Recreate the same light/dark theme colors exactly.
- Recreate the same floating circular theme toggle design.
- Recreate the same accessibility behavior.
- Avoid flash of incorrect theme on first paint.
- Use Next.js App Router conventions.
- Keep the implementation minimal and production-ready.

## Required Files / Structure

Create or update these pieces:

- `app/layout.tsx`
- `app/globals.css`
- `components/theme-toggle.tsx`

If needed, create a small inline theme-init script inside `app/layout.tsx` using `next/script` with an `id`, and place the interactive toggle in a client component.

## Theme Storage / Root Contract

Use this exact storage key:

- `fm-theme`

Store theme on the root element:

- `document.documentElement.dataset.theme = "dark" | "light"`

Also set:

- `document.documentElement.style.colorScheme = theme`

## Exact Theme Tokens

Use these exact CSS custom properties.

### Default dark theme

```css
:root {
  --fm-accent-rgb: 0, 217, 255;
  --fm-bg: #0a0a0a;
  --fm-text: #e5e5e5;
  --fm-muted: #9d9d9d;
  --fm-muted-strong: #c9c9c9;
  --fm-muted-soft: #5a5a5a;
  --fm-border: #2f2f2f;
  --fm-border-soft: #1b1b1b;
  --fm-border-strong: #3a3a3a;
  --fm-accent: #00d9ff;
  --fm-accent-soft: rgba(0, 217, 255, 0.12);
  --fm-accent-soft-strong: rgba(0, 217, 255, 0.16);
  --fm-accent-line: rgba(0, 217, 255, 0.45);
  --fm-surface: #121212;
  --fm-surface-hover: #171717;
  --fm-surface-raised: #161616;
  --fm-surface-strong: #181818;
  --fm-surface-inset: #141414;
  --fm-shadow-elevated: 0 12px 24px rgba(0, 0, 0, 0.28);
  --fm-shadow-glow: 0 0 20px rgba(0, 217, 255, 0.68);
  --fm-theme-button-bg: #242424;
  --fm-theme-button-border: #646464;
  --fm-theme-button-shadow: 0 0 0 rgba(0, 0, 0, 0);
  --fm-theme-button-icon: #b5b5b5;
  --fm-theme-button-icon-muted: #b5b5b5;
  --fm-theme-button-highlight: rgba(255, 255, 255, 0.06);
  --fm-theme-button-glow: rgba(255, 255, 255, 0.08);
  --fm-theme-button-focus-ring: #8aefff;
  --fm-focus-ring: rgba(0, 217, 255, 0.38);
  --fm-motion-fast: 160ms;
  --fm-motion-base: 220ms;
  --fm-motion-slow: 320ms;
  --fm-motion-theme: 280ms;
  --fm-ease-standard: cubic-bezier(0.2, 0, 0, 1);
  --fm-ease-emphasized: cubic-bezier(0.22, 1, 0.36, 1);
  color-scheme: dark;
}
```

### Light theme override

```css
:root[data-theme="light"] {
  --fm-accent-rgb: 0, 106, 128;
  --fm-bg: #f6f1e8;
  --fm-text: #16130f;
  --fm-muted: #6e6558;
  --fm-muted-strong: #423b32;
  --fm-muted-soft: #796c5b;
  --fm-accent: #006a80;
  --fm-border: #d8cfc3;
  --fm-border-soft: #ebe1d5;
  --fm-border-strong: #c8bdae;
  --fm-accent-soft: rgba(var(--fm-accent-rgb), 0.1);
  --fm-accent-soft-strong: rgba(var(--fm-accent-rgb), 0.14);
  --fm-accent-line: rgba(var(--fm-accent-rgb), 0.34);
  --fm-surface: rgba(255, 251, 244, 0.84);
  --fm-surface-hover: #f4ebdf;
  --fm-surface-raised: #fffaf2;
  --fm-surface-strong: #f1e8dc;
  --fm-surface-inset: #efe5d8;
  --fm-shadow-elevated: 0 18px 36px rgba(77, 56, 27, 0.1);
  --fm-shadow-glow: 0 0 20px rgba(var(--fm-accent-rgb), 0.22);
  --fm-theme-button-bg: #ece4d8;
  --fm-theme-button-border: #8a7760;
  --fm-theme-button-shadow: 0 0 0 rgba(0, 0, 0, 0);
  --fm-theme-button-icon: #5f5648;
  --fm-theme-button-icon-muted: #5f5648;
  --fm-theme-button-highlight: rgba(255, 255, 255, 0.45);
  --fm-theme-button-glow: rgba(95, 86, 72, 0.08);
  --fm-theme-button-focus-ring: #005f75;
  --fm-focus-ring: rgba(var(--fm-accent-rgb), 0.34);
  color-scheme: light;
}
```

## Theme Initialization Requirements

Before hydration, determine the theme like this:

1. Read `localStorage.getItem("fm-theme")`.
2. If it is `"light"` or `"dark"`, use it.
3. Otherwise use `window.matchMedia("(prefers-color-scheme: light)")`.
4. Apply the theme immediately to `document.documentElement.dataset.theme`.
5. Set `document.documentElement.style.colorScheme = theme`.
6. Update `meta[name="theme-color"]` to:
   - light: `#f6f1e8`
   - dark: `#0a0a0a`

This must happen before the page becomes interactive to avoid a flash of the wrong theme.

## Toggle Behavior Requirements

Build a floating button in the bottom-right corner with these traits:

- circular
- fixed position
- subtle border
- theme-aware background
- sun/moon icon swap with smooth transform/opacity transition
- hover lift and glow
- active press state
- strong focus-visible ring

Use a client component for interaction.

On toggle:

1. Read current theme from `document.documentElement.dataset.theme`.
2. Flip between `"light"` and `"dark"`.
3. Apply it to the root dataset.
4. Set `root.style.colorScheme`.
5. Persist to `localStorage` under `fm-theme`.
6. Update `meta[name="theme-color"]`.

Also listen for system theme changes with `matchMedia("(prefers-color-scheme: light)")`, but only auto-update if no explicit stored preference exists.

## Accessibility Requirements

The switch must use:

- `button type="button"`
- `role="switch"`
- `aria-checked="true|false"`
- a visible `focus-visible` style
- a visually hidden status element referenced with `aria-describedby`

Use status text exactly in this pattern:

- `"Dark theme active. Activate to switch to light theme."`
- `"Light theme active. Activate to switch to dark theme."`

Also support keyboard shortcut:

- `Ctrl+Shift+T`
- `Cmd+Shift+T`

If pressed, toggle theme and prevent default behavior.

## Motion / Reduced Motion

Respect `prefers-reduced-motion: reduce`.

- Keep the component fully usable with motion reduced.
- Remove or minimize icon rotation / scale transitions when reduced motion is requested.

## Styling Requirements

Apply transitions to theme-sensitive surfaces so the page feels consistent when the theme changes:

- background-color
- color
- border-color

Also include a general focus rule similar to:

```css
:where(a, button, input, textarea, select, summary, [tabindex]:not([tabindex="-1"])):focus-visible {
  outline: 2px solid var(--fm-accent);
  outline-offset: 3px;
}
```

## Implementation Constraints

- Use App Router patterns.
- Keep server and client boundaries clean.
- Do not introduce a heavy theme library if a small native implementation is enough.
- Use semantic HTML and keep the CSS token-based.
- Keep the switcher reusable and isolated.
- Match the original design closely rather than inventing a new switcher.

## Deliverables

Return:

1. The files you changed.
2. The final theme-toggle component.
3. The root layout changes for pre-hydration theme init.
4. The CSS for the theme tokens and toggle styling.
5. A short note confirming how no-flash theming and accessibility were handled.
