# Install App CTA — Activity Log
**Date:** 2026-03-18

---

## Log Entries

### 15:47 — Implementation started
- Explored project structure: found existing `useInstallPrompt.js` hook and `InstallPrompt.jsx` component
- Key files identified: `src/hooks/useInstallPrompt.js`, `src/pages/LandingPage.jsx`, `src/index.css`

### 15:47 — `useInstallPrompt.js` enhanced
- Added `display-mode` MQL `change` listener to detect install mid-session
- Added `appinstalled` event listener to clear deferred prompt and mark standalone
- Added `isNativePromptAvailable` export (true only when `beforeinstallprompt` captured)
- Added `isLandingCtaDismissed` computed property (24h cooldown, key: `pwa_landing_cta_dismissed_until`)
- Added `dismissLandingCTA()` export
- Existing global banner behavior (`pwa_prompt_dismissed`) unchanged

### 15:48 — `LandingPage.jsx` updated
- Imported `useInstallPrompt` hook
- Added state: `showIOSGuide`, `ctaDismissed` (initialized from cooldown)
- Added computed `showInstallCTA = !isStandalone && isInstallable && !ctaDismissed`
- Added secondary CTA button (`data-testid="landing-install-cta"`) in `.landing-ctas`
- Added separate dismiss (✕) button with 24h cooldown
- Added iOS guide modal (`data-testid="ios-install-guide"`) at bottom of landing div
- Clicking backdrop on iOS modal closes it

### 15:48 — `index.css` updated
- Added `.landing-cta-install-wrap`, `.landing-cta-install`, `.landing-cta-install__dismiss`
- Added `.landing-ios-guide-overlay` (fixed overlay, bottom-sheet on mobile)
- Added `.landing-ios-guide`, `.landing-ios-guide__title`, `.landing-ios-guide__steps`, `.landing-ios-guide__actions`
- Responsive: centered on screens ≥480px

### 15:48 — Unit tests written
- `tests/unit/install-cta.test.js` — 20 tests (pure logic, no DOM)
- Coverage: standalone detection, iOS detection, isInstallable, showInstallCTA, cooldown

### 15:48 — Unit tests run
- Result: **20/20 passed** ✅

### 15:48 — E2E tests written
- `tests/e2e/install-cta.spec.js` — 8 Playwright tests
- Coverage: standalone hide, cooldown hide, expired cooldown show, dismiss, Vietnamese, iOS label, iOS guide open/close

### 15:48 — Build run
- `npm run build` → ✅ success in 6.70s
- CSS bundle: 86.97 kB (gzip 15.72 kB)
- LandingPage chunk: 17.67 kB (gzip 5.88 kB)
- No errors or warnings

### 15:48 — Production deploy
- `npm run deploy:prod:hosting`
- Version bumped to v0.0.0+7 (2026-03-18T15:48:16.689Z)
- Firebase project: `kidtracks-e50ac`
- 36 files deployed, 24 new/updated
- Result: ✅ Deploy complete
- Live URL: https://kidtracks-e50ac.web.app

---

## Summary

| Item | Result |
|---|---|
| Files changed | 5 (3 modified, 2 new) |
| Unit tests | 20/20 passed |
| Build | ✅ clean |
| E2E tests written | 8 tests (require dev server) |
| Deploy | ✅ production |
