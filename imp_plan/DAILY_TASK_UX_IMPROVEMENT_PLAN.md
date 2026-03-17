# Daily Task UX Improvements — Plan

**Date:** 2026-03-17
**Author:** UX/UI Leader + Dev Leader review
**Status:** Approved, ready to implement

---

## 1. UX/UI Leader Analysis

### Vấn đề cốt lõi
Hiện tại, mỗi ngày user phải tự tạo lại danh sách việc từ đầu. Đây là điểm ma sát lớn nhất trong daily habit loop — nếu khởi đầu mỗi ngày mà tốn quá nhiều bước, user sẽ bỏ. App cần "zero-friction morning startup".

---

### Feature A — Sao chép từ ngày hôm trước

**Nguyên tắc UX:**
- **Không auto-copy ngầm** — gây mất kiểm soát, user không biết danh sách từ đâu ra
- **Suggest, không ép** — hiển thị banner khi hôm nay chưa có task, user chủ động chọn
- **Đặt ở đúng context** — banner xuất hiện ngay trên danh sách task trống, không phải menu ẩn

**UX Flow:**
```
Sáng mở app → hôm nay 0 task
→ Banner: "📋 Sao chép 5 việc từ hôm qua?"  [Sao chép]  [Bỏ qua]
→ Nhấn "Sao chép" → danh sách được điền, status reset về pending
→ Banner biến mất
```

**Edge cases:**
- Hôm qua cũng 0 task → không hiển thị banner
- Hôm qua đã finalized → copy toàn bộ title+description, reset status về `pending` (không copy failed/completed state)
- Đã có task hôm nay → không hiển thị banner (kể cả chỉ có 1 task)
- "Bỏ qua" → dismiss banner bằng localStorage flag cho ngày đó, không hỏi lại

**Có trên:** DailyView (parent) + KidDashboard (kid)

---

### Feature B — Template Picker (Chọn từ Mẫu)

**Vấn đề với "Load Templates" hiện tại:**
- Load ALL assigned templates → không có quyền chọn lọc
- Không thấy template nào đang được load
- Không thể thêm template chưa assign cho kid nhưng muốn dùng 1 lần

**UX mới — bottom sheet / modal picker:**
```
[Chọn từ Mẫu] button
→ Modal: "Chọn việc từ Mẫu"
   ┌─────────────────────────────────┐
   │ 🔍 [Tìm kiếm...]               │
   │                                 │
   │ ☑ Học toán                      │ ← đã có hôm nay (disabled, checked)
   │ ☐ Đọc sách 20 phút             │
   │ ☐ Dọn phòng                    │
   │ ☐ Tập thể dục                   │
   │ ☐ Học tiếng Anh                │
   │ ────────────────                │
   │ Đã chọn: 2     [Thêm vào hôm nay] │
   └─────────────────────────────────┘
```

**UX details:**
- Task đã có trong ngày → **disabled + checkmark** (không thể bỏ chọn)
- Search/filter real-time trên client (templates đã load sẵn trong store)
- Multi-select, confirm bằng 1 nút "Thêm X việc"
- Giữ lại button "Tải theo lịch" (sync assigned templates) ở vị trí phụ — 2 luồng khác nhau:
  - "Tải theo lịch" → tự động theo assignment → quick bulk
  - "Chọn từ Mẫu" → thủ công, linh hoạt → fine-grained control

**Có trên:** DailyView (parent) + KidDashboard (kid, vì kid cũng có thể tự thêm việc)

---

### Feature C — History View (Lịch sử theo ngày)

**2 entry points:**

**C1 — Parent (DailyView):**
- Hiện tại có date navigation (◀ ▶) nhưng không có "map" tổng quan
- Thêm button "📊 Xem lịch sử" → mở drawer/modal với:
  - Heatmap 30 ngày (màu xanh/vàng/đỏ theo % hoàn thành)
  - Click vào ngày → jump đến ngày đó trong DailyView
  - Hiển thị journal indicator (📓) nếu ngày đó có journal entry

