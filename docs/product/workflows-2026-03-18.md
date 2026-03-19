# KidsTrack — User Workflows
_Generated: 2026-03-18 | Version based on codebase snapshot_

---

## Overview

This document describes the major user journeys in KidsTrack, step-by-step. Flows are grouped by persona (Parent, Child, Visitor) and ordered from first-contact to advanced usage.

---

## WF-01: Parent Onboarding (New Family Setup)

**Persona:** New parent
**Entry point:** `/` (Landing Page) → `/login`
**Goal:** Go from zero to first task assigned

```
1. Visit landing page → Review features, social proof
2. Click "Get Started" / "Sign In"
3. Choose auth method:
   a. Social login (Google / Apple / Facebook) → auto-create account
   b. Email + Password → signup form
   c. Quick-start username → minimal-friction entry (no email needed)
4. If new account → OnboardingWizard launches:
   a. Create family name
   b. Add first child (name, avatar)
   c. Choose a template pack (Little Star / School Star / Home Helper, etc.)
   d. Templates assigned to child
5. Redirect to Dashboard → Family is live
6. [Optional] Account linking prompt: upgrade quick-start to email/social
```

**Key files:** `LandingPage.jsx`, `Login.jsx`, `OnboardingWizard.jsx`

---

## WF-02: Kid Account Setup

**Persona:** Child (guided by parent)
**Entry point:** `/login` → Kid mode
**Goal:** Give child their own login credentials

```
1. Parent provides their email address to child (family lookup key)
2. Child opens app → Switches to "Kid" mode on login page
3. Enters parent's email (family lookup) + creates username + password
4. Account created; kid is linked to family
5. Kid customizes profile: chooses emoji avatar (24 options), display name
6. Kid can now log in independently at /login
```

**Key files:** `Login.jsx`, `KidProfile.jsx`

---

## WF-03: Daily Task Setup (Parent)

**Persona:** Parent
**Entry point:** `/daily` or `/daily/:kidId`
**Goal:** Assign today's tasks to a child with reward amounts

```
1. Parent opens Daily View → Selects a child (if multiple)
2. If routine is saved → "Auto-load" prompt appears (with undo option)
3. To add tasks manually:
   a. Click "Add Task"
   b. Type title + optional description
   c. OR click mic → Speak task aloud → Text auto-inserted
4. To add from templates:
   a. Click "Pick Templates"
   b. Select one or more templates from list (TemplatePickerPage)
   c. Selected templates added to today's list
5. Set reward amount for the day (presets: 10k / 20k / 50k VND; or custom)
6. Set penalty amount for incomplete/failed tasks
7. Tasks are live and visible to the child immediately
```

**Key files:** `DailyView.jsx`, `TemplatePickerPage.jsx`, `useVoiceRecorder.js`

---

## WF-04: Kid Daily Routine (Child)

**Persona:** Child
**Entry point:** `/kid` (KidDashboard)
**Goal:** Complete today's tasks and see reward feedback

```
1. Kid logs in → KidDashboard shows today's task list
2. Kid works through tasks (chores, homework, reading, etc.)
3. Kid marks each task as done → Celebration animation on last task (confetti)
4. [Optional] Kid adds a journal note/voice reflection
5. Parent finalizes the day (in DailyView):
   a. Reviews completions
   b. Marks any incomplete tasks as "failed"
   c. Clicks "Finalize Day"
   d. Ledger auto-updated (credits + debits applied)
6. Kid sees updated balance on dashboard
7. Streak counter increments if 100% completed
```

**Key files:** `KidDashboard.jsx`, `DailyView.jsx`, `DayJournal.jsx`, `CelebrationOverlay.jsx`

---

## WF-05: Template Creation & Management

**Persona:** Parent
**Entry point:** `/templates`
**Goal:** Build a reusable library of tasks

```
1. Parent opens Templates page
2. To create custom template:
   a. Click "New Template"
   b. Enter title (bilingual: EN + VI optional)
   c. Enter description (bilingual)
   d. Assign to specific kids (or all)
   e. Save
3. To import a default pack:
   a. Click "Import Pack"
   b. Choose from: Little Star, School Star, Home Helper, etc.
   c. Templates added to library
4. Templates are available in TemplatePickerPage during daily setup
5. Edit or delete templates at any time
```

