# Voice Task Creation — Implementation Plan

**Date:** 2026-03-17
**Priority:** Medium (UX improvement, reuses existing voice infrastructure)
**Status:** Planned

---

## User Feedback

> "Ở phần thêm việc có thể sử dụng Voice để tạo và thêm việc tương tự nhật ký"

Cho phép dùng giọng nói để điền thông tin khi tạo hoặc chỉnh sửa task, tương tự cách DayJournal sử dụng SpeechRecognition để điền text vào textarea.

---

## Approach

Reuse `useVoiceRecorder` hook (already exists at `src/hooks/useVoiceRecorder.js`).
No audio storage needed — chỉ cần transcript text, không lưu audio clip.

---

## Scope of Changes

### 1. `src/pages/KidDashboard.jsx` — Add/Edit Task Modal
- Thêm mic button bên cạnh input "Task Title" và textarea "Description"
- Khi nhấn mic → start recording, SpeechRecognition điền vào field tương ứng
- Khi stop → transcript append vào field value
- UI: inline mic icon button (tương tự `.journal-mic-inline` pattern)

### 2. `src/pages/DailyView.jsx` — Parent Add/Edit Task Modal
- Cùng pattern với KidDashboard, thêm mic button vào title + description fields
- Parent cũng được hưởng tính năng này khi tạo task cho con

### 3. `src/components/VoiceMicButton.jsx` (New — optional)
- Extract thành shared component nếu cần dùng ở nhiều nơi
- Props: `{ onTranscript, lang, field }` — field = 'title' | 'description'
- States: idle → recording → done (auto-stop sau 10s)

### 4. CSS (src/index.css)
- Reuse `.journal-mic-inline` và `.pulse-mic` keyframe đã có
- Có thể cần điều chỉnh layout cho input row

---

## UX Flow

```
[Task Title input]  [🎤]
  → tap mic → recording (pulse animation)
  → speak "Học toán lớp 3"
  → stop → title = "Học toán lớp 3"

[Description textarea]  [🎤]
  → tap mic → recording
  → speak "Làm 5 bài tập trang 12"
  → stop → description = "Làm 5 bài tập trang 12"
```

- Mic button chỉ active khi field đang focus hoặc empty + recording
- Nếu field đã có text → append (không overwrite)
- Ngôn ngữ recognition: theo `lang` context (vi-VN hoặc en-US)
- Không lưu audio — chỉ lấy transcript

---

## Files to Touch

| File | Change |
|---|---|
| `src/pages/KidDashboard.jsx` | Add mic buttons to Add/Edit task modal |
| `src/pages/DailyView.jsx` | Add mic buttons to Add/Edit task modal |
| `src/hooks/useVoiceRecorder.js` | No change needed (already supports transcript) |
| `src/index.css` | Minor layout tweak for input+mic row if needed |
| `src/hooks/useAnalytics.js` | Add `trackVoiceTaskCreated` event |

---

## Analytics Events to Add

```js
trackVoiceTaskCreated({ field: 'title' | 'description', role: 'kid' | 'parent' })
```

---

## Implementation Notes

- `useVoiceRecorder` already returns `{ recState, transcript, start, stop, clear }`
- Need one recorder instance per field OR one shared instance with a `targetField` state
- Simpler approach: one recorder per modal, track which field is active
- Auto-stop recording after ~10s to avoid UX confusion (or use existing MediaRecorder stop)
- Show mic as disabled if browser doesn't support SpeechRecognition

---

## Estimated Effort: ~2–3 hours
