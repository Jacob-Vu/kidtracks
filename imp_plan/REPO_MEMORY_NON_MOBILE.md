# Repo Memory (Non-Mobile Scope)

Last updated: 2026-03-17

This note intentionally ignores `/mobile` per request.

## Top-Level Structure
- `src/`: main web app source
- `public/`: static/PWA assets
- `functions/`: Firebase Cloud Functions backend
- `tests/e2e/`: Playwright end-to-end tests
- `dist/`: frontend build output
- `imp_plan/`: planning and internal notes
- Root config: `package.json`, `vite.config.js`, `playwright.config.js`, `firebase.json`, `eslint.config.js`

## Tech Stack
- React 19 + Vite + React Router 7
- Zustand for client state
- Firebase Auth + Firestore + Cloud Functions
- PWA via `vite-plugin-pwa`
- Playwright for E2E

## Useful Commands
- Frontend:
  - `npm run dev`
  - `npm run build`
  - `npm run lint`
  - `npm run preview`
  - `npm run test:e2e`
  - `npm run test:e2e:ui`
- Functions (`functions/package.json`):
  - `npm run serve`
  - `npm run deploy`
  - `npm run logs`

## Key Entry Points
- `src/main.jsx`: app bootstrap
- `src/App.jsx`: route shell (parent/kid split)
- `src/contexts/AuthContext.jsx`: auth/session/profile loading
- `src/components/ProtectedRoute.jsx`: route guard
- `src/store/useStore.js`: core app state/business logic
- `src/hooks/useFirebaseSync.js`: Firestore sync + callable actions
- `src/firebase/config.js`: Firebase initialization/env usage
- `src/firebase/auth.js`: auth helpers (including family/kid flows)
- `src/firebase/db.js`: Firestore helpers
- `functions/index.js`: backend callable functions
- `src/testing/e2e.js`: E2E mode and local mock state behavior

## Current Gaps / Risks
- `README.md` appears to be default template and does not document real setup/architecture.
- Required `.env` keys are implicit in Firebase config and not documented clearly.
- Firebase rules/indexes are not obvious in root-level project docs.
- Playwright’s mocked E2E mode workflow is not documented.
- Some text appears to have encoding/mojibake issues.

## Reuse Plan
For future tasks, treat this file as the first-pass map before re-exploring the repo.

## UX Hardening Progress (2026-03-17)
- Completed first-pass UX quality fixes:
  - i18n fallback support in translator (`t(key, fallback)` and params handling).
  - Added missing i18n keys for `common.back`, ledger labels, and `daily.addToPocket`.
  - Replaced native browser `alert/confirm` usage in major parent flows with in-app modal/toast patterns.
  - Upgraded modal accessibility (`role="dialog"`, `aria-modal`, keyboard escape, focus trap, focus restore).
  - Added visible keyboard focus ring styles for key controls.
  - Improved keyboard accessibility for dashboard kid cards (`role`, `tabIndex`, Enter/Space activate).
  - Fixed mojibake avatar/message issues in `KidProfile`.
- Build status after changes: `npm run build` passes.
- Remaining UI quality opportunities:
  - Expand icon-button `aria-label` coverage in all pages.
  - Add reduced-motion handling and motion preference support.
  - Add Playwright UX checks for keyboard navigation and modal focus behavior.

## UI Polish Progress (2026-03-17)
- Saved execution plan: `imp_plan/UI_POLISH_EXECUTION_PLAN.md`.
- Implemented Phase 1 baseline polish:
  - Added typography/spacing tokens in `src/index.css`.
  - Reduced excessive glow intensity and button shadow harshness.
  - Improved typography consistency for key UI primitives.
  - Added reusable section header classes: `.section-title`, `.section-note`.
  - Improved mobile bottom-nav readability and active-state treatment.
  - Added `prefers-reduced-motion` support.
  - Applied new section classes in `Templates` and `KidDashboard`.
- Verification: `npm run build` passes after changes.

## Auth + Template Upgrade Progress (2026-03-17)
- Implemented parent social auth expansion:
  - Added parent sign-in via Apple and Facebook in login flow.
- Implemented parent simple first-time login:
  - Added username-only "quick start" flow backed by a new callable Cloud Function `signInParentSimple` (custom token).
  - Added login guard updates so parent without `familyId` stays in setup flow.
- Implemented parent account linking prompt after creating kids:
  - Dashboard shows a nudge banner when parent account is not linked.
  - Added linking actions for Google, Apple, Facebook, and Email+Password.
  - Linking updates `userProfiles` and `parentEmailLookup` (once email is available).
- Implemented bilingual template descriptions:
  - Template model now supports `descriptions.en` and `descriptions.vi`.
  - Templates page supports editing both EN/VI descriptions.
  - Daily task generation now resolves description based on current app language.
  - Default pack imports now persist both language description fields (initially mirrored from source text).
- Validation:
  - `npm run build` passes.
  - `node -c functions/index.js` passes.

## Production Deploy Memory (2026-03-17)
- Added Firebase hosting target mapping:
  - `.firebaserc`: target `production` -> site `kidtracks-e50ac`.
  - `firebase.json`: Hosting now uses `"target": "production"`.
- Added root deploy scripts:
  - `npm run deploy:prod`
  - `npm run deploy:prod:hosting`
  - `npm run deploy:prod:functions`
- Added deploy playbook:
  - `imp_plan/FIREBASE_PROD_DEPLOY.md`
- Known environment caveat:
  - If CLI times out, clear proxy vars (`HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY`) for the deploy session.
