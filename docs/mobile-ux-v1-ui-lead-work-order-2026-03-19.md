# UI Lead Work Order - Mobile UX v1
Date: 2026-03-19
Source: docs/mobile-ux-v1-handoff-2026-03-19.md

## Mission
Own mobile interaction quality and visual UX for all items in the Mobile UX v1 backlog.

## Deliverables
1. Interaction specs and visual rules for P0/P1/P2 items.
2. Final UI acceptance screenshots for key pages at 360x800, 390x844, 430x932.
3. Signoff checklist per task with pass/fail notes.

## Assigned Tasks
- P0-1 Sticky primary action bar on:
  - DailyView
  - KidDashboard
  - TemplatePickerPage
- P0-2 Touch target normalization (44x44 minimum) for icon controls and dense action rows.
- P1-1 Install CTA clarity:
  - disabled-state helper text
  - deterministic label per platform
  - clear hierarchy vs primary signup CTA
- P1-2 Horizontal scroll discoverability:
  - edge fade + swipe cues where overflow chips exist
- P1-3 Modal-to-bottom-sheet pattern for frequent mobile actions.
- P2-1 Text density and clamp rules for secondary text.

## Acceptance Criteria
- One-hand reachability for primary actions on <=768px.
- Icon controls meet 44x44 tap targets.
- No UI overlap with sticky bars, safe area, or modals.
- All high-frequency mobile flows remain visually stable and readable.

## Coordination with Dev Lead
- Provide design decisions before implementation starts for P0 items.
- Review PRs and annotate final adjustments per viewport.

## Status Board
- [ ] P0-1
- [ ] P0-2
- [ ] P1-1
- [ ] P1-2
- [ ] P1-3
- [ ] P2-1
