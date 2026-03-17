# Repo Memory (Non-Mobile Scope)

Last updated: 2026-03-17
Ignores `/mobile` (Flutter) per standing request.

---

## Top-Level Structure

```
src/              main web app source
public/           static/PWA assets
functions/        Firebase Cloud Functions
tests/e2e/        Playwright E2E tests
dist/             build output (gitignored)
imp_plan/         planning docs & decisions
```

Root config: `package.json`, `vite.config.js`, `playwright.config.js`, `firebase.json`, `.firebaserc`, `eslint.config.js`

---

## Tech Stack

- React 19 + Vite + React Router 7
- Zustand (client state)
- Firebase Auth + Firestore + Cloud Functions (asia-southeast1)
- Firebase Analytics GA4 (`measurementId` in `.env.local`)
- PWA via `vite-plugin-pwa`
- Playwright E2E (13 tests, all passing)

---

## Key Source Files

| File | Purpose |
|---|---|
| `src/main.jsx` | App bootstrap |
| `src/App.jsx` | Route shell, ParentLayout, KidLayout wiring |
| `src/contexts/AuthContext.jsx` | Auth session + profile loading |
| `src/store/useStore.js` | Zustand state + business logic builders |
| `src/hooks/useFirebaseSync.js` | Firestore realtime sync + all callable actions |
| `src/hooks/useVoiceRecorder.js` | MediaRecorder + SpeechRecognition (audio+transcript) |
| `src/hooks/useVoiceInput.js` | SpeechRecognition only (transcript for form fields) |
| `src/hooks/useAnalytics.js` | Firebase Analytics event helpers + usePageTracking |
| `src/firebase/config.js` | Firebase init (app, db, auth, analytics) |
| `src/firebase/auth.js` | Auth helpers (social, email, kid, synthetic quick-start) |
| `src/firebase/db.js` | Firestore helpers |
| `src/data/defaultTemplates.js` | 6 default task packs (EN+VI descriptions) |
| `src/i18n/en.js` + `vi.js` | All UI strings |
| `src/index.css` | Global design system CSS |
| `functions/index.js` | All backend callable functions |
| `src/testing/e2e.js` | E2E mock state |

---

## Key Components

| Component | Purpose |
|---|---|
| `src/components/MobileHeader.jsx` | Sticky mobile header (lang toggle, avatar, logout) |
| `src/components/CelebrationOverlay.jsx` | Full-screen confetti when all tasks done |
| `src/components/DayJournal.jsx` | Daily voice journal (record, transcribe, play, history) |
| `src/components/VoiceMicButton.jsx` | Reusable mic button for form field voice input |
| `src/components/Modal.jsx` | Accessible modal dialog |
| `src/components/InstallPrompt.jsx` | PWA install prompt |
| `src/layouts/KidLayout.jsx` | Kid route wrapper with bottom nav |

---

## Key Pages

| Page | Route | Notes |
|---|---|---|
| `Login.jsx` | `/login` | Social + email + quick-start + kid login |
| `Dashboard.jsx` | `/` | Parent: kids overview, balances, account linking |
| `DailyView.jsx` | `/daily/:kidId` | Task list, finalize day, reward/penalty config, journal |
| `Templates.jsx` | `/templates` | Template management + default pack import |
| `Ledger.jsx` | `/ledger/:kidId` | Transaction history |
| `KidDashboard.jsx` | `/kid` | Kid view: tasks, 10-day strip, ledger, journal |
| `KidProfile.jsx` | `/kid/profile` | Kid profile + password change |

---

## Firestore Schema (under `families/{familyId}/`)

| Collection | Key fields |
|---|---|
| `kids/{kidId}` | `name`, `displayName`, `avatar`, `balance`, `routine: {tasks, savedAt, savedFromDate}` |
| `templates/{id}` | `title`, `descriptions.en`, `descriptions.vi`, `assignedKidIds` |
| `dailyTasks/{id}` | `kidId`, `date`, `title`, `description`, `status` (pending/completed/failed) |
| `dayConfigs/{kidId_date}` | `rewardAmount`, `penaltyAmount`, `isFinalized` |
| `ledger/{id}` | `kidId`, `date`, `amount`, `label` |
| `dayJournal/{kidId_date_role}` | `text`, `audioBase64`, `audioDuration`, `createdAt`, `updatedAt` |

