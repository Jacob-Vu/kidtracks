# KidsTrack — Leadership Opportunities Map
**Date:** 2026-03-18
**Author:** Research Strategist
**Format:** NOW / NEXT / LATER opportunity tiers with hypothesis, evidence, and expected outcome

---

## How to Read This Map

- **NOW:** High impact, low effort. Do these in the next 2 weeks. They are largely de-risked by existing architecture and require either small engineering tasks or no engineering at all.
- **NEXT:** High impact, meaningful effort. Do these in weeks 3-8. Require product and engineering investment but have clear evidence of value.
- **LATER:** Lower confidence or higher complexity. Worth the investigation but should wait until NOW and NEXT are producing measurable results.

Each item covers: what it is, the hypothesis, the evidence supporting it, and the expected outcome.

---

## NOW — High Impact / Low Effort (Weeks 1-2)

### NOW-1: Fix Fabricated Social Proof on Landing Page

**Category:** Product / Trust

**What it is:** Replace or remove hardcoded static constants in `SocialProofSection.jsx` (families count, tasks completed, avg streak) with either real Firestore aggregates or qualitative trust signals.

**Hypothesis:** A parent who notices the fabricated metrics and shares this in a Vietnamese parent Facebook group will cause a trust collapse in the community that would take months to recover from. The risk of inaction exceeds the 1-day cost of the fix.

**Evidence:** BUG-002 fixed the i18n keys for social proof metrics — but the data values themselves remain hardcoded constants, not live aggregates. This is explicitly flagged as a trust liability in `business-product-evaluation-2026-03-18.md`, `business-growth-plan-2026-03-18.md`, `growth-po-next-big-releases-2026-03-18.md`, and `strategic-research-deep-dive-2026-03-18.md`. The source is publicly inspectable by any developer.

**Expected outcome:** Brand risk eliminated before acquisition push amplifies landing page traffic. If real user numbers are low, replacing with qualitative signals ("Trusted by Vietnamese families, built for bilingual homes") plus 1-2 named beta testimonials is more credible than fabricated aggregates regardless.

**Effort:** 1 engineering day (Firestore aggregate query) or 4 hours (content replacement).

---

### NOW-2: Commission Native-Speaker Vietnamese Copy Review

**Category:** Product / Trust / GTM

**What it is:** Have a native-speaking Vietnamese parent (target demographic: 28-40, urban, 1-3 kids) review all Vietnamese UI copy in `vi.js` for tone, naturalness, and cultural alignment.

**Hypothesis:** Developer-written Vietnamese copy that sounds unnatural or formal will undermine trust the moment KidsTrack is shared in Vietnamese parent communities. The parent community will notice and comment — this is especially true for copy about children and family life, where Vietnamese vernacular is highly specific to the speaker's relationship with the audience.

**Evidence:** UX audit status report explicitly flags: "i18n copy tone: new Vietnamese keys added by developer — should be reviewed by a native speaker before production." Fourteen new `dash.*` keys and multiple badge keys were added in the 2026-03-18 UX session, all developer-written. BUG-006 notes badge copy was written to match existing style but without content validation.

**Expected outcome:** Higher conversion from Vietnamese parent community posts. Fewer negative comments about "feels like a foreign app translated by a machine." Vietnamese authenticity is a core brand promise — the copy must deliver it.

**Effort:** 2-3 hours of a native speaker's time. Cost: ~$30-$50 if contracted, zero if done by a founder or advisor.

---

### NOW-3: Deploy Founder Into Vietnamese Parent Facebook Groups

**Category:** GTM / Acquisition

**What it is:** The founder or a designated content lead posts an authentic "30-day family story" in 2-3 target Vietnamese parent Facebook groups, with real screenshots of the app in use, honest account of what worked and what didn't, and a natural mention of KidsTrack.

**Hypothesis:** Authentic peer content in high-trust parent communities converts at 5-10x the rate of paid advertising in the same communities because members have near-zero ad blindness for peer stories. A genuine story from a parent who used the product will generate hundreds of signups in 2-3 weeks at zero cost.

**Evidence:** `business-growth-plan-2026-03-18.md` identifies this as the #4 recommendation with highest speed-to-result. `growth-po-next-big-releases-2026-03-18.md` confirms "Vietnamese parent Facebook groups" as the fastest zero-cost acquisition channel. Target groups have 200k-500k+ members each (Nuôi con kiểu Tây, Nhà có con nhỏ, Hội các mẹ Hà Nội). `business-growth-plan-2026-03-18.md` notes Zalo Groups seeding as second channel given 74M Vietnamese users.

