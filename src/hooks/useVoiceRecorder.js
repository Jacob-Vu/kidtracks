import { useState, useRef, useCallback } from 'react'

export function useVoiceRecorder(lang = 'vi') {
  // states: 'idle' | 'recording' | 'done'
  const [recState, setRecState] = useState('idle')
  const [transcript, setTranscript] = useState('')
  const [audioBlob, setAudioBlob] = useState(null)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState('')

  const recognitionRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)
  const startTimeRef = useRef(null)
  const streamRef = useRef(null)

  const start = useCallback(async () => {
    setError('')
    setTranscript('')
    setAudioBlob(null)
    setDuration(0)

    let stream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
    } catch (err) {
      setError('mic_denied')
      return
    }

    // MediaRecorder for audio capture
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm')
      ? 'audio/webm'
      : 'audio/mp4'

    const recorder = new MediaRecorder(stream, { mimeType })
    chunksRef.current = []
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType })
      setAudioBlob(blob)
      stream.getTracks().forEach((t) => t.stop())
    }
    recorder.start(200)
    recorderRef.current = recorder

    // SpeechRecognition for live transcript
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SR) {
      const recognition = new SR()
      recognition.lang = lang === 'vi' ? 'vi-VN' : 'en-US'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.onresult = (e) => {
        let final = ''
        let interim = ''
        for (let i = 0; i < e.results.length; i++) {
          if (e.results[i].isFinal) final += e.results[i][0].transcript + ' '
          else interim += e.results[i][0].transcript
        }
        setTranscript((final + interim).trim())
      }
      recognition.onerror = () => {} // silence errors
      try { recognition.start() } catch (_) {}
      recognitionRef.current = recognition
    }

    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000))
    }, 1000)

    setRecState('recording')
  }, [lang])

  const stop = useCallback(() => {
    clearInterval(timerRef.current)
    try { recognitionRef.current?.stop() } catch (_) {}
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop()
    setRecState('done')
  }, [])

  const clear = useCallback(() => {
    setTranscript('')
    setAudioBlob(null)
    setDuration(0)
    setError('')
    setRecState('idle')
  }, [])

  return { recState, transcript, audioBlob, duration, error, start, stop, clear }
}
