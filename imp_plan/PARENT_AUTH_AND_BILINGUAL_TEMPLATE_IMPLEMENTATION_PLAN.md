# Parent Auth + Bilingual Template Implementation Plan

Last updated: 2026-03-17
Scope: Web app (non-mobile)

## Objectives
- Parent can sign in with Google, Apple, Facebook.
- Parent can try product first-time with simple username (no password).
- Templates support bilingual descriptions and render by selected language.
- Parent without linked account/email gets nudge after creating kids.

## Implemented (Code Complete)
1. Parent authentication
- Added social sign-in handlers: Google, Apple, Facebook.
- Added simple-login flow for parent using callable function + Firebase custom token.
- Added onboarding-safe redirect behavior for parent without `familyId`.

2. Backend support
- Added callable function `signInParentSimple` in `functions/index.js`.
- Function provisions/reuses simple parent identity and returns custom token.

3. Parent account linking
- Added link actions for Google, Apple, Facebook, and Email+Password.
- Dashboard now shows a recovery/link nudge when parent has kids but no linked provider/email.
- Linking updates `userProfiles` and `parentEmailLookup` when email is available.

4. Bilingual templates
- Template model now supports:
  - `descriptions.en`
  - `descriptions.vi`
- Templates UI supports add/edit both language descriptions.
- Daily task generation resolves description by current language.
- Default pack import writes bilingual description fields (initially mirrored).

## Files Updated
- `functions/index.js`
- `src/firebase/auth.js`
- `src/pages/Login.jsx`
- `src/pages/Dashboard.jsx`
- `src/pages/Templates.jsx`
- `src/hooks/useFirebaseSync.js`
- `src/store/useStore.js`
- `src/i18n/en.js`
- `src/i18n/vi.js`

## Validation
- Frontend build: `npm run build` (pass)
- Cloud Functions syntax: `node -c functions/index.js` (pass)

## Deployment Checklist (Next Session)
1. Firebase Console Auth Providers:
- Enable `Google`
- Enable `Apple` (configure Service ID, key, redirect URI)
- Enable `Facebook` (configure App ID/secret, redirect URI)
- Ensure `Email/Password` is enabled

2. Functions deploy:
- Deploy updated callable functions (`signInParentSimple` included)

3. Smoke tests:
- Parent sign-in with Google/Apple/Facebook
- Parent simple-login first run (new username) -> family setup -> dashboard
- Parent simple-login returning user (existing username)
- Link account flow from dashboard nudge
- Template create/edit with EN/VI description and language-switch display

## Known Follow-up
- Improve deduplication logic for imported templates across bilingual title variants if needed.
- Add automated e2e coverage for new auth/linking flows.
