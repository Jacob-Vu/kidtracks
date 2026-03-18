import { getFunctions, httpsCallable } from 'firebase/functions'
import { app } from '../firebase/config'

const functions = getFunctions(app, 'asia-southeast1')
const MAX_AUDIO_BYTES = 10 * 1024 * 1024

const blobToBase64 = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => {
    const result = String(reader.result || '')
    const base64 = result.includes(',') ? result.split(',')[1] : result
    resolve(base64)
  }
  reader.onerror = () => reject(new Error('file_read_error'))
  reader.readAsDataURL(blob)
})

export async function transcribeAudioBlob(blob, lang = 'vi') {
  if (!blob || blob.size === 0) return ''
  if (blob.size > MAX_AUDIO_BYTES) throw new Error('audio_too_large')

  const audioBase64 = await blobToBase64(blob)
  if (!audioBase64) return ''

  const call = httpsCallable(functions, 'transcribeSpeech')
  const languageCode = lang === 'vi' ? 'vi-VN' : 'en-US'
  const response = await call({
    audioBase64,
    mimeType: blob.type || 'audio/webm',
    languageCode,
  })

  return String(response?.data?.text || '').trim()
}
