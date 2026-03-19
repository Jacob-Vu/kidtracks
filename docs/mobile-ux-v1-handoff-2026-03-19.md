# Mobile UX v1 Backlog and Handoff (UI Lead + Dev Lead)
Date: 2026-03-19
Status: Ready for execution

## Goal
Improve one-handed usability, clarity, and responsiveness on mobile while preserving current product behavior.

## Scope
Primary surfaces:
- Landing page
- DailyView (parent)
- KidDashboard
- TemplatePickerPage
- Templates
- Shared controls and mobile navigation patterns

## Ownership Model
UI Lead owns interaction design, visual hierarchy, spacing/touch ergonomics, copy for states, and QA visual signoff.
Dev Lead owns technical architecture, component/state changes, accessibility wiring, performance guardrails, and release quality.

## Success Metrics
- Mobile tap error rate reduced (mis-taps on icon controls)
- Faster perceived response for async actions (pending feedback visible within 100ms)
- Fewer support complaints about install CTA confusion
- No regression in e2e critical flows (daily tasks, templates, install CTA)

## Prioritized Backlog

### P0-1: Sticky Primary Action Bar on Task-heavy Screens
Owner: UI Lead + Dev Lead
Files:
- src/pages/DailyView.jsx
- src/pages/KidDashboard.jsx
- src/pages/TemplatePickerPage.jsx
- src/index.css
Work:
- Add mobile-only sticky bottom action bar for the top-priority action(s)
- Add safe area handling using env(safe-area-inset-bottom)
- Keep desktop behavior unchanged
Acceptance:
- Primary action always reachable by thumb on <= 768px
- No overlap with content or modals

### P0-2: Touch Target Normalization
Owner: UI Lead + Dev Lead
Files:
- src/index.css
- src/pages/DailyView.jsx
- src/pages/KidDashboard.jsx
- src/pages/TemplatePickerPage.jsx
Work:
- Enforce minimum 44x44 hit area for icon-only controls
- Increase spacing between edit/delete/fail controls
- Keep icon semantics and aria labels intact
Acceptance:
- All tappable icon controls meet minimum touch size on mobile
- No accidental double-action presses in dense rows

### P0-3: Unified Async Feedback Pattern
Owner: Dev Lead
Files:
- src/pages/DailyView.jsx
- src/pages/KidDashboard.jsx
- src/pages/Templates.jsx
- src/pages/TemplatePickerPage.jsx
- src/hooks/useFirebaseSync.js
Work:
- Standardize per-action pending state, disabled controls, and busy labels
- Ensure rollback/error handling preserves UI state consistency
Acceptance:
- Every async mutation shows immediate feedback and temporary lock
- No duplicate requests from repeated taps

### P1-1: Install CTA Clarity on Landing
Owner: UI Lead + Dev Lead
Files:
- src/pages/LandingPage.jsx
- src/index.css
- tests/e2e/install-cta.spec.js
Work:
- Add helper copy for disabled state (why install is unavailable)
- Keep label deterministic by platform (Install App vs Add to Home Screen)
- Ensure visual distinction between primary signup CTA and install CTA
Acceptance:
- CTA remains visible when not standalone
- Disabled state is understandable without guessing
- Install CTA e2e remains green

### P1-2: Horizontal Scroll Discoverability
Owner: UI Lead
Files:
- src/index.css
- chip-based components/pages using horizontal overflow
Work:
- Add edge fade and swipe cue consistently across horizontal chip rows
- Ensure cue disappears appropriately when fully scrolled
Acceptance:
- Users can discover horizontal chip content without trial-and-error

### P1-3: Modal-to-Bottom-Sheet Upgrade for Frequent Mobile Actions
Owner: UI Lead + Dev Lead
Files:
- src/components/Modal.jsx (or sheet variant)
- src/pages/DailyView.jsx
- src/pages/KidDashboard.jsx
- src/pages/Templates.jsx
Work:
- Use bottom-sheet pattern on mobile for high-frequency forms
- Keep desktop modal unchanged
Acceptance:
- Better one-hand reach and less occluded context on small screens

### P2-1: Text Density and Clamp Rules
Owner: UI Lead
Files:
- src/index.css
- template/task list rows and preview cards
Work:
- Clamp secondary copy to 2 lines where needed
- Preserve consistent card heights in scroll lists
Acceptance:
- Reduced visual jitter and better scanability on <= 480px

### P2-2: Motion and Accessibility Hardening
Owner: Dev Lead
Files:
- src/index.css
- interactive components with animations
Work:
- Expand prefers-reduced-motion handling to decorative transitions
- Verify contrast and aria-busy/aria-label consistency on async controls
Acceptance:
- No critical accessibility regressions
- Motion remains pleasant without performance spikes on low-end devices

## Delivery Plan
Phase 1 (P0): 2-3 days
- Sticky action bar
- Touch target normalization
- Unified async feedback

Phase 2 (P1): 2 days
- Install CTA clarity
- Horizontal scroll discoverability
- Mobile bottom-sheet migration for top forms

Phase 3 (P2): 1-2 days
- Text density polish
- Motion/accessibility hardening

## QA Gates
- npm run build
- Focused Playwright:
  - tests/e2e/parent-flow.spec.js
  - tests/e2e/kid-flow.spec.js
  - tests/e2e/template-picker.spec.js
  - tests/e2e/install-cta.spec.js
- Mobile viewport manual pass (360x800, 390x844, 430x932)

## Handoff Notes
UI Lead:
- Start with P0-1 and P0-2 interaction specs and spacing tokens.
- Provide visual acceptance screenshots for each major screen.

Dev Lead:
- Implement P0-3 state and behavior contracts first to reduce regressions.
- Keep tests updated with behavior changes, especially install CTA and task pending flows.
