# KidsTrack UX/UI and Product Owner Discussion + New Requirement Plan
Date: 2026-03-20
Participants: UX/UI Lead, Product Owner, Growth Director (observer)
Scope: Web app (non-mobile codebase), gamification and daily habit experience
References:
- docs/gamification-review-2026-03-19-2126.md
- docs/growth-director-review-and-product-plan-2026-03-20.md
- imp_plan/REPO_MEMORY_NON_MOBILE.md

## 1) Discussion Summary (UX/UI x Product Owner)

## 1.1 Shared objective
- Improve kid habit retention and task completion consistency while preserving parent trust and reducing family friction.

## 1.2 UX/UI Lead perspective
- The current experience has good motivation signals, but progression meaning is not visible enough day-to-day.
- Rank-heavy comparison should be reduced for younger users; growth and teamwork need stronger visual priority.
- Reward mechanics need clearer transparency so kids and parents understand why rewards change.
- Daily workflow has opportunities to reduce cognitive load and decision fatigue.

## 1.3 Product Owner perspective
- Priority is business impact with measurable KPIs, not feature volume.
- New requirements must be phased, feature-flagged, and instrumented before broad rollout.
- Economy controls and telemetry are prerequisites before scaling social/adaptive mechanics.
- We should deliver quick wins in `DailyView` and kid-facing surfaces first, then expand.

## 1.4 Alignment decisions
1. Sequence of delivery: telemetry -> economy guardrails -> growth-first motivation -> adaptive suggestions.
2. UX principles: growth over rank, explainability of rewards, low-friction daily flow, child-safe copy.
3. Product principles: each feature must include KPI target, guardrails, event tracking, and rollout plan.

## 2) New Requirement Plan

## 2.1 Epic A - Telemetry and Experiment Foundation (P0)
Goal: make product and UX decisions measurable.

Requirements:
- A1. Define and implement event schema for:
  - `progress_viewed`, `streak_viewed`, `badge_viewed`
  - `leaderboard_mode_viewed` (rank/growth/co-op)
  - `reward_rule_applied`, `reward_cap_triggered`
  - `adaptive_suggestion_shown`, `adaptive_suggestion_accepted`
- A2. Add experiment metadata support in analytics (`experiment_id`, `variant_id`, `cohort_age_band`).
- A3. Build dashboard slices by age band (6-8, 9-11, 12-14) and engagement tier.

Acceptance criteria:
- Critical event coverage >=95% on `DailyView`, `KidDashboard`, and reward finalization flows.
- Dashboard answers D1/D7/D30 return, streak survival, reward variance, and social sentiment proxies.

Dependencies:
- Engineering + Data alignment on event naming and taxonomy.

## 2.2 Epic B - Reward Economy Guardrails and Clarity (P0)
Goal: stabilize economy and improve trust.

Requirements:
- B1. Introduce parent budget presets: `light`, `balanced`, `ambitious`.
- B2. Define task value bands by effort level (small/medium/high).
- B3. Add streak multiplier cap and cooldown rule.
- B4. Add in-UI explanation component: "How reward was calculated today" on day finalize screen.
- B5. Show budget status indicator (within range / approaching cap / over cap risk).

Acceptance criteria:
- Reward spend variance trends toward target band within 2 sprints.
- Parents can explain reward outcomes without support intervention.
- No statistically significant drop in D7 return after rollout.

Dependencies:
- Product rule table approved before UI implementation.

## 2.3 Epic C - Growth-First Motivation Redesign (P1)
Goal: keep motivation high while reducing harmful comparison.

Requirements:
- C1. Replace default rank-first panel with growth-first panel:
  - personal best streak
  - weekly improvement delta
  - consistency score
- C2. Add family co-op mission card with shared progress.
- C3. Keep optional rank view for older cohorts behind flag.
- C4. Update copywriting to avoid shame/punitive framing.

Acceptance criteria:
- Growth panel adoption >60% in exposed cohorts.
- Negative social-comparison feedback remains below safety threshold.
- Engagement uplift in at least one cohort without budget/safety regression.

Dependencies:
- Epic A instrumentation in place.

## 2.4 Epic D - Adaptive Suggestions v1 (P1)
Goal: reduce boredom and improve streak survival.

Requirements:
- D1. Add rules-based "Next best task" suggestions in `DailyView` and kid view.
- D2. Suggestion logic uses recent completion history and missed-task patterns.
- D3. Add frequency controls to avoid overloading kids with too many tasks.
- D4. Provide parent override for suggested tasks.

Acceptance criteria:
- Suggestion acceptance rate meets baseline target after 2 weeks.
- Median streak and week-2 retention improve in pilot cohort.
- No increase in parent conflict signals.

Dependencies:
- Task history quality and consistent event logging.

## 2.5 Epic E - Information Architecture and UI Cleanup (P1)
Goal: make daily progress obvious and reduce friction.

Requirements:
- E1. `DailyView`: prioritize task completion flow, move secondary actions to progressive disclosure.
- E2. `KidDashboard`: elevate today's progress, streak health, and next milestone.
- E3. `KidProfile`: improve clarity for profile settings and reward rules visibility.
- E4. Add a consistent "Progress Language" design pattern (today/this week/next milestone).

Acceptance criteria:
- Time-to-complete core daily flow decreases.
- Fewer navigation back-and-forth actions per session.
- Qualitative parent and kid comprehension improves in usability checks.

Dependencies:
- UX wireframes and copy review.

## 3) Delivery Schedule (6 Sprints)

Sprint 1:
- Epic A (schema + instrumentation on key flows)
- Start Epic B (rule definitions and wireframes)

Sprint 2:
- Epic A dashboard completion
- Epic B implementation + limited rollout

Sprint 3:
- Epic B full rollout (if guardrails pass)
- Epic C design and experiment setup

Sprint 4:
- Epic C pilot rollout (growth-first mode + co-op card)
- Epic E cleanup in `DailyView`

Sprint 5:
- Epic D pilot rollout (adaptive suggestions v1)
- Epic E updates in `KidDashboard` and `KidProfile`

Sprint 6:
- Evaluate pilots, scale winners, rollback weak variants
- Finalize v1 playbook for growth-safe gamification

## 4) Requirement Quality Template (must be attached to each ticket)
- Problem statement
- User segment and scenario
- UX behavior and UI states (loading, empty, success, failure)
- Analytics events and experiment tags
- KPI target and guardrails
- Rollout plan and rollback condition
- Accessibility and child-safe language checklist

## 5) Risks and Controls
- Risk: shipping too many behavior changes together
Control: limit to max 2 high-impact experiments per sprint.

- Risk: engagement improves but trust declines
Control: parent conflict + budget variance are hard stop metrics.

- Risk: complexity in adaptive logic
Control: rules-based v1 only; no ML until stable signal quality.

## 6) Immediate Next Actions (This Week)
1. Product Owner: approve Epic A/B requirement details and KPI thresholds.
2. UX/UI Lead: deliver wireframes for reward clarity and growth-first motivation surfaces.
3. Engineering Lead: implement telemetry events in key flows behind versioned schema.
4. Data Analyst: publish baseline dashboard with cohort cuts.
5. Growth Director: run first go/no-go review for Sprint 2 rollout.
