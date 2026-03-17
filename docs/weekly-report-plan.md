# Weekly Report — Feature Plan

## Mục tiêu
Parent nhận bản tổng kết tuần rõ ràng, dễ hiểu, có actionable insights.

## Khi nào hiển thị
1. **Auto-popup sáng thứ Hai** — modal khi parent mở app
2. **Button trên Dashboard** — "📊 Xem báo cáo tuần"
3. **Route** `/report/weekly` hoặc `/report/weekly?week=2026-W11`
4. **Push notification** sáng thứ Hai 8:00

## Nội dung báo cáo

### Section 1: Hero Summary
- Tỷ lệ hoàn thành tổng (%) + so sánh tuần trước (↑↓)
- Progress bar visual
- Tổng tasks completed / total

### Section 2: Per-Kid Breakdown
- Completion rate + trend
- Streak hiện tại
- Tiền kiếm được trong tuần
- Day-by-day heatmap (Mon→Sun)
- Best task (hoàn thành nhiều nhất)
- Needs improvement (fail/miss nhiều nhất)

### Section 3: Task Insights
- Task completion ranking
- Ngày mạnh/yếu nhất
- Smart tip rule-based

### Section 4: Earnings Summary
- Per-kid earnings tuần này
- Tổng gia đình

### Section 5: Actions
- Quick link điều chỉnh task từng kid
- Share report (image / text)

## Smart Tips Logic

| Condition | Tip |
|-----------|-----|
| Weekend completion < 50% | Thử giảm task cuối tuần |
| 1 task fail > 70% | Task X có vẻ khó — chia nhỏ hoặc thay đổi |
| Streak ≥ 7 | Chuỗi tuyệt vời! Thưởng thêm |
| Completion tăng > 15% | Tuần tuyệt vời! Con đang tiến bộ |
| Completion giảm > 15% | Tuần hơi chậm — trò chuyện với con |
| All tasks 100% ≥ 3 ngày | Thêm 1-2 task thử thách mới |
| Balance > 200,000 | Set mục tiêu tiết kiệm |

## Kiến trúc

```
src/
├── pages/WeeklyReport.jsx
├── components/
│   ├── WeeklyReportModal.jsx
│   ├── WeeklyHeroSummary.jsx
│   ├── WeeklyKidCard.jsx
│   ├── WeeklyInsights.jsx
│   └── WeeklyEarnings.jsx
├── hooks/useWeeklyReport.js
└── utils/weeklyTips.js
```

## Timeline
- P1: useWeeklyReport hook + WeeklyReport page (Section 1-2)
- P2: Insights + Tips + Earnings (Section 3-4-5)
- P3: Auto-popup modal thứ Hai + push notification
- P4: Share/Export (screenshot + text)
