import { useVoiceInput } from '../hooks/useVoiceInput'
import { useLang } from '../i18n/I18nContext'

// Mic button that appends voice transcript to a field value via onAppend callback.
// Props:
//   onAppend(text)  — called with final transcript to append to the field
//   disabled        — disable the button
export default function VoiceMicButton({ onAppend, disabled }) {
  const { lang } = useLang()
  const { listening, liveText, error, hasSR, start, stop } = useVoiceInput(lang)

  if (!hasSR) return null

  const handleClick = () => {
    if (listening) {
      stop()
    } else {
      start((text) => {
        if (text) onAppend(text)
      })
    }
  }

  return (
    <span className="voice-input-wrap">
      <button
        type="button"
        className={`voice-input-btn${listening ? ' voice-input-btn--active' : ''}`}
        onClick={handleClick}
        disabled={disabled}
        aria-label={listening ? 'Dừng ghi âm' : 'Nhập bằng giọng nói'}
        title={listening ? 'Dừng' : 'Giọng nói'}
      >
        {listening ? '⏹' : '🎤'}
      </button>
      {listening && liveText && (
        <span className="voice-input-live">{liveText}</span>
      )}
      {error === 'mic_denied' && (
        <span className="voice-input-error">Không có quyền mic</span>
      )}
    </span>
  )
}
