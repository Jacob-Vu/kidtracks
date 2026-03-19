# KidsTrack — Research Work Log
**Date:** 2026-03-18
**Author:** Research Strategist
**Purpose:** Timestamped journal of documents reviewed, key findings from each, surprises and gaps discovered, and cross-document connections

---

## Phase 1: Business and Growth Documentation

### docs/business-product-evaluation-2026-03-18.md

**Type:** Business assessment, SWOT, monetization analysis, PMF hypotheses, risk register.

**Key conclusions:**
- Product is technically launch-ready: 39/39 E2E tests, all UX audit items shipped, UX score 8.2/10.
- Zero revenue. No paywall, no subscription, no payment provider wired. This is the dominant risk — explicitly rated "Critical" with "High" likelihood.
- Six-layer kid engagement loop (tasks → sound → streak → badge → leaderboard → savings goal) is the product's strongest differentiator, with no equivalent in competing apps.
- Full EN/VI bilingual parity is described as a "real moat in Vietnam and Vietnamese diaspora markets."
- Social proof metrics on landing page are hardcoded display values — not live Firestore aggregates. Explicitly flagged as a trust liability.
- Bundle size: 876KB / 266KB gzipped. Flagged as a risk for Vietnamese mobile users on 3G/4G.
- Monetization readiness score: 7/10. The product has the feature depth today.
- PMF Hypothesis 1 (primary): Urban Vietnamese millennial parents, 28-40, Hanoi/HCMC, ₫20M+ income.
- PMF Hypothesis 2 (secondary): Vietnamese diaspora parents in US/Australia/Canada/France — Western income, bilingual home, no competing product.

**Surprises:**
- The evaluation explicitly acknowledges that "social proof metrics appear seeded, not real" — this is a self-aware assessment that should have already been acted on. The fact that this is documented but unfixed at build #4 (production deploy) suggests either insufficient prioritization or an assumption that "no one will notice." Both are wrong.
- The 5 task packs (Little Star, School Star, etc.) are culturally appropriate Vietnamese names, not generic English ones — this level of localization detail is unusual for a bootstrapped product.

**Gaps:**
- No mention of actual current user count anywhere in this document. The metrics section says "Revenue: $0" but does not state how many families are currently active.
- No Firebase cost figure mentioned. Cost basis is entirely unknown from this document.

---

### docs/business-growth-plan-2026-03-18.md

**Type:** Phased growth plan with specific tactics, KPI tree, experiment backlog, GTM plan, pricing, revenue projections.

**Key conclusions:**
- Phase 1 (2 weeks): Analytics instrumentation + freemium paywall + fix social proof. These are treated as prerequisites for everything else.
- Analytics events specified in detail: 13 events including `signup_started`, `task_completed`, `paywall_seen`, `paywall_converted`, `streak_milestone`. This is a well-designed event schema.
- Freemium pricing: Free Tier ("Family Starter") — 1 child, 3 packs, basic badges; Premium Tier ("Family Pro") — ₫99,000/month or ₫890,000/year (~$4/month, ~$36/year).
- Diaspora USD tier: $5.99/month | $49/year — 50% higher ARPU, no competing product.
- School/classroom plan (B2B): ₫500,000/classroom/month.
- North Star Metric: Weekly Active Families (WAF) — defined as at least one parent and one kid interacting in the same week.
- K-factor target: K > 0.3 by end of Phase 2.
- Revenue projections: Conservative — 100 WAF, 5% premium rate → ₫495k/month (~$20) at launch; 5,000 WAF, 15% premium rate → ₫90M/month (~$3,600) by end of Q4 2026.
- GTM priority channels: Vietnamese parent Facebook groups (fastest, zero cost), referral program (compounding), SEO/blog (long-term), Zalo OA (high reach).
- Channels explicitly flagged as "avoid now": Google/Facebook paid ads, App Store SEO, PR/press.
- 4 retention loops documented: daily task habit (streak loss aversion), weekly report ritual (social accountability), badge progression (achievement completion psychology), savings goal motivation (goal proximity effect).

