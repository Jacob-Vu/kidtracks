# KidsTrack UX/UI Execution Plan — Dev Lead Runbook

Date: 2026-03-17
Owner: Dev Lead (execution)
Requester: Jacob

## Objective
Triển khai toàn bộ action items từ audit UX/UI, ưu tiên P0 → P1 → P2, theo cơ chế job dài hạn có retry/skip rõ ràng và báo cáo tiến độ định kỳ.

## Scope nguồn
- Audit nguồn: `docs/ux-ui-audit-2026-03-17.md`
- App: `D:\Docs\Learn Tech\AIAgent\Refs\TodoList`
- Production: `https://kidtracks-e50ac.web.app`

## Execution Protocol (bắt buộc)
1. Chạy theo **job nền** cho các task dài.
2. Với mỗi task:
   - Phân tích khả năng thực thi trước khi sửa.
   - Nếu lỗi: retry tối đa **3 lần** (mỗi lần phải nêu nguyên nhân + chỉnh chiến lược).
   - Sau 3 lần không qua: đánh dấu `BLOCKED_UNFINISHABLE`, ghi nguyên nhân + hướng xử lý sau, **chuyển task tiếp theo**.
3. Cập nhật trạng thái cho requester mỗi **3 phút/lần** cho đến khi toàn bộ queue kết thúc.
4. Không sửa ngoài phạm vi UX/UI backlog.
5. Sau mỗi task hoàn tất: build/test tối thiểu và ghi kết quả vào status report.

## Work Queue

### P0 — Critical (execute first)
- [ ] P0.1 Reorder visual hierarchy on Parent Dashboard.
- [ ] P0.2 Reorder visual hierarchy on Kid Dashboard.
- [ ] P0.3 Standardize button hierarchy (primary/secondary/ghost) on all main pages.
- [ ] P0.4 Accessibility pass: contrast + visible focus states.
- [ ] P0.5 Sweep i18n missing keys (EN/VI) + raw key fallback checks.

### P1 — High
- [ ] P1.1 Split Templates into tabs (Default Packs / Family Templates).
- [ ] P1.2 Landing hero + CTA funnel simplification (single primary CTA).
- [ ] P1.3 Motion/sound profile clarity (kid vs parent defaults + settings wording).
- [ ] P1.4 Mobile chip overflow affordance (fade gradient, scroll hint).

### P2 — Stabilize/Scale
- [ ] P2.1 Mini design-system doc (tokens, component variants, usage rules).
- [ ] P2.2 Visual QA checklist before deploy.
- [ ] P2.3 Low stimulation mode for Kid profile.
- [ ] P2.4 Responsive audit pass (320/375/768/1024) + issue fixes.

## Deliverables
1. Code changes + commits theo từng nhóm task.
2. Deploy production khi các task khả dụng hoàn tất.
3. Final report đầy đủ (trạng thái từng đầu việc):
   - File: `docs/ux-ui-execution-status-2026-03-17.md`
   - Bao gồm: Done/Blocked/Skipped, retries, evidence (build/test/deploy), risk còn lại.

## Definition of Done
- Tất cả task trong queue có trạng thái cuối cùng (DONE hoặc BLOCKED_UNFINISHABLE).
- Có commit và bằng chứng build/test cho từng nhóm thay đổi.
- Có final report chi tiết gửi lại requester.
