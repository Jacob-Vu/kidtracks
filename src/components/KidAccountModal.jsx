import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useT } from '../i18n/I18nContext'
import useStore from '../store/useStore'
import { createKidAuthAccount } from '../firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import Modal from './Modal'

const AVATARS = ['🧒', '👦', '👧', '🧒🏻', '👦🏻', '👧🏻', '🧒🏽', '👦🏽', '👧🏽', '🧒🏿', '👦🏿', '👧🏿', '🦸', '🦸‍♂️', '🦸‍♀️', '🐶', '🐱', '🦊', '🐼', '🐸', '🦁', '🐯', '🐰', '🐻']

export default function KidAccountModal({ kid, onClose }) {
    const t = useT()
    const { profile } = useAuth()
    const { kids } = useStore()
    const isEdit = !!kid

    const [displayName, setDisplayName] = useState(kid?.displayName || kid?.name || '')
    const [username, setUsername] = useState(kid?.username || '')
    const [password, setPassword] = useState('')
    const [avatar, setAvatar] = useState(kid?.avatar || '🧒')
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState('')
    const [created, setCreated] = useState(false)

    const familyId = profile?.familyId

    const handleCreate = async () => {
        if (!displayName.trim() || !username.trim() || password.length < 6) return
        setError(''); setBusy(true)
        try {
            const syntheticEmail = `${username.trim().toLowerCase()}@${familyId}.kidstrack`
            const kidUid = await createKidAuthAccount(syntheticEmail, password)

            const kidId = Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
            await setDoc(doc(db, 'families', familyId, 'kids', kidId), {
                id: kidId, displayName: displayName.trim(), name: displayName.trim(),
                username: username.trim().toLowerCase(), avatar, balance: 0,
            })
            await setDoc(doc(db, 'users', kidUid), {
                role: 'kid', familyId, kidId, username: username.trim().toLowerCase(),
            })
            setCreated(true)
        } catch (err) {
            setError(err.message)
        } finally { setBusy(false) }
    }

    const handleEdit = async () => {
        if (!displayName.trim()) return
        setBusy(true)
        try {
            await setDoc(doc(db, 'families', familyId, 'kids', kid.id), {
                ...kid, displayName: displayName.trim(), avatar,
            })
            onClose()
        } catch (err) { setError(err.message) }
        finally { setBusy(false) }
    }

    if (created) {
        return (
            <Modal title="🎉" onClose={onClose}>
                <div style={{ textAlign: 'center', padding: 20 }}>
                    <div style={{ fontSize: 52, marginBottom: 12 }}>{avatar}</div>
                    <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>{displayName}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                        {t('kidModal.loginHint', { username: username.trim().toLowerCase() })}
                    </div>
                    <button className="btn btn-primary" onClick={onClose} style={{ marginTop: 20 }}>{t('common.close')}</button>
                </div>
            </Modal>
        )
    }

    return (
        <Modal title={isEdit ? t('kidModal.editTitle') : t('kidModal.createTitle')} onClose={onClose}>
            <div className="col">
                {error && <div className="login-error">{error}</div>}
                <div className="form-group">
                    <label>{t('kidModal.displayName')}</label>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                        placeholder={t('kidModal.namePlaceholder')} autoFocus />
                </div>
                {!isEdit && (
                    <>
                        <div className="form-group">
                            <label>{t('kidModal.username')}</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
                                placeholder={t('kidModal.usernamePlaceholder')} />
                        </div>
                        <div className="form-group">
                            <label>{t('kidModal.password')}</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••" />
                        </div>
                    </>
                )}
                <div className="form-group">
                    <label>{t('kidModal.avatar')}</label>
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
                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>{t('common.cancel')}</button>
                    <button className="btn btn-primary"
                        onClick={isEdit ? handleEdit : handleCreate}
                        disabled={busy || !displayName.trim() || (!isEdit && (password.length < 6 || !username.trim()))}>
                        {busy ? t('kidModal.creating') : isEdit ? t('kidModal.saveBtn') : t('kidModal.createBtn')}
                    </button>
                </div>
            </div>
        </Modal>
    )
}