**Surprises:**
- The explicit acknowledgment that Zalo is strategically more important than Instagram for this market — "Zalo-friendly share card is worth 2x the effort of Instagram" — is an unusually specific and correct market insight. Most growth plans skip Zalo.
- The business plan suggests MoMo/bank transfer as the initial payment method, explicitly to avoid App Store tax. This is pragmatic and correct for Vietnam but would be unusual advice in a Western product context.
- The "first hire" recommendation is a Vietnamese-speaking community manager / content creator for parent Facebook groups and Zalo — explicitly "worth more than a second engineer in the next 6 months." This is a non-obvious but defensible prioritization.

**Gaps:**
- No discussion of what happens if early Facebook group posts generate signups but engagement drops off quickly. The plan assumes the product converts new users at adequate rates, but there is no Day-7 retention data to support this assumption.
- The pricing strategy assumes ₫99k is below the Vietnamese psychological ceiling, but this is asserted without citing market research. It is plausible but unvalidated.

---

## Phase 2: QA Documentation

### docs/qa-master-test-plan-2026-03-18.md

**Type:** E2E test plan, risk documentation, test matrix, coverage gaps.

**Key conclusions:**
- 11 spec files, 6 feature areas covered, 4 known coverage gaps.
- Risk documentation is unusually thorough: `addInitScript` reload behavior, i18n silent failure mode, AudioContext headless Chrome failure, Playwright strict mode multiple-element violations.
- Test mode: `?e2e=1` URL parameter + localStorage state injection (not Firebase). This is a well-designed mock layer that enables reliable E2E testing without live Firebase dependency.
- Coverage gaps: notification settings UI (no test), parent profile management (no test), error states (network failure, invalid input — no test), PWA install prompt (no test).

**Surprises:**
- The AudioContext testing workaround (`window.__kidFeedbackAudio` event bus dispatched before the try-catch) is a genuinely clever solution to a hard headless-browser testing problem. It also reveals that sound feedback is treated as a first-class testable feature, not an afterthought.
- The `addInitScript` conditional guard pattern — checking whether localStorage keys exist before writing — is a non-obvious but correct solution to test state persistence across reloads. This required a bug (BUG-004, BUG-010) to discover and fix. The pattern is now documented as a standard.

**Gaps:**
- No mention of performance testing (Lighthouse, Core Web Vitals, FCP/LCP targets). The 876KB bundle is documented as a risk but there are no E2E checks that would catch a performance regression.
- No mention of cross-browser testing beyond Chromium. Safari behavior (especially for PWA install, AudioContext, and CSS animations) is untested.

---

### docs/qa-bug-report-2026-03-18.md

**Type:** 11 bug details with root cause analysis and fix summaries.

**Key conclusions:**
- 11 bugs: 1 High, 7 Medium, 3 Low. All fixed. All verified by 39/39 Playwright E2E pass.
- Bug distribution reveals the primary risk vectors: i18n completeness (BUG-002, BUG-006, BUG-011 — 3 of 11 bugs), test infrastructure architecture (BUG-004, BUG-010 — 2 bugs from the same `addInitScript` antipattern), and product behavior vs. test expectation mismatches (BUG-001, BUG-007, BUG-008).
- Only 2 bugs (BUG-003, BUG-005) were actual product bugs as opposed to test bugs. This means the QA cycle primarily improved test quality and i18n completeness, not product correctness.

**Surprises:**
- BUG-001 (tests expected /login, app shows landing page) is interesting: the auth redirect behavior changed at some point — unauthenticated users now land on `LandingPage` at `/` rather than being redirected to `/login`. This is a product UX decision (prefer landing page for unauthenticated users) that was never reflected in the tests. It reveals a gap between product decision-making and test maintenance.
- BUG-003 (new template invisible after creation — fixed by `setActiveTab('family')`) is a classic UX bug: the product correctly saved the data but navigated to the wrong view to show it. The fix is one line. The finding is that template creation had likely been "broken" from a user perspective for some time.

**Gaps:**
- None of the 11 bugs are user-reported. They are all test-infrastructure or QA-cycle discoveries. This means either the product has been tested only internally, or actual user-facing bug reports are not being captured anywhere.

---

### docs/qa-fix-status-2026-03-18.md and docs/qa-e2e-coverage-report-2026-03-18.md

