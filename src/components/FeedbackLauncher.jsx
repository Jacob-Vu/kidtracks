import { useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { useLocation } from 'react-router-dom'
import Modal from './Modal'
import VoiceMicButton from './VoiceMicButton'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { useLang, useT } from '../i18n/I18nContext'
import { trackEvent } from '../hooks/useAnalytics'

const FEEDBACK_TYPES = ['bug', 'feedback', 'idea']

const createId = () => {
    try {
        if (crypto?.randomUUID) return crypto.randomUUID()
    } catch {
        // ignore
    }
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export default function FeedbackLauncher({ compact = false }) {
    const t = useT()
    const { lang, setLang } = useLang()
    const { user, familyId, role } = useAuth()
    const location = useLocation()

    const [open, setOpen] = useState(false)
    const [busy, setBusy] = useState(false)
    const [type, setType] = useState('bug')
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [voiceUsed, setVoiceUsed] = useState(false)
    const [voiceMode, setVoiceMode] = useState('none')
    const [error, setError] = useState('')
    const [sentId, setSentId] = useState('')

    if (role !== 'parent') return null

    const openPanel = () => {
        setOpen(true)
        setError('')
        trackEvent('feedback_bubble_opened', {
            page: location.pathname,
            locale: lang,
        })
    }

    const closePanel = () => {
        setOpen(false)
    }

    const resetForm = () => {
        setType('bug')
        setSubject('')
        setMessage('')
        setVoiceUsed(false)
        setVoiceMode('none')
        setError('')
        setSentId('')
    }

    const handleSubmit = async () => {
        const trimmedMessage = message.trim()
        if (trimmedMessage.length < 10) {
            setError(t('feedback.reportValidation'))
            return
        }
        if (!familyId || !user?.uid) {
            setError(t('feedback.reportError'))
            return
        }

        setBusy(true)
        setError('')
        try {
            const id = createId()
            await setDoc(doc(db, 'families', familyId, 'feedbackReports', id), {
                id,
                type,
                subject: subject.trim(),
                message: trimmedMessage,
                locale: lang,
                createdByUid: user.uid,
                createdByRole: 'parent',
                createdAt: new Date().toISOString(),
                status: 'new',
                sourcePage: location.pathname,
                voiceUsed,
                voiceMode,
            })
            setSentId(id)
            trackEvent('feedback_submitted', {
                type,
                voice_used: voiceUsed,
                voice_mode: voiceMode,
                message_length: trimmedMessage.length,
            })
        } catch (_) {
            setError(t('feedback.reportError'))
            trackEvent('feedback_submit_failed', { reason: 'firestore_write_failed' })
        } finally {
            setBusy(false)
        }
    }

    const handleTypeChange = (nextType) => {
        setType(nextType)
        trackEvent('feedback_type_selected', { type: nextType })
    }

    return (
        <>
            <button
                type="button"
                className={`feedback-launcher-btn${compact ? ' feedback-launcher-btn--compact' : ''}`}
                onClick={openPanel}
                title={t('feedback.reportBtn')}
                aria-label={t('feedback.reportBtn')}
            >
                {compact ? '✉' : `✉ ${t('feedback.reportBtn')}`}
            </button>

            {open && (
                <Modal title={t('feedback.reportTitle')} onClose={closePanel}>
                    {sentId ? (
                        <div className="feedback-report-success">
                            <div className="feedback-report-success__title">{t('feedback.reportSuccess')}</div>
                            <div className="feedback-report-success__id">#{sentId.slice(0, 8)}</div>
                            <div className="modal-footer">
                                <button className="btn btn-ghost" onClick={closePanel}>{t('common.close')}</button>
                                <button
                                    className="btn btn-primary"
                                    onClick={resetForm}
                                >
                                    {t('feedback.reportAnother')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="col">
                            <div className="row between center" style={{ marginBottom: 8 }}>
                                <label>{t('feedback.reportType')}</label>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    type="button"
                                    onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
                                >
                                    {lang === 'vi' ? 'EN' : 'VN'}
                                </button>
                            </div>
                            <div className="feedback-type-group">
                                {FEEDBACK_TYPES.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        className={`chip chip--sm${type === option ? ' selected' : ''}`}
                                        onClick={() => handleTypeChange(option)}
                                    >
                                        {t(`feedback.type.${option}`)}
                                    </button>
                                ))}
                            </div>

                            <div className="form-group">
                                <label>{t('feedback.reportSubject')}</label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(event) => setSubject(event.target.value)}
                                    placeholder={t('feedback.reportSubjectPlaceholder')}
                                    maxLength={120}
                                />
                            </div>

                            <div className="form-group">
                                <label>{t('feedback.reportMessage')}</label>
                                <div className="form-group-row">
                                    <textarea
                                        value={message}
                                        onChange={(event) => setMessage(event.target.value)}
                                        placeholder={t('feedback.reportMessagePlaceholder')}
                                        rows={5}
                                        maxLength={2000}
                                    />
                                    <VoiceMicButton
                                        field="feedback_message"
                                        role="parent"
                                        onAppend={(text, meta) => {
                                            setMessage((prev) => (prev ? `${prev} ${text}` : text))
                                            setVoiceUsed(true)
                                            setVoiceMode(meta?.mode || 'unknown')
                                        }}
                                    />
                                </div>
                            </div>

                            {error && <div className="login-error">{error}</div>}

                            <div className="modal-footer">
                                <button className="btn btn-ghost" onClick={closePanel} disabled={busy}>
                                    {t('common.cancel')}
                                </button>
                                <button className="btn btn-primary" onClick={handleSubmit} disabled={busy}>
                                    {busy ? t('common.loading') : t('feedback.reportSubmit')}
                                </button>
                            </div>
                        </div>
                    )}
                </Modal>
            )}
        </>
    )
}
