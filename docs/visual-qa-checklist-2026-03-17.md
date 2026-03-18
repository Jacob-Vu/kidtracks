# KidsTrack Visual QA Checklist (Pre-Deploy)

Date: 2026-03-17

## 1) Viewports
- [ ] 320px: no clipped primary CTA, no horizontal page overflow
- [ ] 375px: chip rows and filters scroll with visible affordance
- [ ] 768px: card grids and headers align with consistent spacing
- [ ] 1024px: section hierarchy remains visually clear

## 2) Hierarchy and CTA
- [ ] Parent dashboard order is: actions -> kids summary -> weekly -> secondary tools
- [ ] Kid dashboard starts with today-critical info before secondary engagement blocks
- [ ] One primary action per cluster; secondary/ghost actions are clearly differentiated

## 3) Accessibility
- [ ] Keyboard focus ring visible on buttons, chips, links, inputs, and toggles
- [ ] Text contrast on cards/modals meets readable dark-theme baseline
- [ ] No key interactions depend only on hover

## 4) i18n
- [ ] No raw translation keys visible in EN
- [ ] No raw translation keys visible in VI
- [ ] EN/VI parity check for newly added UI strings

## 5) Motion and Kid Safety
- [ ] Low stimulation mode reduces celebration/motion intensity
- [ ] Feedback sounds follow profile settings
- [ ] Reduced-motion behavior remains stable across kid dashboard interactions

## 6) Final Technical Gate
- [ ] `npm run build`
- [ ] Targeted tests for changed areas (if available)
- [ ] Deploy only if no P0/P1 critical regressions remain