**C2 — Kid (KidDashboard):**
- 10-day strip hiện tại chỉ show %, không click được
- Nâng cấp: Click vào ngày bất kỳ trong strip → mở `DayDetailModal` với:
  - Danh sách tasks của ngày đó (read-only)
  - Journal entry của ngày đó (audio + text nếu có)
- Thêm "Xem thêm" để xem 30 ngày thay vì 10 ngày

**UX principles:**
- History là read-only — không cho edit task cũ (đã finalized)
- Journal vẫn cho phép xem audio playback
- Không tạo route mới cho history của kid — dùng modal để giữ navigation đơn giản

---

## 2. Dev Leader Review & Technical Plan

### Architecture Assessment

**Điểm thuận lợi:**
- `dailyTasks` đã được load toàn bộ vào store (realtime subscription) → history filter là pure client-side, **không cần Firestore reads thêm**
- `dayJournal` đã có pattern fetch on-demand (DayJournal component) → tái dụng
- `templates` đã load sẵn → template picker không cần API call mới
- Không cần thêm Cloud Functions hay thay đổi Firestore schema

**Điểm cần chú ý:**
- `dailyTasks` subscription load toàn bộ collection — khi gia đình dùng lâu (1+ năm) có thể có 10k+ documents → cần plan giới hạn Firestore query theo date range trong tương lai (out of scope hiện tại)
- `dayJournal` fetch by `kidId + role` → không cần composite index (equality only)

---

### Implementation Priority

| Priority | Feature | Effort | Value | Phụ thuộc |
|----------|---------|--------|-------|-----------|
| P1 | Feature B: Template Picker | 3-4h | ★★★★★ | Không |
| P2 | Feature A: Copy from yesterday | 2h | ★★★★☆ | Không |
| P3 | Feature C: History (Kid strip clickable) | 3-4h | ★★★★☆ | Không |
| P4 | Feature C: History (Parent heatmap) | 4-5h | ★★★☆☆ | P3 patterns |

---

### Feature B — Template Picker: Technical Spec

**Files cần tạo/sửa:**

```
src/components/TemplatePickerModal.jsx  (NEW)
src/pages/DailyView.jsx                (EDIT — add button + modal)
src/pages/KidDashboard.jsx             (EDIT — add button + modal)
src/index.css                          (EDIT — modal list styles)
```

**Component API:**
```jsx
<TemplatePickerModal
  kidId={kid.id}
  date={today}
  existingTaskTitles={todayTasks.map(t => t.title)}
  onClose={() => setShowTemplatePicker(false)}
  onAdd={(tasks) => { /* calls addDailyTask for each */ }}
/>
```

**Internal logic:**
- `templates` từ store → filter/search client-side
- `existingTaskTitles` → mark already-added as disabled
- Multi-select state: `Set<templateId>`
- Confirm: loop selected templates → call `addDailyTask(kidId, date, template.title, getDescription(template))`
- Không cần function mới trong `useFireActions`

---

### Feature A — Copy from Yesterday: Technical Spec

**Files cần tạo/sửa:**

```
src/hooks/useFirebaseSync.js   (EDIT — add copyTasksFromDate action)
src/pages/DailyView.jsx        (EDIT — add banner)
src/pages/KidDashboard.jsx     (EDIT — add banner)
src/index.css                  (EDIT — banner styles)
```

**New action:**
```js
copyTasksFromDate: async (kidId, fromDate, toDate) => {
  const sourceTasks = store.dailyTasks
    .filter(t => t.kidId === kidId && t.date === fromDate)
  const existingTitles = store.dailyTasks
    .filter(t => t.kidId === kidId && t.date === toDate)
    .map(t => t.title)
  const toAdd = sourceTasks.filter(t => !existingTitles.includes(t.title))
  for (const t of toAdd) {
    await addDailyTask(kidId, toDate, t.title, t.description)
  }
  return toAdd.length
}
```