**Expected outcome:** 50-300 signups in 2-3 weeks at zero cost. Signal on which user story resonates most (which drives acquisition copy for subsequent channels). First real testimonials from community members who try the product (replacing fabricated social proof).

**Effort:** 4-6 hours to write genuine content, zero engineering, zero budget.

---

### NOW-4: Check and Document Firebase Monthly Cost Basis

**Category:** Business / Operations

**What it is:** Log into Firebase console, pull the current monthly Firestore reads/writes, Functions invocations, and Hosting bandwidth. Document the cost basis. Set a monthly alert at a defined threshold.

**Hypothesis:** The team is currently operating without knowledge of its infrastructure cost trajectory. As acquisition accelerates, costs will scale. Without a baseline, there is no way to know when the cost cliff arrives — and Firebase costs can spike unexpectedly when Firestore read patterns are inefficient.

**Evidence:** `business-product-evaluation-2026-03-18.md` explicitly identifies Firebase cost scaling as a medium-high risk: "At ~10,000 active families × 2 kids × 10 tasks/day × 30 days = ~6M Firestore reads/month." No document in the corpus mentions the current actual cost figure. This is a known unknown that has zero engineering cost to answer.

**Expected outcome:** Clear runway estimate before costs become problematic. Informed decision on whether to add React Query/SWR caching before or after the acquisition push.

**Effort:** 30 minutes. No engineering required.

---

### NOW-5: Lock the Founding Premium Campaign Parameters

**Category:** Monetization / Product

**What it is:** Make four explicit decisions required before the paywall can be built: (a) trial duration — 90 days as specified in `content-tech-lead-plan-2026-03-18.md` or shorter; (b) eligibility ceiling — 300 or 500 families; (c) auto-downgrade behavior at trial end; (d) reminder email sequence timing (day 60, 75, 85).

**Hypothesis:** The Founding Premium campaign is the correct launch mechanic for a product with no public testimonials yet — it generates goodwill, creates urgency, and gives early families a genuine premium experience that converts at higher rates than an immediate paywall. But it cannot be built until these four parameters are locked. Indecision here blocks the entire monetization roadmap.

**Evidence:** `content-tech-lead-plan-2026-03-18.md` Section 5 explicitly lists these as "Required Decisions (Blocking Inputs)." The integrated timeline in that document shows these decisions needed by 2026-03-20. The `growth-po-next-big-releases-2026-03-18.md` Release 1 scope includes 14-day trial as a baseline, but the Founding Premium 90-day variant is a distinct and superior strategy for the current user acquisition phase.

**Expected outcome:** Engineering can begin paywall implementation with clear scope. No rework from mid-build scope changes. Content lead can begin writing paywall copy, pricing page, and reminder email sequence in parallel.

**Effort:** 1 meeting, 2 hours. Output: a decision document with four locked parameters.

---

### NOW-6: Validate Vietnamese Diaspora Segment With a Single Community Post

**Category:** Market / GTM

**What it is:** Post one authentic message in a large Vietnamese-American parent Facebook group (or Vietnamese diaspora Zalo group) describing KidsTrack as "the only bilingual Vietnamese-English family app for teaching kids chores and pocket money." Include a link to the landing page. Measure signups from that source for 1 week.

**Hypothesis:** The Vietnamese diaspora segment will show meaningfully higher willingness to pay ($5.99-$8/month USD) than domestic Vietnam users, given Western income levels and the absence of any competing bilingual product. Validating this with one community post costs 30 minutes and either confirms or refutes the highest-value market hypothesis before engineering a USD payment tier.

**Evidence:** `business-product-evaluation-2026-03-18.md` rates diaspora as the highest-ARPU segment with 50% premium over Vietnam pricing. `business-growth-plan-2026-03-18.md` identifies diaspora communities in US/Australia/Canada/France as priority target with specific channel guidance. No validation of this hypothesis exists yet — the segment is entirely theoretical. One post answers the question.

**Expected outcome:** Either (a) 20+ signups from diaspora community within 7 days, validating the segment and justifying Stripe USD tier engineering; or (b) minimal response, saving weeks of engineering on a hypothesis that turned out to be wrong.

