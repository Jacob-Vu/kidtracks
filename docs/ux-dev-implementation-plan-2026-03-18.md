# UX/UI + Dev Implementation Plan (2026-03-18)

## 1. Objective
Deliver a UX/UI and engineering improvement package focused on:
- Better parent usability (feedback/report flow, dashboard clarity).
- Consistent system states (loading, notification toggle).
- Stronger personalization (theme presets + custom primary color).
- Full removal of hardcoded language to improve i18n consistency.

This plan includes analysis, UX direction, Jira-style breakdown, sequencing, risks, acceptance criteria, and a pre-deploy test plan.

## 2. Scope Mapping
1. Feedback form: move from modal to a full page, improve interaction quality, reduce CTA visual dominance.
2. Theme: allow presets + custom main color via color picker.
3. Loading/Blocking: add loading icon and block interactions for critical select/submit actions.
4. i18n: eliminate hardcoded language keys/strings.
5. Notification toggle: fix incorrect enable/disable state behavior and messaging.
6. Dashboard restructure: move "Achievement Overview" to top, remove "Kids Summary", and merge key task/earnings stats into overview.

## 3. Product + UX Direction

### 3.1 Feedback/Report (Modal to Dedicated Page)
- UX decision:
  - Move to dedicated route: `/feedback/new` for better long-form input and review.
  - Change launcher button from high-emphasis primary to subtle secondary style in top-right utility area (near avatar/language).
- Proposed IA:
  - Header: report type + current context page.
  - Form body: subject, detail, optional contact preference, voice append.
  - Sticky footer: `Cancel` / `Submit`.
- Accessibility:
  - Clear focus rings, proper tab order, full aria labels.

### 3.2 Theme System (Preset + Custom)
- UX decision:
  - Keep presets for quick selection.
  - Add `Custom` mode with color picker for primary color.
  - Provide instant preview on sample UI elements (button/chip/card accents).
- Data model:
  - `themeMode: 'preset' | 'custom'`
  - `themePresetId`
  - `themeCustomPrimary` (hex)

### 3.3 Loading + Action Blocking
- UX decision:
  - Standardize `busy` state for async actions: feedback submit, async selections, settings save.
  - While `busy`: disable controls + spinner + state text (`Saving...`, `Sending...`).
  - Prevent double submit and race conditions.

### 3.4 Dashboard Information Architecture
- UX decision:
  - Top block becomes `Achievement Overview` (hero analytics).
  - Remove duplicated `Kids Summary` section.
  - Move key values into overview:
    - Total tasks completed
    - Total pocket money earned
    - Completion rate
    - Optional compact per-kid chips

## 4. Jira Task Breakdown

### Epic KT-2026Q1-UX-REFINE-02

### KT-201 - Convert Feedback Modal to Full Page
- Priority: P0
- Owner: Frontend Dev + UX/UI
- Estimate: 1.5 days
- Scope:
  - Add route `/feedback/new`.
  - Move form logic from `FeedbackLauncher` to new `FeedbackPage`.
  - Update launcher to subtle navigation-only button.
  - Keep voice append and existing analytics events.
- Acceptance:
  - No feedback modal remains.
  - Success/error submit states are clear.
  - Mobile interaction is better than modal UX.

### KT-202 - Theme Presets + Custom Color Picker
- Priority: P0
- Owner: Frontend Dev
- Estimate: 2 days
- Scope:
  - Extend `ThemeContext` to support `preset/custom` mode.
  - Generate CSS variables from custom color (primary, hover, soft bg).
  - Add picker UI in profile/settings.
- Acceptance:
  - User can select preset or custom color and persistence survives reload.
  - Main UI contrast remains valid.

### KT-203 - Global Busy States + Action Blocking
- Priority: P0
- Owner: Frontend Dev
- Estimate: 1 day
- Scope:
  - Standardize reusable loading button/state pattern.
  - Apply to feedback submit, settings save, and async selection flows.
- Acceptance:
  - Double-click submit is prevented.
  - Spinner + disabled states are visible in all in-scope actions.

### KT-204 - Eliminate Hardcoded Language Keys
- Priority: P0
- Owner: Frontend Dev
- Estimate: 1 day
- Scope:
  - Scan hardcoded UI text in `src` with script.
  - Add missing keys to `en.js` and `vi.js`.
  - Expand i18n audit to fail on hardcoded UI patterns.
