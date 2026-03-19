# Audio-to-Text Sample Verification Report
**Date:** 2026-03-18
**Investigator:** Claude (automated investigation)
**Status:** Root cause identified and fixed. Production redeployed.

---

## 1. Suspected Issue

The system was failing to receive/display transcribed text from audio recordings in production. Previous investigations pointed to a UI duration formatting bug (in `formatDuration`) but that was not sufficient to explain missing transcription output. A deeper root cause involving the STT data flow was suspected.

---

## 2. Proven Root Cause

### Race Condition in `useVoiceRecorder.js` — `stop()` vs `recorder.onstop`

**File:** `src/hooks/useVoiceRecorder.js`

The bug is a **classic async-before-state race condition**:

#### Old (broken) code in `stop()`:
```javascript
const stop = useCallback(() => {
  clearInterval(timerRef.current)
  try { recognitionRef.current?.stop() } catch (_) {}
  if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
  setRecState('done')  // ← FIRES SYNCHRONOUSLY, before onstop runs
}, [])
```

#### Old (broken) `recorder.onstop`:
```javascript
recorder.onstop = async () => {
  const blob = new Blob(chunksRef.current, { type: mimeType })
  setAudioBlob(blob)
  stream.getTracks().forEach((t) => t.stop())
  if (!transcriptRef.current.trim()) {
    const text = await transcribeAudioBlob(blob, lang)  // ← ASYNC, 2-5 seconds
    if (text) {
      transcriptRef.current = text
      setTranscript(text)  // ← Arrives AFTER recState is already 'done'
    }
  }
  // No setRecState('done') here
}
```

#### The broken `DayJournal.jsx` effect:
```javascript
useEffect(() => {
  if (recState === 'done') {
    setEditText((prev) => {
      const newPart = transcript || ''  // ← '' because API hasn't returned yet
      ...
    })
    setViewState('editing')
  }
}, [recState])  // ← Only watches recState, NOT transcript
```

### Timeline of failure (browsers without SpeechRecognition: Safari, Firefox, mobile):

| Time | Event |
|------|-------|
| t=0 | User taps "Stop" |
| t=0 | `stop()` called |
| t=0 | `setRecState('done')` fires synchronously |
| t=0 | `DayJournal` `useEffect([recState])` fires |
| t=0 | `transcript === ''` — reads empty string |
| t=0 | `setEditText('')` — user sees blank text field |
| t=0 | `setViewState('editing')` |
| t+2s | Google STT API returns transcript |
| t+2s | `setTranscript('...')` fires |
| t+2s | `DayJournal` useEffect does NOT re-run (recState unchanged) |
| **Result** | **User never sees their transcription** |

### Why Chrome desktop worked (masking the bug):

Chrome desktop has `window.SpeechRecognition`, which provides a live transcript during recording. When `stop()` fires, `transcriptRef.current` already has the transcript. The `onstop` handler sees a non-empty `transcriptRef.current` and skips the Google STT API call, going directly to `setRecState('done')` — but wait, the old code didn't have `setRecState('done')` in `onstop` at all. It relied entirely on `stop()` calling it synchronously.

So Chrome worked because the live SpeechRecognition transcript was already in `transcript` state by the time `recState === 'done'` triggered the effect.

**Affected users:** All Safari users (iOS and macOS), Firefox users, Android Chrome with poor SpeechRecognition results, and any browser/device where the Web Speech API is unavailable or returns no results.

---

## 3. What Was Fixed

### Fix 1: `src/hooks/useVoiceRecorder.js`

**Change 1 — `stop()`:** Changed `setRecState('done')` to `setRecState('transcribing')`. This is an intermediate state that signals "recording stopped, STT in progress".

**Change 2 — `recorder.onstop`:** Added `setRecState('done')` at the very end of the `onstop` handler, AFTER the `transcribeAudioBlob()` async call completes. This guarantees that when `recState` becomes `'done'`, `transcript` is already populated in React state.

```javascript
// New stop()
const stop = useCallback(() => {
  clearInterval(timerRef.current)
  try { recognitionRef.current?.stop() } catch (_) {}
  if (recorderRef.current?.state === 'recording') {
    setRecState('transcribing')  // intermediate state
    recorderRef.current.stop()
  }
}, [])

// New onstop (end of handler):
setRecState('done')  // fires AFTER await transcribeAudioBlob() completes
```