**Effort:** 30 minutes. Zero engineering. Zero cost.

---

## NEXT — High Impact / High Effort (Weeks 3-8)

### NEXT-1: Build and Ship the Freemium Paywall

**Category:** Monetization

**What it is:** Implement the full freemium paywall: `isPremium` flag in Firestore user document, `useSubscription()` hook gating premium features, paywall modal with 3 compelling features + price display + CTA, manual payment flow via VNPay/MoMo/bank transfer, and 14-day free trial (or 90-day Founding Premium) trigger at signup.

**Hypothesis:** A meaningful cohort of active families (8-12%) will convert to premium within the first 30 days of paywall launch, given the feature gate creates genuine upgrade incentives (second child, savings goals, full badge set, smart weekly report tips).

**Evidence:** The paywall analytics events (`paywall_seen`, `paywall_converted`, `trial_started`) are already wired in `useAnalytics.js` but will never fire without a paywall UI. Feature gate hypothesis is fully documented in `business-product-evaluation-2026-03-18.md` with per-feature free/premium mapping. Pricing rationale (₫99k/month below Vietnamese psychological ceiling) is documented in `business-growth-plan-2026-03-18.md`. The `growth-po-next-big-releases-2026-03-18.md` Release 1 KPI targets: paywall view rate ≥25% of parent sessions, conversion ≥6% from paywall views, Day-7 retention drop ≤5% from pre-paywall baseline.

**Expected outcome:** First MRR within 30 days of launch. Conversion data that informs pricing optimization (EXP-005: ₫79k vs ₫99k vs ₫149k). Firebase costs become sustainable against revenue. The business becomes defensible.

**Effort:** 5-7 days engineering (paywall modal, `useSubscription()` hook, feature gates, manual payment instructions). 1-2 days content (copy for paywall modal, pricing page, onboarding email sequence). Parallel content and engineering tracks.

---

### NEXT-2: Weekly Report Share Card with Referral Incentive

**Category:** Retention / Activation / GTM

**What it is:** Add a designed share image card generated client-side (Canvas API) showing family completion %, top kid name/avatar, streak count, week number, and KidsTrack branding. Embed in the Monday weekly report modal with "Share our family's week" and "Invite a family → you both get 1 month free" buttons. Generate unique referral links per account with Firebase Dynamic Links or equivalent.

**Hypothesis:** Vietnamese parents share family achievements on Zalo, Facebook, and family WhatsApp groups regularly. A designed share card showing "Our family completed 87% of tasks this week 🔥" will spread organically in parent communities and generate referral signups at a viral coefficient of K=0.25+ within 8 weeks.

**Evidence:** The weekly report share exists as a soft text-copy mechanism only (clipboard copy of text summary). The Monday auto-popup modal is already shipped. `business-growth-plan-2026-03-18.md` identifies this as Recommendation #3 and the highest-leverage growth lever: "the highest-leverage growth lever" with direct reference to Zalo's 74M users. `growth-po-next-big-releases-2026-03-18.md` Release 2 KPI: weekly report share rate ≥20% of weekly active parents, referral signup share ≥15% of new signups.

**Expected outcome:** Weekly acquisition from referral begins within 6 weeks. Monday becomes the most important day in the growth cadence — both for retention (report ritual) and acquisition (share loop). Viral coefficient trends from 0 toward K=0.25.

**Effort:** 1 week engineering (Canvas API share card, referral link generation, attribution tracking). 3 days content (share card copy, referral program copy EN/VI, incentive messaging).

---

### NEXT-3: Wire Real Data to Social Proof and Ship Named Testimonials

**Category:** Product / Trust / Conversion

**What it is:** Build a Firestore Cloud Function that aggregates real metrics (total families, tasks completed, avg streak) into a summary document, updated daily. Replace hardcoded constants in `SocialProofSection.jsx` with live reads from this aggregate document. Simultaneously, collect 3-5 named testimonials with photos from real beta users.

**Hypothesis:** Real social proof metrics will convert landing page visitors at a meaningfully higher rate than fabricated numbers (or their removal), and the named testimonials will anchor the trust signal with specificity that aggregate numbers alone cannot provide.

