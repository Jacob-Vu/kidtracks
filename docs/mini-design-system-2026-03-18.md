# KidsTrack Mini Design System — 2026-03-18

## 1) Core Color Tokens

### Background / Surface
- `--bg-primary`: `#0f0c29` (page background, default theme)
- `--bg-secondary`: `#1a1740` (secondary surfaces)
- `--bg-card`: `rgba(255,255,255,0.05)` (card background)
- `--bg-card-hover`: `rgba(255,255,255,0.08)` (card hover)
- `--border`: `rgba(255,255,255,0.1)` (default border)
- `--border-light`: `rgba(255,255,255,0.06)` (subtle divider)

### Text
- `--text-primary`: `#f1f5f9` (≥7:1 on dark bg — AAA pass)
- `--text-secondary`: `#cbd5e1` (≥5:1 on dark bg — AA pass)
- `--text-muted`: `#94a3b8` (≥3.5:1 — use only for non-critical labels, captions)

### Semantic Accents
- `--accent-purple`: `#7c3aed` (primary brand)
- `--accent-purple-light`: `#9d5ff5` (hover/lighter states)
- `--accent-green`: `#10b981` (success, completion)
- `--accent-amber`: `#f59e0b` (warning, earnings)
- `--accent-red`: `#ef4444` (error, danger, penalty)
- `--accent-orange`: `#f97316` (streak, hot states)
- `--accent-teal`: `#06b6d4` (secondary accent, ocean theme)
- `--accent-pink`: `#ec4899` (candy theme, decorative)

### Focus Ring
- `--focus-ring`: `#f8fafc` (3px outline on interactive elements)
- `--focus-ring-shadow`: `rgba(15,23,42,0.65)` (4px box-shadow)

### Gradients
- `--gradient-purple`: `linear-gradient(135deg,#7c3aed,#ec4899)` — primary CTA
- `--gradient-amber`: `linear-gradient(135deg,#f59e0b,#f97316)` — earnings/rewards
- `--gradient-green`: `linear-gradient(135deg,#10b981,#059669)` — success

## 2) Typography Scale
| Token | Size |
|-------|------|
| `--text-xs` | 0.75rem (12px) |
| `--text-sm` | 0.875rem (14px) |
| `--text-md` | 1rem (16px) |
| `--text-lg` | 1.125rem (18px) |
| `--text-xl` | 1.25rem (20px) |
| `--text-2xl` | 1.5rem (24px) |
| `--text-3xl` | 1.75rem (28px) |
| `--text-4xl` | 2rem (32px) |

- Headings: `font-family: 'Outfit', sans-serif`
- Body/UI: `font-family: 'Nunito', sans-serif`
- Page title: `.page-title` — Outfit 800 gradient text, clamps from 2xl→4xl
- Section title: `.section-title` — Outfit 800, xl

## 3) Spacing Scale (4px base)
| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-5` | 20px |
| `--space-6` | 24px |
| `--space-7` | 28px |
| `--space-8` | 32px |

- Card internal padding: `var(--space-6)` (24px)
- Card gap in grid: 20px
- Mobile card padding: `var(--space-4)` (16px)

## 4) Border Radius
| Token | Value |
|-------|-------|
| `--radius-sm` | 8px |
| `--radius-md` | 14px |
| `--radius-lg` | 20px |
| `--radius-xl` | 28px |

## 5) Button Hierarchy (strict rules)

### `.btn.btn-primary`
- Background: `var(--gradient-purple)`
- Color: white
- Shadow: `0 4px 12px rgba(124,58,237,0.24)`
- **Use for:** The single primary action per screen or section. Add Kid, Finalize Day, Save, Start.
- **Max 1 per visual cluster.**

### `.btn.btn-secondary`
- Background: `rgba(124,58,237,0.16)`
- Color: `#e9d5ff`
- Border: `1px solid rgba(167,139,250,0.45)`
- **Use for:** Important alternatives that must remain visible. Weekly Report, Link Account.

### `.btn.btn-ghost`
- Background: transparent
- Border: `1px solid var(--border)`
- Color: `var(--text-primary)`
- **Use for:** Low-emphasis actions: Cancel, Back, Dismiss, minor utilities.

### `.btn.btn-danger`
- Background: `var(--gradient-red)`
- Color: white
- **Use for:** Destructive actions only: Delete, Remove.

### `.btn.btn-amber`
- Background: `var(--gradient-amber)`
- **Use for:** Reward/money-related urgent actions only.

### Size modifiers
- `.btn-sm`: `6px 12px`, font-size 12px
- (default): `10px 18px`, font-size 14px

