# Dev Lead Work Order - Mobile UX v1
Date: 2026-03-19
Source: docs/mobile-ux-v1-handoff-2026-03-19.md

## Mission
Own technical implementation, state behavior, performance, accessibility, and release safety for all Mobile UX v1 tasks.

## Deliverables
1. Implementation plan per phase (P0/P1/P2).
2. PRs with test updates and regression-proof async handling.
3. QA evidence from build + focused e2e suites.

## Assigned Tasks
- P0-1 Implement sticky bottom action bar behavior (mobile-only) with safe-area support.
- P0-2 Enforce 44x44 touch targets in code/CSS.
- P0-3 Unify async feedback state patterns (pending, disabled, aria-busy, rollback safety).
- P1-1 Implement install CTA disabled helper state and platform label logic.
- P1-3 Introduce mobile bottom-sheet pattern for high-frequency forms.
- P2-2 Motion/accessibility hardening:
  - prefers-reduced-motion
  - contrast checks
  - aria consistency

## Required Verification
- npm run build
- Playwright focused:
  - tests/e2e/parent-flow.spec.js
  - tests/e2e/kid-flow.spec.js
  - tests/e2e/template-picker.spec.js
  - tests/e2e/install-cta.spec.js

## Non-Regression Requirements
- No duplicate async requests from repeated taps.
- No state corruption on failed optimistic updates.
- No mobile layout overlap with fixed/sticky controls.

## Status Board
- [ ] P0-1
- [ ] P0-2
- [ ] P0-3
- [ ] P1-1
- [ ] P1-3
- [ ] P2-2
