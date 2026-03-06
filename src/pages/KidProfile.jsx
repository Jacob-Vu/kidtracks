import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { changeKidPassword, linkKidEmail } from '../firebase/auth'
import useStore from '../store/useStore'
import { useFireActions } from '../hooks/useFirebaseSync'
import KidLayout from '../layouts/KidLayout'

const AVATARS = ['🧒', '👦', '👧', '🧑', '👶', '🦸', '🧙', '👸', '🤴', '🏃', '🦊', '🐱', '🐶', '🐻', '🦁', '🐯']

export default function KidProfile() {
    const { kidId, familyId, user } = useAuth()
    const { kids } = useStore()
    const { updateKid } = useFireActions()
    const kid = kids.find((k) => k.id === kidId)

    // Profile edit
    const [displayName, setDisplayName] = useState(kid?.displayName || '')
    const [avatar, setAvatar] = useState(kid?.avatar || '🧒')
    const [profileSaving, setProfileSaving] = useState(false)
    const [profileMsg, setProfileMsg] = useState('')

    // Password change
    const [currentPw, setCurrentPw] = useState('')
    const [newPw, setNewPw] = useState('')
    const [confirmPw, setConfirmPw] = useState('')
    const [pwLoading, setPwLoading] = useState(false)
    const [pwMsg, setPwMsg] = useState('')
    const [pwError, setPwError] = useState('')

    // Link email
    const [linkPw, setLinkPw] = useState('')
    const [linkEmail, setLinkEmail] = useState('')
    const [linkLoading, setLinkLoading] = useState(false)
    const [linkMsg, setLinkMsg] = useState('')
    const [linkError, setLinkError] = useState('')

    const saveProfile = async () => {
        if (!displayName.trim()) return
        setProfileSaving(true)
        try {
            await updateKid(kidId, { displayName: displayName.trim(), avatar })
            setProfileMsg('✅ Profile updated!')
            setTimeout(() => setProfileMsg(''), 3000)
        } catch {
            setProfileMsg('❌ Failed to update profile.')
        } finally {
            setProfileSaving(false)
        }
    }

    const handleChangePw = async (e) => {
        e.preventDefault()
        setPwError('')
        if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return }
        if (newPw.length < 6) { setPwError('Password must be at least 6 characters.'); return }
        setPwLoading(true)
        try {
            await changeKidPassword(currentPw, newPw)
            setPwMsg('✅ Password changed!')
            setCurrentPw(''); setNewPw(''); setConfirmPw('')
            setTimeout(() => setPwMsg(''), 3000)
        } catch (err) {
            setPwError(err.message.includes('INVALID_LOGIN') || err.message.includes('wrong-password')
                ? 'Current password is incorrect.'
                : err.message)
        } finally {
            setPwLoading(false)
        }
    }

    const handleLinkEmail = async (e) => {
        e.preventDefault()
        setLinkError('')
        setLinkLoading(true)
        try {
            await linkKidEmail(linkPw, linkEmail)
            setLinkMsg('✅ Email linked successfully!')
            setLinkPw(''); setLinkEmail('')
            setTimeout(() => setLinkMsg(''), 3000)
        } catch (err) {
            setLinkError(err.message)
        } finally {
            setLinkLoading(false)
        }
    }

    if (!kid) return null

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">⚙️ My Profile</h1>
                <p className="page-subtitle">Update your info and account settings</p>
            </div>

            {/* Profile */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>👤 Display Name & Avatar</h3>
                <div className="col">
                    <div className="form-group">
                        <label>Display Name</label>
                        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Avatar</label>
                        <div className="chip-group">
                            {AVATARS.map((a) => (
                                <button key={a} onClick={() => setAvatar(a)} style={{
                                    background: avatar === a ? 'var(--gradient-purple)' : 'rgba(255,255,255,0.05)',
                                    border: `2px solid ${avatar === a ? 'transparent' : 'var(--border)'}`,
                                    borderRadius: 10, fontSize: 22, padding: '5px 9px', cursor: 'pointer',
                                    transform: avatar === a ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.2s',
                                }}>{a}</button>
                            ))}
                        </div>
                    </div>
                    {profileMsg && <p style={{ color: 'var(--accent-green)', fontSize: 13 }}>{profileMsg}</p>}
                    <button className="btn btn-primary" onClick={saveProfile}
                        disabled={profileSaving || !displayName.trim()}>
                        {profileSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Change Password */}
            <div className="card" style={{ marginBottom: 24 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 16 }}>🔑 Change Password</h3>
                <form onSubmit={handleChangePw} className="col">
                    <div className="form-group">
                        <label>Current Password</label>
                        <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>New Password</label>
                        <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Confirm New Password</label>
                        <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                    </div>
                    {pwError && <p style={{ color: 'var(--accent-red)', fontSize: 13 }}>{pwError}</p>}
                    {pwMsg && <p style={{ color: 'var(--accent-green)', fontSize: 13 }}>{pwMsg}</p>}
                    <button type="submit" className="btn btn-primary" disabled={pwLoading || !currentPw || !newPw || !confirmPw}>
                        {pwLoading ? 'Changing…' : 'Change Password'}
                    </button>
                </form>
            </div>

            {/* Link Real Email */}
            <div className="card">
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>📧 Link Your Email</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
                    Link your real email so you can reset your own password in the future.
                </p>
                <form onSubmit={handleLinkEmail} className="col">
                    <div className="form-group">
                        <label>Your Email</label>
                        <input type="email" value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} placeholder="your@email.com" />
                    </div>
                    <div className="form-group">
                        <label>Confirm Password</label>
                        <input type="password" value={linkPw} onChange={(e) => setLinkPw(e.target.value)} />
                    </div>
                    {linkError && <p style={{ color: 'var(--accent-red)', fontSize: 13 }}>{linkError}</p>}
                    {linkMsg && <p style={{ color: 'var(--accent-green)', fontSize: 13 }}>{linkMsg}</p>}
                    <button type="submit" className="btn btn-primary" disabled={linkLoading || !linkEmail || !linkPw}>
                        {linkLoading ? 'Linking…' : 'Link Email'}
                    </button>
                </form>
            </div>
        </div>
    )
}
