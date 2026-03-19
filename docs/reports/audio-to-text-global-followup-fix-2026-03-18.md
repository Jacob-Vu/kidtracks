# Audio-to-Text Global Follow-up Fix Report
**Date:** 2026-03-18
**Type:** Follow-up bugfix + UX normalization
**Scope:** All mic/voice-to-text entry points in the KidsTrack app

---

## Executive Summary

This report documents a follow-up audit and fix of all audio-to-text (speech-to-text) entry points in the KidsTrack web app. The previous fix addressed a race condition in the `useVoiceRecorder` hook for the DayJournal recording flow. This follow-up addresses remaining UX inconsistencies found in the DayJournal component, and normalizes all voice entry points to write recognized text directly into the adjacent text input, rather than displaying it in a separate transcript area.

---

## 1. Audit Results — All Voice Entry Points

### Entry Points Found

| Screen | Component/Hook | Field | Status Before Fix |
|--------|---------------|-------|------------------|
| Task creation (KidDashboard) | `VoiceMicButton` → `useVoiceInput` | task title, task description | ✅ Working (reference) |
| Task creation (DailyView) | `VoiceMicButton` → `useVoiceInput` | task title, task description | ✅ Working (reference) |
| Feedback submission (FeedbackPage) | `VoiceMicButton` → `useVoiceInput` | feedback message | ✅ Working (same pattern as reference) |
| Journal full recording (DayJournal) | `useVoiceRecorder` → direct state | editText textarea | ⚠️ Broken UX: transcript shown in separate paragraph during recording |
| Journal inline mic in editing (DayJournal) | `journal-mic-inline` button → `useVoiceRecorder` | editText textarea | ❌ Broken: switches full UI to recording view instead of appending to adjacent textarea |

### Files Containing Voice Functionality

```
src/hooks/useVoiceRecorder.js      — Full recording hook (journal, audio storage)
src/hooks/useVoiceInput.js         — Quick voice input hook (form fields)
src/components/VoiceMicButton.jsx  — Reusable mic button using useVoiceInput
src/components/DayJournal.jsx      — Journal with both voice flows
src/pages/KidDashboard.jsx         — Task creation (VoiceMicButton)
src/pages/DailyView.jsx            — Task creation parent (VoiceMicButton)
src/pages/FeedbackPage.jsx         — Feedback form (VoiceMicButton)
```

---

## 2. Root Causes

### Issue 1: DayJournal Recording View — Separate Transcript Paragraph

**Location:** `src/components/DayJournal.jsx`, recording view (viewState === 'recording')

**Old behavior:**
```jsx
{transcript && (
  <p className="journal-live-transcript">{transcript}</p>
)}
```
Live transcript appeared in a `<p>` element below the recording controls — a separate display area, NOT a text input. This violated the UX requirement that text must appear in the target text box.

**Root cause:** The original design treated the recording view as a dedicated modal-like UI where the transcript was just a preview. There was no adjacent text box during recording.

---

### Issue 2: DayJournal Editing View — Inline Mic Switches Full UI

**Location:** `src/components/DayJournal.jsx`, editing view inline mic button

**Old behavior:**
```jsx
<button
  className={`journal-mic-inline ...`}
  onClick={recState === 'recording' ? stop : ... : handleRecord}
  ...
>
  {recState === 'recording' ? '⏹' : recState === 'transcribing' ? '⏳' : '🎤'}
</button>
```

`handleRecord()` called `setViewState('recording')`, causing the ENTIRE editing UI (including the textarea) to disappear and be replaced by the full recording view. The user was taken away from the text box to record, then returned after recording. This violated the requirement that text be inserted directly into the adjacent text box.

**Root cause:** The inline mic button reused the same `handleRecord()` function designed for the full-recording flow (from empty state), which always transitions to 'recording' viewState.

---

### Issue 3: Dead Code — `prevTranscriptRef`