**Banner trigger logic:**
```js
const yesterdayTasks = dailyTasks.filter(t => t.kidId === kid.id && t.date === yesterday)
const showCopyBanner = todayTasks.length === 0 && yesterdayTasks.length > 0
  && !localStorage.getItem(`kidstrack-skip-copy-${kid.id}-${today}`)
```

**Dismiss:** `localStorage.setItem('kidstrack-skip-copy-{kidId}-{today}', '1')`

---

### Feature C — History: Technical Spec

**C1 — Kid day strip nâng cấp:**

```
src/components/DayDetailModal.jsx   (NEW)
src/pages/KidDashboard.jsx          (EDIT — strip items clickable, "Xem thêm" button)
```

**DayDetailModal:**
```jsx
// Props: { kidId, date, tasks, role, kidName, onClose }
// Shows:
//   - Date header
//   - Task list (read-only, with status badges)
//   - DayJournal in read-only mode (show existing entry, no edit)
```

**Read-only DayJournal:** Add `readOnly` prop to `DayJournal.jsx`
- When `readOnly=true`: không show edit/record buttons, chỉ show audio player + text nếu có entry

**C2 — Parent history heatmap:**

```
src/components/DayHistoryPanel.jsx  (NEW)
src/pages/DailyView.jsx             (EDIT — add "Xem lịch sử" button)
```

**DayHistoryPanel:**
```jsx
// Props: { kidId, currentDate, onSelectDate, dailyTasks }
// Shows 30-day grid with:
//   - Color: green (100%), amber (>0%), red (0%, has tasks), gray (no tasks)
//   - Click → calls onSelectDate(date) → jumps DailyView to that date
//   - Journal dot: fetched on-demand (or just show if dailyTasks has entries for that date)
```

---

### Data Flow Summary

```
Store (realtime) → already has:
  dailyTasks (all dates)      → Feature A, B, C (no extra reads)
  templates                   → Feature B (no extra reads)

On-demand reads:
  dayJournal/{kidId}_{date}_{role}  → Feature C (DayDetailModal reuses DayJournal)
```

---

## 3. Implementation Order

### Phase 1 (P1+P2): ~5-6h total
1. `TemplatePickerModal.jsx` — component + integration vào DailyView + KidDashboard
2. Copy-from-yesterday banner + `copyTasksFromDate` action
3. CSS cho cả 2
4. i18n keys mới
5. Build + deploy

### Phase 2 (P3+P4): ~7-9h total
1. `DayDetailModal.jsx` — kid history detail
2. `DayJournal` readOnly mode
3. Nâng cấp KidDashboard day strip (clickable, 30 days, "Xem thêm")
4. `DayHistoryPanel.jsx` — parent heatmap
5. Integration vào DailyView
6. CSS heatmap + modal
7. Build + deploy

---

## 4. i18n Keys cần thêm

```js
// en.js / vi.js
'daily.copyYesterday': 'Copy {count} tasks from yesterday?' / 'Sao chép {count} việc từ hôm qua?'
'daily.copyBtn': 'Copy' / 'Sao chép'
'daily.skipCopy': 'Skip' / 'Bỏ qua'
'daily.pickTemplate': 'Pick from Templates' / 'Chọn từ Mẫu'
'daily.templatePickerTitle': 'Add from Templates' / 'Thêm việc từ Mẫu'
'daily.addSelected': 'Add {count} tasks' / 'Thêm {count} việc'
'daily.alreadyAdded': 'Already added' / 'Đã có'
'daily.searchTemplates': 'Search...' / 'Tìm...'
'daily.viewHistory': 'History' / 'Lịch sử'
'history.title': 'Task History' / 'Lịch sử công việc'
'history.noEntry': 'No tasks this day' / 'Không có việc ngày này'
'history.seeMore': 'See 30 days' / 'Xem 30 ngày'
```

---

## 5. Không làm trong scope này

- Firestore query pagination cho dailyTasks (future, khi data lớn)
- Export history ra PDF/CSV
- Shared/collaborative task lists
- Recurring task scheduler (sẽ thay thế copy-yesterday trong tương lai)
