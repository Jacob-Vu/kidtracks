import { useEffect, useRef } from 'react'
import { useVoiceInput } from '../hooks/useVoiceInput'
import { useLang, useT } from '../i18n/I18nContext'
import { trackVoiceInputUsed } from '../hooks/useAnalytics'

// Mic button that appends voice transcript to a field value via onAppend callback.
// Props:
//   onAppend(text)  - called with final transcript to append to the field
//   disabled        - disable the button
export default function VoiceMicButton({ onAppend, disabled, field = 'unknown', role = 'parent' }) {
  const t = useT()
  const { lang } = useLang()
  const {
    listening,
    transcribing,
    liveText,
    error,
    canUseVoice,
    currentMode,
    start,
    stop,
  } = useVoiceInput(lang)
  const pendingTrackRef = useRef(false)
  const lastErrorRef = useRef('')

  useEffect(() => {
    if (!pendingTrackRef.current) return
    if (!error || error === lastErrorRef.current) return
    lastErrorRef.current = error
    trackVoiceInputUsed({
      field,
      role,
      mode: currentMode || 'unknown',
      success: false,
    })
    pendingTrackRef.current = false
  }, [error, field, role, currentMode])

  if (!canUseVoice) return null

  const handleClick = () => {
    if (listening) {
      stop()
      return
    }
    if (transcribing) return
    pendingTrackRef.current = true
    start((text, meta) => {
      if (text) onAppend(text, meta)
      if (text) {
        trackVoiceInputUsed({
          field,
          role,
          mode: meta?.mode || currentMode || 'unknown',
          success: true,
        })
      }
      pendingTrackRef.current = false
    })
  }

  const label = t('voice.label')
  const title = listening
    ? t('voice.stopRecording')
    : transcribing
      ? t('voice.transcribing')
      : t('voice.input')

  return (
    <span className="voice-input-wrap">
      <button
        type="button"
        className={`voice-input-btn${listening ? ' voice-input-btn--active' : ''}${transcribing ? ' voice-input-btn--busy' : ''}`}
        onClick={handleClick}
        disabled={disabled || transcribing}
        aria-label={title}
        title={title}
      >
        {listening ? '■' : transcribing ? '…' : '🎤'}
      </button>
      <span className="voice-input-label">{label}</span>
      {(listening || transcribing) && liveText && (
        <span className="voice-input-live">{liveText}</span>
      )}
      {transcribing && (
        <span className="voice-input-live">{t('voice.processing')}</span>
      )}
      {error === 'mic_denied' && (
        <span className="voice-input-error">{t('voice.micDenied')}</span>
      )}
      {error === 'stt_failed' && (
        <span className="voice-input-error">{t('voice.sttFailed')}</span>
      )}
    </span>
  )
}
