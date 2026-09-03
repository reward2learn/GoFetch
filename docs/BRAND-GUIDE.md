# GoFetch Brand Guide

## Overview

GoFetch is a cross-border delivery marketplace connecting buyers with travelers. The design system prioritizes clarity, trust, and effortless usability across light and dark themes.

---

## 1. Brand Colors

### Primary — Deep Teal
- **Light:** `#2A5A4A` — Use for primary actions, active states, brand emphasis
- **Dark:** `#3d8b6e` — Brightened for dark backgrounds; maintains WCAG AA contrast
- **Hover:** One shade darker than primary
- **Active:** Two shades darker than primary

### Secondary — Warm Terracotta
- **Light:** `#C97A5E` — Accent for secondary actions, highlights, rewards
- **Dark:** `#d4896a` — Slightly brightened for dark mode
- **Hover:** One shade darker

### Surface System
| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| `--app-bg` | `#FCFBFA` | `#0f1114` | Page background |
| `--app-surface-0` | `#FCFBFA` | `#0f1114` | Lowest surface (page) |
| `--app-surface-1` | `#FFFFFF` | `#181b20` | Cards, panels, elevated surfaces |
| `--app-surface-2` | `#F8F7F5` | `#1e2127` | Subtle backgrounds, hover states |
| `--app-surface-3` | `#F2F0ED` | `#252830` | Disabled, placeholders, dividers |

---

## 2. Text Colors

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--app-text` | `#1a1a1a` | `#e4e4e7` | Primary headings, body text |
| `--app-text-secondary` | `#4B5563` | `#a1a1aa` | Descriptions, secondary info |
| `--app-text-muted` | `#6B7280` | `#71717a` | Timestamps, labels, hints |
| `--app-text-disabled` | `#9CA3AF` | `#52525b` | Disabled states only |

### Contrast Requirements
- **Primary text on `surface-1`:** Minimum 7:1 ratio (AAA)
- **Secondary text on `surface-1`:** Minimum 4.5:1 ratio (AA)
- **Muted text on `surface-1`:** Minimum 3:1 ratio (AA for large text)
- **White text on `--app-primary`:** Must meet 4.5:1 ratio
- **White text on `--app-secondary`:** Must meet 4.5:1 ratio

---

## 3. Border Colors

| Token | Light | Dark | Use |
|-------|-------|------|-----|
| `--app-border` | `#E5E3DF` | `#2e3138` | Default borders, dividers |
| `--app-border-strong` | `#D1D5DB` | `#383b42` | Emphasized borders, input focus |

---

## 4. Input Styling

| Token | Light | Dark |
|-------|-------|------|
| `--app-input-bg` | `#FFFFFF` | `#1e2127` |
| `--app-input-border` | `#D1D5DB` | `#383b42` |
| `--app-input-text` | `#1a1a1a` | `#e4e4e7` |
| `--app-input-placeholder` | `#9CA3AF` | `#52525b` |

**Rules:**
- Inputs always use `surface-1` background
- Focus ring uses `--app-primary` with 2px offset
- Placeholder text must be `text-muted` or lighter
- Error state: border switches to `--app-error-text`

---

## 5. Status Colors

### Success (Green)
- **Light:** bg `#DCFCE7`, text `#16A34A`, border `#BBF7D0`
- **Dark:** bg `rgba(34,197,94,0.12)`, text `#4ade80`, border `rgba(34,197,94,0.25)`

### Error (Red)
- **Light:** bg `#FEE2E2`, text `#DC2626`, border `#FECACA`
- **Dark:** bg `rgba(239,68,68,0.12)`, text `#f87171`, border `rgba(239,68,68,0.25)`

### Warning (Amber)
- **Light:** bg `#FEF9C3`, text `#CA8A04`, border `#FEF08A`
- **Dark:** bg `rgba(234,179,8,0.12)`, text `#facc15`, border `rgba(234,179,8,0.25)`

### Info (Blue)
- **Light:** bg `#DBEAFE`, text `#2563EB`, border `#BFDBFE`
- **Dark:** bg `rgba(59,130,246,0.12)`, text `#60a5fa`, border `rgba(59,130,246,0.25)`

---

## 6. Component Guidelines

### Cards
- Use `surface-1` background
- Border: 1px `--app-border`
- Border radius: `0.75rem` (12px)
- Shadow: `--app-shadow-sm` (resting), `--app-shadow-md` (hover)
- Padding: `1rem` (16px) minimum
- Images: full bleed with `rounded-t-xl` if inside card

### Buttons

#### Primary Button
- Background: `--app-primary`
- Text: White (`#FFFFFF`)
- Hover: `--app-primary-hover`
- Active: `--app-primary-active`
- Border radius: `9999px` (pill shape)
- Padding: `0.5rem 1.25rem` (8px 20px)
- Font: `0.875rem` (14px), `font-semibold`

#### Secondary Button
- Background: `--app-secondary`
- Text: White (`#FFFFFF`)
- Hover: `--app-secondary-hover`
- Border radius: `9999px` (pill shape)

#### Outline Button
- Background: transparent
- Border: 1.5px `--app-border-strong`
- Text: `--app-text`
- Hover: `--app-surface-2` background
- Border radius: `9999px` (pill shape)

