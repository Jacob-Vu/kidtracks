# KidsTrack UX/UI Audit Status Report — 2026-03-18

**Execution Date:** 2026-03-18
**Session:** Full implementation pass
**Build Result:** ✅ PASS — `npm run build` succeeded, 2142 modules, no errors

---

## Summary

All P0, P1, and P2 audit items from the 2026-03-17 audit are now DONE. This session verified, refined, and completed items from the prior session (which had build/git blockers), and added additional improvements discovered during the code review.

---

## Item-by-Item Status

### P0 — Critical

#### P0.1 Reorder visual hierarchy on Parent Dashboard
**Status: DONE**
**Files:** `src/pages/Dashboard.jsx`
- Order confirmed: Primary Actions → Kids Summary → Weekly Summary → Goals → Leaderboard → Performance Report
- Primary Actions card has `btn-primary` for Add Kid and `btn-secondary` for Report/Templates
- Hardcoded ASCII Vietnamese strings replaced with `t()` i18n calls (`dash.primaryActionsTitle`, `dash.kidsSummaryTitle`)

#### P0.2 Reorder visual hierarchy on Kid Dashboard
**Status: DONE (improved this session)**
**Files:** `src/pages/KidDashboard.jsx`
- Moved "Today's Tasks" section BEFORE 10-day progress strip and savings goal
- New order: Hero → Badge toast → Routine banner → Today's Tasks → 10-day strip → Goal → BadgeStrip → Leaderboard → History
- Audit requirement: "start with today-critical info before secondary engagement blocks" — now met

#### P0.3 Standardize button hierarchy (primary/secondary/ghost)
**Status: DONE**
**Files:** `src/pages/LandingPage.jsx`, `src/pages/Dashboard.jsx`, `src/index.css`
- `btn-secondary` CSS class defined with outlined purple tint
- Landing bottom CTA fixed: was `btn-secondary`, now `btn-primary` ← **fixed this session**
- Dashboard: Add Kid = `btn-primary`, Report/Templates = `btn-secondary`, Cancel = `btn-ghost`
- KidDashboard: Add Task = `btn-primary`, Save Routine = `btn-ghost`
- Modal footers: Cancel = `btn-ghost`, Confirm = `btn-primary`, Delete = `btn-danger`

#### P0.4 Accessibility pass: contrast + visible focus states
**Status: DONE (expanded this session)**
**Files:** `src/index.css`
- Existing focus rings: `.btn`, `.nav-link`, `.chip`, `.lang-switch`, `.login-lang-btn`, `.mobile-header-btn`, `.modal-close`, `.task-checkbox`, `.kid-card`
- **Added this session:**
  - `input:focus-visible + .notif-toggle-slider` — toggle switches now keyboard-accessible
  - `.theme-swatch:focus-visible` — theme picker swatches
  - `.goal-icon-btn:focus-visible` — goal icon selector buttons
  - `.theme-sidebar-dot:focus-visible` — sidebar theme dots
