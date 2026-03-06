import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useT } from '../i18n/I18nContext'
import useStore from '../store/useStore'
import { changeKidPassword, linkKidEmail } from '../firebase/auth'
import { doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

const AVATARS = ['🧒', '👦', '👧', '🧒🏻', '👦🏻', '👧🏻', '🧒🏽', '👦🏽', '👧🏽', '🧒🏿', '👦🏿', '👧🏿', '🦸', '🦸‍♂️', '🦸‍♀️', '🐶', '🐱', '🦊', '🐼', '🐸', '🦁', '🐯', '🐰', '🐻']

export default function KidProfile() {
    const t = useT()
    const { user, profile } = useAuth()
    const { kids } = useStore()
    const kid = kids.find((k) => k.id === profile?.kidId)

    const [displayName, setDisplayName] = useState(kid?.displayName || kid?.name || '')
    const [avatar, setAvatar] = useState(kid?.avatar || '🧒')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    const [currentPw, setCurrentPw] = useState('')
    const [newPw, setNewPw] = useState('')
    const [pwBusy, setPwBusy] = useState(false)
    const [pwMsg, setPwMsg] = useState('')

    const [email, setEmail] = useState('')
    const [emailBusy, setEmailBusy] = useState(false)
    const [emailMsg, setEmailMsg] = useState('')

    if (!kid) return null

    const handleSaveProfile = async () => {
        setSaving(true)
        try {
            const familyId = profile.familyId
            await updateDoc(doc(db, 'families', familyId, 'kids', kid.id), { displayName: displayName.trim(), avatar })
            setSaved(true); setTimeout(() => setSaved(false), 2000)
        } catch (err) { alert(err.message) }
        finally { setSaving(false) }
    }

    const handleChangePw = async () => {
        if (newPw.length < 6) return
        setPwBusy(true); setPwMsg('')
        try {
            await changeKidPassword(user, currentPw, newPw)
            setPwMsg(t('kidProf.passwordUpdated')); setCurrentPw(''); setNewPw('')
            setTimeout(() => setPwMsg(''), 3000)
        } catch (err) { setPwMsg(err.message) }
        finally { setPwBusy(false) }
    }

    const handleLinkEmail = async () => {
        if (!email.trim()) return
        setEmailBusy(true); setEmailMsg('')
        try {
            await linkKidEmail(email.trim())
            setEmailMsg(t('kidProf.linked'))
            setTimeout(() => setEmailMsg(''), 3000)
        } catch (err) { setEmailMsg(err.message) }
        finally { setEmailBusy(false) }
    }

    return (
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <h1 className="page-title" style={{ marginBottom: 24 }}>{t('kidProf.title')}</h1>

            {/* Profile section */}
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
                </div>
            </div>

            {/* Change password */}
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
                    {pwMsg && <div style={{ fontSize: 13, color: pwMsg.includes('✅') ? 'var(--accent-green)' : 'var(--accent-red)' }}>{pwMsg}</div>}
                    <button className="btn btn-primary" onClick={handleChangePw} disabled={pwBusy || newPw.length < 6}>
                        {pwBusy ? t('kidProf.updating') : t('kidProf.updatePassword')}
                    </button>
                </div>
            </div>

            {/* Link email */}
            <div className="card">
                <h3 style={{ fontWeight: 800, fontSize: 16, marginBottom: 8 }}>{t('kidProf.linkEmail')}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>{t('kidProf.linkEmailDesc')}</p>
                <div className="col">
                    <div className="form-group">
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('kidProf.emailPlaceholder')} />
                    </div>
                    {emailMsg && <div style={{ fontSize: 13, color: emailMsg.includes('✅') ? 'var(--accent-green)' : 'var(--accent-red)' }}>{emailMsg}</div>}
                    <button className="btn btn-primary" onClick={handleLinkEmail} disabled={emailBusy || !email.trim()}>
                        {emailBusy ? t('kidProf.linking') : t('kidProf.linkBtn')}
                    </button>
                </div>
            </div>
        </div>
    )
}
