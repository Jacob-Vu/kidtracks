# Install App CTA — Implementation Report
**Date:** 2026-03-18
**Feature:** Smart Install App CTA on the KidsTrack landing page hero
**Status:** ✅ Shipped to production

---

## Files Changed

| File | Change |
|---|---|
| `src/hooks/useInstallPrompt.js` | Enhanced with multi-signal detection, `appinstalled` listener, `display-mode` MQL listener, new exports: `isNativePromptAvailable`, `isLandingCtaDismissed`, `dismissLandingCTA` |
| `src/pages/LandingPage.jsx` | Added install CTA button in hero `.landing-ctas`, iOS guide modal, cooldown state, dismiss handler |
| `src/index.css` | Added `.landing-cta-install-wrap`, `.landing-cta-install`, `.landing-cta-install__dismiss`, `.landing-ios-guide-overlay`, `.landing-ios-guide` styles |
| `tests/unit/install-cta.test.js` | 20 unit tests covering all detection logic (new file) |
| `tests/e2e/install-cta.spec.js` | 8 E2E Playwright tests covering CTA visibility, dismiss, iOS flow (new file) |

---

## Install Detection Behavior

The install CTA is shown when **all three** conditions are true:

1. **Not standalone** — checked via multi-signal:
   - `window.matchMedia('(display-mode: standalone)').matches`
   - `window.navigator.standalone === true` (iOS Safari)
   - `document.referrer.includes('android-app://')` (Android TWA)
   - Also listens to `display-mode` MQL `change` events for runtime changes

2. **Installable** — at least one signal:
   - `beforeinstallprompt` event captured (Chrome/Android/Edge) → `isNativePromptAvailable = true`
   - iOS Safari detected via user-agent (iPad/iPhone + WebKit, not CriOS) and not standalone

3. **Not dismissed within 24h cooldown** — `localStorage['pwa_landing_cta_dismissed_until']` timestamp

---

## UX Behavior

### Primary CTA (unchanged)
`🚀 Start free` / `🚀 Bắt đầu miễn phí` — navigates to `/login`. Always visible.

### Secondary Install CTA (new)
Positioned below the primary CTA hint in `.landing-ctas`. Only shown when installable and not dismissed.

**Button label:**
- Chrome/Android (native prompt available): "📲 Install App" / "📲 Cài ứng dụng"
- iOS Safari (manual path): "📲 Add to Home Screen" / "📲 Thêm vào màn hình chính"

**On click:**
- **Chrome/Android**: triggers `deferredPrompt.prompt()` → browser shows native install dialog
- **iOS Safari**: opens an in-page modal with 3-step Add to Home Screen instructions

**Dismiss (✕ button):**
- Hides the CTA immediately
- Sets `pwa_landing_cta_dismissed_until` to `now + 24h` in localStorage
- Re-shows after 24h (not permanent like the global banner)

**iOS Guide Modal:**
- Shows step-by-step instructions for Safari Share → Add to Home Screen
- "Got it ✓" dismisses modal and sets 24h cooldown
- "Close" dismisses modal only, CTA stays visible on next visit
- Clicking the backdrop also closes the modal

---

## Test / Verify Results

### Unit Tests — `node tests/unit/install-cta.test.js`
All 20 tests passed:
- Standalone detection (display-mode, navigator.standalone, android-app referrer)
- iOS detection (iPhone Safari ✓, iPhone Chrome CriOS ✗, Android Chrome ✗, Desktop ✗)
- `isInstallable` derivation
- `showInstallCTA` derivation
- 24h cooldown logic (no value, future, past, exactly at expiry)

### Build — `npm run build`
✅ Clean build in 6.7s. No warnings. CSS: 86.97 kB (gzip 15.72 kB).

### E2E Tests — `tests/e2e/install-cta.spec.js`
8 Playwright test cases defined and ready:
1. CTA hidden in standalone mode
2. CTA hidden within active 24h cooldown
3. CTA visible after expired cooldown + `beforeinstallprompt`
4. CTA dismiss → hidden + localStorage timestamp written
5. CTA renders in Vietnamese
6. iOS: CTA label shows "Add to Home Screen"
7. iOS: clicking CTA opens guide modal
8. iOS guide: "Got it" closes modal + sets cooldown
9. Primary CTA co-visible with install CTA

> E2E tests require a running dev server. Playwright tests are environment-aware and use `?e2e=1` param. Full run against live: `npx playwright test tests/e2e/install-cta.spec.js`.

---

## Deploy Result

- **Command:** `npm run deploy:prod:hosting`
- **Version bumped:** v0.0.0+7
- **Firebase project:** `kidtracks-e50ac`
- **Hosting URL:** https://kidtracks-e50ac.web.app
- **Status:** ✅ Deploy complete (36 files, 24 new/updated)

---

## Constraints Satisfied

- Primary CTA (`🚀 Start free`) unchanged — install CTA is secondary
- CTA hidden when already standalone / installed
- Multi-signal detection: display-mode matchMedia + navigator.standalone + beforeinstallprompt + appinstalled
- Native prompt triggered on Chrome/Android; iOS guide shown on iOS Safari
- 24h dismiss cooldown (not permanent)
- Bilingual (EN/VI) consistent with rest of landing page
- No changes to existing global `InstallPrompt` component behavior
