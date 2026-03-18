# Jira Task Breakdown - UI/UX + Performance (2026-03-18)

## Sprint Goal
Ship critical UX fixes and speed improvements for Landing + Signin while keeping regressions low.

## Epic KT-WEB-2026Q1-UXPERF

### KT-101 - Fix missing i18n keys showing raw key text
- Priority: P0
- Estimate: 2h
- Scope:
  - Add missing keys for `landing.social.testimonial{1..3}.{name,role,quote}` in `en/vi`.
  - Add missing safe fallback logic check for social proof block.
  - Add automated key parity check script (`en` vs `vi`) and run in CI (`npm run test:i18n`).
- Acceptance Criteria:
  - No raw key text (example: `testimonial`) is visible in landing and social proof sections.
  - `npm run test:i18n` passes.

### KT-102 - Reduce bundle size and improve first-load performance (Landing/Signin)
- Priority: P0
- Estimate: 6h
- Scope:
  - Route-level code splitting with `React.lazy` for pages.
  - Add Vite `manualChunks` for vendor split (`react`, `firebase`, `date-fns`).
  - Keep landing/signin critical path lightweight.
- Acceptance Criteria:
  - Build output shows split chunks instead of single heavy app chunk.
  - Landing and Signin route JS first-load reduced versus baseline.

### KT-103 - Improve target icon size in kid target chooser
- Priority: P1
- Estimate: 1.5h
- Scope:
  - Increase icon button size in goal target icon grid.
  - Improve hit target and selected state visibility.
- Acceptance Criteria:
  - Icons are visibly larger and tappable on mobile and desktop.
  - No layout break on modal width <= 360px.

### KT-104 - Increase profile icon/avatar size
- Priority: P2
- Estimate: 1h
- Scope:
  - Increase mobile header profile avatar size.
  - Keep alignment with language and logout actions.
- Acceptance Criteria:
  - Avatar appears visually balanced and tap-friendly.

### KT-105 - Refresh DateTime picker UI
- Priority: P1
- Estimate: 2h
- Scope:
  - Restyle date input (`goal due date`) to match design system.
  - Improve calendar indicator visibility and focus states.
- Acceptance Criteria:
  - Date input is consistent with app visual style.
  - Works in Chromium-based browser and Safari fallback.

### KT-106 - Profile click navigation to Parent/Kid profile page
- Priority: P1
- Estimate: 2h
- Scope:
  - Parent dashboard: clicking kid profile affordance navigates to `kid profile` page.
  - Mobile header avatar click routes by role:
    - Parent -> `/profile`
    - Kid -> `/kid/profile`
  - Add parent profile page route and minimal profile view.
- Acceptance Criteria:
  - Avatar/profile actions always open correct profile page by role.

### KT-107 - Landing hero slider with 7 feature slides
- Priority: P1
- Estimate: 5h
- Scope:
  - Replace single hardcoded preview card (Minh) with slider.
  - Add 7 slides with bilingual title/desc and mini task preview.
  - Include controls (prev/next/dots), autoplay pause on hover, swipe support baseline.
- Acceptance Criteria:
  - Landing shows exactly 7 slides.
  - Slider works on desktop/mobile and does not block initial render.

### KT-108 - Verification + smoke tests
- Priority: P0
- Estimate: 2h
- Scope:
  - Build and run unit/e2e smoke relevant suites.
  - Confirm no route regression in auth and landing social proof.
- Acceptance Criteria:
  - `npm run build` passes.
  - Existing critical tests pass or failures are documented.

## Execution Order
1. KT-101
2. KT-102
3. KT-106
4. KT-103 + KT-104 + KT-105
5. KT-107
6. KT-108

## Status Board
- Done: KT-101, KT-102, KT-103, KT-104, KT-105, KT-106, KT-107, KT-108
- In Progress: none
- Blocked: none
- Next: UI review + optional e2e rerun on staging
