import { useState, useRef, useCallback } from 'react'
import { transcribeAudioBlob } from '../services/speechToText'
const SR_LANGUAGE_CODE = { vi: 'vi-VN', en: 'en-US' }

// Voice-to-text hook for form inputs.
// Primary path: browser SpeechRecognition.
// Fallback path: MediaRecorder + Firebase callable + Google STT.
export function useVoiceInput(lang = 'vi') {
  const [listening, setListening] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [liveText, setLiveText] = useState('')
  const [error, setError] = useState('')

  const recognitionRef = useRef(null)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const modeRef = useRef('idle')
  const onFinalRef = useRef(null)
  const latestTextRef = useRef('')
  const finalizedRef = useRef(false)

  const hasSR = !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  const hasRecorder = !!(navigator.mediaDevices?.getUserMedia && window.MediaRecorder)
  const canUseVoice = hasSR || hasRecorder

  const stopMediaTracks = useCallback(() => {
    if (!streamRef.current) return
    streamRef.current.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }, [])

  const startFallbackRecording = useCallback(async () => {
    setError('')
    setLiveText('')
    setTranscribing(false)

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
    } catch (_) {
      setError('mic_denied')
      return
    }

    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4'

    chunksRef.current = []
    const recorder = new MediaRecorder(stream, { mimeType })
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      stopMediaTracks()
      try {
        const text = await transcribeAudioBlob(blob, lang)
        if (text) onFinalRef.current?.(text, { mode: 'fallback_api' })
        else setError('stt_empty')
      } catch (_) {
        setError('stt_failed')
      } finally {
        setTranscribing(false)
        setLiveText('')
      }
    }

    recorder.start(200)
    recorderRef.current = recorder
    modeRef.current = 'fallback'
    setListening(true)
  }, [lang, stopMediaTracks])

  const start = useCallback((onFinal) => {
    onFinalRef.current = onFinal
    modeRef.current = 'idle'
    latestTextRef.current = ''
    finalizedRef.current = false
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SR) {
      if (!hasRecorder) {
        setError('unsupported')
        return
      }
      startFallbackRecording()
      return
    }

    setError('')
    setLiveText('')
    setTranscribing(false)

    const recognition = new SR()
    recognition.lang = SR_LANGUAGE_CODE[lang] || SR_LANGUAGE_CODE.en
    recognition.continuous = false
    recognition.interimResults = true

    const finalizeTranscript = (rawText) => {
      const text = String(rawText || '').trim()
      if (!text || finalizedRef.current) return
      finalizedRef.current = true
      onFinalRef.current?.(text, { mode: 'local' })
    }

    recognition.onresult = (event) => {
      let final = ''
      let interim = ''
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript
        else interim += event.results[i][0].transcript
      }
      const merged = (final || interim).trim()
      latestTextRef.current = merged
      setLiveText(merged)
      if (final.trim()) {
        finalizeTranscript(final)
        setListening(false)
        setLiveText('')
      }
    }

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') setError('mic_denied')
      setListening(false)
      setLiveText('')
    }

    recognition.onend = () => {
      if (!finalizedRef.current && latestTextRef.current.trim()) {
        finalizeTranscript(latestTextRef.current)
      }
      setListening(false)
      setLiveText('')
    }

    try {
      recognition.start()
      recognitionRef.current = recognition
      modeRef.current = 'sr'
      setListening(true)
    } catch (_) {
      setError('unsupported')
    }
  }, [hasRecorder, lang, startFallbackRecording])

  const stop = useCallback(() => {
    if (modeRef.current === 'fallback') {
      if (recorderRef.current?.state === 'recording') {
        setListening(false)
        setLiveText('')
        setTranscribing(true)
        recorderRef.current.stop()
      }
      return
    }

    try { recognitionRef.current?.stop() } catch (_) {}
    setListening(false)
  }, [])

  return { listening, transcribing, liveText, error, hasSR, canUseVoice, currentMode: modeRef.current, start, stop }
}
