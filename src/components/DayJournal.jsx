import { useState, useEffect, useRef } from 'react'
import { doc, getDoc, setDoc, deleteDoc, getDocs, query, collection, where } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { useT, useLang } from '../i18n/I18nContext'
import { useVoiceRecorder } from '../hooks/useVoiceRecorder'
import { format, parseISO } from 'date-fns'
import Modal from './Modal'

const toBase64 = (blob) => new Promise((resolve) => {
  const reader = new FileReader()
  reader.onload = () => resolve(reader.result)
  reader.readAsDataURL(blob)
})

const formatDuration = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

function AudioPlayer({ src }) {
  const [playing, setPlaying] = useState(false)
  const [current, setCurrent] = useState(0)
  const [total, setTotal] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    const a = audioRef.current
    if (!a) return
    const onLoaded = () => setTotal(Math.floor(a.duration))
    const onTime = () => setCurrent(Math.floor(a.currentTime))
    const onEnd = () => setPlaying(false)
    a.addEventListener('loadedmetadata', onLoaded)
    a.addEventListener('timeupdate', onTime)
    a.addEventListener('ended', onEnd)
    return () => {
      a.removeEventListener('loadedmetadata', onLoaded)
      a.removeEventListener('timeupdate', onTime)
      a.removeEventListener('ended', onEnd)
    }
  }, [])

  const toggle = () => {
    const a = audioRef.current
    if (!a) return
    if (playing) { a.pause(); setPlaying(false) } else { a.play(); setPlaying(true) }
  }

  const pct = total > 0 ? (current / total) * 100 : 0

  return (
    <div className="journal-audio-player">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button className="journal-play-btn" onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
        {playing ? '⏸' : '▶'}
      </button>
      <div className="journal-progress">
        <div className="journal-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="journal-time">{formatDuration(current)} / {formatDuration(total)}</span>
    </div>
  )
}

