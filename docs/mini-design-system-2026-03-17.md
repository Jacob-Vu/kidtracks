# KidsTrack Mini Design System (2026-03-17)

## 1) Core Tokens
- Colors:
  - `--bg-primary`, `--bg-secondary`, `--bg-card`, `--border`, `--border-light`
  - `--text-primary`, `--text-secondary`, `--text-muted`
  - Semantic accents: `--accent-green`, `--accent-amber`, `--accent-red`, `--accent-purple`
- Spacing:
  - 4px scale via `--space-1` to `--space-8`
  - Default card/internal rhythm: 8/12/16/24px
- Radius:
  - `--radius-sm` (8), `--radius-md` (14), `--radius-lg` (20), `--radius-xl` (28)
- Typography:
  - Heading: `Outfit`
  - Body/UI: `Nunito`
  - Sizing from `--text-xs` through `--text-4xl`

## 2) Button Hierarchy
- Primary: `btn btn-primary`
  - Use for one main action per section/screen.
- Secondary: `btn btn-secondary`
  - Use for high-importance alternatives that should remain visible.
- Ghost: `btn btn-ghost`
  - Use for low-emphasis actions (dismiss, tertiary navigation, minor utilities).
- Destructive: `btn btn-danger`
  - Only for delete/remove/irreversible operations.

## 3) Layout Rules
- Page structure:
  - `page-header` (title + top actions)
  - Primary content first, secondary tools later.
- Card system:
  - Prefer `card` wrappers with single intent each.
  - Group dense repeated items with `card-grid`.
- Responsive:
  - 320/375: reduce padding and avoid side-by-side action clusters.
  - 768+: allow multi-column cards and richer side-by-side controls.

## 4) Accessibility Rules
- Keep contrast with `--text-primary` or `--text-secondary` on dark surfaces.
- Use visible focus ring on all keyboard-interactive controls.
- Maintain 44px-equivalent tap comfort for touch-critical buttons.
- Respect low-stimulation/reduced-motion settings for kid profile flows.

## 5) Component Usage Snapshot
- Dashboard:
  - Order: primary actions -> kids summary -> weekly summary -> secondary tools.
- Template picker:
  - Horizontal chips must include overflow affordance on mobile.
- Kid profile:
  - Feedback settings must expose both sound toggle and low stimulation toggle.
