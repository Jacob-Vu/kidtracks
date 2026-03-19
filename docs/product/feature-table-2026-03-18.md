# KidsTrack — Feature Table
_Generated: 2026-03-18 | Version based on codebase snapshot_

---

## How to Read This Table

| Column | Meaning |
|--------|---------|
| **Feature** | Name as it appears in the product |
| **Target User** | Parent, Child, Both, or Visitor |
| **Purpose** | What problem it solves |
| **Status** | Shipped / In Dev / Planned / Known Issue |
| **Key Files** | Primary source files (for dev reference) |
| **Dependencies** | External or internal services required |
| **Notes / Risks** | Edge cases, known issues, or future risks |

---

## Authentication & Onboarding

| Feature | Target User | Purpose | Status | Key Files | Dependencies | Notes / Risks |
|---------|-------------|---------|--------|-----------|--------------|---------------|
| Social Login (Google / Apple / Facebook) | Parent | Frictionless signup with existing accounts | Shipped | `Login.jsx` | Firebase Auth (OAuth providers) | Apple login requires HTTPS; Facebook may have policy restrictions |
| Email + Password Login | Parent | Standard credential-based auth | Shipped | `Login.jsx` | Firebase Auth | Password reset flow supported |
| Quick-Start Username Login | Parent | Zero-email entry for hesitant users | Shipped | `Login.jsx`, `functions/index.js` (`signInParentSimple`) | Firestore `simpleParentAccounts` | Simplified account; limited recovery options |
| Account Linking | Parent | Upgrade quick-start account to email/social | Shipped | `ParentProfile.jsx` | Firebase Auth link providers | Users may lose access if quick-start account not upgraded |
| Kid Credential Login | Child | Child's own independent login | Shipped | `Login.jsx` | Firestore `userProfiles` | Requires parent email as lookup; no email recovery for kid |
| Password Reset | Parent | Recover access via email | Shipped | `Login.jsx` | Firebase Auth email action | Only available for email/password accounts |
| Onboarding Wizard | Parent | Guided first-time setup (family → kid → template → task) | Shipped | `OnboardingWizard.jsx` | Firestore write | If wizard is skipped, parent lands on empty dashboard |
| Family Code Invite | Parent | Add co-parent or second guardian to family | Shipped | `FamilyCodeModal.jsx` | Firestore `families` | Code should expire; no expiry mechanism confirmed in code |

---

## Task Management

| Feature | Target User | Purpose | Status | Key Files | Dependencies | Notes / Risks |
|---------|-------------|---------|--------|-----------|--------------|---------------|
| Daily Task List (Parent) | Parent | Create and assign daily tasks per child | Shipped | `DailyView.jsx` | Firestore `dailyTasks` | Resets per calendar day; time zone handling important |
| Daily Task View (Kid) | Child | See and complete today's tasks | Shipped | `KidDashboard.jsx` | Firestore `dailyTasks` | Real-time updates via subscription |
| Task Completion Toggle | Child | Mark task done / undone | Shipped | `KidDashboard.jsx` | Firestore update | Undo supported before day is finalized |
| Task Failed Marking | Parent | Mark a task as failed (applies penalty) | Shipped | `DailyView.jsx` | Firestore `dailyTasks` | Distinct from "incomplete" in finalization logic |
| Day Finalization | Parent | Lock the day; apply rewards/penalties to ledger | Shipped | `DailyView.jsx` | Firestore `dayConfigs`, `ledger` | Irreversible once finalized; no undo in UI |
| Auto-Load Routine | Parent + Child | Reload yesterday's task list as today's routine | Shipped | `DailyView.jsx`, `useFireActions.js` | Firestore `routines` | Includes undo option; reduces daily setup friction |
| Save Routine | Parent | Save current day's tasks as reusable routine | Shipped | `DailyView.jsx` | Firestore `routines` | Overwrites previous saved routine |
| Task Templates | Parent | Reusable tasks with bilingual descriptions | Shipped | `Templates.jsx`, `TemplatePickerPage.jsx` | Firestore `templates` | Templates assignable per-kid or globally |
| Default Template Packs | Parent | Pre-built packs (Little Star, School Star, etc.) | Shipped | `Templates.jsx` | Local pack definitions | Pack content is hardcoded; needs content review for locale accuracy |
| Template Picker in Daily View | Parent | Select templates to add to today's task list | Shipped | `TemplatePickerPage.jsx` | Firestore `templates` | — |
| Voice Task Input | Parent + Child | Speak task title/description instead of typing | Shipped | `VoiceMicButton.jsx`, `useVoiceRecorder.js` | Web Speech API, Google Cloud STT (fallback) | Fallback adds latency; needs mic permission; may fail on some browsers |

