import { useMemo, useState } from 'react'
import { doc, setDoc } from 'firebase/firestore'
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import VoiceMicButton from '../components/VoiceMicButton'
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

export default function FeedbackPage() {
    const t = useT()
    const navigate = useNavigate()
    const location = useLocation()
    const [searchParams] = useSearchParams()
    const { lang, toggleLang } = useLang()
    const { user, familyId, role } = useAuth()

    const [busy, setBusy] = useState(false)
    const [type, setType] = useState('bug')
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [voiceUsed, setVoiceUsed] = useState(false)
    const [voiceMode, setVoiceMode] = useState('none')
    const [error, setError] = useState('')
    const [sentId, setSentId] = useState('')

    const sourcePage = useMemo(
        () => searchParams.get('from') || location.state?.from || '/',
        [searchParams, location.state],
    )

    if (role !== 'parent') return <Navigate to="/" replace />

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
                sourcePage,
                voiceUsed,
                voiceMode,
            })
            setSentId(id)
            trackEvent('feedback_submitted', {
                type,
                voice_used: voiceUsed,
                voice_mode: voiceMode,
                message_length: trimmedMessage.length,
                page: sourcePage,
            })
        } catch {
            setError(t('feedback.reportError'))
            trackEvent('feedback_submit_failed', { reason: 'firestore_write_failed', page: sourcePage })
        } finally {
            setBusy(false)
        }
    }

    const handleTypeChange = (nextType) => {
        setType(nextType)
        trackEvent('feedback_type_selected', { type: nextType })
    }

    return (
        <div className="feedback-page">
            <div className="page-header row between center">
                <div>
                    <h1 className="page-title">{t('feedback.reportTitle')}</h1>
                    <p className="page-subtitle">{t('feedback.pageSubtitle')}</p>
                </div>
                <button className="btn btn-ghost" type="button" onClick={() => navigate(-1)} disabled={busy}>
                    {t('common.back')}
                </button>
            </div>

            <div className="card feedback-page-card">
                {sentId ? (
                    <div className="feedback-report-success">
                        <div className="feedback-report-success__title">{t('feedback.reportSuccess')}</div>
                        <div className="feedback-report-success__id">#{sentId.slice(0, 8)}</div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => navigate(-1)}>{t('common.close')}</button>
                            <button
                                className="btn btn-primary"
                                onClick={() => {
                                    setType('bug')
                                    setSubject('')
                                    setMessage('')
                                    setVoiceUsed(false)
                                    setVoiceMode('none')
                                    setError('')
                                    setSentId('')
                                }}
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
                                className="btn btn-ghost btn-sm lang-switch--flag-only"
                                type="button"
                                onClick={toggleLang}
                                disabled={busy}
                                aria-label={t('common.langSwitchAria')}
                                title={t('common.langSwitchAria')}
                            >
                                <span className="lang-switch__flag" aria-hidden>
                                    <img
                                        className="lang-switch__flag-img"
                                        src={lang.startsWith('vi') ? '/flags/vn.svg' : '/flags/us.svg'}
                                        alt=""
                                    />
                                </span>
                            </button>
                        </div>
                        <div className="feedback-type-group">
                            {FEEDBACK_TYPES.map((option) => (
                                <button
                                    key={option}
                                    type="button"
                                    className={`chip chip--sm${type === option ? ' selected' : ''}`}
                                    onClick={() => handleTypeChange(option)}
                                    disabled={busy}
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
                                disabled={busy}
                            />
                        </div>

                        <div className="form-group">
                            <label>{t('feedback.reportMessage')}</label>
                            <div className="form-group-row">
                                <textarea
                                    value={message}
                                    onChange={(event) => setMessage(event.target.value)}
                                    placeholder={t('feedback.reportMessagePlaceholder')}
                                    rows={6}
                                    maxLength={2000}
                                    disabled={busy}
                                />
                                <VoiceMicButton
                                    field="feedback_message"
                                    role="parent"
                                    onAppend={(text, meta) => {
                                        setMessage((prev) => (prev ? `${prev} ${text}` : text))
                                        setVoiceUsed(true)
                                        setVoiceMode(meta?.mode || 'unknown')
                                    }}
                                    disabled={busy}
                                />
                            </div>
                        </div>

                        {error && <div className="login-error">{error}</div>}

                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => navigate(-1)} disabled={busy}>
                                {t('common.cancel')}
                            </button>
                            <button className="btn btn-primary" onClick={handleSubmit} disabled={busy}>
                                {busy ? t('common.loading') : t('feedback.reportSubmit')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