`prevTranscriptRef` was declared and set but never read. Removed as part of cleanup.

---

## 3. Fixes Applied

### Fix 1: DayJournal Recording View — Textarea Instead of Paragraph

**File:** `src/components/DayJournal.jsx`

**Change:** Replaced `<p className="journal-live-transcript">` with a read-only textarea.

```jsx
// Before:
{transcript && (
  <p className="journal-live-transcript">{transcript}</p>
)}

// After:
<textarea
  className="journal-textarea"
  value={transcript || ''}
  readOnly
  rows={3}
  placeholder={recState === 'transcribing' ? t('voice.transcribing') : t('journal.placeholder')}
/>
```

**Effect:** Live SR transcript now appears inside a textarea during recording (the same visual element used in the editing state). Text is displayed in a text box, not in a separate paragraph area. When recording completes, the textarea becomes editable in the editing state with the finalized transcript.

---

### Fix 2: DayJournal Editing View — VoiceMicButton Replaces Inline Mic

**File:** `src/components/DayJournal.jsx`

**Change:** Replaced the `journal-mic-inline` button (which used `useVoiceRecorder` via `handleRecord`) with `VoiceMicButton` (which uses `useVoiceInput`), consistent with all other form voice entry points.

```jsx
// Before:
<button
  className={`journal-mic-inline ${recState === 'recording' ? 'recording' : ''}`}
  onClick={recState === 'recording' ? stop : recState === 'transcribing' ? undefined : handleRecord}
  disabled={recState === 'transcribing'}
  title={...}
>
  {recState === 'recording' ? '⏹' : recState === 'transcribing' ? '⏳' : '🎤'}
</button>

// After:
<VoiceMicButton
  field="journal_entry"
  role={role}
  onAppend={(text) => setEditText((prev) => (prev ? prev + ' ' + text : text))}
/>
```

**Effect:**
- Clicking the inline mic now records in-place without switching viewState
- Recognized text is immediately appended to the `editText` state (the adjacent textarea value)
- Uses the same `useVoiceInput` → `onAppend` pattern as task creation (reference implementation)
- `useVoiceRecorder` is now exclusively used for the full journal recording flow (from empty state and re-record button)

---

### Fix 3: Removed Dead Code

Removed `prevTranscriptRef` (was set but never read) and its two assignment sites.

---

### Fix 4: Added VoiceMicButton Import to DayJournal

```js
import VoiceMicButton from './VoiceMicButton'
```

---

## 4. Screens Fixed vs Unchanged

| Screen | Fixed? | What Changed |
|--------|--------|-------------|
| DayJournal — recording view | ✅ Fixed | Transcript now in read-only textarea, not separate paragraph |
| DayJournal — editing view inline mic | ✅ Fixed | VoiceMicButton appends directly to textarea; no viewState switch |
| KidDashboard task creation | No change needed | Already correct (reference implementation) |
| DailyView task creation | No change needed | Already correct (reference implementation) |
| FeedbackPage | No change needed | Already correct (same VoiceMicButton + onAppend pattern) |

---

## 5. Architecture After Fix

All voice entry points now follow the same normalized pattern:

```
User speaks
    ↓
useVoiceInput (SR path or fallback)
    ↓
onFinal(text) → onAppend(text)
    ↓
setState: field = prev + ' ' + text
    ↓
Text appears in the adjacent text box
```

The only exception is the DayJournal **full recording flow** (from empty state / re-record button), which uses `useVoiceRecorder` for audio storage + long-form recording. In that flow, the recording view now shows a read-only textarea with live transcript, and the editable textarea appears after recording completes with the finalized text.

### Hook Usage After Fix

| Hook | Used For |
|------|----------|
| `useVoiceInput` (via `VoiceMicButton`) | All form field voice input: task title, task description, feedback message, journal inline dictation |
| `useVoiceRecorder` | DayJournal full recording only (captures audio blob + transcript for journal storage) |

---