**Evidence:** `growth-po-next-big-releases-2026-03-18.md` Release 2 KPI: "landing conversion improves ≥10% after trust section update." The social proof section was built to support this (5 landing page sections, testimonials with name/role/quote keys in `en.js`/`vi.js`). The i18n keys for testimonials (`landing.social.testimonial1.name`, `.role`, `.quote`) exist but are currently placeholder text.

**Expected outcome:** ≥10% improvement in landing page signup conversion. Brand risk of fabricated metrics eliminated permanently. Named testimonials provide quotable content for Facebook group posts and press outreach.

**Effort:** 2 days engineering (Cloud Function aggregate, Firestore summary doc, component update). 3 days content (recruiting real beta testimonials, writing/editing with users).

---

### NEXT-4: Full Monetization Analytics Dashboard

**Category:** Business Intelligence / Operations

**What it is:** Create a simple internal dashboard (can be a Firestore admin page, a Firebase console custom report, or a lightweight internal tool) showing the key monetization metrics in real time: WAF, trial starts, trial conversions, paywall view rate, paywall conversion rate, MRR, and churn.

**Hypothesis:** Without a real-time view of the monetization funnel, the team cannot make weekly decisions about pricing, feature gating, or trial length. The first 30 days of paywall data are the most valuable information the business will ever produce — they must be captured and acted on immediately.

**Evidence:** `growth-po-next-big-releases-2026-03-18.md` PO Backlog item #3 explicitly: "Monetization analytics dashboard." The business plan (`business-growth-plan-2026-03-18.md`) defines 5 tiers of KPIs (Acquisition, Activation, Engagement/Retention, Monetization, Referral/Virality) but no mechanism for viewing these in aggregate exists. Weekly review cadence is blocked without a visible dashboard.

**Expected outcome:** Weekly growth reviews become data-driven within 2 weeks of paywall launch. Pricing experiments (EXP-005) can be run with actual cohort data. The team stops guessing and starts optimizing.

**Effort:** 3-4 days (Firebase Analytics event validation + simple internal reporting view or Mixpanel free tier setup). Can be done in parallel with paywall engineering.

---

### NEXT-5: Google Play Store Presence via Capacitor Wrapper

**Category:** Distribution / Activation

**What it is:** Wrap the existing React PWA with Capacitor to produce a Google Play Store listing. Android is 90%+ of Vietnam smartphone market. App store search is where parents look for parenting tools. PWA home screen install is a workaround, not discovery — the app has zero app store visibility.

**Hypothesis:** App store presence (Google Play) will add a discovery channel that the PWA cannot replicate. Vietnamese parents searching "quản lý việc nhà cho trẻ" (chore management for kids) on Google Play will find KidsTrack in organic search results, generating signups that would not occur through web-only channels.

**Evidence:** `business-product-evaluation-2026-03-18.md` lists "No native app = discovery gap" as Weakness #6. `business-growth-plan-2026-03-18.md` P3.4 explicitly recommends Capacitor wrapper for Google Play. The Flutter mobile codebase exists but is not launch-ready and depends on local tooling — Capacitor wrapping the existing React app is faster and lower-risk. `growth-po-next-big-releases-2026-03-18.md` Release 3 includes "Mobile beta readiness checkpoint (internal Android beta, not public launch) after Release 1 and 2 KPIs are met."

**Expected outcome:** New organic discovery channel. Estimated 20-40% increase in signups from mobile-first users who prefer app store distribution. Credibility signal (app store presence signals legitimacy to Vietnamese parents who distrust web-only products).

**Effort:** 2-3 weeks (Capacitor setup, store listing creation, screenshots localized in EN/VI, Play Store review process). Highest effort in this tier. Block until Release 1 and Release 2 KPIs are met.

---

### NEXT-6: MoMo Payment Integration for Subscription Billing

**Category:** Monetization / Activation

**What it is:** Integrate MoMo payment gateway for recurring subscription billing, replacing the manual payment flow (VNPay, bank transfer) that is appropriate only for the initial launch phase.

**Hypothesis:** Credit card penetration in Vietnam is ~25%. Manual bank transfer for subscription payment creates 40-60% drop-off between "intends to pay" and "completes payment." MoMo integration (55M+ Vietnamese users) will materially increase paywall conversion by removing the payment friction that is the #1 unresolved conversion blocker in Vietnamese SaaS.

