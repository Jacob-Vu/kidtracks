# UI Polish Execution Plan (Non-Mobile + Shared Web UI)

Date: 2026-03-17
Owner: Codex

## Goal
Make the product look more professional and visually consistent by reducing style drift, improving hierarchy, and refining mobile quality.

## Phase 1 (Implement Now)
1. Introduce stronger design tokens in `src/index.css`:
   - Typography scale tokens (`--text-xs` to `--text-4xl`)
   - Spacing tokens (`--space-1` to `--space-8`)
   - Softer glow/shadow tokens
2. Improve baseline visual quality:
   - Slightly reduce heavy glow/gradient intensity
   - Normalize key heading and body sizes to token-based scale
3. Improve mobile bottom nav quality:
   - Increase label readability
   - Improve touch feedback and active state clarity
4. Add motion accessibility:
   - `prefers-reduced-motion` fallback to minimize motion effects

## Phase 2 (Next)
1. Replace high-volume inline styles with semantic utility classes:
   - Section headers
   - Metric cards and value text
   - Shared action rows
2. Split CSS for maintainability:
   - `styles/tokens.css`
   - `styles/layout.css`
   - `styles/components.css`
   - `styles/pages/*.css`

## Phase 3 (Verification)
1. Visual QA checklist:
   - Desktop (1280+), tablet, mobile
   - Parent and kid flows
2. Accessibility QA:
   - Keyboard traversal visible/focused
   - Reduced-motion behavior
3. E2E screenshots for regression baseline

## Success Criteria
- UI looks consistent across core pages.
- Mobile nav readability and touch confidence improve.
- Motion and glow effects feel intentional, not noisy.
- Future styling is easier due to tokenized foundation.