---

## Reward & Finance System

| Feature | Target User | Purpose | Status | Key Files | Dependencies | Notes / Risks |
|---------|-------------|---------|--------|-----------|--------------|---------------|
| Per-Day Reward Amount | Parent | Set how much a child earns for completing all tasks | Shipped | `DailyView.jsx` | Firestore `dayConfigs` | Presets: 10k / 20k / 50k VND; custom input supported |
| Per-Day Penalty Amount | Parent | Set deduction for incomplete/failed tasks | Shipped | `DailyView.jsx` | Firestore `dayConfigs` | Presets: 5k / 10k / 20k VND |
| Auto-Apply on Finalization | Parent | Automatically credit/debit child on day finalize | Shipped | `DailyView.jsx`, `useFireActions.js` | Firestore `ledger` | Finalization is irreversible |
| Ledger History | Parent + Child | Full transaction log per child | Shipped | `Ledger.jsx` | Firestore `ledger` | Shows label, date, and amount for each entry |
| Manual Transactions | Parent | Add bonus or deduction outside daily routine | Shipped | `Ledger.jsx` | Firestore `ledger` | Useful for allowances, penalties, or special rewards |
| Balance Display | Child | Real-time balance shown on kid dashboard | Shipped | `KidDashboard.jsx` | Firestore `kids.balance` | — |
| Savings Goals | Parent + Child | Set a target amount for child to save towards | Shipped | `GoalModal.jsx`, `GoalCard.jsx` | Firestore `goals` | Goal completion archives goal; no delete confirmation shown |
| Goal Milestones | Child | Auto-unlock milestones as balance grows | Shipped | `GoalMilestoneSync.jsx`, `useGoalMilestones.js` | Firestore `goals` | Milestones calculated client-side; may re-trigger on rerenders |

---

## Gamification

| Feature | Target User | Purpose | Status | Key Files | Dependencies | Notes / Risks |
|---------|-------------|---------|--------|-----------|--------------|---------------|
| Daily Completion Streak | Child | Track consecutive days of 100% task completion | Shipped | `useStreak.js`, `KidDashboard.jsx` | Firestore `dailyTasks`, `dayConfigs` | Streak resets if day is finalized with incomplete tasks |
| Streak Milestones (3 / 7 / 14 / 30 days) | Child | Reward consistency with badge unlocks | Shipped | `useStreak.js` | localStorage streak milestone flags | Milestone flags stored in localStorage; clear on device change |
| Badge System (20+ badges) | Child | Achievement recognition for task patterns | Shipped | `useBadges.js`, `BadgeGallery.jsx`, `BadgeStrip.jsx` | Firestore `badges` | Badge definitions are hardcoded; adding new badges requires deploy |
| Birthday Badge | Child | Auto-unlock on birthday | Shipped | `useBadges.js` | Kid's birthday field in Firestore | Requires birthday stored on profile |
| Confetti Celebration | Child | Full-screen celebration on 100% day completion | Shipped | `CelebrationOverlay.jsx` | `react-confetti` | Disabled in low-stimulation mode |
| Leaderboard | Parent + Child | Family ranking by weekly completion | Shipped | `useLeaderboard.js`, `LeaderboardCard.jsx` | Firestore `dailyTasks`, `ledger` | Ranking visible to all family members |
| Weekly Report | Parent | Analytics for the previous 7 days | Shipped | `WeeklyReport.jsx`, `useWeeklyReport.js` | Firestore `dailyTasks`, `ledger` | Auto-prompt on Mondays with new data |

---

## Analytics & Reporting