#### Ghost Button
- Background: transparent
- Text: `--app-text-secondary`
- Hover: `--app-hover` background
- Border radius: `9999px` (pill shape)

### Input Fields
- Background: `--app-input-bg`
- Border: 1px `--app-input-border`
- Border radius: `0.5rem` (8px)
- Padding: `0.5rem 0.75rem` (8px 12px)
- Focus: 2px ring `--app-primary`, border `--app-primary`
- Error: border `--app-error-text`, ring `--app-error-text`
- Label: `text-sm font-medium`, color `--app-text`
- Helper text: `text-xs`, color `--app-text-muted`

### Status Chips / Badges
- Use semantic background + text colors
- Border radius: `9999px` (pill)
- Padding: `0.125rem 0.5rem` (2px 8px)
- Font: `0.75rem` (12px), `font-medium`

### Modals
- Overlay: `--app-overlay` (black with opacity)
- Modal background: `surface-1`
- Border radius: `1rem` (16px)
- Max height: `86vh` with scrollable body
- Header/footer: fixed, non-scrolling

### Sidebar
- Background: `surface-1`
- Width: `16rem` (256px) expanded, `4rem` (64px) collapsed
- Border right: 1px `--app-border`

### Bottom Navigation (Mobile)
- Background: `surface-1`
- Border top: 1px `--app-border`
- Height: `4rem` (64px)
- Active icon: `--app-primary`
- Inactive icon: `--app-text-muted`

---

## 7. Typography

### Font Family
- **Primary:** Plus Jakarta Sans
- **Fallback:** system-ui, -apple-system, sans-serif

### Type Scale
| Size | Class | Use |
|------|-------|-----|
| `2.25rem` (36px) | `text-3xl` | Page titles |
| `1.5rem` (24px) | `text-2xl` | Section headers |
| `1.25rem` (20px) | `text-xl` | Card titles |
| `1.125rem` (18px) | `text-lg` | Sub-headers |
| `1rem` (16px) | `text-base` | Body text |
| `0.875rem` (14px) | `text-sm` | Labels, buttons |
| `0.75rem` (12px) | `text-xs` | Captions, timestamps |

### Font Weights
- `font-bold` (700): Page titles, primary numbers
- `font-semibold` (600): Section headers, card titles
- `font-medium` (500): Buttons, labels, chips
- `font-normal` (400): Body text, descriptions

---

## 8. Spacing & Layout

### Page Padding
- Desktop: `1.5rem` (24px)
- Mobile: `1rem` (16px)

### Card Grid
- 1 column on mobile
- 2 columns on tablet (`md:`)
- 3 columns on desktop (`lg:`)
- Gap: `1rem` (16px)

### Component Spacing
- Between sections: `1.5rem` (24px)
- Between related items: `0.75rem` (12px)
- Inside cards: `1rem` (16px)
- Between card sections: `0.5rem` (8px)

---

## 9. Elevation & Shadows

| Level | Light | Dark | Use |
|-------|-------|------|-----|
| `sm` | `0 1px 2px rgba(0,0,0,0.05)` | `0 1px 2px rgba(0,0,0,0.4)` | Subtle lift |
| `md` | `0 4px 6px -1px rgba(0,0,0,0.1)` | `0 4px 6px -1px rgba(0,0,0,0.4)` | Cards on hover |
| `lg` | `0 10px 15px -3px rgba(0,0,0,0.1)` | `0 10px 15px -3px rgba(0,0,0,0.4)` | Modals, dropdowns |

---

## 10. Accessibility

### Focus States
- All interactive elements must have visible focus ring
- Focus ring: 2px `--app-primary` with 2px offset
- Never remove focus outlines

### Color Contrast
- Text on `surface-1` must meet WCAG AA (4.5:1 for normal text)
- Text on `primary` buttons must meet WCAG AA (4.5:1)
- Status text must be readable on its background

### Touch Targets
- Minimum touch target: 44px × 44px
- Bottom nav icons: 24px with padding to meet target
- Buttons: minimum height 36px

### Screen Readers
- All images must have `alt` text
- Interactive elements must have `aria-label` when icon-only
- Status changes must be announced

---

## 11. Dark Mode Rules

1. **Never use pure black** (`#000000`) for backgrounds — use `#0f1114` or darker surface
2. **Never use pure white** (`#FFFFFF`) for text — use `#e4e4e7` or lighter
3. **Status colors use alpha backgrounds** (12% opacity) to maintain readability
4. **Borders are subtle** — use `#2e3138` not `#383b42` for default
5. **Shadows are heavier** — dark mode needs more shadow to create depth
6. **Primary/secondary colors are brightened** — to maintain contrast on dark surfaces

---

## 12. Light Mode Rules

1. **Backgrounds use warm whites** — `#FCFBFA` not pure `#FFFFFF`
2. **Cards are white** — `#FFFFFF` for maximum contrast on warm background
3. **Text is near-black** — `#1a1a1a` for primary, not pure `#000000`
4. **Status colors use solid backgrounds** — full opacity for light mode
5. **Borders are warm** — `#E5E3DF` with warm undertone
6. **Shadows are minimal** — light mode relies on borders for depth
