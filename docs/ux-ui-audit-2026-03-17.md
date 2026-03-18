# KidsTrack UX/UI Audit — 2026-03-17

## Tổng quan

**Điểm tổng thể: 8.2/10**
- UX: 8.4 | UI: 7.9 | Style system: 8.1

---

## Đánh giá theo trang

### A. Landing Page (8/10)
✅ Social proof, testimonial, bilingual
✅ CTA rõ ràng
⚠️ Hero nên rút gọn copy — 1 headline + 1 sub + 1 CTA chính
⚠️ Nhiều CTA ngang hàng => giảm conversion
**Fix:** giữ 1 CTA primary "Bắt đầu miễn phí", CTA phụ dạng ghost

### B. Login / Auth Gate (7.5/10)
✅ Multi-method auth (Google/Apple/Facebook/Email/Simple)
✅ Kid login flow riêng
⚠️ Error/help text style chưa thống nhất
⚠️ Trạng thái unauth (landing vs login) chưa rõ
**Fix:** chuẩn hóa microcopy + đường quay lại

### C. Parent Dashboard (7.5/10)
✅ Weekly modal, Notifications, Report CTA, leaderboard, goals
⚠️ Nhiều card ngang level → khó biết ưu tiên
⚠️ Visual hierarchy phân tán
**Fix:** reorder: actions → kids summary → weekly → secondary tools. Spacing 8pt grid.

### D. Daily View (8.5/10)
✅ Task flow rõ, finalize/config tốt
✅ Streak badge, routine auto-load
⚠️ Action buttons đôi lúc trùng nhịp thị giác
**Fix:** 1 primary action mỗi cụm

### E. Template Picker (8.5/10)
✅ Filter theo pack + search diacritics-safe
✅ Preview song ngữ
⚠️ Chip overflow trên mobile cần scroll affordance
**Fix:** thêm fade gradient ở cuối chip row

### F. Templates Page (7.5/10)
✅ Import packs + family templates đầy đủ
⚠️ Trang dài, cognitive load cao
**Fix:** tách thành 2 tabs "Default Packs" / "Family Templates"

### G. Ledger (8.5/10)
✅ Summary + transaction list dễ đọc
✅ Manual add flow tốt
⚠️ Thuật ngữ penalty/deduct chưa nhất quán EN/VI
**Fix:** chuẩn hóa terminology

### H. Kid Dashboard (8/10)
✅ Engagement loop mạnh: goal + badges + feedback + streak + leaderboard
⚠️ Nhiều tín hiệu cùng lúc → visual noise cho bé nhỏ
**Fix:** thêm "low stimulation mode" trong kid settings

### I. Kid Profile (8/10)
✅ Theme picker + sound toggle + badge gallery
✅ Password/email management
⚠️ Avatar grid dày
**Fix:** grouping hoặc collapse avatar grid

### J. Weekly Report (8.5/10)
✅ Week navigation, trend, insights, tips, share/copy
✅ Monday auto-popup modal
⚠️ No-data state nên có CTA hướng dẫn
**Fix:** thêm CTA "Giao việc cho con" khi no-data

---

## Style System Audit

### Đang tốt
- Theme tokens xuyên suốt (5 themes)
- Chip/button/card pattern lặp lại
- Brand tone "friendly-family" rõ

### Cần chuẩn hóa
1. **Typography scale** — H1/H2/body/caption lệch ở vài trang
2. **Button hierarchy** — primary/secondary/ghost đôi lúc chưa nhất quán
3. **Status colors** — semantic success/warning/error cần khóa token chặt hơn
4. **Motion policy** — confetti/animation/sounds cần global policy theo profile (kid vs parent)

---

## Accessibility Quick Check

| Hạng mục | Status |
|----------|--------|
| Color contrast (text) | ⚠️ Cần audit WCAG AA |
| Focus states | ⚠️ Một số button thiếu visible focus ring |
| Reduced motion | ✅ Có toggle sound, nhưng animation chưa respect prefers-reduced-motion toàn diện |
| Screen reader | ⚠️ Một số aria-label hardcode EN |
| Touch targets | ✅ Hầu hết >= 44px |

---

## Ưu tiên cải thiện

### P0 — Làm ngay (2-3 ngày)
- [ ] Chuẩn hóa visual hierarchy Dashboard + KidDashboard (reorder cards)
- [ ] Chuẩn hóa button hierarchy toàn app (primary/secondary/ghost rules)
- [ ] Audit contrast + focus states (a11y pass cơ bản)
- [ ] Fix tất cả missing i18n keys còn sót

### P1 — 1 tuần
- [ ] Tách Templates thành tab để giảm cognitive load
- [ ] Refine Landing hero + CTA funnel (1 primary CTA)
- [ ] Motion/sound profile settings rõ ràng hơn (kid vs parent default)
- [ ] Thêm fade gradient cho chip scroll overflow

### P2 — Sau đó
- [ ] Tạo mini design system doc (token + component spec + usage rules)
- [ ] Snapshot visual QA checklist trước mỗi deploy
- [ ] "Low stimulation mode" cho kid profile
- [ ] Responsive audit toàn app ở 320px/375px/768px/1024px