| Feature | Target User | Purpose | Status | Key Files | Dependencies | Notes / Risks |
|---------|-------------|---------|--------|-----------|--------------|---------------|
| Weekly Completion % | Parent | Overall family performance metric | Shipped | `useWeeklyReport.js` | Firestore `dailyTasks`, `dayConfigs` | Trend arrows (↑↓→) compare to prior week |
| Per-Kid Breakdown | Parent | Individual performance within the weekly report | Shipped | `WeeklyReport.jsx` | Firestore | — |
| 7-Day Heatmap | Parent | Visual completion calendar per child | Shipped | `WeeklyReport.jsx` | Firestore | — |
| Task Popularity Analysis | Parent | Which tasks are completed most / least | Shipped | `WeeklyReport.jsx` | Firestore `dailyTasks` | — |
| Best / Worst Day of Week | Parent | Identify patterns in task completion | Shipped | `useWeeklyReport.js` | Firestore | — |
| Earnings Summary | Parent | Total earnings per child and family | Shipped | `WeeklyReport.jsx` | Firestore `ledger` | — |
| Weekly Report Modal (Monday auto-prompt) | Parent | Surface key metrics without requiring navigation | Shipped | `WeeklyReportModal.jsx` | localStorage flag | Seen-flag stored in localStorage; can be reset manually |
| Shareable Weekly Summary | Parent | Copy/share text summary of weekly performance | Shipped | `WeeklyReport.jsx` | Clipboard API | Falls back gracefully if clipboard not available |
| 7-Day & 30-Day Completion Charts | Parent | Extended trend views on Dashboard | Shipped | `Dashboard.jsx` | Firestore | — |
| Event Analytics | Internal | Track user actions (login, task, install, etc.) | Shipped | `useAnalytics.js` | Firebase Analytics | Used for product metrics; no PII tracked |

---

## Voice & Input

| Feature | Target User | Purpose | Status | Key Files | Dependencies | Notes / Risks |
|---------|-------------|---------|--------|-----------|--------------|---------------|
| Voice Task Input | Parent | Speak task title/description | Shipped | `useVoiceRecorder.js`, `VoiceMicButton.jsx` | Web Speech API + Google Cloud STT | Browser STT preferred; Cloud STT fallback adds ~1-2s latency |
| Voice Journal (Kid) | Child | Speak reflection notes on the day | Shipped | `DayJournal.jsx`, `useVoiceRecorder.js` | Same as above | — |
| Voice Feedback Submission | Parent + Child | Speak bug reports or feature requests | Shipped | `FeedbackPage.jsx`, `useVoiceRecorder.js` | Same as above | — |
| Language-Aware STT | Parent + Child | Voice input in EN or VI | Shipped | `useVoiceRecorder.js` | Google Cloud STT `vi-VN` / `en-US` | STT accuracy varies for Vietnamese; accent sensitivity possible |
| Server-Side STT Fallback | All | When browser STT unavailable (older browsers, iOS) | Shipped | `functions/index.js` (`transcribeSpeech`) | Google Cloud Speech-to-Text API, asia-southeast1 | Additional cost per transcription call |

---

## Internationalization (i18n)

| Feature | Target User | Purpose | Status | Key Files | Dependencies | Notes / Risks |
|---------|-------------|---------|--------|-----------|--------------|---------------|
| English UI | All | Full English interface | Shipped | `src/i18n/en.js`, `I18nContext.jsx` | — | — |
| Vietnamese UI | All | Full Vietnamese interface | Shipped | `src/i18n/vi.js`, `I18nContext.jsx` | — | Missing keys fall back to English |
| Language Switcher | All | Toggle EN ↔ VI from login or header | Shipped | `Login.jsx`, `MobileHeader.jsx` | I18nContext | Flag icons (🇬🇧🇻🇳) |
| Bilingual Task Templates | Parent | Templates show description in active language | Shipped | `Templates.jsx`, `TemplatePickerPage.jsx` | Firestore `templates.descriptions.en/vi` | Missing VI description falls back to EN |
| Localized Notifications | All | Push reminders in user's language | Shipped | `useNotifications.js` | I18nContext | — |
| Vietnamese Currency Format | All | Display amounts as VND (đ) | Shipped | `src/i18n/vi.js` | I18nContext | No multi-currency conversion; VND assumed |

---

## Progressive Web App (PWA)