### Rules
1. Never place two `btn-primary` buttons side by side without hierarchy.
2. Landing bottom CTA: use `btn-primary` (not secondary).
3. Modal footers: ghost (cancel) + primary (confirm).

## 6) Layout Patterns

### Page Structure
```
.page-header (title + top actions)
↓
Primary content (Kids summary, Today tasks, Progress)
↓
Secondary tools (Reports, Leaderboard, Settings)
```

### Dashboard Hierarchy (Parent)
1. Primary Actions card (Quick links)
2. Kids Summary grid
3. Weekly Summary card
4. Goals grid
5. Leaderboard
6. Performance Report

### Kid Dashboard Hierarchy
1. Hero card (avatar, balance, streak)
2. Badge unlock toast (transient)
3. Routine banner (transient)
4. Today's Tasks (critical — task list)
5. 10-day progress strip
6. Savings Goal
7. Badge Strip
8. Leaderboard
9. Recent History
10. Day Journal

### Card System
- Wrap each distinct concern in `.card`
- Use `.card-grid` for multiple comparable cards
- Hover: `translateY(-2px)` + shadow (already in CSS)

## 7) Accessibility Rules

### Focus States (all interactive elements)
```css
:focus-visible {
  outline: 3px solid var(--focus-ring);
  outline-offset: 2px;
  box-shadow: 0 0 0 4px var(--focus-ring-shadow);
}
```
Applied to: `.btn`, `.nav-link`, `.chip`, `.lang-switch`, `.login-lang-btn`, `.mobile-header-btn`, `.modal-close`, `.task-checkbox`, `.kid-card`, `.notif-toggle input:focus-visible + .notif-toggle-slider`, `.theme-swatch`, `.goal-icon-btn`

### Contrast (WCAG AA minimum 4.5:1 for small text)
- `--text-primary` on dark surfaces: ✅ ~14:1
- `--text-secondary` on dark surfaces: ✅ ~8:1
- `--text-muted` on dark surfaces: ⚠️ ~4.5:1 (borderline — use only for decorative labels)
- White on `--accent-purple`: ✅ ~5.5:1

### Touch Targets
- All buttons: minimum `44px` height for primary interactive buttons
- `.btn-sm`: minimum `32px` — acceptable for inline actions
- Chip pills: minimum `32px` height with `6px` padding

### Reduced Motion
- `@media (prefers-reduced-motion: reduce)` — global animation disable
- `[data-feedback-reduced-motion="true"]` — KidDashboard low-stimulation mode
- Low-stim mode disables: confetti, celebration animations, streak pulse, badge toast animation, task pop

## 8) Chip / Tag Rows

### Standard wrapping
```html
<div class="chip-group">...</div>
```

### Horizontal scrolling (mobile overflow)
```html
<div class="chip-group chip-group--scroll">...</div>
```
- Hides scrollbar (`scrollbar-width: none`)
- `-webkit-overflow-scrolling: touch` for momentum

### Template Picker filter chips
```html
<div class="tpicker-chip-scroll-wrap">
  <div class="chip-group tpicker-chip-scroll">...</div>
  <div class="tpicker-chip-hint">Swipe to see more...</div>
</div>
```
- Fade overlay via `::after` pseudo-element
- Hint text visible on `@media (max-width: 640px)`

## 9) Motion & Feedback Policy

| Context | Animation | Sound | Confetti |
|---------|-----------|-------|---------|
| Parent Dashboard | Minimal (card hover) | None | None |
| Kid Dashboard (default) | Full | On | Yes |
| Kid Dashboard (low-stim) | Reduced | Off | No |
| `prefers-reduced-motion` OS | None | Off | No |

## 10) Theme System
5 themes: `default` (space purple), `ocean` (teal), `forest` (green), `sunset` (orange), `candy` (pink).
Each theme overrides `--accent-purple`, `--gradient-hero`, `--gradient-purple`, `--border`, `--bg-card`.
Theme persists in `localStorage('kidstrack-theme')`.

## 11) i18n Rules
- All user-visible strings must be in both `en.js` and `vi.js`
- Keys follow dot-notation namespacing: `section.key`
- Param interpolation: `{paramName}` in the string value
- Never hardcode strings in JSX using `lang === 'vi' ? ...` — use `t('key')`
- Raw `lang ===` comparisons only acceptable for format/date logic, not display text

## 12) Responsive Breakpoints
| Breakpoint | Target |
|------------|--------|
| 320px | Minimum support (reduce padding, smaller font) |
| 375px | Most phones (standard mobile) |
| 640px | Template picker preview collapses to stacked |
| 768px | Mobile nav switches to bottom nav; sidebar hides |
| 760px | Leaderboard table columns compress |
| 1024px | Desktop (full sidebar, multi-column grids) |
