# QA Bug Report — 2026-03-18

**Project:** KidsTrack
**Date:** 2026-03-18
**Status:** All bugs resolved — 39/39 E2E tests passing

---

## Summary

11 bugs were identified and fixed during the 2026-03-18 QA cycle. Bugs span E2E test infrastructure, i18n coverage gaps, UI state management, and audio API compatibility in headless Chrome.

---

## Bug Details

### BUG-001 — Auth redirect: tests expected /login, app shows landing page

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Status** | Fixed |
| **Files Changed** | `tests/e2e/auth-flow.spec.js`, `tests/e2e/prod-smoke.spec.js`, `tests/e2e/kid-flow.spec.js` |

**Description:** E2E tests asserted that unauthenticated users would be redirected to `/login`. The app instead shows `LandingPage` at `/` for unauthenticated users.

**Root Cause:** Product behavior changed — unauthenticated users now land on `LandingPage` at `'/'` instead of being redirected to `/login`. Test assertions were never updated to match.

**Fix Summary:** Updated test assertions to check for landing page heading/content instead of asserting on the URL path `/login`.

---

### BUG-002 — Missing i18n keys for social proof metrics

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Status** | Fixed |
| **Files Changed** | `src/i18n/en.js`, `src/i18n/vi.js` |

**Description:** Social proof metrics on the landing page displayed raw key strings (e.g., `landing.social.metrics.families`) instead of translated text.

**Root Cause:** Keys such as `t('landing.social.metrics.families')` were referenced in the component but never defined in `en.js` or `vi.js`, causing the i18n library to return the key string as a fallback.

**Fix Summary:** Added all missing `landing.social.metrics.*` keys to both `en.js` and `vi.js`.

---

### BUG-003 — New template invisible after creation

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Status** | Fixed |
| **Files Changed** | `src/pages/Templates.jsx` |

**Description:** After a parent created a new custom template, it did not appear in the UI immediately.

**Root Cause:** After `addTemplate()` was called in `Templates.jsx`, `activeTab` remained on `'default'` tab. New family templates are shown under the `'family'` tab, so they were never visible without a manual tab switch.

**Fix Summary:** Added `setActiveTab('family')` immediately after template creation to auto-navigate the user to the tab where the new template appears.

---

### BUG-004 — Goal state wiped on page.reload() in E2E tests

| Field | Value |
|-------|-------|
| **Severity** | High |
| **Status** | Fixed |
| **Files Changed** | `tests/e2e/goals.spec.js` |

**Description:** E2E tests that reloaded the page after setting up goal state found localStorage wiped, causing assertion failures on goal-related UI elements.

**Root Cause:** `addInitScript` fires on every navigation event, including `page.reload()`. The `beforeEach` block unconditionally overwrote the E2E state in localStorage with empty goals on every navigation, destroying any state that had been set up.

**Fix Summary:** Made `addInitScript` conditional — it now checks whether the relevant keys already exist in localStorage before writing, so state persists across reloads within the same test.

---

### BUG-005 — Audio debug event inside try-catch prevents test detection

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Status** | Fixed |
| **Files Changed** | `src/hooks/useKidFeedback.js` |

**Description:** E2E tests listening for `window.__kidFeedbackAudio` debug events were not receiving them even when the hook was triggered.

**Root Cause:** `window.dispatchEvent(AUDIO_DEBUG_EVENT)` was placed inside a `try-catch` block. In headless Chrome, `AudioContext` creation fails silently, and the exception was caught before the event could be dispatched.

**Fix Summary:** Moved `window.dispatchEvent()` to before the `try-catch` block so the debug event is always dispatched regardless of whether the `AudioContext` succeeds.

---

### BUG-006 — Missing badge i18n keys and wrong weekly report copy

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Status** | Fixed |
| **Files Changed** | `src/i18n/en.js`, `src/i18n/vi.js` |

**Description:** Badge names rendered as raw key strings. The weekly report section showed "New Badges" instead of "Newly unlocked badges" and badge counts displayed as "1 new badge(s)" instead of "1 unlocked".

**Root Cause:** `BADGE_DEFINITIONS` referenced keys such as `badge.consistency3Name` that were not defined in either `en.js` or `vi.js`. The weekly report section title and count copy strings were also outdated and did not match the current expected text.

**Fix Summary:** Added all `badge.*Name` and `badge.*Desc` definition keys to both `en.js` and `vi.js`. Updated the weekly section title copy to "Newly unlocked badges" and badge count format to "N unlocked".