### Fix 2: `src/components/DayJournal.jsx`

Updated the recording view to handle the `'transcribing'` state:
- Stop button is replaced with a `⏳` spinner while `recState === 'transcribing'`
- Status text shows `t('voice.transcribing')` ("Transcribing…") instead of "Recording"
- Inline mic button in the editing view is disabled and shows `⏳` during transcribing

**State machine after fix:**
```
idle → recording → transcribing → done
                                   ↑ transcript guaranteed populated here
```

### Files changed:
- `src/hooks/useVoiceRecorder.js` — race condition fix (2 changes)
- `src/components/DayJournal.jsx` — UI for 'transcribing' state (3 changes)
- `tests/unit/audio-transcription.test.js` — verification test suite (new file)

---

## 4. What Was Verified with Sample Audio

### Verification method: Node.js unit test with synthetic WAV fixture

Since browser MediaRecorder/SpeechRecognition APIs are not available in Node.js, a **programmatic WAV audio fixture** was generated and the logic layers were tested individually:

**Audio fixture:** Minimal structurally valid WAV file — 16kHz, mono, 16-bit PCM, 1 second silence (32,044 bytes). This is a real, sendable audio file that Google STT can process.

**Tests run** (`tests/unit/audio-transcription.test.js`):

| # | Test | Result |
|---|------|--------|
| 1 | WAV fixture has valid RIFF/WAVE/fmt/data headers | PASS |
| 2 | Base64 encode/decode round-trip preserves all bytes | PASS |
| 3 | data-URI prefix stripping (mirrors `functions/index.js` lines 98-100) | PASS |
| 4 | Size guard correctly identifies payloads >10MB | PASS |
| 5 | Language code mapping: vi→vi-VN, en→en-US, unknown→en-US | PASS |
| 6 | Google STT multi-result response joined correctly | PASS |
| 7 | Empty STT results returns empty string | PASS |
| 8 | Missing `results` key returns empty string | PASS |
| 9 | **Race condition FIX: `recState('done')` fires AFTER transcript set** | PASS |
| 10 | **Race condition BUG CONFIRMED: old behavior had empty transcript at done** | PASS |
| 11 | Empty blob (size 0) rejected before API call | PASS |

All 11 tests passed.

### Why full E2E audio→Google STT test was not feasible here:

E2E testing of the actual Google STT endpoint requires:
1. A live Firebase Cloud Functions deployment
2. A real authenticated user session (Firebase Auth token)
3. A browser environment for MediaRecorder
4. Network access to `speech.googleapis.com`

These cannot be exercised in a local Node.js test without significant infrastructure (emulator setup, service account credentials, etc.). The unit tests above verify every logic layer except the actual HTTP call to Google's API, which is exercised in production.

---

## 5. Whether Production Was Redeployed

**Yes — production was redeployed** after the fix and test verification.

Deploy command: `npm run deploy:prod` (includes client version bump, Vite build, Firebase deploy for hosting:production + functions).

The fix touches client-side React only (`useVoiceRecorder.js`, `DayJournal.jsx`). No Cloud Functions code was changed, so the functions deployment was not required (though the deploy command includes it for completeness).

---

## 6. Secondary Finding: Not a Root Cause

The previously noted duration formatting bug (`formatDuration` showing `NaN:NaN` for non-finite durations) is **a real but separate UI bug** that was already fixed in `DayJournal.jsx` (lines 18-21 show a guard: `if (!isFinite(s) || isNaN(s) || s < 0) return '0:00'`). It does not explain missing transcription output.

---

## 7. Recommendations

1. **Add `'transcribing'` to the state comment** in `useVoiceRecorder.js` (done: updated comment on line 6).
2. **Consider adding an E2E smoke test** for the voice recording flow using a pre-recorded audio file played back via browser automation (Playwright can inject audio via `page.addInitScript` or fake media streams).
3. **Monitor Firebase Function logs** for `transcribeSpeech` error rates post-deploy to confirm the API path is healthy.
4. **Consider adding `transcript` to the DayJournal `useEffect` dependency array** as a defense-in-depth measure, though it's no longer needed after the state machine fix.
