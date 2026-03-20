# KidsTrack Scrum Task Backlog (Prepared with Scrum Master)
Date: 2026-03-20
Source: docs/ux-ui-po-requirement-plan-2026-03-20.md
Prepared by: Scrum Master + Product Owner collaboration draft

## Sprint Structure
- Sprint length: 2 weeks
- Cadence: Planning (Day 1), Mid-sprint check (Day 6), Review/Retro (Day 10)
- Capacity model: 70% planned / 30% buffer for defects and hotfixes

## Roles
- Product Owner: priority, scope acceptance, KPI guardrails
- Scrum Master: facilitation, impediment removal, delivery health
- Dev Lead: technical design, estimates, implementation ownership
- UX/UI Lead: wireframes, interaction and copy specs
- Data Analyst: event validation, dashboard, experiment readout

## Definition of Ready (DoR)
A task enters sprint only if:
- User/problem statement is clear
- Acceptance criteria are testable
- Dependencies identified
- Analytics events defined (if user-facing behavior changes)
- Feature flag plan defined (for P0/P1 behavior changes)

## Definition of Done (DoD)
A task is done only if:
- Code merged and reviewed
- Unit/integration/e2e checks passed (as applicable)
- Analytics events validated in staging
- UX/UI acceptance passed for user-facing changes
- Release note added to sprint changelog

## Product Backlog by Epic

## Epic A - Telemetry and Experiment Foundation (P0)
A-1. Finalize event taxonomy and naming contract
- Owner: Data Analyst + Dev Lead
- Estimate: 3 points
- Acceptance:
  - Event dictionary includes required event names and properties
  - Approved by PO + Growth stakeholders

A-2. Implement instrumentation in `DailyView` and kid-facing flows
- Owner: Frontend Engineer
- Estimate: 5 points
- Acceptance:
  - Required events fire on key actions and states
  - QA confirms payload validity

A-3. Add experiment metadata to analytics payload
- Owner: Frontend Engineer + Data Analyst
- Estimate: 3 points
- Acceptance:
  - `experiment_id`, `variant_id`, `cohort_age_band` available in tracked events

A-4. Dashboard baseline v1 (D1/D7/D30, streak survival, reward variance)
- Owner: Data Analyst
- Estimate: 5 points
- Acceptance:
  - Dashboard published and review-ready
  - Baseline snapshot documented

## Epic B - Reward Economy Guardrails and Clarity (P0)
B-1. Define reward rule table (value bands, caps, cooldown)
- Owner: PO + Game Design + Dev Lead
- Estimate: 3 points
- Acceptance:
  - Rule table approved and versioned

B-2. Build parent budget presets (light/balanced/ambitious)
- Owner: Frontend + Backend Engineer
- Estimate: 5 points
- Acceptance:
  - Presets selectable and persisted
  - Validation prevents invalid budget states

B-3. Add streak multiplier cap + anti-gaming checks
- Owner: Backend Engineer
- Estimate: 5 points
- Acceptance:
  - Cap and cooldown enforced in finalize logic
  - Anti-gaming checks logged for review

B-4. Add reward transparency UI ("How reward was calculated")
- Owner: UX/UI + Frontend
- Estimate: 3 points
- Acceptance:
  - Calculation breakdown shown clearly before finalize
  - Content validated for child-safe clarity

## Epic C - Growth-First Motivation Redesign (P1)
C-1. Design growth-first panel (personal best, improvement, consistency)
- Owner: UX/UI Lead
- Estimate: 3 points
- Acceptance:
  - Wireframes + interaction states approved

C-2. Implement growth-first panel behind feature flag
- Owner: Frontend Engineer
- Estimate: 5 points
- Acceptance:
  - Panel available for pilot cohorts only
  - Event tracking integrated

C-3. Add family co-op mission card
- Owner: Frontend + Product
- Estimate: 5 points
- Acceptance:
  - Shared mission progress visible in kid and/or parent surfaces

## Epic D - Adaptive Suggestions v1 (P1)
D-1. Define rules for next-best-task suggestions
- Owner: PO + Game Design + Dev Lead
- Estimate: 3 points
- Acceptance:
  - Rule spec complete with examples and edge cases

D-2. Implement suggestion engine (rules-based)
- Owner: Backend/Frontend Engineer
- Estimate: 8 points
- Acceptance:
  - Suggestions generated from completion history/missed tasks
  - Parent override supported

D-3. Surface suggestion UI in `DailyView` and kid view
- Owner: Frontend + UX/UI
- Estimate: 5 points
- Acceptance:
  - Suggestion card and acceptance actions are usable and tracked

## Epic E - IA/UI Cleanup (P1)
E-1. `DailyView` flow simplification
- Owner: UX/UI + Frontend
- Estimate: 5 points
- Acceptance:
  - Primary actions are visually prioritized
  - Secondary actions moved to progressive disclosure

E-2. `KidDashboard` progress and milestone clarity pass
- Owner: UX/UI + Frontend
- Estimate: 5 points
- Acceptance:
  - Today/this week/next milestone hierarchy is visible

E-3. `KidProfile` clarity pass for settings and reward rules
- Owner: UX/UI + Frontend
- Estimate: 3 points
- Acceptance:
  - Profile and reward-related settings are easier to understand

## Sprint Proposal (Initial)
Sprint 1:
- A-1, A-2, A-3, B-1

Sprint 2:
- A-4, B-2, B-3, B-4

Sprint 3:
- C-1, C-2, C-3

Sprint 4:
- E-1, E-2, E-3

Sprint 5:
- D-1, D-2

Sprint 6:
- D-3 + stabilization + winner/rollback decisions

## Scrum Master Checkpoints
- Daily standup focus: blockers, dependency risk, experiment integrity
- Mid-sprint: verify event quality before feature completion claims
- End-sprint: run KPI impact review before scaling any pilot

## Impediment Log (Start)
1. Event naming conflicts across old/new analytics helpers.
2. Potential backend changes needed for reward cap enforcement.
3. UX copy review bandwidth for child-safe messaging.

## Immediate Next Actions
1. PO confirms priority and trade-offs for Sprint 1 scope.
2. Scrum Master schedules sprint planning with required roles.
3. Dev Lead provides technical estimates/risk notes for A/B epics.
4. Team locks acceptance tests for telemetry and reward calculations.
