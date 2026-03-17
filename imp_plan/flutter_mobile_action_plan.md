# Action Plan for Adding a Flutter Mobile App in `mobile/`

## Summary
Create a new Flutter app in `mobile/` as a sibling application to the current React web app and Firebase Functions backend. Build it in phases, keeping the existing Firebase project, Firestore schema, auth model, and callable functions unchanged so the mobile app reaches feature parity with the current product.

Recommended repo layout:

```text
TodoList/
  src/                  # existing React web app
  public/               # existing web assets
  functions/            # existing Firebase Functions
  tests/                # existing Playwright tests
  mobile/               # new Flutter app
  imp_plan/             # planning docs
```

## Actions
### 1. Create the mobile app shell
- Create a new Flutter project in `mobile/`.
- Configure Android and iOS targets in the same Flutter app.
- Add core packages:
  - `firebase_core`
  - `firebase_auth`
  - `cloud_firestore`
  - `cloud_functions`
  - `google_sign_in`
  - `flutter_riverpod`
  - `go_router`
  - `intl`
  - `shared_preferences`
- Set up FlutterFire for Android and iOS against the existing Firebase project.
- Configure callable functions to use region `asia-southeast1`.

### 2. Establish mobile project structure
- Create these top-level folders under `mobile/lib/`:
  - `app/`
  - `core/`
  - `data/models/`
  - `data/services/`
  - `features/auth/`
  - `features/parent/dashboard/`
  - `features/parent/templates/`
  - `features/parent/daily/`
  - `features/parent/ledger/`
  - `features/kid/dashboard/`
  - `features/kid/profile/`
- Add app bootstrap pieces:
  - theme
  - router
  - localization setup
  - auth/session bootstrap
- Keep widgets thin and move behavior into controllers/services.

### 3. Port backend integration first
- Recreate the current web data models in Dart:
  - `UserProfile`
  - `Kid`
  - `Template`
  - `DailyTask`
  - `DayConfig`
  - `LedgerEntry`
- Implement `auth_service` for:
  - parent Google sign-in
  - parent email sign-in/sign-up
  - family creation
  - parent email family lookup
  - kid login via synthetic email rule
  - kid password change
  - kid email linking
- Implement Firestore sync repository with real-time streams for:
  - `kids`
  - `templates`
  - `dailyTasks`
  - `dayConfigs`
  - `ledger`
- Implement callable function wrappers for all existing write operations.
- Preserve current collection paths and payload shapes exactly.

### 4. Build navigation and route protection
- Add routes:
  - `/login`
  - `/parent/dashboard`
  - `/parent/templates`
  - `/parent/daily/:kidId?`
  - `/parent/ledger/:kidId?`
  - `/kid/dashboard`
  - `/kid/profile`
- Add auth guards and role guards.
- Redirect rules:
  - unauthenticated users -> `/login`
  - parent users -> parent shell
  - kid users -> kid shell

### 5. Build screens in delivery order
- Phase 1:
  - Login
  - parent dashboard
  - daily view
  - ledger
- Phase 2:
  - templates
  - kid dashboard
  - kid profile
- Phase 3:
  - localization polish
  - animation/presentation polish
  - store-readiness polish

### 6. Implement Login
- Build parent and kid tabs.
- Parent flow:
  - Google sign-in
  - email sign-in
  - email sign-up
  - first-time family creation
- Kid flow:
  - parent email input with cached value
  - username/password login
- Match current web behavior and error handling closely.

### 7. Implement parent dashboard
- Show kid cards with avatar, display name, username, and balance.
- Add create/edit/delete kid flows.
- Add quick actions to open Daily and Ledger for a selected kid.

### 8. Implement daily task flow
- Show kid switcher and date switcher.
- Load tasks and day config for selected kid/date.
- Add/edit/delete tasks.
- Toggle task states:
  - `pending`
  - `completed`
  - `failed`
- Show progress metrics and finalized state.
- Support:
  - manual template loading for a day
  - auto-sync assigned templates for a day
  - reward/penalty configuration
  - finalize day with reward or deductions
- Keep finalize-day calculation logic aligned with the web app before calling the function.

### 9. Implement ledger flow
- Show kid-specific balance summary.
- Show earned totals and penalty totals.
- Show ledger history list.
- Add manual reward/deduction entry flow.

### 10. Implement templates flow
- Show default template packs.
- Add preview modal/page for pack contents.
- Support selective import from packs.
- Add create/edit/delete template flows.
- Add assign-to-kids flow.
- Add filter-by-kid behavior.
- Keep duplicate-prevention by title consistent with web behavior.

### 11. Implement kid dashboard
- Show hero card with balance and profile info.
- Show today’s tasks.
- Allow add/edit task.
- Allow task completion toggle.
- Show recent ledger history.
- Show 10-day progress strip.

### 12. Implement kid profile
- Allow display name change.
- Allow avatar selection.
- Allow password change.
- Allow linking a real email address.

### 13. Add localization
- Create ARB-based localization files for English and Vietnamese.
- Set default locale to Vietnamese.
- Add language toggle on login and both authenticated shells.
- Persist locale choice in `SharedPreferences`.
- Translate all user-facing text from the current feature set.

### 14. Add UI polish for mobile
- Parent shell: bottom navigation for Dashboard, Templates, Daily, Ledger.
- Kid shell: bottom navigation for Dashboard and Profile.
- Adapt list/detail layouts for phone-sized screens first.
- Recreate only meaningful UX flourishes from web, such as celebration feedback on full completion.

### 15. Validate platform setup
- Android:
  - Firebase config
  - Google sign-in config
  - debug and release signing readiness
- iOS:
  - Firebase config
  - URL schemes / Google sign-in setup
  - simulator and device validation
- Confirm callable functions and Firestore work on both platforms.

## Interfaces And Constraints
- Keep Firebase collections unchanged:
  - `families/{familyId}/kids`
  - `families/{familyId}/templates`
  - `families/{familyId}/dailyTasks`
  - `families/{familyId}/dayConfigs`
  - `families/{familyId}/ledger`
  - `userProfiles`
  - `parentEmailLookup`
- Keep existing callable function names unchanged.
- Keep kid synthetic-email auth behavior unchanged.
- Keep non-negative balance rule unchanged.
- Keep title-based duplicate prevention behavior unchanged for template import/day sync.
- Do not move or rewrite the existing web app or `functions/` as part of this mobile build.

## Test Plan
- Authentication
  - parent Google sign-in works
  - parent email sign-up/sign-in works
  - first-time family creation works
  - kid login via parent email + username/password works
- Parent flows
  - create/edit/delete kid
  - create/edit/delete template
  - import pack and assign templates
  - load/sync tasks for a day
  - update task status
  - set reward/penalty
  - finalize day
  - add manual ledger entry
- Kid flows
  - see today tasks
  - add/edit task
  - toggle completion
  - see history and balance
  - update profile
  - change password
  - link email
- Localization
  - English/Vietnamese switching works
  - locale persists across restart
- Platform
  - Android build runs
  - iOS build runs
  - Firebase sign-in and Functions calls work on both

## Assumptions And Defaults
- Source code location for Flutter app: `mobile/`
- Delivery strategy: feature parity first
- State management: Riverpod
- Routing: GoRouter
- Localization: Flutter ARB + `intl`
- Backend strategy: reuse current Firebase project and backend without schema redesign
- Out of scope for first release:
  - push notifications
  - offline-first sync conflict handling
  - tablet-specific redesign
  - backend refactor
