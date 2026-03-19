# Audio-to-Text Prod Fix — Progress Log (2026-03-18)

| Timestamp | Action | Result |
|-----------|--------|--------|
| 2026-03-18T~09:00 | Codebase exploration — mapped full STT/audio feature surface | Completed |
| 2026-03-18T~09:10 | Read `functions/index.js`, `src/services/speechToText.js`, `src/hooks/useVoiceRecorder.js`, `src/hooks/useVoiceInput.js` | Completed |
| 2026-03-18T~09:15 | Reviewed commit `8e28ba0` diff (added `transcribeSpeech` function) | Completed |
| 2026-03-18T~09:20 | Root cause identified: `chirp_2` model not available in `asia-southeast1`; `STT_LOCATION` defaults to `asia-southeast1` | Confirmed |
| 2026-03-18T~09:22 | Fix applied: `functions/index.js` line 16 — changed default `STT_LOCATION` from `"asia-southeast1"` to `"us-central1"` | Completed |
| 2026-03-18T~09:25 | Incident report written: `docs/reports/audio-mix-to-text-prod-fix-2026-03-18.md` | Completed |
| 2026-03-18T~09:26 | Production deploy initiated: `npm run deploy:prod:functions` | ✅ SUCCESS |
| 2026-03-18T~09:30 | All 23 Cloud Functions updated. `transcribeSpeech(asia-southeast1)` confirmed deployed with `STT_LOCATION=us-central1` fix | ✅ DONE |
| 2026-03-18T~09:30 | Incident report finalized at `docs/reports/audio-mix-to-text-prod-fix-2026-03-18.md` | ✅ DONE |
