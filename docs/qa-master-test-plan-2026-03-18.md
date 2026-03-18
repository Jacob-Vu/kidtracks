# QA Master Test Plan — 2026-03-18

**Project:** KidsTrack
**Date:** 2026-03-18
**Test Framework:** Playwright E2E

---

## 1. Feature Inventory

### 1.1 Auth Flows
- Unauthenticated landing page display
- Sign in (email/password)
- Sign out
- Kid login (PIN or simplified flow)
- Auth state persistence across page reload

### 1.2 Parent Dashboard
- Kids list — view, add, remove
- Goals — create, edit, delete, milestone progression
- Templates — create family templates, browse default templates, delete
- Daily tasks — mark complete, undo, view by kid
- Ledger — coin history, balance display
- Weekly report — navigation, summary, badge section, export

### 1.3 Kid Dashboard
- Task list — view today's tasks, mark complete
- Kid profile — avatar, theme selection
- Badges — unlock on milestone, badge gallery view
- Feedback sounds — play on task complete, toggle on/off, reduced motion

### 1.4 Notification Settings
- Toggle notification types on/off
- Save preferences
- Clear all preferences

### 1.5 Internationalization (i18n)
- English (EN) — all keys resolve to human-readable text
- Vietnamese (VI) — all keys resolve, no raw key strings rendered
- Locale switching persists across navigation

### 1.6 PWA
- Service worker registration
- Auto-update on new deploy (skipWaiting + clientsClaim)
- Offline fallback page

---

## 2. Risk Areas

### 2.1 E2E Mock Layer — addInitScript Fires on Reload
`page.addInitScript` executes on every navigation including `page.reload()`. Any script that unconditionally writes to localStorage will overwrite state that was set up mid-test. All `addInitScript` blocks must use a conditional guard that checks whether the key already exists before writing.

### 2.2 i18n Key Fallback Returns Key String
The i18n library returns the raw key string when a translation is missing (e.g., `'landing.social.metrics.families'`). This is a silent failure — the page renders without error, but the displayed text is wrong. Tests asserting on visible text will catch this, but tests that only check for element existence will not.

### 2.3 Audio API in Headless Chrome
`AudioContext` creation fails silently in headless Chrome. Any hook or component that dispatches debug events or performs assertions inside an `AudioContext` try-catch may silently swallow failures. Debug events must be dispatched before the try-catch block to guarantee delivery.

### 2.4 Strict Mode Violations from Multiple Matching Elements
Playwright strict mode requires that locators resolve to exactly one element. Pages with repeated interactive elements (e.g., "Sign in" buttons in both header and footer) will cause strict mode errors if the locator is not scoped or qualified with `.first()`, `.last()`, or a parent scope.

---

## 3. Test Matrix

| Feature Area | Spec File(s) |
|---|---|
| Auth (landing, sign in/out, kid login) | `auth-flow.spec.js`, `new-features.spec.js` |
| Goals (CRUD, milestones, reload persistence) | `goals.spec.js` |
| Templates (create, browse, delete) | `parent-flow.spec.js`, `new-features.spec.js`, `template-picker.spec.js` |
| Kids and daily tasks | `kid-flow.spec.js`, `parent-flow.spec.js` |
| Badges (unlock, gallery) | `badges.spec.js` |
| Feedback sounds and reduced motion | `feedback.spec.js` |
| Weekly report (navigation, export) | `weekly-report.spec.js` |
| Landing page (social proof, CTA) | `landing-social-proof.spec.js`, `prod-smoke.spec.js` |

---

## 4. Coverage Gaps

The following areas are not currently covered by any E2E spec:

- **Notification settings UI** — toggling notification types, saving, and clearing preferences has no automated test coverage
- **Kid theme and avatar settings (interactive)** — the profile page renders but interactive theme/avatar selection is not exercised
- **Parent profile management** — display name update, avatar upload, account settings page
- **Error states** — network failure handling (Firebase offline, fetch errors), invalid form input (empty required fields, duplicate names)

---

## 5. Test Environment

| Setting | Value |
|---------|-------|
| Framework | Playwright |
| Mode | E2E mode via `?e2e=1` URL param + localStorage state injection |
| Browser | Chromium (headless) |
| State strategy | `addInitScript` conditional guard pattern |
| Audio testing | `window.__kidFeedbackAudio` event bus pattern |
| Locale tested | EN (primary), VI (selector tests) |

---

## 6. Pass Criteria

A release is considered QA-cleared when:

1. All Playwright E2E tests pass (0 failures, 0 unexpected skips)
2. No raw i18n key strings appear in the EN or VI rendered output
3. No Playwright strict mode violations in the run log
4. All High and Medium severity open bugs are resolved