**Type:** Fix status table, E2E coverage report with spec-by-spec breakdown.

**Key conclusions:**
- All 11 bugs fixed, verified by full suite run.
- Test architecture: `?e2e=1` URL param, mock Firebase layer, conditional localStorage injection, event bus for audio testing.
- Uncovered flows: notification preferences, parent account settings, password change, error boundaries, Firebase offline mode, PWA install prompt.

**Connection to strategy:** The uncovered parent account settings flow is directly relevant to a future paywall — if subscription management (upgrade, cancel, billing) is added to the profile page (`ParentProfile.jsx`), it will enter the uncovered zone. Test coverage should expand to the profile page before paywall UX lands there.

---

## Phase 3: UX/UI Documentation

### docs/ux-ui-audit-2026-03-17.md

**Type:** Bilingual Vietnamese UX audit (scores + findings + priorities).

**Key conclusions:**
- Overall 8.2/10 (UX: 8.4, UI: 7.9, Style: 8.1).
- Highest-scored pages: Daily View (8.5), Template Picker (8.5), Weekly Report (8.5), Ledger (8.5).
- Lowest-scored: Login/Auth Gate (7.5), Parent Dashboard (7.5), Templates Page (7.5).
- P0 issues: dashboard visual hierarchy (reorder cards), button hierarchy standardization (primary/secondary/ghost), a11y contrast/focus states, missing i18n keys.
- "Low stimulation mode" for kid profile was a P2 item — meaning it was identified as needed but not yet shipped as of the audit.

**Surprises:**
- The audit is written in Vietnamese (partially). This is unusual for a technical audit document and suggests the intended audience includes Vietnamese-speaking stakeholders, not just English-speaking engineers. This is consistent with the bilingual-first product philosophy.
- The leaderboard is described as "emphasize improvement, not shame" — this is a deliberate UX principle about competitive framing for children, documented in the `p2-p3-ux-dev-plan.md`. Most app developers would not articulate this explicitly.

---

### docs/ux-ui-audit-status-report-2026-03-18.md

**Type:** Complete implementation pass — all P0/P1/P2 items done.

