import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useT } from '../i18n/I18nContext'
import useStore from '../store/useStore'
import { changeKidPassword, linkKidEmail } from '../firebase/auth'
import { useFireActions } from '../hooks/useFirebaseSync'
import { useTheme, THEMES } from '../contexts/ThemeContext'

const AVATARS = ['🧒', '👦', '👧', '🧒🏻', '👦🏻', '👧🏻', '🧒🏽', '👦🏽', '👧🏽', '🧒🏿', '👦🏿', '👧🏿', '🦸', '🦸‍♂️', '🦸‍♀️', '🐶', '🐱', '🦊', '🐼', '🐸', '🦁', '🐯', '🐰', '🐻']

export default function KidProfile() {
    const t = useT()
    const { profile } = useAuth()
    const { kids } = useStore()
    const { updateKid } = useFireActions()
    const { theme, setTheme } = useTheme()
    const kid = kids.find((k) => k.id === profile?.kidId)

    const [displayName, setDisplayName] = useState('')
    const [avatar, setAvatar] = useState('🧒')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [profileMsg, setProfileMsg] = useState(null)

    const [currentPw, setCurrentPw] = useState('')
    const [newPw, setNewPw] = useState('')
    const [pwBusy, setPwBusy] = useState(false)
    const [pwMsg, setPwMsg] = useState(null)

    const [email, setEmail] = useState('')
    const [emailCurrentPw, setEmailCurrentPw] = useState('')
    const [emailBusy, setEmailBusy] = useState(false)
    const [emailMsg, setEmailMsg] = useState(null)

    useEffect(() => {
        if (!kid) return
        setDisplayName(kid.displayName || kid.name || '')
        setAvatar(kid.avatar || '🧒')
    }, [kid])

    if (!kid) return null

    const handleSaveProfile = async () => {
        setSaving(true)
        setProfileMsg(null)
        try {
            await updateKid(kid.id, { displayName: displayName.trim(), name: displayName.trim(), avatar })
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            setProfileMsg({ type: 'error', text: err.message })
        } finally {
            setSaving(false)
        }
    }

    const handleChangePw = async () => {
        if (newPw.length < 6) return
        setPwBusy(true)
        setPwMsg(null)
        try {
            await changeKidPassword(currentPw, newPw)
            setPwMsg({ type: 'success', text: t('kidProf.passwordUpdated') })
            setCurrentPw('')
            setNewPw('')
            setTimeout(() => setPwMsg(null), 3000)
        } catch (err) {
            setPwMsg({ type: 'error', text: err.message })
        } finally {
            setPwBusy(false)
        }
    }

    const handleLinkEmail = async () => {
        if (!email.trim() || !emailCurrentPw.trim()) return
        setEmailBusy(true)
        setEmailMsg(null)
        try {
            await linkKidEmail(emailCurrentPw, email.trim())
            setEmailMsg({ type: 'success', text: t('kidProf.linked') })
            setEmail('')
            setEmailCurrentPw('')
            setTimeout(() => setEmailMsg(null), 3000)
        } catch (err) {
            setEmailMsg({ type: 'error', text: err.message })
        } finally {
            setEmailBusy(false)
        }
    }

    return (
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <h1 className="page-title" style={{ marginBottom: 24 }}>{t('kidProf.title')}</h1>

            <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 6 }}>🎨 {t('theme.title')}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>{t('theme.desc')}</p>
                <div className="theme-picker">
                    {THEMES.map((th) => (
                        <button
                            key={th.id}
                            className={`theme-swatch${theme === th.id ? ' theme-swatch--active' : ''}`}
                            style={{ background: `linear-gradient(135deg, ${th.colors[0]}, ${th.colors[1]})` }}
                            onClick={() => setTheme(th.id)}
                            title={th.name}
                            aria-label={th.name}
                        >
                            {th.emoji}
                        </button>
                    ))}
                </div>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
                <div className="col">
                    <div className="form-group">
                        <label>{t('kidProf.displayName')}</label>
                        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>{t('kidProf.avatar')}</label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {AVATARS.map((a) => (
                                <button key={a} onClick={() => setAvatar(a)}
                                    style={{
                                        fontSize: 28, background: avatar === a ? 'rgba(124,58,237,0.2)' : 'transparent',
                                        border: avatar === a ? '2px solid var(--accent-purple)' : '2px solid transparent',
                                        borderRadius: 'var(--radius-sm)', padding: 6, cursor: 'pointer'
                                    }}>
                                    {a}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
                        {saving ? t('kidProf.saving') : saved ? t('kidProf.saved') : t('kidProf.saveProfile')}
                    </button>
                    {profileMsg && <div style={{ fontSize: 13, color: profileMsg.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{profileMsg.text}</div>}
                </div>
            </div>

            <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 16 }}>{t('kidProf.changePassword')}</h3>
                <div className="col">
                    <div className="form-group">
                        <label>{t('kidProf.currentPassword')}</label>
                        <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>{t('kidProf.newPassword')}</label>
                        <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                    </div>
                    {pwMsg && <div style={{ fontSize: 13, color: pwMsg.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{pwMsg.text}</div>}
                    <button className="btn btn-primary" onClick={handleChangePw} disabled={pwBusy || newPw.length < 6}>
                        {pwBusy ? t('kidProf.updating') : t('kidProf.updatePassword')}
                    </button>
                </div>
            </div>

            <div className="card">
                <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{t('kidProf.linkEmail')}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>{t('kidProf.linkEmailDesc')}</p>
                <div className="col">
                    <div className="form-group">
                        <label>{t('kidProf.currentPassword')}</label>
                        <input type="password" value={emailCurrentPw} onChange={(e) => setEmailCurrentPw(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('kidProf.emailPlaceholder')} />
                    </div>
                    {emailMsg && <div style={{ fontSize: 13, color: emailMsg.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)' }}>{emailMsg.text}</div>}
                    <button className="btn btn-primary" onClick={handleLinkEmail} disabled={emailBusy || !email.trim() || !emailCurrentPw.trim()}>
                        {emailBusy ? t('kidProf.linking') : t('kidProf.linkBtn')}
                    </button>
                </div>
            </div>
        </div>
    )
}
