# KidsTrack Growth Director Review + Product Owner Release Alignment
Date: 2026-03-18
Role Lens: Growth Director in collaboration with Product Owner
Time Horizon: Next 12 weeks (Q2 2026)

## 1) Updated Product Review (Current Reality)

### What is strong right now
- Product depth is strong for family habit building:
  - Daily tasks, templates, rewards ledger, goals, badges, leaderboard, weekly report, kid dashboard.
- Core quality is stable:
  - Recent QA cycle reports 39/39 E2E tests passed.
- Bilingual support (EN/VI) is broad and consistent across the app.
- PWA and Firebase architecture are already in production flow.

### What changed vs previous business review assumptions
- Analytics is not zero:
  - Firebase Analytics is configured and event tracking hooks exist (`src/firebase/config.js`, `src/hooks/useAnalytics.js`).
  - Core journey events are being tracked in major screens (`src/pages/Login.jsx`, `src/components/OnboardingWizard.jsx`, `src/pages/WeeklyReport.jsx`).
- Monetization is still zero:
  - No active subscription/paywall implementation found in web or functions.
  - Paywall events exist, but no paywall flow is wired.
- Trust risk remains:
  - Landing social proof metrics are static constants (`src/components/SocialProofSection.jsx`), not live aggregates.
- Mobile app is promising but not launch-ready:
  - Flutter codebase exists, but local setup still depends on Flutter CLI/Firebase generation (`mobile/README.md`).

### Business risk summary
1. No revenue engine despite high engagement feature set.
2. Social proof credibility risk from hardcoded metrics.
3. Mobile expansion can distract from near-term monetization if started too early.

## 2) Product Owner Discussion Outcomes (Aligned Priorities)

### Decision principles agreed
1. Monetize current web PMF before scaling channels.
2. Protect trust before pushing acquisition.
3. Keep release scope narrow, measurable, and reversible.

### North-star and gate metrics
- North-star: Weekly Active Families (WAF)
- Gate metrics per release:
  - Activation: onboarding completion, Day-7 retention
  - Monetization: paywall view rate, paywall conversion, MRR
  - Trust/Growth: referral share rate, referral signup rate

## 3) Next Big Releases (Execution Plan)

## Release 1 (Weeks 1-4): Revenue Foundation
Goal: Turn engagement into first recurring revenue with minimal user friction.

### Scope in
- Subscription model and entitlements:
  - Free tier: 1 kid, limited packs/features.
  - Pro tier: multi-kid, full weekly report, full badges/goals/leaderboard.
- Paywall entry points:
  - Trigger at high-intent moments (add second kid, premium report export, premium badges/goals).
- Pricing and trial:
  - Start with VN-friendly monthly/annual options and 14-day trial.
- Instrument full monetization funnel:
  - `paywall_seen`, `paywall_converted`, `trial_started`, `trial_ended`, `subscription_active`.

### Scope out
- App-store release.
- School/B2B workflows.

### Release KPI targets
- Paywall view rate >= 25% of active parent sessions.
- Paywall conversion >= 6% from paywall views.
- Day-7 retention does not drop more than 5% from pre-paywall baseline.

## Release 2 (Weeks 5-8): Trust + Referral Loop
Goal: Convert weekly habit into organic acquisition while improving brand trust.

### Scope in
- Replace hardcoded social proof with real data or remove numeric claims.
- Weekly report share card (image + copy variants EN/VI).
- Referral system:
  - Invite link tracking.
  - Incentive: both families receive premium time.
- Monday growth loop:
  - Weekly report reminder + one-tap share from modal/report.

### Scope out
- Deep channel expansion (paid ads, broad influencer spend).

### Release KPI targets
- Weekly report share rate >= 20% of weekly active parents.
- Referral signup share >= 15% of new signups.
- Landing conversion improves >= 10% after trust section update.

## Release 3 (Weeks 9-12): Expansion Readiness
Goal: Prepare the product for broader scale with disciplined risk control.

### Scope in
- Performance and conversion hardening:
  - Reduce initial JS payload and improve first-load mobile performance.
- Mobile beta readiness checkpoint:
  - Internal Android beta (not public launch) after Release 1 and 2 KPIs are met.
- Pricing refinement:
  - Basic price sensitivity test and annual-plan conversion optimization.
- Growth ops cadence:
  - Weekly experiment review with PO + Growth + Engineering.

### Scope out
- Full B2B/classroom productization.

### Release KPI targets
- First contentful paint and route transition performance improve measurably on mid-tier Android.
- MRR growth week-over-week trend is positive for 4 consecutive weeks.
- Referral coefficient trends upward from Release 2 baseline.

## 4) PO Backlog Order (Must-Do Sequence)

1. Entitlement model and feature-gate map.
2. Paywall UX + payment integration path.
3. Monetization analytics dashboard.
4. Social proof data pipeline.
5. Referral links + attribution.
6. Weekly report share card.
7. Performance hardening.
8. Mobile beta readiness checklist.

## 5) Go/No-Go Checklist Before Each Release

### Go criteria
- Event tracking validated in production for all new funnel steps.
- QA smoke and regression suites pass.
- Release dashboard has baseline and post-release breakouts.
- Rollback plan documented.

### No-go triggers
- Core parent flow regression (login, dashboard, daily tasks, weekly report).
- Material drop in activation/retention beyond agreed tolerance.
- Inaccurate trust claims still visible on landing.

## 6) Leadership Recommendation

Do not split focus across monetization and broad market expansion in parallel.
The highest-ROI path is:
1) monetize current product depth,
2) build trust-based referral loop,
3) scale only after unit economics and retention are stable.

This sequence keeps delivery realistic for the current team and gives Product Owner clear release gates tied to business outcomes.