**Evidence:** `business-growth-plan-2026-03-18.md` P3.3 explicitly recommends MoMo integration: "Vietnamese parents are extremely comfortable with MoMo. This removes the payment friction that kills SaaS conversion in Vietnam." The manual payment approach is explicitly described as "start here, not stay here" in the paywall implementation plan.

**Expected outcome:** 20-40% increase in paywall conversion rate from current baseline after MoMo replaces manual payment flow. Annual plan take-up increases because paying ₫890,000 via MoMo in one tap is psychologically easier than arranging a bank transfer.

**Effort:** 2-3 weeks (MoMo API integration, webhook handling for subscription lifecycle, billing management UI). Requires MoMo merchant account registration (1-2 weeks lead time separate from engineering).

---

## LATER — Lower Impact or Speculative (Quarter 3+ 2026)

### LATER-1: B2B Classroom Pilot for Vietnamese Primary Schools

**Category:** Monetization / Product Expansion

**What it is:** Develop a teacher admin role with class-wide task assignment, classroom leaderboard, weekly class report for teachers, and per-student parent view (read-only). Pilot with 5-10 primary schools in HCMC/Hanoi at ₫500,000/classroom/month.

**Hypothesis:** Vietnamese teachers managing classroom responsibilities (morning tasks, reading logs, homework tracking) will pay for a structured digital tool that replaces paper charts and provides parent-visible accountability. School contracts are high-ACV (~₫6M/school/year) and very low churn.

**Evidence:** `business-growth-plan-2026-03-18.md` P3.2 estimates 10 schools × 5 classrooms = ₫25M/month as the revenue potential. The task management and leaderboard features already exist — the teacher admin role is the primary engineering addition. `growth-po-next-big-releases-2026-03-18.md` explicitly scopes this out of Releases 1-3.

**Expected outcome:** ₫25M/month additional MRR from B2B channel by end of Q3. Brand credibility from institutional associations. Teacher network becomes a referral channel for parent users.

**Effort:** 6-8 weeks engineering (teacher role, class task model, school admin UI). 4-6 weeks BD (school outreach, pilot negotiation). Total: one quarter. Do not start before web PMF is validated.

---

### LATER-2: MoMo/ZaloPay Pocket Money Integration (Real Digital Wallet)

**Category:** Product Differentiation / Partnerships

**What it is:** Partner with MoMo or ZaloPay to allow pocket money earned in KidsTrack to be transferred to a child's real digital wallet account. The savings goal becomes a real financial goal, not just an in-app tracker.

**Hypothesis:** Making the pocket money mechanic real — where a child's KidsTrack balance connects to actual money in a MoMo account — would be a category-defining differentiator with no parallel in any competing family app globally. It transforms KidsTrack from a habit tracker into a fintech-adjacent family finance platform.

**Evidence:** The ledger, balance tracking, savings goals, and milestone celebration architecture are already built. `business-product-evaluation-2026-03-18.md` Opportunity #6 explicitly: "Partnerships with digital wallet/family finance apps in Vietnam (Momo, ZaloPay) to make the pocket money reward actually digital." MoMo has 55M users; ZaloPay has 10M+.

**Expected outcome:** Massive word-of-mouth ("my kid's KidsTrack savings went into his real MoMo account") and press coverage. Premium tier justified at ₫199,000/month. Partnership creates a distribution channel through MoMo's parent user base.

**Effort:** Partnership negotiation (3-6 months), API integration (4-6 weeks), regulatory review (child account compliance). High effort, high complexity. Speculative until MoMo/ZaloPay partner engagement confirms feasibility.

---

### LATER-3: SEA Language Expansion (Tagalog, Thai, Bahasa)

**Category:** Market Expansion

**What it is:** Add Southeast Asian languages to the existing i18n system (which already supports multiple locales) to expand KidsTrack into the Philippines, Thailand, and Indonesia markets.

**Hypothesis:** The i18n architecture is already built for multi-language support — adding a language is a sprint-size engineering task, not a rewrite. SEA markets (Philippines: 12M+ families with pocket money culture, Indonesia: 50M+ families, Thailand: 10M+ families) share pocket money culture and mobile-first behavior with Vietnam.

**Evidence:** `business-product-evaluation-2026-03-18.md` Opportunity #4: "Tagalog, Thai, Bahasa Indonesia are logical next languages." The i18n system (`en.js`, `vi.js` with full parity) is extensible. BUG-011 and the Vietnamese locale E2E testing confirm the i18n architecture handles non-Latin scripts correctly.