export default function DayJournal({ kidId, date, role, kidName }) {
  const t = useT()
  const { lang } = useLang()
  const { familyId } = useAuth()
  const { recState, transcript, audioBlob, duration, error: voiceError, start, stop, clear } = useVoiceRecorder(lang)

  const [viewState, setViewState] = useState('loading') // loading | empty | editing | saved
  const [note, setNote] = useState(null) // { text, audioBase64, audioDuration, createdAt }
  const [editText, setEditText] = useState('')
  const [saving, setSaving] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Track previous transcript for append logic when re-recording within editing
  const prevTranscriptRef = useRef('')

  const docId = `${kidId}_${date}_${role}`
  const docPath = () => doc(db, 'families', familyId, 'dayJournal', docId)

  // Guard: if no familyId, do nothing
  if (!familyId) return null

  // Load note for current kid+date+role
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (!familyId || !kidId || !date) return
    setViewState('loading')
    getDoc(docPath()).then((snap) => {
      if (snap.exists()) {
        setNote(snap.data())
        setViewState('saved')
      } else {
        setNote(null)
        setViewState('empty')
      }
    }).catch(() => setViewState('empty'))
  }, [familyId, kidId, date, role])

  // When recording stops and we get a blob → switch to review (editing) state
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (recState === 'done') {
      setEditText((prev) => {
        const newPart = transcript || ''
        if (!prev.trim()) return newPart
        if (!newPart) return prev
        return prev + ' ' + newPart
      })
      prevTranscriptRef.current = transcript
      setViewState('editing')
    }
  }, [recState])

  const handleSave = async () => {
    if (!editText.trim()) return
    setSaving(true)
    try {
      let audioBase64 = null
      let audioDuration = null
      if (audioBlob) {
        audioBase64 = await toBase64(audioBlob)
        audioDuration = duration
      } else if (note?.audioBase64 && viewState === 'editing') {
        // Keep existing audio if editing without re-recording
        audioBase64 = note.audioBase64
        audioDuration = note.audioDuration
      }
      const now = new Date().toISOString()
      const data = {
        id: docId,
        kidId,
        date,
        role,
        text: editText.trim(),
        ...(audioBase64 ? { audioBase64, audioDuration } : {}),
        createdAt: note?.createdAt || now,
        updatedAt: now,
      }
      await setDoc(docPath(), data)
      setNote(data)
      setViewState('saved')
      clear()
    } catch (err) {
      console.error('Journal save error:', err)
    }
    setSaving(false)
  }

  const handleDelete = async () => {
    await deleteDoc(docPath())
    setNote(null)
    setViewState('empty')
    setConfirmDelete(false)
    clear()
  }

  const openEdit = () => {
    setEditText(note?.text || '')
    clear()
    setViewState('editing')
  }

  const cancelEdit = () => {
    clear()
    setViewState(note ? 'saved' : 'empty')
  }

  const handleRecord = async () => {
    clear()
    prevTranscriptRef.current = ''
    setViewState('recording')
    await start()
  }

  const loadHistory = async () => {
    setHistoryLoading(true)
    try {
      const q = query(
        collection(db, 'families', familyId, 'dayJournal'),
        where('kidId', '==', kidId),
        where('role', '==', role)
      )
      const snap = await getDocs(q)
      const docs = snap.docs.map((d) => d.data()).sort((a, b) => b.date.localeCompare(a.date))
      setHistory(docs)
    } catch (e) {
      console.error(e)
    }
    setHistoryLoading(false)
    setShowHistory(true)
  }

  // --- Render ---

  if (viewState === 'loading') return null

  const headerRight = (
    <button className="btn btn-ghost btn-sm" onClick={loadHistory} title={t('journal.history')}>
      🕐
    </button>
  )

  return (
    <div className="day-journal">
      {/* Header */}
      <div className="journal-header">
        <div className="journal-title">
          <span>📓</span>
          <span>{t('journal.title')}</span>
          {role === 'parent' && <span className="badge badge-purple" style={{ fontSize: 10, fontWeight: 700 }}>{t('journal.roleParent')}</span>}
          {role === 'kid' && <span className="badge badge-teal" style={{ fontSize: 10, fontWeight: 700 }}>{t('journal.roleKid')}</span>}
        </div>
        {headerRight}
      </div>

      {/* Empty state */}
      {viewState === 'empty' && (
        <div className="journal-empty">
          <p className="journal-empty-text">{t('journal.empty', { name: kidName || '' })}</p>
          <div className="row" style={{ gap: 10, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={handleRecord}>
              🎤 {t('journal.recordBtn')}
            </button>
            <button className="btn btn-ghost" onClick={() => { setEditText(''); setViewState('editing') }}>
              ✏️ {t('journal.writeBtn')}
            </button>
          </div>
        </div>
      )}

      {/* Recording state */}
      {viewState === 'recording' && (
        <div className="journal-recording">
          <div className="journal-rec-header">
            <span className="journal-rec-dot" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>{t('journal.recording')}</span>
            <span className="journal-rec-timer">{formatDuration(duration)}</span>
            <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }} onClick={stop}>
              ⏹ {t('journal.stop')}
            </button>
          </div>
          <div className="voice-waveform">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="voice-bar" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
          {transcript && (
            <p className="journal-live-transcript">{transcript}</p>
          )}
        </div>
      )}

      {/* Editing / Review state */}
      {viewState === 'editing' && (
        <div className="journal-editing">
          {voiceError === 'mic_denied' && (
            <div className="login-error" style={{ marginBottom: 8 }}>{t('journal.micDenied')}</div>
          )}
          {recState === 'done' && audioBlob && (
            <div className="journal-preview-audio">
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t('journal.previewAudio')}</span>
              <AudioPlayer src={URL.createObjectURL(audioBlob)} />
            </div>
          )}
          <div className="journal-textarea-wrap">
            <textarea
              className="journal-textarea"
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              placeholder={t('journal.placeholder')}
              rows={4}
              autoFocus={recState !== 'done'}
            />
            <button
              className={`journal-mic-inline ${recState === 'recording' ? 'recording' : ''}`}
              onClick={recState === 'recording' ? stop : handleRecord}
              title={recState === 'recording' ? t('journal.stop') : t('journal.recordBtn')}
            >
              {recState === 'recording' ? '⏹' : '🎤'}
            </button>
          </div>
          <div className="row" style={{ gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            {recState === 'done' && (
              <button className="btn btn-ghost btn-sm" onClick={() => { clear(); handleRecord() }}>
                🔄 {t('journal.reRecord')}
              </button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={cancelEdit}>{t('common.cancel')}</button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || !editText.trim()}>
              {saving ? '⏳' : '💾'} {t('common.save')}
            </button>
          </div>
        </div>
      )}

      {/* Saved note state */}
      {viewState === 'saved' && note && (
        <div className="journal-saved">
          <blockquote className="journal-text">{note.text}</blockquote>
          {note.audioBase64 && (
            <AudioPlayer src={note.audioBase64} />
          )}
          <div className="row between center" style={{ marginTop: 12 }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              {note.updatedAt ? format(new Date(note.updatedAt), 'HH:mm, dd/MM/yyyy') : ''}
            </span>
            <div className="row" style={{ gap: 6 }}>
              <button className="btn btn-ghost btn-sm" onClick={openEdit}>✏️ {t('common.edit')}</button>
              <button className="btn btn-danger btn-sm" onClick={() => setConfirmDelete(true)}>🗑️</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {confirmDelete && (
        <Modal title={t('journal.deleteTitle')} onClose={() => setConfirmDelete(false)}>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>{t('journal.deleteConfirm')}</p>
          <div className="modal-footer">
            <button className="btn btn-ghost" onClick={() => setConfirmDelete(false)}>{t('common.cancel')}</button>
            <button className="btn btn-danger" onClick={handleDelete}>{t('common.delete')}</button>
          </div>
        </Modal>
      )}

      {/* History modal */}
      {showHistory && (
        <Modal title={`🕐 ${t('journal.historyTitle')} — ${kidName}`} onClose={() => setShowHistory(false)}>
          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>{t('common.loading')}</div>
          ) : history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>{t('journal.historyEmpty')}</div>
          ) : (
            <div className="col" style={{ maxHeight: 440, overflowY: 'auto', gap: 0 }}>
              {history.map((entry) => (
                <div key={entry.id} className="journal-history-entry">
                  <div className="journal-history-date">
                    📅 {format(parseISO(entry.date), 'EEE, dd/MM/yyyy')}
                    {entry.date === date && <span className="badge badge-purple" style={{ marginLeft: 6, fontSize: 10 }}>{t('daily.today')}</span>}
                  </div>
                  <p className="journal-history-text">{entry.text}</p>
                  {entry.audioBase64 && <AudioPlayer src={entry.audioBase64} />}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