Global: `userProfiles/{uid}`, `simpleParentAccounts/{username}`, `parentEmailLookup/{email}`

---

## Cloud Functions (`functions/index.js`)

| Function | Purpose |
|---|---|
| `signInParentSimple` | Username-only quick-start (custom token) |
| `addKid / updateKid / deleteKid` | Kid CRUD |
| `addTemplate / updateTemplate / deleteTemplate` | Template CRUD |
| `importDefaultPack / assignTemplateToKids` | Pack import, kid assignment |
| `addDailyTask / updateDailyTask / deleteDailyTask` | Task CRUD |
| `loadTemplatesForDay / syncAssignedTemplatesForDay` | Bulk task creation from templates |
| `clearDayTasks` | Batch delete all tasks for kidId+date |
| `setDayConfig / finalizeDay` | Day config + finalize with reward/penalty |
| `addManualTransaction` | Manual ledger entry |

---

## Auth Architecture

- Parent: Google / Apple / Facebook social login
- Parent: email+password + forgot password
- Parent: Quick-start (username only → synthetic email `{username}@parent.kidstrack`)
- `profile.simpleLogin: true` flags quick-start accounts
- Kid: `{username}@{familyId}.kidstrack` via `signInKid()`
- `upgradeSimpleParentEmail()`: swap synthetic → real email+password

---

## Analytics Events (Firebase GA4)

| Event | When |
|---|---|
| `page_view` | Every route change (auto via `usePageTracking`) |
| `login` / `sign_up` | Login success, method: google/apple/facebook/email/quick_start/kid |
| `family_created` | Family name set on first login |
| `task_completed` | Kid checks off a task |
| `all_tasks_done` + `celebration_shown` | All tasks completed in a day |
| `journal_saved` / `voice_recording_used` | Journal saved with/without audio |
| `template_imported` | Template pack imported |
| `voice_task_input` | Voice used to fill task title/description |

---

## Default Routine Feature

- Routine stored in `kids/{kidId}.routine` — no new collection
- ⭐ "Lưu lịch cố định" button saves current task list as routine
- Auto-loads on empty today (once per kid+date, `useRef` guard)
- Banner: "✨ Đã tải lịch cố định (N việc)" + [Hoàn tác]
- Undo = `clearDayTasks` (batch delete today's tasks)
- Available in both DailyView (parent) and KidDashboard (kid)

---

## Deploy Commands

```bash
npm run deploy:prod            # full build + hosting + functions
npm run deploy:prod:hosting    # hosting only
npm run deploy:prod:functions  # functions only
```

Proxy issue: clear `HTTP_PROXY`, `HTTPS_PROXY`, `ALL_PROXY` if CLI times out.

---

## Git — Current State (master)

```
25f9514  feat(routine): add default daily routine with auto-load
ea6c794  feat(task): add voice input to task creation modal
26e0cb2  feat(analytics): integrate Firebase Analytics GA4 tracking
af4e90b  fix(templates): propagate Vietnamese descriptions through import pipeline
cc5d64b  feat(journal): add daily voice journal with audio recording + transcription
220c7b0  fix(mobile): add language switcher and user profile to mobile header
37141a2  feat(kid): add celebration overlay when all daily tasks are completed
```

All committed and deployed to production. `git status` should be clean.
E2E: 13 tests passing.

---

## CEO Product Priorities (remaining)

1. **Goal Jar** — savings goal + parent approval (monetization anchor)
2. **Family Insights** — completion trends card on parent dashboard
3. **Push/email reminders** — daily active use nudge
4. **Co-parent invite** — word-of-mouth growth
5. **Monetization** — freemium 49k VND/month

Detailed review: `imp_plan/CEO_PRODUCT_REVIEW.md`

---

## Planned / In-Progress

| Plan file | Feature | Status |
|---|---|---|
| `DAILY_TASK_UX_IMPROVEMENT_PLAN.md` | Template picker popup, copy-from-yesterday, history view | Planned |
| `VOICE_TASK_CREATION_PLAN.md` | Voice input for task creation | ✅ Done |
| `CEO_PRODUCT_REVIEW.md` | Full product review + roadmap | Reference |
| `FIREBASE_PROD_DEPLOY.md` | Deploy playbook | Reference |