**Key files:** `Templates.jsx` (assumed), `TemplatePickerPage.jsx`

---

## WF-06: Goal Creation & Savings Tracking

**Persona:** Parent (creates goal); Child (tracks progress)
**Entry point:** Dashboard GoalCard → GoalModal
**Goal:** Set a savings target and track progress

```
1. Parent clicks "Add Goal" for a child
2. GoalModal opens:
   a. Enter goal title (e.g., "New LEGO Set")
   b. Choose icon (emoji)
   c. Set target amount
   d. Set optional due date
   e. Add milestones (e.g., 25%, 50%, 75%)
   f. Save
3. Goal card appears on Dashboard and KidDashboard
4. As child earns money → balance tracked against goal automatically
5. When balance crosses milestone → GoalMilestoneSync auto-unlocks milestone
6. Kid sees progress bar and milestone markers
7. On goal completion → Goal archived; celebration shown
```

**Key files:** `GoalModal.jsx`, `GoalCard.jsx`, `GoalMilestoneSync.jsx`

---

## WF-07: Audio/Voice Input for Tasks

**Persona:** Parent or Child
**Entry point:** Any form with VoiceMicButton (DailyView, DayJournal, FeedbackPage)
**Goal:** Input text by speaking instead of typing

```
1. User clicks VoiceMicButton (microphone icon)
2. Browser requests microphone permission (first time)
3. Recording starts → visual indicator shown
4. User speaks task title / description / reflection in EN or VI
5. Transcription flow:
   a. Primary: Web Speech API (browser-native, real-time)
   b. Fallback: Audio captured → base64 encoded → sent to Cloud Function
      → Google Cloud Speech-to-Text API (asia-southeast1) → text returned
6. Transcribed text inserted into input field
7. User reviews, edits if needed, then saves
```

**Key files:** `useVoiceRecorder.js`, `useVoiceInput.js`, `VoiceMicButton.jsx`, `functions/index.js` (`transcribeSpeech`)

---

## WF-08: Ledger & Manual Balance Adjustments

**Persona:** Parent
**Entry point:** `/ledger` or `/ledger/:kidId`
**Goal:** View transaction history and make manual adjustments

```
1. Parent opens Ledger page → Selects a child
2. Sees full transaction history: date, label, amount (+/-)
3. Earnings vs. penalties breakdown shown
4. To add manual transaction:
   a. Click "Add Transaction"
   b. Choose type: Credit (add) or Debit (deduct)
   c. Enter amount and label (e.g., "Bonus for helping grandma")
   d. Save → Ledger updated; balance adjusted immediately
```

**Key files:** `Ledger.jsx`

---

## WF-09: Weekly Report Review

**Persona:** Parent
**Entry point:** Auto-modal on Monday (if new data) or `/report/weekly`
**Goal:** Review last week's performance and identify patterns

```
1. Report opens (auto on Monday or via navigation)
2. Parent sees:
   a. Family completion % with trend arrow (↑↓→)
   b. Per-kid performance cards (completion rate, earnings)
   c. 7-day heatmap per child
   d. Task popularity: most/least completed tasks
   e. Best/worst performing days of the week
   f. Tips for the coming week
   g. Badges unlocked during the period
3. Parent can navigate to previous weeks (weekOffset)
4. Share/Copy: Generates a text summary to share (messaging, notes)
5. Close → weekly modal marked as seen (localStorage flag)
```

**Key files:** `WeeklyReport.jsx`, `WeeklyReportModal.jsx`, `useWeeklyReport.js`

---

## WF-10: App Install (PWA Flow)

**Persona:** Mobile user (Android or iOS)
**Entry point:** Landing page or post-login banner
**Goal:** Install KidsTrack as a home-screen app

