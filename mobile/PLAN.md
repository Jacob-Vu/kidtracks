# Flutter Mobile Implementation Blueprint for KidTracks

## Summary
Build a new Flutter app for Android and iOS as a feature-parity mobile client for the existing web app, reusing the current Firebase project, Firestore data model, Auth flows, and Cloud Functions. Save this plan as `imp_plan/flutter_mobile_implementation_plan.md`.

The mobile app should preserve the current product model:
- Parent and kid roles with separate navigation and screens
- Firebase Auth for parent and kid login
- Firestore real-time sync for `kids`, `templates`, `dailyTasks`, `dayConfigs`, and `ledger`
- Firebase Callable Functions for all writes already handled in the web app backend
- English and Vietnamese localization from day one

## Implementation Changes
### App architecture
- Create a standalone Flutter app, not a web-to-mobile wrapper.
- Use:
  - `firebase_core`, `firebase_auth`, `cloud_firestore`, `cloud_functions`
  - `google_sign_in`
  - `flutter_riverpod` for app state
  - `go_router` for routing and role-based redirects
  - `intl` for localization
  - `shared_preferences` for small local preferences
- Keep all business logic in Flutter services/controllers, not directly in widgets.
- Mirror the web app’s domain shape with models for `UserProfile`, `Kid`, `Template`, `DailyTask`, `DayConfig`, and `LedgerEntry`.
- Use repository/service layers:
  - `auth_service` for login, family setup, kid auth, password/email updates
  - `sync_repository` for Firestore stream subscriptions
  - `actions_repository` for all callable function writes
- Keep write behavior aligned with web:
  - `addKid`, `updateKid`, `deleteKid`
  - `addTemplate`, `updateTemplate`, `deleteTemplate`, `importDefaultPack`, `assignTemplateToKids`
  - `addDailyTask`, `updateDailyTask`, `deleteDailyTask`, `loadTemplatesForDay`, `syncAssignedTemplatesForDay`
  - `setDayConfig`, `finalizeDay`, `addManualTransaction`

### Public interfaces and mobile structure
- App folder structure:
  - `lib/app/` for app shell, theme, router
  - `lib/core/` for constants, utilities, localization, formatting
  - `lib/features/auth/`
  - `lib/features/parent/dashboard/`
  - `lib/features/parent/templates/`
  - `lib/features/parent/daily/`
  - `lib/features/parent/ledger/`
  - `lib/features/kid/dashboard/`
  - `lib/features/kid/profile/`
  - `lib/data/models/`
  - `lib/data/services/`
- Route map:
  - `/login`
  - `/parent/dashboard`
  - `/parent/templates`
  - `/parent/daily/:kidId?`
  - `/parent/ledger/:kidId?`
  - `/kid/dashboard`
  - `/kid/profile`
- Navigation:
  - Parent: bottom navigation with Dashboard, Templates, Daily, Ledger
  - Kid: bottom navigation with Dashboard and Profile
- Keep role gating identical to web:
  - parent users cannot open kid routes
  - kid users cannot open parent routes
  - unauthenticated users always land on login
- Localization interface:
  - all user-facing strings moved into ARB files
  - default locale `vi`
  - language toggle available on login and authenticated shells
  - store selected locale in `SharedPreferences`

### Screen and behavior parity
- Login:
  - Parent tab: Google sign-in, email sign-in, email sign-up, first-time family creation
  - Kid tab: parent email lookup, username/password login, cached parent email preference
- Parent dashboard:
  - list kids with avatar, name, username, balance
  - create/edit/delete kid account
  - quick actions to open Daily and Ledger per kid
- Templates:
  - list default packs with preview and selective import
  - create/edit/delete family templates
  - assign templates to all kids or selected kids
  - filter templates by kid
- Daily:
  - switch kid, switch date, jump to today
  - auto-sync assigned templates for the selected day
  - add/edit/delete tasks
  - toggle `pending/completed/failed`
  - show counts, progress, reward banner, finalized state
  - set day reward/penalty and finalize day
- Ledger:
  - kid-specific ledger view
  - show balance, total earned, total penalties
  - add manual reward or deduction
- Kid dashboard:
  - today’s task list
  - add/edit task
  - completion progress
  - recent ledger history
  - 10-day activity strip
- Kid profile:
  - edit display name and avatar
  - change password
  - link real email

### Firebase and backend alignment
- Reuse the existing Firebase project configuration for Android and iOS with FlutterFire.
- Keep Firestore collection paths exactly unchanged:
  - `families/{familyId}/kids`
  - `families/{familyId}/templates`
  - `families/{familyId}/dailyTasks`
  - `families/{familyId}/dayConfigs`
  - `families/{familyId}/ledger`
  - `userProfiles`
  - `parentEmailLookup`
- Keep kid synthetic email behavior unchanged using the same rule as web.
- Keep finalize-day computation client-driven for parity with current web behavior, then submit the resulting payload through callable functions.
- Preserve non-negative kid balance behavior.
- Preserve duplicate-prevention behavior when importing or syncing templates by title for a day.

## Test Plan
- Authentication
  - parent Google sign-in
  - parent email sign-up, sign-in, and first-time family creation
  - kid login via parent email lookup + username/password
  - role-based redirect and route protection
- Parent flows
  - create, update, and delete kid
  - create, assign, import, edit, filter, and delete templates
  - load templates into a day and auto-sync assigned templates
  - add/edit/delete task and toggle task status
  - set reward/penalty and finalize day
  - add manual ledger transaction
- Kid flows
  - view today tasks, edit/add task, mark complete
  - view recent ledger history and 10-day strip
  - update profile, change password, link email
- Localization
  - switch between Vietnamese and English on login and authenticated shells
  - locale persists across app relaunch
- Platform validation
  - Android and iOS Firebase initialization
  - Google sign-in works on both platforms
  - callable functions reach `asia-southeast1`
  - Firestore streams update UI in real time
- Acceptance checks
  - every core feature from the web list is reachable on mobile
  - no mobile screen requires a web-only fallback
  - parent and kid can use the app independently end-to-end

## Assumptions And Defaults
- Strategy chosen: feature-parity first, with no v1-only mobile feature expansion such as push notifications or offline-first conflict resolution.
- Plan output chosen: implementation blueprint, intended as a build-ready Markdown file.
- State management default: Riverpod.
- Routing default: GoRouter.
- Backend default: reuse existing Firebase Auth, Firestore, and Functions exactly; do not redesign schema in v1.
- UI direction: native Flutter UI that matches the current product structure, not pixel-perfect web cloning.
- Out of scope for v1:
  - push notifications
  - deep analytics/monitoring
  - tablet-specific layouts beyond responsive adaptation
  - replacing current callable functions or Firestore schema
