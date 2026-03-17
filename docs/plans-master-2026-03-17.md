# KidsTrack Plans Master (2026-03-17)

## 1) Growth quick-win plan (đã triển khai)

### Mục tiêu
Ship nhanh 3 hạng mục tác động trực tiếp đến activation + retention.

### Hạng mục
1. **Streak Counter**
   - Hiển thị streak ở KidDashboard / DailyView / Dashboard
   - Badge nóng khi streak >= 3
2. **Guided Onboarding (3 bước)**
   - Parent mới (0 kid) đi theo flow: thêm con -> chọn pack -> tạo ngày đầu
3. **Push Notifications (Web/PWA)**
   - Banner xin quyền + settings giờ nhắc
   - Nhắc sáng/chiều/tối

### Trạng thái
- Đã code + build + deploy.

---

## 2) Weekly Report plan

Nguồn gốc chi tiết: `docs/weekly-report-plan.md`

### Mục tiêu
Cho parent báo cáo tuần có insight và action.

### Nội dung
- Hero summary (completion + trend)
- Per-kid breakdown (heatmap, best/worst task, earnings)
- Insights (most popular/hardest/best day/worst day)
- Tips rule-based
- Earnings tổng hợp

---

## 3) Codex implementation phases cho Weekly Report

### Phase 0 — Hardening
- Chuẩn i18n, bỏ hardcode UI
- Query deep-link tuần `?week=YYYY-Www`
- Tối ưu tính toán hook

### Phase 1 — Route dark launch
- Bật route `/report/weekly` (parent)

### Phase 2 — i18n weekly.*
- EN/VI key matrix đầy đủ cho weekly UI + tips

### Phase 3 — CSS weekly-*
- Hoàn thiện style responsive cho report

### Phase 5 — Tests + quality gate
- e2e weekly report
- build/regression checks

### Phase 4 — Dashboard entry (last)
- Nút CTA từ Dashboard sang Weekly Report

### Trạng thái hiện tại
- Đã có đầy đủ file weekly report + route + dashboard entry + i18n + css + e2e weekly.
- `tests/e2e/weekly-report.spec.js`: pass.
- `npm run build`: pass.

---

## 4) Gợi ý bước tiếp theo
1. Add auto-popup Monday summary modal
2. Share/export weekly report (image/text)
3. Push reminder riêng cho weekly report vào sáng thứ Hai
