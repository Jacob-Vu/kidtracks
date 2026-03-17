import { useState, useRef, useCallback } from 'react'

// Lightweight voice-to-text hook — SpeechRecognition only, no audio storage.
// Use this for filling form fields; use useVoiceRecorder when you need the audio blob.
export function useVoiceInput(lang = 'vi') {
  const [listening, setListening] = useState(false)
  const [liveText, setLiveText] = useState('')
  const [error, setError] = useState('')
  const recognitionRef = useRef(null)

  const hasSR = !!(window.SpeechRecognition || window.webkitSpeechRecognition)

  const start = useCallback((onFinal) => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { setError('unsupported'); return }

    setError('')
    setLiveText('')

    const recognition = new SR()
    recognition.lang = lang === 'vi' ? 'vi-VN' : 'en-US'
    recognition.continuous = false
    recognition.interimResults = true

    recognition.onresult = (e) => {
      let final = ''
      let interim = ''
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript
        else interim += e.results[i][0].transcript
      }
      setLiveText((final || interim).trim())
      if (final) {
        onFinal?.(final.trim())
        setListening(false)
        setLiveText('')
      }
    }

    recognition.onerror = (e) => {
      if (e.error === 'not-allowed') setError('mic_denied')
      setListening(false)
      setLiveText('')
    }

    recognition.onend = () => {
      setListening(false)
      setLiveText('')
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      setListening(true)
    } catch (_) {
      setError('unsupported')
    }
  }, [lang])

  const stop = useCallback(() => {
    try { recognitionRef.current?.stop() } catch (_) {}
    setListening(false)
    setLiveText('')
  }, [])

  return { listening, liveText, error, hasSR, start, stop }
}
