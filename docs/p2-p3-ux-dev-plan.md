# KidsTrack P2/P3 UX + Dev Plan

_Last updated: 2026-03-17_

## Scope
- **P2**: Savings goals for kid, Achievement badges, Fun sounds + animations
- **P3**: Sibling leaderboard, Landing page social proof

---

## Product goals
1. Increase kid daily engagement (task completion loop)
2. Improve parent-perceived value (progress visibility + motivation tools)
3. Increase retention and referral through delight + social proof

Primary metrics:
- Weekly active families (WAF)
- % kids with streak >= 3 days
- Avg tasks completed / kid / week
- D7 parent retention

---

## UX blueprint (high level)

### 1) Savings Goals (P2, Medium, ~1 week)

#### User stories
- Parent creates a savings goal for each kid
- Kid sees progress and stays motivated
- Parent/kid celebrate when goal is reached

#### UX flow
1. Kid Dashboard: Goal card (empty state if no goal)
2. Create Goal modal (title, target amount, icon, optional due date)
3. Goal detail card: progress bar, current amount, target, ETA
4. Milestone celebration at 25/50/75/100%
5. Completed state + CTA “Create next goal”

#### UI blocks
- `GoalCard` (KidDashboard, Dashboard summary)
- `GoalModal` (create/edit)
- `GoalProgressRing` (optional compact visual)

#### Edge behavior
- If balance drops, progress recalculates (never >100%)
- If goal deleted, history preserved (optional audit)

---

### 2) Achievement Badges (P2, Small, 3-5 days)

#### User stories
- Kid unlocks badges from positive habits
- Parent sees progress and gives encouragement

#### Badge categories
- Consistency: 3-day/7-day streak
- Completion: First 10 tasks, Perfect week
- Finance: First savings goal reached
- Responsibility: Morning/evening routine completion

#### UX flow
- Badge strip on Kid Dashboard (top 3 recent)
- Full gallery in Kid Profile
- Weekly report highlights newly unlocked badge

---

### 3) Fun sounds + animations (P2, Small, 3-5 days)

#### User stories
- Kid gets immediate reward feedback when completing actions

#### Interaction design
- Task complete: small pop animation + soft click/chime
- Day complete: confetti + short victory sound
- Badge unlock: sparkle + unlock sound

#### Accessibility
- Toggle sound ON/OFF
- Respect prefers-reduced-motion
- Parent mode can default to low/no sound

---

### 4) Sibling Leaderboard (P3, Small, 2-3 days)

#### User stories
- Family can compare progress in a healthy way

#### UX principles
- Emphasize improvement, not shame
- Show “Most Improved” and “Consistency Star”
- Hide ranking if data insufficient (fairness gate)

#### KPI cards
- Weekly completion rate
- Weekly earnings
- Current streak

---

### 5) Landing social proof (P3, Small, 1-2 days)

#### UX content blocks
- Trust metrics strip (families, tasks completed, avg streak)
- 3 testimonials (short, real voice)
- “Used by families in VN” block
- CTA paired with trust copy

---

## Technical implementation plan (Dev Lead)

## Phase A — Savings goals foundation (Sprint 1)

### A1. Data model + store
Files:
- `src/store/useStore.js`
- `src/hooks/useFirebaseSync.js`

Data model (`goals` collection):
- `id`
- `kidId`
- `title`
- `targetAmount`
- `status` (`active|completed|archived`)
- `icon`
- `dueDate?`
- `createdAt`
- `completedAt?`

Acceptance:
- Parent can CRUD goals
- Goals sync real-time
- Goal scoped by family/user data permissions

Risks:
- Firestore security rules mismatch
Mitigation:
- Add/verify read-write constraints per family namespace

### A2. Savings goal UI
Files:
- `src/components/GoalCard.jsx` (new)
- `src/components/GoalModal.jsx` (new)
- `src/pages/KidDashboard.jsx`
- `src/pages/Dashboard.jsx`
- `src/index.css`

Acceptance:
- Goal create/edit/delete works
- Progress shown correctly from balance/target
- Empty and completed states are polished on mobile

Risks:
- UX clutter on KidDashboard
Mitigation:
- Keep card concise + collapse details by default

### A3. Milestone logic
Files:
- `src/utils/goals.js` (new)
- `src/hooks/useGoalMilestones.js` (new)

Acceptance:
- 25/50/75/100 milestone events emitted once per goal
- No repeated celebrations on refresh

---

## Phase B — Achievement badges

### B1. Badge engine
Files:
- `src/utils/badges.js` (new)
- `src/hooks/useBadges.js` (new)

Acceptance:
- Unlock logic deterministic and testable
- Only new badges trigger animation/notification

### B2. Badge UI
Files:
- `src/components/BadgeGallery.jsx` (new)
- `src/components/BadgeStrip.jsx` (new)
- `src/pages/KidDashboard.jsx`
- `src/pages/KidProfile.jsx`

Acceptance:
- Kid sees unlocked + locked progression
- Parent can inspect badge status

---

## Phase C — Sounds & animations

### C1. Feedback engine
Files:
- `src/hooks/useKidFeedback.js` (new)
- `src/components/SettingsPanel.jsx` or existing settings component
- `src/index.css`
- `public/sounds/*`

Acceptance:
- Event-based feedback fires on task/day/badge events
- Setting persists in localStorage
- Reduced motion and sound-off respected

---

## Phase D — Leaderboard
Files:
- `src/hooks/useLeaderboard.js` (new)
- `src/components/LeaderboardCard.jsx` (new)
- `src/pages/Dashboard.jsx`
- `src/pages/KidDashboard.jsx`

Acceptance:
- Weekly ranking shows for >=2 kids with enough data
- Most improved and streak star visible

Risk:
- Negative sibling pressure
Mitigation:
- Positive labels, no red-loss messaging

---

## Phase E — Landing social proof
Files:
- `src/components/SocialProofSection.jsx` (new)
- `src/pages/LandingPage.jsx`
- `src/i18n/en.js`, `src/i18n/vi.js`
- `src/index.css`

Acceptance:
- Social proof visible above fold (mobile)
- No layout shift / perf regression

---

## Test strategy

### Unit/integration
- `goals` calculations (progress, milestone trigger)
- badge unlocking rules
- leaderboard ranking fairness

### E2E (Playwright)
1. Parent creates goal, kid sees progress
2. Goal reaches milestone and shows celebration once
3. Badge unlock after meeting rule
4. Sound toggle off => no audio feedback
5. Leaderboard visible with 2+ kids and hidden with 1 kid
6. Landing social proof section renders in EN/VI

### Quality gates per phase
- `npm run build`
- Targeted e2e for touched feature
- No regression in weekly-report spec

---

## Delivery order (recommended)
1. **Phase A** (Savings goals)
2. **Phase B** (Badges)
3. **Phase C** (Sounds/animations)
4. **Phase D** (Leaderboard)
5. **Phase E** (Landing social proof)

Reason: build foundation first, then engagement layers, then acquisition-facing polish.

---

## Sprint-ready task board (next immediate execution)

### Sprint 1 (start now): Savings Goals
- [ ] Define Firestore schema + store actions
- [ ] Build GoalCard + GoalModal
- [ ] Wire KidDashboard + Dashboard summary
- [ ] Add milestone tracking (25/50/75/100)
- [ ] Add EN/VI copy for goals
- [ ] Add Playwright flow for goal create + progress
- [ ] Build + deploy