- Acceptance:
  - No hardcoded UI text remains in scoped screens.
  - i18n script passes.

### KT-205 - Fix Notification Enable State Logic/UI
- Priority: P0
- Owner: Frontend Dev
- Estimate: 1 day
- Scope:
  - Re-map `enabled`, `permission`, and visible UI copy.
  - Separate explicit states:
    - Disabled by user
    - Blocked by browser permission
    - Enabled + scheduled
  - Update labels/hints to remove ambiguity.
- Acceptance:
  - Toggle and state display reflect real behavior.
  - No "Enabled but looks disabled" confusion.

### KT-206 - Dashboard IA Refactor (Achievement First)
- Priority: P0
- Owner: Frontend Dev + UX/UI
- Estimate: 2 days
- Scope:
  - Move `Achievement Overview` to top.
  - Remove `Kids Summary` section.
  - Merge task/earnings metrics from kids cards into overview block.
  - Improve information density and reduce dead space.
- Acceptance:
  - No duplicated information blocks.
  - Overview is easier to scan and more compact.

### KT-207 - QA, Accessibility, Regression, Deploy
- Priority: P0
- Owner: Dev + QA
- Estimate: 1 day
- Scope:
  - Build + smoke + targeted e2e.
  - Validate responsive desktop/mobile behavior.
  - Run regression checks on auth/dashboard/profile/settings.
- Acceptance:
  - `npm run build` passes.
  - Core flow smoke checks pass.
  - Short release note prepared before deploy.

## 5. Execution Sequence
1. KT-204 (i18n hardcode cleanup) to reduce copy noise early.
2. KT-205 (notification state fix) to stabilize base logic.
3. KT-201 + KT-203 (feedback page + busy states) in partial parallel.
4. KT-202 (theme custom) after UX interaction pattern is stable.
5. KT-206 (dashboard refactor) last due to larger layout impact.
6. KT-207 (QA + deploy).

## 6. Technical Plan by Module
- `src/components/FeedbackLauncher.jsx`: change from modal launcher to route navigation button.
- `src/pages/FeedbackPage.jsx` (new): full form, submit flow, voice append, loading states.
- `src/App.jsx`: add feedback route and parent role guard.
- `src/contexts/ThemeContext.jsx`: support custom/preset schema and persistence keys.
- `src/index.css`: add custom-theme CSS variables + busy/disabled state styles.
- `src/hooks/useNotifications.js`: normalize state derivation and expose status enum.
- `src/pages/KidProfile.jsx` or related settings page: integrate custom theme picker UI.
- `src/pages/Dashboard.jsx`: refactor section order and aggregate metrics.
- `src/i18n/en.js`, `src/i18n/vi.js`: add/update keys and replace hardcoded strings.
- `scripts/check-i18n-keys.mjs`: add stricter JSX hardcoded-text checks (rule-based + allowlist).

## 7. Risks and Mitigation
- Risk: Custom color can reduce contrast.
  - Mitigation: apply safe palette clamping + contrast fallback.
- Risk: Dashboard refactor can break kid-specific CTAs.
  - Mitigation: preserve compact per-kid action row + snapshot checks.
- Risk: Notification permission behavior differs by browser.
  - Mitigation: validate behavior and copy in Chrome/Edge/Safari fallback scenarios.

## 8. Test Checklist
- Feedback:
  - Navigate to `/feedback/new`, submit success/fail, voice append works.
  - Busy state blocks double submit.
- Theme:
  - Preset select, custom pick, persistence after reload.
- Notification:
  - Permission denied/default/granted states render correctly.
- Dashboard:
  - Achievement overview appears first, Kids Summary removed.
  - Task/earnings metrics are visible and data-consistent.
- i18n:
  - No raw keys/hardcoded UI text outside allowlist.

## 9. Definition of Done
- KT-201..KT-207 all meet acceptance criteria.
- Build pass + smoke pass.
- No major UX defects in feedback/dashboard/notification/theme.
- Production deploy complete with short changelog.

## 10. Status
- Planning: DONE (2026-03-18)
- Implementation: NOT STARTED
- Blockers: none