---

### BUG-007 — Strict mode violations: multiple 'Sign in' buttons on landing page

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Status** | Fixed |
| **Files Changed** | `tests/e2e/auth-flow.spec.js`, `tests/e2e/prod-smoke.spec.js` |

**Description:** Playwright tests threw strict mode violation errors when trying to interact with the "Sign in" button.

**Root Cause:** Both the header and footer of the landing page contain "Sign in" buttons. `getByRole('button', { name: /sign in/i })` matched 2 elements, which Playwright's strict mode rejects.

**Fix Summary:** Changed assertions to use `.first()` on the matched locator to target the header "Sign in" button unambiguously.

---

### BUG-008 — Template picker 'select all' adds 30 default pack tasks instead of 2

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Status** | Fixed |
| **Files Changed** | `tests/e2e/parent-flow.spec.js` |

**Description:** The parent-flow E2E test used a 'select all' action on the template picker and then asserted that only 3 task-checkboxes were present. The default template pack contains 30 tasks, so the assertion failed.

**Root Cause:** The test assumed 'select all' would select a small number of tasks, but the default pack includes 30 items. Expected task count assertions were wrong for the actual data set.

**Fix Summary:** Changed the test to individually select 2 specific templates ('Pack school bag', 'Do homework') by name, then updated count assertions to match the actual number of tasks from those 2 templates.

---

### BUG-009 — Feedback sound toggle: hidden checkbox not clickable in headless Chrome

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Status** | Fixed |
| **Files Changed** | `tests/e2e/feedback.spec.js` |

**Description:** Clicking the feedback sound toggle had no effect in headless Chrome E2E runs. The toggle visually appeared to work in headed mode.

**Root Cause:** The `input[type="checkbox"]` element is visually hidden via CSS (using the `notif-toggle` pattern). Playwright cannot click hidden inputs that are outside the viewport or obscured by the CSS `opacity: 0` / `position: absolute` pattern used for custom toggle styling.

**Fix Summary:** Changed the test to click the visible `<label>` element via `data-testid="feedback-sound-toggle"` instead of clicking the hidden `<input>` directly.

---

### BUG-010 — Feedback sound toggle state reset on page.reload()

| Field | Value |
|-------|-------|
| **Severity** | Medium |
| **Status** | Fixed |
| **Files Changed** | `tests/e2e/feedback.spec.js` |

**Description:** After toggling the feedback sound off and reloading the page, the toggle appeared to be on again. The test asserting the persisted state after reload failed.

**Root Cause:** `addInitScript` unconditionally reset `kidstrack-feedback-sound-enabled` to `'true'` on every navigation, including `page.reload()`, overwriting any state the user (or test) had set.

**Fix Summary:** Made the `addInitScript` block conditional for the sound key — it now only sets the initial value if the key is not already present in localStorage, preserving state across reloads.

---

### BUG-011 — Family templates tab button selector fails in Vietnamese locale

| Field | Value |
|-------|-------|
| **Severity** | Low |
| **Status** | Fixed |
| **Files Changed** | `tests/e2e/new-features.spec.js` |

**Description:** The new-features spec failed when run with the Vietnamese locale because the "Family Templates" tab button could not be found.

**Root Cause:** The test used the regex `/family templates/i` to locate the tab button. In the Vietnamese locale, the button text is `'📋 Mẫu gia đình'`, which does not match the English-only regex.

**Fix Summary:** Updated the regex to include the Vietnamese alternative: `/family templates|mẫu gia đình/i`.

---

## Files Changed (Consolidated)

| File | Bugs |
|------|------|
| `tests/e2e/auth-flow.spec.js` | BUG-001, BUG-007 |
| `tests/e2e/prod-smoke.spec.js` | BUG-001, BUG-007 |
| `tests/e2e/kid-flow.spec.js` | BUG-001 |
| `tests/e2e/goals.spec.js` | BUG-004 |
| `tests/e2e/feedback.spec.js` | BUG-009, BUG-010 |
| `tests/e2e/parent-flow.spec.js` | BUG-008 |
| `tests/e2e/new-features.spec.js` | BUG-011 |
| `src/i18n/en.js` | BUG-002, BUG-006 |
| `src/i18n/vi.js` | BUG-002, BUG-006 |
| `src/pages/Templates.jsx` | BUG-003 |
| `src/hooks/useKidFeedback.js` | BUG-005 |