| Feature | Target User | Purpose | Status | Key Files | Dependencies | Notes / Risks |
|---------|-------------|---------|--------|-----------|--------------|---------------|
| Installable PWA | All | Install as native-like app on any device | Shipped | `useInstallPrompt.js`, `InstallPrompt.jsx` | Vite PWA Plugin, Service Worker | iOS Safari requires manual Add to Home Screen |
| iOS Install Guide | iOS Users | Step-by-step instructions for Safari Add to Home Screen | Shipped | `InstallPrompt.jsx` | None | Cannot trigger native prompt on iOS; guide is manual |
| Android Install Prompt | Android Users | Native Chrome install dialog | Shipped | `useInstallPrompt.js` | Browser `beforeinstallprompt` event | Not available in all Android browsers |
| Offline Support | All | App usable without internet (cached assets) | Shipped | Service Worker (Vite PWA) | Vite PWA Plugin | Firestore queries will fail offline; only UI cached |
| Push Notifications | Parent | Reminders for task completion / check-ins | Shipped | `useNotifications.js`, `NotificationSettings.jsx` | Browser Notification API | Requires explicit user permission; iOS <16.4 unsupported |
| Install CTA (Landing Page) | Visitor | Drive app installs from marketing page | Shipped | `LandingPage.jsx`, `InstallPrompt.jsx` | `useInstallPrompt` | Dismissal tracked in localStorage |

---

## Accessibility & UX

| Feature | Target User | Purpose | Status | Key Files | Dependencies | Notes / Risks |
|---------|-------------|---------|--------|-----------|--------------|---------------|
| Low-Stimulation Mode | Child (sensitive) | Reduce animations/confetti for sensory-sensitive kids | Shipped | `KidProfile.jsx`, `useKidFeedback.js` | localStorage `LS_LOW_STIMULATION` | — |
| Feedback Sound Toggle | Child | Enable/disable audio feedback on task completion | Shipped | `KidProfile.jsx`, `useKidFeedback.js` | localStorage `LS_FEEDBACK_SOUND` | — |
| Theme Customization | Parent | Preset + custom color themes | Shipped | `ParentProfile.jsx` | Zustand state | — |
| Responsive Layout | All | Mobile-first design for phone use | Shipped | All pages | CSS (Tailwind-like) | Primary use case is mobile |
| ARIA Labels | All | Screen reader accessibility | Partial | All pages | — | Ongoing; not fully audited |
| Keyboard Navigation | All | Tab/Enter nav without mouse | Partial | All pages | — | Not fully tested |

---

## Backend & Infrastructure

| Feature | Target User | Purpose | Status | Key Files | Dependencies | Notes / Risks |
|---------|-------------|---------|--------|-----------|--------------|---------------|
| Real-Time Firestore Sync | All | Live data without polling | Shipped | `useFirebaseSync.js` | Firebase Firestore | Subscription cost scales with active users |
| Cloud Functions (Node.js) | System | Server-side auth and STT | Shipped | `functions/index.js` | Firebase Functions, Google Cloud STT | Cold starts may add latency on first STT call |
| Firebase Authentication | All | Secure user identity management | Shipped | Firebase Auth | Firebase project | — |
| Firebase Hosting | All | CDN-served PWA | Shipped | `.firebase/` | Firebase Hosting | Deployed via `npm run deploy:prod` |
| Client Version Tracking | Internal | Track deployed version for support | Shipped | `client-version.json`, `ClientVersionInfo.jsx` | Git CI/deploy script | — |
| Analytics Event Tracking | Internal | Understand user behavior | Shipped | `useAnalytics.js` | Firebase Analytics | Event list should be documented separately |

---

## Status Legend

| Status | Meaning |
|--------|---------|
| **Shipped** | Live in production, fully functional |
| **In Dev** | Being actively developed |
| **Planned** | On roadmap, not yet started |
| **Partial** | Exists but incomplete or not fully tested |
| **Known Issue** | Shipped but has documented bugs or limitations |

---

## High-Risk Features (Operational Attention Needed)

| Feature | Risk | Mitigation Needed |
|---------|------|-------------------|
| Day Finalization | Irreversible; incorrect finalization cannot be undone | Add confirmation dialog + 24h undo window |
| Quick-Start Login | No email = no account recovery | Prompt users to link email after onboarding |
| Google Cloud STT | Per-call billing; abuse possible | Rate limiting on Cloud Function |
| Streak milestone flags in localStorage | Lost on device change / browser clear | Migrate to Firestore for persistence |
| Goal milestone sync (client-side) | May re-trigger on re-renders | Debounce or server-side milestone writes |
| Family Code (no expiry) | Stale codes could allow unauthorized joins | Add TTL or revoke mechanism |