**Expected outcome:** New market segments totaling 70M+ family households. First-mover advantage in each language before funded US competitors localize.

**Effort:** Translation cost (3 languages × ~300 keys = ~900 translations per language × professional translation rate). 1 week engineering for locale switching extension. Primary constraint is translation quality, not engineering. Pursue only after Vietnam and diaspora PMF are validated.

---

### LATER-4: Vietnamese Parent Content Hub (SEO + Community)

**Category:** Acquisition / Brand

**What it is:** Build a content site (or blog subdomain) publishing Vietnamese-language parenting content around financial literacy for kids, household routines, and educational habit formation — with embedded KidsTrack CTAs. Target keyword clusters: "cách dạy con quản lý tiền," "ứng dụng quản lý việc nhà cho bé," "daily routine app for children bilingual."

**Hypothesis:** SEO content compounds over 6-12 months and provides zero-marginal-cost acquisition at scale. Vietnamese parents searching for parenting advice are exactly the target audience. A content hub also creates a community anchor that reduces churn — parents who read KidsTrack content weekly are harder to churn than parents who only use the app.

**Evidence:** `business-growth-plan-2026-03-18.md` P2.4 provides full keyword cluster analysis. 2-3 posts/week format. "These rank in 3-6 months and provide compounding organic acquisition."

**Expected outcome:** 500-2,000 monthly organic visitors within 6 months. Ongoing acquisition at near-zero marginal cost. Brand authority in Vietnamese parenting content space.

**Effort:** 2-3 hours/post × 2-3 posts/week = 6-9 hours/week ongoing. This requires a dedicated content lead — the single hire that `business-growth-plan-2026-03-18.md` recommends as "worth more than a second engineer in the next 6 months."

---

### LATER-5: Corporate/Employer Benefit Program

**Category:** Monetization / B2B

**What it is:** Package KidsTrack as an employee family benefit, sold to Vietnamese companies as part of their HR benefits portfolio. "KidsTrack for your employees' families."

**Hypothesis:** Family productivity tools are increasingly part of employee benefit packages in Vietnamese tech companies. An HR buyer purchasing 200+ family accounts at a discounted rate (₫50,000/family/month) provides predictable B2B revenue and accesses the company's parent employee population without consumer acquisition cost.

**Evidence:** `business-product-evaluation-2026-03-18.md` Opportunity #7: "Corporate/employer benefit programs. Family productivity tools are increasingly part of employee benefits packages." No further validation exists in the corpus — this is a hypothesis without evidence.

**Expected outcome:** Speculative. If one large tech company adopts (e.g., VNG, Momo itself, FPT), that could mean 500-1,000 family accounts at ₫50,000/month = ₫25-50M MRR from a single deal. But HR sales cycles in Vietnam are 3-6 months, and this is a distribution bet without supporting data.

**Effort:** 4-6 weeks BD. Requires packaging, HR-buyer-facing marketing materials, and enterprise-grade account management. Pursue only in Q4 2026 after consumer unit economics are proven.

---

### LATER-6: Task Pack Marketplace (UGC + Community)

**Category:** Product / Retention / SEO

**What it is:** Allow premium parents to publish their custom family task templates as public "packs" discoverable by other families. Build a simple marketplace or gallery of community-created packs alongside the existing default packs.

**Hypothesis:** User-generated task packs create community investment in the product (contributors don't churn), drive SEO from long-tail task-specific content ("morning routine for 8-year-old"), and reduce the cold-start problem for new families by expanding the template catalog without product team effort.

**Evidence:** The template system (family templates tab, template picker with search/filter/preview) is already fully built — `src/pages/Templates.jsx` with `activeTab` state for "default" / "family" tabs. `business-product-evaluation-2026-03-18.md` Opportunity #5: "A curated task packs marketplace where parents share their family templates."

**Expected outcome:** Compounding SEO traffic from pack-specific landing pages. Community retention benefit from pack contributors. Template catalog expands from 5 default packs to 50+ community packs within 6 months.

**Effort:** 3-4 weeks engineering (publish flow, public gallery, moderation queue, SEO-friendly pack pages). Not high urgency compared to monetization and referral — pursue in Q3 2026.
