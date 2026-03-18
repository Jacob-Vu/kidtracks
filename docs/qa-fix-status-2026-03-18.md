# QA Fix Status — 2026-03-18

**Project:** KidsTrack
**Date:** 2026-03-18
**Run Result:** 39/39 Playwright E2E tests passed

---

## Fix Status Table

| ID | Severity | Title | Status | Changed Files | Verified By |
|----|----------|-------|--------|---------------|-------------|
| BUG-001 | Medium | Auth redirect — tests expected /login, app shows landing page | ✅ FIXED | `tests/e2e/auth-flow.spec.js`, `tests/e2e/prod-smoke.spec.js`, `tests/e2e/kid-flow.spec.js` | Playwright E2E — 39/39 passed 2026-03-18 |
| BUG-002 | Low | Missing i18n keys for social proof metrics | ✅ FIXED | `src/i18n/en.js`, `src/i18n/vi.js` | Playwright E2E — 39/39 passed 2026-03-18 |
| BUG-003 | Medium | New template invisible after creation | ✅ FIXED | `src/pages/Templates.jsx` | Playwright E2E — 39/39 passed 2026-03-18 |
| BUG-004 | High | Goal state wiped on page.reload() in E2E tests | ✅ FIXED | `tests/e2e/goals.spec.js` | Playwright E2E — 39/39 passed 2026-03-18 |
| BUG-005 | Medium | Audio debug event inside try-catch prevents test detection | ✅ FIXED | `src/hooks/useKidFeedback.js` | Playwright E2E — 39/39 passed 2026-03-18 |
| BUG-006 | Medium | Missing badge i18n keys and wrong weekly report copy | ✅ FIXED | `src/i18n/en.js`, `src/i18n/vi.js` | Playwright E2E — 39/39 passed 2026-03-18 |
| BUG-007 | Medium | Strict mode violations: multiple 'Sign in' buttons on landing page | ✅ FIXED | `tests/e2e/auth-flow.spec.js`, `tests/e2e/prod-smoke.spec.js` | Playwright E2E — 39/39 passed 2026-03-18 |
| BUG-008 | Medium | Template picker 'select all' adds 30 default pack tasks instead of 2 | ✅ FIXED | `tests/e2e/parent-flow.spec.js` | Playwright E2E — 39/39 passed 2026-03-18 |
| BUG-009 | Low | Feedback sound toggle: hidden checkbox not clickable in headless Chrome | ✅ FIXED | `tests/e2e/feedback.spec.js` | Playwright E2E — 39/39 passed 2026-03-18 |
| BUG-010 | Medium | Feedback sound toggle state reset on page.reload() | ✅ FIXED | `tests/e2e/feedback.spec.js` | Playwright E2E — 39/39 passed 2026-03-18 |
| BUG-011 | Low | Family templates tab button selector fails in Vietnamese locale | ✅ FIXED | `tests/e2e/new-features.spec.js` | Playwright E2E — 39/39 passed 2026-03-18 |

---

## Severity Breakdown

| Severity | Count | All Fixed? |
|----------|-------|------------|
| High | 1 | Yes |
| Medium | 7 | Yes |
| Low | 3 | Yes |
| **Total** | **11** | **Yes** |

---

## Verification

All fixes were verified by running the full Playwright E2E suite on 2026-03-18.

- **Total tests:** 39
- **Passed:** 39
- **Failed:** 0
- **Skipped:** 0
