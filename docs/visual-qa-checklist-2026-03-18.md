# KidsTrack Visual QA Checklist (Pre-Deploy) — 2026-03-18

## 1) Viewports
- [ ] **320px**: No clipped primary CTA, no horizontal page overflow, card padding reduces to 16px
- [ ] **375px**: Chip rows and filters scroll with visible affordance; card grids go 1-column
- [ ] **768px**: Card grids and headers align with consistent spacing; sidebar hidden; bottom nav visible
- [ ] **1024px**: Full sidebar shown, multi-column grids, section hierarchy visually clear

## 2) Visual Hierarchy — Parent Dashboard
- [ ] Order is: Primary Actions → Kids Summary → Weekly Summary → Goals → Leaderboard → Performance Report
- [ ] Primary action buttons use `btn-primary` for main action, `btn-secondary` for secondary
- [ ] No two `btn-primary` buttons side by side in same row (except header with clear separation)

## 3) Visual Hierarchy — Kid Dashboard
- [ ] Order is: Hero card → Routine banner → **Today's Tasks** → 10-day strip → Goal → Badge Strip → Leaderboard → History → Journal
- [ ] Today's Tasks appear BEFORE progress history and savings goal
- [ ] "Add Task" is `btn-primary`, "Save Routine" is `btn-ghost`

## 4) Landing Page CTA Funnel
- [ ] Hero section has exactly one `btn-primary` CTA: "🚀 Start free" / "Bắt đầu miễn phí"
- [ ] Nav bar "Sign in" uses `btn-secondary btn-sm`
- [ ] Bottom CTA section uses `btn-primary` (not secondary)
- [ ] Footer "Sign in" uses `btn-secondary btn-sm`

## 5) Button Hierarchy — All Pages
- [ ] `btn-primary`: filled purple gradient — used for primary action only
- [ ] `btn-secondary`: outlined purple tint — used for important alternatives
- [ ] `btn-ghost`: transparent with border — used for cancel, back, minor actions
- [ ] `btn-danger`: red gradient — used only for delete/remove

## 6) Accessibility — Focus States
- [ ] Tab through Dashboard: every button, chip, link, input shows visible focus ring
- [ ] Tab through KidDashboard: task checkboxes have focus ring
- [ ] Tab through KidProfile: toggle sliders have focus ring via `input:focus-visible + slider`
- [ ] Tab through Templates: chip filter buttons, pack cards have focus ring
- [ ] Tab through TemplatePicker: all tpicker-row elements reachable by keyboard
- [ ] Modal close button has focus ring
- [ ] Theme swatches have focus ring

## 7) Accessibility — Contrast
- [ ] All `--text-primary` text on card surfaces: ✅ passes AA (14:1)
- [ ] All `--text-secondary` text: ✅ passes AA (8:1)
- [ ] `--text-muted` used only for captions/decorative labels, not primary info
- [ ] Badge text on colored backgrounds: check `badge-purple`, `badge-green`, `badge-amber`
- [ ] Button text on gradient backgrounds: white on purple passes (5.5:1)

## 8) i18n — No Raw Keys Visible
- [ ] Switch app to EN: no raw `key.subkey` visible in any page
- [ ] Switch app to VI: no raw `key.subkey` visible in any page
- [ ] EN/VI parity: `dash.primaryActionsTitle`, `dash.kidsSummaryTitle`, `dash.reportAvg`, `dash.reportDayStreak`, `dash.reportLast30`, `dash.reportToday`, `dash.reportLegendFull`, `dash.reportLegendPartial`, `dash.reportLegendNone`, `dash.reportLegendNoTasks`
- [ ] `leaderboard.improvedBy` uses `{value}` param (fixed from `{pct}`)
- [ ] Dashboard KidReport component uses `t()` for all display strings

## 9) Motion & Kid Safety
- [ ] Toggle low-stimulation mode: confetti hidden, celebration animation suppressed, streak pulse removed
- [ ] `prefers-reduced-motion: reduce` OS setting: all animations disabled globally
- [ ] Feedback sounds follow KidProfile toggle setting (`LS_FEEDBACK_SOUND` localStorage key)
- [ ] Low-stim mode badge unlock toast uses `badge-unlock-toast--reduced` class (no animation)
- [ ] Kid Dashboard rendered with `data-feedback-reduced-motion` attr set to match `reducedMotion` state

## 10) Templates Page — Tabs
- [ ] Default Packs tab and Family Templates tab functional
- [ ] Switching tabs correctly shows/hides sections
- [ ] Empty state shown in Family Templates when no templates exist
- [ ] Kid filter dropdown in Family Templates filters correctly

## 11) TemplatePicker — Mobile Chip Overflow
- [ ] Chip row scrolls horizontally on mobile (≤640px)
- [ ] Hint text "Swipe to see more packs" visible on mobile
- [ ] Fade overlay visible at right edge of chip row
- [ ] All chips accessible via touch/scroll

## 12) NotificationSettings
- [ ] Toggle shows/hides time pickers correctly
- [ ] Default state text clearly says reminders are OFF by default for parents
- [ ] `permDenied` error shown when browser blocks notifications
- [ ] Time inputs saved correctly to localStorage

## 13) KidProfile
- [ ] Avatar grid wraps properly on mobile (all 24 avatars visible)
- [ ] Avatar buttons have aria-label and aria-pressed attributes
- [ ] Feedback sound toggle and low-stim toggle both have aria-label
- [ ] Sound toggle default: ON (true)
- [ ] Low-stim toggle default: OFF (false)
- [ ] Theme picker swatches interactive and keyboard accessible

## 14) Final Technical Gate
- [ ] `npm run build` — no errors (only pre-existing chunk size warning acceptable)
- [ ] No TypeScript/ESLint errors in changed files
- [ ] Build artifact generated in `dist/`
- [ ] Service worker generated (`dist/sw.js`)
