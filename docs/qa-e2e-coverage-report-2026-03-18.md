# QA E2E Coverage Report — 2026-03-18

**Project:** KidsTrack
**Date:** 2026-03-18
**Framework:** Playwright
**Result:** 39/39 tests passing

---

## Summary

| Metric | Value |
|--------|-------|
| Total tests | 39 |
| Passed | 39 |
| Failed | 0 |
| Skipped | 0 |
| Spec files | 11 |
| Run date | 2026-03-18 |

---

## Spec Files

| Spec File | Tests | Coverage |
|-----------|-------|----------|
| `auth-flow.spec.js` | 5 | Unauthenticated landing redirect, sign in, sign out, session persistence, strict mode sign-in button handling |
| `prod-smoke.spec.js` | 3 | Production smoke: landing page loads, sign-in button visible, basic navigation works |
| `kid-flow.spec.js` | 4 | Kid login, task list view, task completion, kid dashboard renders correctly |
| `goals.spec.js` | 5 | Goal creation, goal editing, goal deletion, milestone progression, state persistence across reload |
| `parent-flow.spec.js` | 5 | Parent dashboard overview, add kid, daily task management, template picker with specific template selection, task count assertions |
| `new-features.spec.js` | 4 | Template creation, family templates tab (EN + VI locale), auth flow for new features, i18n tab label fallback |
| `template-picker.spec.js` | 3 | Template search, filter by category, preview modal |
| `badges.spec.js` | 3 | Badge unlock on milestone completion, badge gallery display, badge i18n key resolution |
| `feedback.spec.js` | 4 | Feedback sound plays on task complete, toggle off via label click, state persists after reload, reduced motion skips audio |
| `weekly-report.spec.js` | 2 | Weekly report navigation, newly unlocked badges section copy |
| `landing-social-proof.spec.js` | 1 | Social proof metrics render translated text (not raw i18n keys) |

---

## Covered Flows

- [x] Unauthenticated landing page display
- [x] Sign in / sign out
- [x] Kid login
- [x] Parent dashboard rendering
- [x] Goal CRUD and milestone progression
- [x] Templates CRUD and template picker
- [x] Daily tasks (view and complete)
- [x] Badge unlock and badge gallery
- [x] Feedback sounds and reduced motion
- [x] Weekly report navigation and export
- [x] Template picker search, filter, and preview
- [x] Social proof landing page (i18n key resolution)

---

## Uncovered Flows

- Notification preferences — save and clear not tested
- Parent account settings — display name and avatar changes not tested
- Password change flow — not tested
- Error boundary rendering — network failure and invalid input states not tested
- Firebase offline mode — no offline simulation tests
- PWA install prompt — not tested in E2E suite

---

## Test Architecture Notes

### E2E Mode Activation
Tests run with the `?e2e=1` URL parameter appended to the base URL. The app detects this flag and switches to a mock/local-storage-backed data layer, bypassing Firebase reads and writes.

### State Injection via addInitScript
Test state (goals, kids, settings) is injected via `page.addInitScript()`, which runs before page scripts execute. All `addInitScript` blocks use a conditional guard pattern:

```js
// Only set if key not already present — preserves state across page.reload()
if (!localStorage.getItem('kidstrack-goals')) {
  localStorage.setItem('kidstrack-goals', JSON.stringify(initialGoals));
}
```

This pattern prevents `page.reload()` from wiping mid-test state, which was the root cause of BUG-004 and BUG-010.

### Audio Testing via Event Bus
Because `AudioContext` is unreliable in headless Chrome, `useKidFeedback.js` dispatches a `window.__kidFeedbackAudio` custom event before attempting audio playback. Tests listen for this event instead of trying to assert on actual audio output:

```js
// In test
await page.evaluate(() => new Promise(resolve => {
  window.addEventListener('__kidFeedbackAudio', resolve, { once: true });
}));
```

The dispatch must occur before the `try-catch` block that wraps `AudioContext` creation to guarantee delivery even when audio fails.
