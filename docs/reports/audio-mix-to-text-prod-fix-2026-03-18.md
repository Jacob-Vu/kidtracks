# Incident Report — Audio-to-Text Production Fix
**Date:** 2026-03-18
**Severity:** P1 (production feature completely broken)
**Feature:** Mixed/recorded audio → text transcription (STT fallback path)
**Status:** Fixed and deployed

---

## Summary

The `transcribeSpeech` Firebase Cloud Function (Speech-to-Text backend) was broken from its first production deployment. Every transcription call silently failed, returning `stt_failed` to the user. The root cause was a region mismatch: the function's STT API calls targeted `asia-southeast1`, but the `chirp_2` model is only available in `us-central1` and `europe-west4`.

---

## Root Cause

### Feature Background

Commit `8e28ba0` (2026-03-18 14:12 +0700) introduced the full STT fallback pipeline:
- **`functions/index.js`** — Added `transcribeSpeech` HTTPS Callable Cloud Function
- **`src/services/speechToText.js`** — Client-side wrapper calling the function
- **`src/hooks/useVoiceInput.js`** — MediaRecorder fallback path calling `transcribeAudioBlob`
- **`src/hooks/useVoiceRecorder.js`** — Journal recording with API fallback

### The Bug

`functions/index.js` line 16 (before fix):
```js
const STT_LOCATION = process.env.STT_LOCATION || "asia-southeast1";
```

The `transcribeSpeech` function calls Google Cloud Speech-to-Text API v2 with model `chirp_2` against a recognizer path:
```
projects/{projectId}/locations/asia-southeast1/recognizers/_
```

**`chirp_2` model availability in Speech-to-Text v2:**
| Region | `chirp_2` available |
|--------|---------------------|
| `us-central1` | ✅ Yes |
| `europe-west4` | ✅ Yes |
| `asia-southeast1` | ❌ No |

The Google Speech API returned a non-2xx error for every call. The function caught this at:
```js
if (!response.ok) {
  throw new HttpsError("internal", "Speech transcription failed.");
}
```

The client received this as a Firebase `functions/internal` error, and `useVoiceInput.js` / `useVoiceRecorder.js` caught it and set `error: 'stt_failed'`, showing users "Speech-to-text failed. Please try again."

The primary path (browser `SpeechRecognition`) was unaffected. Only users on browsers without native SpeechRecognition (iOS Safari, some Android WebViews) hit the broken fallback path.

---

## Files Changed

| File | Change |
|------|--------|
| `functions/index.js` | Changed default `STT_LOCATION` from `"asia-southeast1"` to `"us-central1"` |

### Diff

```diff
- const STT_LOCATION = process.env.STT_LOCATION || "asia-southeast1";
+ // chirp_2 is only available in us-central1 and europe-west4.
+ // asia-southeast1 does NOT support chirp_2 → use us-central1 as default.
+ const STT_LOCATION = process.env.STT_LOCATION || "us-central1";
```

---

## Call Path (end-to-end)

```
User taps mic (no SpeechRecognition) →
  useVoiceInput.startFallbackRecording() →
    MediaRecorder captures audio blob →
  useVoiceInput.recorder.onstop →
    transcribeAudioBlob(blob, lang) [src/services/speechToText.js] →
      blobToBase64(blob) → strips data URL prefix → pure base64
      httpsCallable(functions, 'transcribeSpeech')({ audioBase64, languageCode }) →
        [Firebase Cloud Function — asia-southeast1] →
          GoogleAuth.getClient().getAccessToken() →
          fetch(https://speech.googleapis.com/v2/projects/{id}/locations/us-central1/recognizers/_:recognize)
            { config: { model: 'chirp_2', languageCodes: ['vi-VN'] }, content: base64 }
          ← { results: [{ alternatives: [{ transcript: '...' }] }] }
        return { text: '...' }
      ← response.data.text
    onFinalRef.current(text, { mode: 'fallback_api' })
  UI updated with transcript
```

---

## Verification Steps

1. **Code review:** Confirmed `chirp_2` model regional availability mismatch — fixed by changing default `STT_LOCATION` to `us-central1`.
2. **STT_LOCATION override:** The fix uses `process.env.STT_LOCATION || "us-central1"`. If needed, `STT_LOCATION` can be overridden via Firebase Function environment config for future region changes.
3. **No client-side changes needed:** The client (`speechToText.js`, hooks, components) is correct and unchanged.
4. **Deploy scope:** Functions-only deploy (`deploy:prod:functions`). No hosting rebuild needed.

---

## Deploy / Release Result

- **Deploy command:** `npm run deploy:prod:functions`
- **Target:** Firebase project `kidtracks-e50ac`, functions only
- **Result:** ✅ SUCCESS — All 23 functions updated. `transcribeSpeech(asia-southeast1)` confirmed successful update.

---

## Remaining Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| `chirp_2` latency from `us-central1` for Vietnamese users | Low | Transcription is async; 200–400ms extra latency acceptable |
| `chirp_2` not yet enabled in GCP project | Low | Would show 403/404 in function logs; fix: enable Speech API in GCP console |
| Service account lacks Speech API permissions | Low | Would show 403; fix: grant `roles/speech.client` to the function's SA |
| Future region expansion: if Google adds `chirp_2` to `asia-southeast1`, the env var `STT_LOCATION` can be set to restore lower latency | None now | Use Firebase Function config: `firebase functions:config:set stt.location=asia-southeast1` |

---

## Timeline

| Time | Event |
|------|-------|
| 2026-03-18 14:12 +0700 | Commit `8e28ba0` deployed — `transcribeSpeech` function added with `chirp_2` + `asia-southeast1` (broken) |
| 2026-03-18 (this fix) | Root cause identified: `chirp_2` unavailable in `asia-southeast1` |
| 2026-03-18 (this fix) | `STT_LOCATION` default changed to `us-central1` in `functions/index.js` |
| 2026-03-18 (this fix) | Functions-only deploy to production |