```
Android / Chrome:
1. User visits app in Chrome mobile
2. Install prompt appears (banner or CTA button)
3. User taps "Install"
4. Native "Add to Home Screen" dialog shown by Chrome
5. User confirms → App icon added to home screen
6. App opens in standalone mode (no browser chrome)

iOS / Safari:
1. User visits app in Safari mobile
2. Install CTA shows "Add to Home Screen" guide
3. Step-by-step instructions:
   a. Tap Share button (Safari toolbar)
   b. Scroll to "Add to Home Screen"
   c. Tap "Add"
4. App icon added → Full-screen experience on launch

Desktop (Chrome/Edge):
1. Install icon appears in address bar
2. User clicks → "Install KidsTrack" dialog
3. Confirms → App opens in standalone window
```

**Key files:** `useInstallPrompt.js`, `InstallPrompt.jsx`, `LandingPage.jsx`

---

## WF-11: Streak & Badge Unlock

**Persona:** Child
**Entry point:** Automatic, triggered by task completion patterns
**Goal:** Earn recognition for consistent behavior

```
1. Child completes 100% of tasks for the day → streak counter +1
2. Streak displayed on KidDashboard (with fire emoji when hot)
3. On milestone days (3, 7, 14, 30):
   a. Badge unlock animation plays
   b. Badge added to gallery
   c. Push notification sent (if enabled)
4. Other badge triggers:
   - Speed Demon: task completed very quickly
   - Perfect Week: 7-day streak
   - Consistency Star: long-running streak
   - Birthday: auto-unlocked on birthday
5. BadgeStrip on KidDashboard shows recently unlocked badges
6. BadgeGallery shows full collection
```

**Key files:** `useStreak.js`, `useBadges.js`, `BadgeStrip.jsx`, `BadgeGallery.jsx`, `KidDashboard.jsx`

---

## WF-12: Family Invite / Multi-Parent Setup

**Persona:** Parent
**Entry point:** FamilyCodeModal
**Goal:** Add another parent/guardian to the same family

```
1. Parent opens Profile or Dashboard → "Family Code" option
2. FamilyCodeModal opens → Shows unique family invite code
3. Second parent:
   a. Signs up with their own account
   b. Enters family code during setup
   c. Linked to the same family workspace
4. Both parents see same kids, tasks, ledger, and goals
```

**Key files:** `FamilyCodeModal.jsx`

---

## WF-13: Feedback Submission

**Persona:** Parent or Child
**Entry point:** Floating FeedbackLauncher button
**Goal:** Report a bug or suggest a feature

```
1. User clicks FeedbackLauncher (floating button on any page)
2. FeedbackPage opens
3. Selects type: Bug / Idea / Feedback
4. Enters text description or clicks mic for voice input
5. Submits → Feedback recorded in backend
```

**Key files:** `FeedbackPage.jsx`, `FeedbackLauncher.jsx`

---

## WF-14: Parent Profile & Theme Customization

**Persona:** Parent
**Entry point:** `/profile`
**Goal:** Personalize app appearance and manage account settings

```
1. Parent opens Profile page
2. Views account info (display name, linked auth providers)
3. Theme customization:
   a. Choose from preset color themes
   b. Or pick custom color with color picker
   c. Theme applied globally in real-time
4. View kid profiles (quick access cards)
5. View app version (for support)
6. Account linking: Add email/social if using quick-start login
```

**Key files:** `ParentProfile.jsx`

---

## WF-15: Language Switching

**Persona:** Any user
**Entry point:** Login page language switcher or app header
**Goal:** Switch interface language between English and Vietnamese

```
1. User clicks language toggle (🇬🇧 / 🇻🇳 flag buttons)
2. App re-renders in selected language
3. All UI text, labels, error messages, and notifications update
4. Language preference persisted (localStorage or user profile)
5. Task templates auto-show description in active language
6. Voice input language hint updated (en-US / vi-VN)
```

**Key files:** `I18nContext.jsx`, `src/i18n/en.js`, `src/i18n/vi.js`

---

## WF-16: Notification Setup

**Persona:** Parent
**Entry point:** NotificationSettings component
**Goal:** Receive push reminders for task completion

```
1. Parent opens notification settings
2. Grants browser notification permission (if not already granted)
3. Configures reminder schedule (e.g., 6 PM daily reminder)
4. Test notification sent to confirm setup
5. Notifications respect user's language preference
```

**Key files:** `NotificationSettings.jsx`, `useNotifications.js`