- Text contrast: `--text-primary` (#f1f5f9) on dark = ~14:1 (AAA), `--text-secondary` = ~8:1 (AA)

#### P0.5 Sweep i18n missing keys (EN/VI) + raw key fallback checks
**Status: DONE (fixed param mismatch this session)**
**Files:** `src/i18n/en.js`, `src/i18n/vi.js`, `src/pages/Dashboard.jsx`
- `leaderboard.improvedBy`: param was `{pct}` but component sends `{value}` — **fixed this session**
- Added 14 new i18n keys for dashboard display strings (both EN and VI)
- KidReport component: added `useT()` hook, replaced all `lang === 'vi' ? ... : ...` display strings with `t()` calls
- EN/VI parity verified: all keys present in both files

---

### P1 — High

#### P1.1 Split Templates into tabs (Default Packs / Family Templates)
**Status: DONE**
**Files:** `src/pages/Templates.jsx`
- `activeTab` state with "default" / "family" values
- Chip-group tab switcher at top using `t('tmpl.defaultPacks')` and `t('tmpl.familyTemplates')`
- Conditional rendering: `{activeTab === 'default' && <section>...}` / `{activeTab === 'family' && <section>...}`
- Empty state shown when family templates tab has no items

#### P1.2 Landing hero + CTA funnel simplification (single primary CTA)
**Status: DONE**
**Files:** `src/pages/LandingPage.jsx`
- Hero has exactly one primary CTA with `btn-primary landing-cta-primary`
- Nav "Sign in" = `btn-secondary btn-sm`
- Bottom CTA = `btn-primary` (fixed this session from `btn-secondary`)
- Footer "Sign in" = `btn-secondary btn-sm`

#### P1.3 Motion/sound profile clarity (kid vs parent defaults + settings wording)
**Status: DONE**
**Files:** `src/components/NotificationSettings.jsx`, `src/pages/KidProfile.jsx`, `src/i18n/en.js`, `src/i18n/vi.js`
- NotificationSettings: Parent mode hint text separated under title; default state text in italic
- `notif.parentModeHint`: "Parent reminder settings"
- `notif.defaultParent`: "Parent mode default: reminders are OFF until you enable them."
- KidProfile feedback card: shows `feedback.defaultKid` = "Kid mode default: sounds ON"
- Low-stim toggle with `feedback.lowStimLabel` and `feedback.lowStimHint`
- aria-label added to toggle label and input elements

#### P1.4 Mobile chip overflow affordance (fade gradient, scroll hint)
**Status: DONE**
**Files:** `src/pages/TemplatePickerPage.jsx`, `src/index.css`
- `.tpicker-chip-scroll-wrap` with `::after` fade gradient overlay
- `.tpicker-chip-scroll` with `flex-wrap: nowrap; overflow-x: auto`
- `.tpicker-chip-hint` shown on mobile (`display: block` at max-width 640px)
- **Added this session:** `.chip-group--scroll` utility class for general use

---

### P2 — Stabilize/Scale

#### P2.1 Mini design-system doc (tokens, component variants, usage rules)
**Status: DONE (updated this session)**
**Files:** `docs/mini-design-system-2026-03-18.md`
- Comprehensive doc covering: color tokens, typography, spacing, border radius, button hierarchy rules, layout patterns, accessibility rules, chip/tag patterns, motion policy, theme system, i18n rules, responsive breakpoints
- Previous doc: `docs/mini-design-system-2026-03-17.md` (kept)

#### P2.2 Visual QA checklist before deploy
**Status: DONE (updated this session)**
**Files:** `docs/visual-qa-checklist-2026-03-18.md`
- 14 sections covering: viewports, hierarchy (parent & kid dashboard), landing CTA funnel, button hierarchy, accessibility focus states, accessibility contrast, i18n, motion/kid safety, templates tabs, chip overflow, notification settings, kid profile, build gate
- Previous checklist: `docs/visual-qa-checklist-2026-03-17.md` (kept)

#### P2.3 Low stimulation mode for Kid profile
**Status: DONE**
**Files:** `src/hooks/useKidFeedback.js`, `src/pages/KidProfile.jsx`, `src/index.css`
- `LS_LOW_STIMULATION = 'kidstrack-low-stimulation-mode'` localStorage key
- `readLowStimulationMode()` reads on mount
- `reducedMotion = prefersReducedMotion || lowStimulationMode` computed value
- KidProfile: toggle with `data-testid="feedback-low-stim-toggle"`
- KidDashboard: `data-feedback-reduced-motion={reducedMotion ? 'true' : 'false'}` on root div
- **Added this session:** CSS selectors `[data-feedback-reduced-motion="true"]` that disable confetti, celebration animations, streak pulse, badge toast animation, task pop animation
- Also added `.badge-unlock-toast` and `.badge-unlock-toast--reduced` CSS classes

#### P2.4 Responsive audit pass (320/375/768/1024) + issue fixes
**Status: DONE (enhanced this session)**
**Files:** `src/index.css`
- Existing: `@media (max-width: 768px)` with sidebar hide, bottom nav, content padding adjustments
- **Added this session:** `@media (max-width: 360px)` with:
  - Content padding: 12px (reduced from 16px)
  - Page title: 2xl (from 3xl)
  - Card padding: space-4 (from space-6)
  - Button/font sizes reduced for very small screens
  - Pack/report grids force to 1-column
  - Landing hero: reduced vertical padding
- KidProfile avatar grid: `.avatar-grid` class with `@media (max-width: 400px)` 6-column CSS grid
- Goal grid: 1-column on 768px
- Page header button group: left-aligned on mobile

---

## Additional Improvements (Beyond Original Scope)

### Bug Fixes
1. **leaderboard.improvedBy param mismatch**: Component used `{value}` but key had `{pct}` — fixed in both en.js and vi.js
2. **Dashboard KidReport missing i18n**: Function used `lang ===` ternaries for display strings — converted to `t()` with proper keys
3. **Landing bottom CTA wrong hierarchy**: Was `btn-secondary`, should be `btn-primary` — fixed

### New Utilities
- `.chip-group--scroll`: horizontal scrollable chip row class with hidden scrollbar
- `.avatar-grid`: semantic class for KidProfile avatar picker
- `.form-select`: styled native dropdown with custom arrow indicator
- `.badge-unlock-toast` family: CSS for the badge unlock toast in KidDashboard

### Accessibility Additions
- 4 new focus-visible targets (notif-toggle, theme-swatch, goal-icon-btn, theme-sidebar-dot)
- `aria-label` + `aria-pressed` on avatar picker buttons
- `aria-label` on notification toggle
- Improved low-stimulation mode CSS coverage

---

## Files Changed This Session

| File | Changes |
|------|---------|
| `src/pages/Dashboard.jsx` | KidReport: added useT(), replaced hardcoded strings with t(); Dashboard: replaced hardcoded display strings with t() calls; legend strings i18n'd |
| `src/pages/KidDashboard.jsx` | Reordered sections: tasks before 10-day strip and goal |
| `src/pages/LandingPage.jsx` | Bottom CTA: btn-secondary → btn-primary |
| `src/pages/KidProfile.jsx` | Avatar grid: flex → .avatar-grid class; aria-label + aria-pressed on buttons |
| `src/components/NotificationSettings.jsx` | Layout: hint under title; aria-label on toggle; italic default state text |
| `src/index.css` | Added: notif-toggle focus-visible, theme-swatch focus-visible, goal-icon-btn focus-visible, 320px breakpoint, chip-group--scroll, avatar-grid, form-select, low-stimulation CSS, badge-unlock-toast CSS, responsive goal-grid and page-header fixes |
| `src/i18n/en.js` | Fixed: leaderboard.improvedBy {pct}→{value}; Added: 14 dash.* keys |
| `src/i18n/vi.js` | Fixed: leaderboard.improvedBy {pct}→{value}; Added: 14 dash.* keys (Vietnamese) |
| `docs/mini-design-system-2026-03-18.md` | Created: comprehensive design system doc |
| `docs/visual-qa-checklist-2026-03-18.md` | Created: pre-deploy QA checklist |
| `docs/ux-ui-audit-progress-log-2026-03-18.md` | Created: session progress log |

---

## Blocked / Not Applicable Items

**None blocked.** All items from the 2026-03-17 audit are now DONE or had no applicable code to change.

Items that were DONE in prior session and verified correct in this session:
- Weekly Report core functionality
- Streak badge display
- BadgeStrip component
- LeaderboardCard component
- OnboardingWizard flow
- GoalCard / GoalModal components

---

## Risks & Remaining Notes

1. **Bundle size warning**: JS bundle is 876KB gzipped → 266KB. Pre-existing. No new regressions added.
2. **`t` variable shadowing in KidReport**: `const t = useT()` is shadowed in `.filter((t) => ...)` callbacks where `t` means task. Works correctly (local scope) but is confusing code. Not fixing as it was pre-existing and would require renaming all filter variables.
3. **WCAG automated scan**: No automated contrast/accessibility scanner run (environment limitation). Manual review indicates AA compliance for all text on dark surfaces.
4. **Visual browser testing**: No Playwright/screenshot tests run. Changes are CSS-class based and structurally sound per code review.
5. **Low-stimulation mode persistence**: Stored in `localStorage` only, not in Firebase profile. Will reset if user clears storage. Acceptable for P2 scope.
6. **i18n copy tone**: New Vietnamese keys added by developer (not PM/content review). Tone matches existing copy style but should be reviewed by a native speaker before production.

---

## Build Evidence

```
npm run build
✓ 2142 modules transformed
✓ built in 6.40s (main bundle)
✓ 65 modules transformed
✓ built in 220ms (service worker)
PWA precache: 9 entries (926.26 KiB)
Result: PASS ✅
```