**Key conclusions:**
- All items from the 2026-03-17 audit are DONE as of this session.
- 14 new i18n keys added to both EN/VI for dashboard display strings.
- Low stimulation mode fully implemented (CSS selectors, localStorage key, KidDashboard data attribute, KidProfile toggle).
- 4 new focus-visible targets added (accessibility expansion beyond P0 requirements).
- 320px breakpoint added (very small Android phones common in Vietnam's emerging markets).
- Notable additional fix: `t` variable shadowing in KidReport (identified but not fixed — "pre-existing, would require renaming all filter variables").

**Connection to strategy:** The 320px breakpoint addition is a market-aware decision — Vietnam's mid-tier Android devices include sub-380px screens. This shows UX awareness of the actual target device environment, not just Western mobile conventions (375px iPhone as the baseline).

**Gaps:**
- "Low-stimulation mode persistence: stored in localStorage only, not in Firebase profile. Will reset if user clears storage." This is acceptable for P2 scope but will become a user-facing issue for engaged users who clear browser data. Should be elevated to Firebase profile storage before paywall launch.
- "WCAG automated scan: no automated contrast/accessibility scanner run." Accessibility claims are manual-review only. Before targeting any US market (where ADA compliance matters), an automated scan should be run.

---

## Phase 4: Product Plans and Roadmap

### docs/plans-master-2026-03-17.md

**Type:** Master feature roadmap with implementation phases.

**Key conclusions:**
- Three delivered features documented: Streak Counter, Guided Onboarding (3-step), Push Notifications (PWA).
- Weekly Report implementation is complete: route, dashboard entry, i18n, CSS, E2E pass.
- Next suggested steps: auto-popup Monday summary modal, share/export weekly report (image/text), push reminder for weekly report Monday 8:00 AM.

**Surprises:**
- The weekly report share/export is listed as "next" — but the strategic research documents (business-growth-plan, growth-po) treat it as a P0/critical feature. This gap between "feature backlog" priority and "business priority" is a signal that the product roadmap and the growth/business roadmap have not been fully reconciled.

---

### docs/weekly-report-plan.md

**Type:** Original feature plan for weekly report.

**Key conclusions:**
- Smart tips logic is rule-based (7 condition/tip rules documented). Not ML-based — this is appropriate for a v1 and can be validated quickly.
- Five sections: Hero Summary, Per-Kid Breakdown, Task Insights, Earnings Summary, Actions.
- Monday 8:00 AM push notification is part of the plan.
- Share/Export: "screenshot + text" — the screenshot approach (Canvas API) is the right architecture for a shareable image card.

**Connection to strategy:** The weekly-report-plan.md is the foundational design document for what `business-growth-plan-2026-03-18.md` calls the highest-leverage growth lever. The plan was written to serve the parent; the growth plan shows how to make it serve acquisition.

---

## Phase 5: Growth and Release Planning

### docs/growth-po-next-big-releases-2026-03-18.md

**Type:** Growth Director review + Product Owner release alignment.

**Key conclusions:**
- Updates previous assumptions: analytics is not zero — Firebase Analytics configured, `useAnalytics.js` exists, events tracked in Login/OnboardingWizard/WeeklyReport.
- Paywall events exist in code but no paywall UI is wired.
- Flutter codebase exists but not launch-ready.
- Three agreed decision principles: (1) monetize current web PMF before scaling, (2) protect trust before pushing acquisition, (3) keep release scope narrow, measurable, reversible.
- Release 1 (Weeks 1-4): Revenue Foundation — subscription model, paywall entry points, pricing/trial, full monetization funnel instrumentation.
- Release 2 (Weeks 5-8): Trust + Referral Loop — fix social proof, share card, referral system, Monday growth loop.
- Release 3 (Weeks 9-12): Expansion Readiness — performance hardening, mobile beta checkpoint, pricing refinement.

**Surprises:**
- The document corrects a finding from the business evaluation: "Analytics is not zero." `useAnalytics.js` with `useFirebaseAnalytics()` hook exists. This is an important correction — it means the analytics foundation is present and the paywall events will fire once the paywall UI exists. The earlier documents underestimated analytics maturity.
- The explicit "scope out" items are well-defined: Release 1 explicitly scopes out app-store release and B2B workflows. Release 2 explicitly scopes out deep channel expansion. This is disciplined product management.

**Gaps:**
- No mention of who specifically will run the Facebook group community strategy. This is the fastest acquisition channel but requires a named owner to execute.

---

### docs/jira-task-breakdown-2026-03-18.md

**Type:** Sprint task board for UX/performance sprint.

**Key conclusions:**
- All 8 tasks are Done: KT-101 (i18n keys), KT-102 (code splitting), KT-103 (icon size), KT-104 (avatar size), KT-105 (DateTime picker), KT-106 (profile navigation), KT-107 (landing hero slider with 7 slides), KT-108 (build + smoke tests).
- KT-102 (route-level code splitting, Vite `manualChunks` for vendor split) is Done — this addresses the 876KB bundle concern partially.
- KT-107 (7-slide landing hero slider with bilingual title/desc, mini task preview, prev/next/dots, autoplay, swipe) is Done — this is a significant landing page improvement not mentioned in other documents.

**Surprises:**
- KT-107 (landing hero slider with 7 feature slides) is Done but not mentioned in any other strategic document. This is a meaningful landing page upgrade — the slider replaces a single hardcoded preview card (named "Minh") with seven feature-highlighting slides. This should be assessed for conversion impact.
- The execution order (KT-101 → KT-102 → KT-106 → KT-103/104/105 → KT-107 → KT-108) shows discipline: fix correctness first (i18n), then performance (code splitting), then navigation UX, then polish, then test.

---

### docs/content-tech-lead-plan-2026-03-18.md

**Type:** Parallel workstream plan — Content Lead (pricing/packaging/Founding Premium) + Tech Lead (architecture review).

**Key conclusions:**
- Three-tier packaging proposed: Starter (Free), Plus (mid), Premium (full).
- Founding Premium campaign: 90-day free for first 300-500 families, with transparent expiration and progressive reminder emails at day 60, 75, 85.
- Five required decisions are blocking: trial duration, eligibility count, VN-only or VN+US launch, billing transition behavior.
- Tech Lead identifies four debt clusters: i18n consistency, React hook dependency hygiene, architectural boundaries (UI/state/service), test coverage.
- Integrated timeline: 2026-03-19 to 2026-03-24 (consolidated review and sign-off target).

**Surprises:**
- The three-tier packaging (Starter/Plus/Premium) in this document conflicts with the two-tier model (Free/Premium) in `business-growth-plan-2026-03-18.md`. These documents were produced in the same session by different role lenses. The conflict is not resolved. A decision needs to be made before paywall engineering starts: two-tier or three-tier.
- The "Founding Premium" 90-day campaign is a more sophisticated launch mechanic than what the business growth plan describes (14-day free trial). The 90-day Founding Premium creates a much longer engagement window before conversion pressure — which is appropriate for a product with no public testimonials yet. This document's recommendation is strategically superior to the growth plan's 14-day trial suggestion.

**Gaps:**
- The content lead plan generates content deliverables (pricing page copy, paywall copy, onboarding emails, reminder sequence) but does not specify who will write the Vietnamese versions. The developer-written Vietnamese copy risk applies here too.

---

## Phase 6: Source Code Review

### src/pages/ParentProfile.jsx

**Key observations:**
- The profile page contains: account info (displayName/email display), theme picker (5 themes + custom color picker), kid list with balance display, and `NotificationSettings` + `ClientVersionInfo` components.
- No subscription management UI exists in this file. The profile page is the natural home for subscription status, upgrade CTA, and billing management — but none of this exists yet.
- `useSearchParams` for `?kidId=` allows deep-linking to a specific kid from the parent dashboard. This is used by the KT-106 profile navigation task.
- The `ClientVersionInfo` component is embedded here, displaying `v0.0.0+4` (from `client-version.json`). This is a developer debugging aid currently visible in the production profile page — it should be review before broad user acquisition (it signals "pre-1.0" product versioning to savvy users).

**Connection to strategy:** The profile page is where subscription management will live (upgrade button, plan status, billing info). Before the paywall ships, this page should be assessed for where the premium status badge and upgrade CTA should be placed. Currently it has no affordance for this.

---

### client-version.json

**Key observations:**
- `appVersion: "0.0.0"`, `buildNumber: 4`, `channel: "production"`, `commitHash: "42238c4"`, `deployedAt: "2026-03-18T10:47:07.175Z"`.
- Build #4 means four production deployments have occurred. This is a low number consistent with early-stage product.
- `v0.0.0` version string signals explicitly pre-release product status.

**Connection to strategy:** Before pushing to Vietnamese parent Facebook groups, consider bumping to `v1.0.0` or at minimum `v0.1.0`. "v0.0.0" visible in the profile page signals technical immaturity to savvy parents and could undermine credibility. This is a 5-minute change.

---

### src/i18n/ (en.js, vi.js)

**Key observations:**
- Two files confirmed present with full EN/VI parity as established in QA cycle.
- Recent additions: 14 `dash.*` dashboard keys, badge name and description keys, social proof metric keys, leaderboard `improvedBy` parameter fix, notification settings hint keys, low stimulation mode copy.

**Connection to strategy:** The breadth of the i18n key set (covering every UI surface) confirms the bilingual-first claim is substantive, not superficial. This is genuine engineering investment, not an "add a language flag" localization.

---

### src/pages/ (full page list)

**Pages confirmed present:** WeeklyReport.jsx, DailyView.jsx, KidDashboard.jsx, TemplatePickerPage.jsx, Templates.jsx, LandingPage.jsx, KidProfile.jsx, Login.jsx, FeedbackPage.jsx, Dashboard.jsx, Ledger.jsx, ParentProfile.jsx.

**Observations:**
- `FeedbackPage.jsx` exists — this is likely the parent feedback launcher referenced in commit `8e28ba0` ("feat: add parent feedback launcher, voice STT fallback, and analytics events"). This is an in-app user research surface that, if active in production, could be generating qualitative feedback right now. No strategic document mentions this page or whether it is being used to collect real parent feedback.
- 12 pages in total. The feature surface is comprehensive for a v0 product. Most competing apps at comparable stage have 4-6 pages.

---

## Cross-Document Connections and Synthesis

### Connection 1: Analytics Exists vs. Analytics Not Instrumented

The business evaluation (`business-product-evaluation-2026-03-18.md`) states "No analytics / event instrumentation (no Mixpanel, Amplitude, or GA4 visible)" as Weakness #2. The growth-po document corrects this: Firebase Analytics is configured and `useAnalytics.js` exists with events wired in Login, OnboardingWizard, and WeeklyReport. The conflict is explained by different research methods — the business evaluation was written without examining `src/hooks/useAnalytics.js` directly, while the growth-po document reflects deeper code examination. The truth: analytics foundation exists but monetization funnel events are not firing (because the paywall UI doesn't exist).

**Implication:** The analytics situation is better than the business evaluation suggested, but still incomplete. The paywall build will activate the dormant monetization events.

### Connection 2: Social Proof Risk Is Consistently Flagged Across All Documents

Every document in the corpus that touches the landing page flags the fabricated social proof as a risk: business evaluation, business growth plan, growth-po, strategic research deep dive, and content-tech-lead plan. The risk is described consistently: "trust liability," "brand-damaging," "scrutiny risk." Yet build #4 has shipped to production without fixing it. This is either a prioritization failure or a decision to accept the risk temporarily. It should not be accepted any longer.

### Connection 3: Weekly Report Is Both Retention and Acquisition

The weekly report was planned and built as a parent retention tool (`weekly-report-plan.md`, `plans-master-2026-03-17.md`). The growth documents (`business-growth-plan-2026-03-18.md`, `growth-po-next-big-releases-2026-03-18.md`) reframe it as the primary acquisition engine via share card + referral incentive. This dual-purpose framing is the single most leveraged insight in the entire document corpus — the same feature, with incremental investment, serves both goals simultaneously.

### Connection 4: Packaging Conflict Between Two-Tier and Three-Tier

The business growth plan (`business-growth-plan-2026-03-18.md`) proposes a two-tier model (Free Starter + Family Pro). The content-tech-lead plan (`content-tech-lead-plan-2026-03-18.md`) proposes three tiers (Starter + Plus + Premium). These were written in the same session by different role lenses without reconciliation. Engineering cannot build a paywall until this conflict is resolved. The two-tier model is simpler to launch and test; the three-tier model allows more sophisticated pricing experiments but adds implementation complexity. The founder must decide.

### Connection 5: FeedbackPage.jsx Is an Unmentioned Asset

`FeedbackPage.jsx` exists as a page but is not mentioned in any strategic document, QA plan, or roadmap. If this is a live user feedback collection surface (the parent feedback launcher from commit `8e28ba0`), it may be generating qualitative product data right now that is not being reviewed or acted upon. This is an underused asset if true.

### Connection 6: Flutter Codebase Is an Open Resource Question

Every document that mentions the Flutter mobile codebase describes it as "exists but not launch-ready." No document assigns an owner, a timeline, or a make-vs-pause decision. The `content-tech-lead-plan-2026-03-18.md` notes it as a "Mobile app is promising but not launch-ready" risk. The `growth-po` document scopes mobile out of Releases 1-3. But no document says "pause Flutter and commit to Capacitor." This ambiguity is a resource leak.

---

## Summary of Notable Gaps Across the Corpus

| Gap | Severity | Source |
|---|---|---|
| Fabricated social proof in production | Critical | All strategic docs |
| No paywall despite full product readiness | Critical | All business docs |
| Actual user count unknown | High | No document mentions it |
| Firebase monthly cost unknown | High | No document mentions it |
| Packaging model not resolved (2-tier vs 3-tier) | High | business-growth-plan vs content-tech-lead-plan |
| FeedbackPage.jsx not referenced in any plan | Medium | Glob of src/pages/ |
| v0.0.0 version string visible in production profile | Medium | client-version.json, ParentProfile.jsx |
| Flutter codebase has no owner or decision | Medium | Multiple docs |
| Low stimulation mode stored in localStorage, not Firebase | Low | UX audit status report |
| No parent research has been conducted with real Vietnamese parents | Medium | Noted in strategic research |
| Vietnamese i18n copy not reviewed by native speaker | Medium | UX audit status report |