## 6. Tests Added

**File:** `tests/unit/audio-transcription.test.js`

Added 7 new test cases (total: 18 tests, all passing):

| Test | What It Verifies |
|------|-----------------|
| `append pattern: empty prev gives only new text` | Baseline append behavior for VoiceMicButton onAppend |
| `append pattern: non-empty prev gets text appended with space` | Space-separated append |
| `append pattern: VoiceMicButton guards onAppend against empty text` | Guard: if (text) onAppend(text) — no empty strings injected |
| `append pattern: multiple voice inputs accumulate correctly` | Multi-utterance accumulation |
| `DayJournal: recState done sets editText from transcript (textarea integration)` | Core DayJournal integration: done → editText updated |
| `DayJournal: recState done appends transcript to existing editText` | Append to pre-existing note text |
| `DayJournal: recState done with empty transcript preserves existing editText` | Guard: empty transcript doesn't wipe existing text |

---

## 7. Files Changed

| File | Changes |
|------|---------|
| `src/components/DayJournal.jsx` | Import VoiceMicButton; remove prevTranscriptRef; recording view: transcript paragraph → textarea; editing view: journal-mic-inline → VoiceMicButton |
| `tests/unit/audio-transcription.test.js` | +7 test cases for append pattern and DayJournal textarea integration |

**Files NOT changed (already correct):**
- `src/hooks/useVoiceRecorder.js`
- `src/hooks/useVoiceInput.js`
- `src/components/VoiceMicButton.jsx`
- `src/pages/KidDashboard.jsx`
- `src/pages/DailyView.jsx`
- `src/pages/FeedbackPage.jsx`

---

## 8. Test Results

```
node tests/unit/audio-transcription.test.js

ok - buildSilentWavBuffer produces a structurally valid WAV file
ok - audio buffer survives base64 encode/decode round-trip
ok - base64 with data-URI prefix is correctly stripped
ok - audio size guard rejects payloads over 10MB
ok - language code mapping is correct for vi and en
ok - STT response with multiple results is joined correctly
ok - STT response with empty results returns empty string
ok - STT response with missing results key returns empty string
ok - race condition fix: recState becomes done ONLY after transcript is populated
ok - race condition: OLD behavior would have empty transcript at done
ok - empty blob (size 0) is rejected before API call
ok - append pattern: empty prev gives only new text
ok - append pattern: non-empty prev gets text appended with space
ok - append pattern: VoiceMicButton guards onAppend against empty text
ok - append pattern: multiple voice inputs accumulate correctly
ok - DayJournal: recState done sets editText from transcript (textarea integration)
ok - DayJournal: recState done appends transcript to existing editText
ok - DayJournal: recState done with empty transcript preserves existing editText

audio-transcription unit tests passed (18/18)
```

---

## 9. Build Result

```
vite v7.3.1 building client environment for production...
✓ 2148 modules transformed.
✓ built in 6.53s
PWA: 33 entries precached
```

Build: clean, no warnings.

---

## 10. Deploy Result

- **Version:** v0.0.0+6 (2026-03-18)
- **Target:** Firebase Hosting (production), project `kidtracks-e50ac`
- **Command:** `firebase deploy --project kidtracks-e50ac --only hosting:production`
- **Status:** ✅ Deploy complete
- **URL:** https://kidtracks-e50ac.web.app

---

## 11. Summary

| Item | Result |
|------|--------|
| Screens audited | 5 voice entry points across 5 components/pages |
| Screens with issues | 2 (both in DayJournal) |
| Root causes | (1) Separate paragraph for transcript in recording view; (2) Inline mic switches full UI instead of appending to textarea |
| Files changed | 2 (DayJournal.jsx, audio-transcription.test.js) |
| Tests added | 7 new test cases |
| Tests passing | 18/18 |
| Build | ✅ Clean |
| Production deploy | ✅ Deployed (v0.0.0+6, 2026-03-18) |
