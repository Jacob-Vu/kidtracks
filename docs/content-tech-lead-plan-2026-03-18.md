# Content Lead + Tech Lead Analysis and Execution Plan (2026-03-18)

## 1. Purpose
This document stores the working analysis and implementation plan for two parallel workstreams:
1. Content Lead: pricing strategy, package positioning, and a launch-time Founding Premium free access policy.
2. Tech Lead: full architecture and source code review of the current product.

The goal is to make product messaging, monetization, and technical quality move forward together in one coordinated rollout.

## 2. Workstream A - Content Lead

### 2.1 Business Context and Analysis
- The product already has multiple strong value points: daily tasks, rewards, reports, gamification, templates, goals, and journal.
- Current monetization messaging is not yet clearly staged from activation to paid conversion.
- A launch-time free Premium offer can boost early adoption, but must have clear limits to avoid long-term revenue leakage.
- Pricing communication should be clear for both Vietnam-first users and US-ready expansion.

### 2.2 Strategy Direction
- Positioning: "A family habit and reward system that turns routines into measurable progress."
- Packaging model:
- Starter (Free): core daily operations and basic tracking.
- Plus: stronger reporting and personalization for active families.
- Premium: full insight, advanced gamification, richer goals, and priority feature access.
- Launch policy: Founding Premium campaign for early adopters.

### 2.3 Proposed Founding Premium Program
- Offer: Premium free for 90 days.
- Eligibility: first 300 to 500 families (final number to confirm).
- Rules:
- one family account per offer
- no stacking with other discounts
- auto-downgrade to Starter after trial if no paid conversion
- Messaging:
- transparent expiration date
- explicit value reminder before day 60, day 75, day 85

### 2.4 Execution Plan (Content Lead)
1. Messaging architecture and persona alignment (1 day)
- Deliverable: value proposition matrix by persona and use-case.

2. Package definition and pricing narrative (1 day)
- Deliverable: package comparison table and draft VN + US pricing narrative.

3. Founding Premium policy and FAQ (0.5 day)
- Deliverable: launch policy copy, edge-case policy, terms summary.

4. Full content production (2 days)
- Deliverable: pricing page copy, paywall copy, in-app banners, onboarding emails, reminder sequence.

5. Instrumentation and optimization loop (1 day setup + ongoing)
- Deliverable: event map for trial-to-paid funnel and weekly optimization report format.

### 2.5 KPIs and Success Criteria
- D7 activation rate improvement.
- Trial start rate from new signups.
- Trial to paid conversion rate.
- D30 retention for families entering Founding Premium.
- Reduction in paywall confusion and support questions.

### 2.6 Content Risks and Mitigations
- Risk: over-promising premium value in copy.
- Mitigation: map every claim to a shipped feature.
- Risk: free offer abuse.
- Mitigation: eligibility limits and account checks.
- Risk: low conversion after free period.
- Mitigation: progressive value education across trial lifecycle.

## 3. Workstream B - Tech Lead

### 3.1 Technical Context and Analysis
- The project has rapid feature growth and many UX improvements, which is good for speed but increases consistency risk.
- Current likely debt clusters:
- i18n consistency and hardcoded text regression risk
- React hook dependency hygiene
- architectural boundaries between UI, state, and service layer
- test coverage and regression protection
- deployment/runtime upgrade readiness

### 3.2 Architecture Review Goals
- Improve maintainability without blocking product delivery.
- Reduce regression risk in high-traffic flows (Landing, Login, Dashboard, Daily actions).
- Create a clear remediation backlog with priorities and ownership.

### 3.3 Review Scope
1. Architecture and module boundaries.
2. State management and side-effect patterns.
3. API/Firebase integration and service abstraction.
4. i18n consistency and localization guardrails.
5. Performance (bundle shape, route splitting, critical path).
6. Security and data access assumptions.
7. Test strategy and CI quality gates.
8. Deployment/runtime health and upgrade readiness.

### 3.4 Execution Plan (Tech Lead)
1. Baseline architecture mapping (1 day)
- Deliverable: current-state architecture diagram and dependency map.

2. Code quality audit (1 day)
- Deliverable: prioritized issue list (P0/P1/P2) with impact and effort estimate.

3. Performance and bundle review (1 day)
- Deliverable: quick-win list for TTI/FCP/LCP and loading speed of Landing/Login.

4. Security and operational review (0.5 day)
- Deliverable: security hardening checklist and deployment risk notes.

5. Test strategy review (0.5 day)
- Deliverable: minimum reliable test matrix for release confidence.

6. Remediation roadmap and governance (1 day)
- Deliverable: 2 to 4 week refactor roadmap, code standards, PR checklist, CI gate proposals.

### 3.5 Technical Success Criteria
- Architecture report approved and shared.
- Debt backlog published with owners and deadlines.
- Top P0 issues converted into implementation tasks.
- CI checks enforce i18n and basic quality standards.
- Runtime and dependency upgrade path documented.

### 3.6 Technical Risks and Mitigations
- Risk: audit creates too many tasks and slows delivery.
- Mitigation: split into quick wins vs structural changes.
- Risk: unclear ownership for cross-module debt.
- Mitigation: assign owners per area before execution starts.
- Risk: missing production observability.
- Mitigation: define minimum analytics and error tracking baseline.

## 4. Integrated Timeline
1. 2026-03-19 to 2026-03-20
- Content strategy, package matrix, Founding Premium policy draft.
- Tech architecture baseline and code quality audit kickoff.

2. 2026-03-21 to 2026-03-23
- Content production for pricing/paywall/onboarding.
- Performance + security + testing review and issue prioritization.

3. 2026-03-24
- Consolidated review and sign-off.
- Final backlog for sprint execution and rollout checklist.

## 5. Required Decisions (Blocking Inputs)
- Final Founding Premium trial duration (60 or 90 days).
- Total number of eligible founding families.
- Initial paid pricing target per market (VN only first, or VN + US-ready launch).
- Billing transition behavior after trial end.

## 6. Next Actions
1. Publish this plan to Jira as epics and tasks.
2. Lock business decisions in Section 5.
3. Start execution with daily status updates and owner accountability.
