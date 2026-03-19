# Audio-to-Text Sample Verification Work Log
**Date:** 2026-03-18

---

## [2026-03-18 — Session Start]

**Task:** Urgent production investigation — system fails to receive text from audio/sound.

**Prior context:** A UI duration formatting bug was previously identified but deemed insufficient as the final root cause.

---

## [Step 1] Codebase Exploration

Launched Explore agent to map the full audio→text pipeline.

**Files examined:**
- `src/hooks/useVoiceRecorder.js` — MediaRecorder + SpeechRecognition hook
- `src/hooks/useVoiceInput.js` — Form field voice input hook
- `src/services/speechToText.js` — Firebase Callable client
- `src/components/DayJournal.jsx` — Primary recording UI consumer
- `src/components/VoiceMicButton.jsx` — Reusable mic button
- `functions/index.js` — `transcribeSpeech` Cloud Function (Google STT v2, chirp_2 model)

**Pipeline summary:**
1. Client: MediaRecorder captures audio → Blob
2. Fallback (no SpeechRecognition): `transcribeAudioBlob()` → Base64 → Firebase Callable
3. Cloud Function: Google Speech-to-Text v2 API (chirp_2 model, us-central1)
4. Response: `{ text }` → React state

---

## [Step 2] Root Cause Analysis

**Finding:** Race condition in `useVoiceRecorder.js`.

- `stop()` calls `setRecState('done')` synchronously at line 105
- `recorder.onstop` is async — calls `transcribeAudioBlob()` which takes 2-5 seconds
- `DayJournal.jsx`'s `useEffect([recState])` fires immediately when `recState === 'done'`
- At that point, `transcript` is still `''` (Google STT hasn't returned)
- When STT result arrives, `setTranscript()` fires but `useEffect` doesn't re-run
- **Result:** User sees an empty text field. Transcription is silently lost.

**Who is affected:** All browsers without `window.SpeechRecognition`: Safari (iOS/macOS), Firefox, Android Chrome (when SR unavailable/poor quality). Chrome desktop worked because the Web Speech API provides a live transcript before `stop()` is called.

---

## [Step 3] Fix Implementation

**File 1: `src/hooks/useVoiceRecorder.js`**

Change A — `stop()`:
- Before: `setRecState('done')` (synchronous)
- After: `setRecState('transcribing')` + defer `setRecState('done')` to `onstop`

Change B — `recorder.onstop`:
- Added `setRecState('done')` at end of handler, after `await transcribeAudioBlob()` returns

**File 2: `src/components/DayJournal.jsx`**

- Recording view: shows `⏳` spinner and disables stop button when `recState === 'transcribing'`
- Inline mic button in editing view: disabled with `⏳` during transcribing
- Updated `useEffect` comment to document the new state machine

**New state machine:** `idle → recording → transcribing → done`

---

## [Step 4] Test Suite Creation

**File: `tests/unit/audio-transcription.test.js`**

Created 11-test suite covering:
- WAV fixture structural validity (RIFF/WAVE headers, sample rate, length)
- Base64 round-trip accuracy
- data-URI prefix stripping
- Size guard (10MB limit)
- Language code mapping
- Google STT response parsing (multi-result, empty, missing key)
- **Race condition FIX verification** (transcript populated before 'done')
- **Race condition BUG confirmation** (old behavior had empty transcript at 'done')
- Empty blob early rejection

**Test run results:** 11/11 PASSED

```
ok - buildSilentWavBuffer produces a structurally valid WAV file
ok - audio buffer survives base64 encode/decode round-trip
ok - base64 with data-URI prefix is correctly stripped (mirrors functions/index.js lines 98-100)
ok - audio size guard rejects payloads over 10MB
ok - language code mapping is correct for vi and en
ok - STT response with multiple results is joined correctly
ok - STT response with empty results returns empty string
ok - STT response with missing results key returns empty string
ok - race condition fix: recState becomes done ONLY after transcript is populated
ok - race condition: OLD behavior would have empty transcript at done
ok - empty blob (size 0) is rejected before API call

audio-transcription unit tests passed
```

Existing leaderboard tests: 3/3 PASSED (no regression).

---

## [Step 5] Production Deploy

Ran: `npm run deploy:prod`

Command includes:
1. `npm run version:client` — bumps client version
2. `npm run build` — Vite production build
3. `firebase deploy --project kidtracks-e50ac --only hosting:production,functions`

**Deploy result: SUCCESS**

- Client version bumped: `v0.0.0+5` (2026-03-18T14:15:32Z)
- Vite build: ✓ 2148 modules, 7.88s
- Firebase hosting: 36 files uploaded → release complete
- Cloud Functions: no changes detected (all skipped — only client code changed)
- Hosting URL: https://kidtracks-e50ac.web.app

---

## [Step 6] Report Writing

- `docs/reports/audio-to-text-sample-verification-2026-03-18.md` — full investigation report
- `docs/reports/audio-to-text-sample-verification-log-2026-03-18.md` — this work log

---

## Summary

| Item | Result |
|------|--------|
| Root cause | Race condition: `setRecState('done')` fired before async Google STT returned |
| Fix | Moved `setRecState('done')` to end of `onstop` async handler; intermediate `'transcribing'` state added |
| Files changed | `useVoiceRecorder.js`, `DayJournal.jsx` |
| Test file created | `tests/unit/audio-transcription.test.js` |
| Tests passed | 11/11 |
| Production deployed | Yes |
| Browsers fixed | Safari (iOS/macOS), Firefox, mobile Chrome without SpeechRecognition |
