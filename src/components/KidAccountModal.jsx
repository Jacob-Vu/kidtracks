import { useState } from 'react'
import Modal from './Modal'
import { useFireActions } from '../hooks/useFirebaseSync'
import { createKidAuthAccount } from '../firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'
import { kidAuthEmail } from '../firebase/auth'

const AVATARS = ['🧒', '👦', '👧', '🧑', '👶', '🦸', '🧙', '👸', '🤴', '🏃', '🦊', '🐱', '🐶', '🐻', '🦁', '🐯']
const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36)

export default function KidAccountModal({ kid, onClose }) {
    const { familyId } = useAuth()
    const { addKid: buildKid, updateKid } = useFireActions()
    const isEdit = !!kid

    // Create fields
    const [displayName, setDisplayName] = useState(kid?.displayName || '')
    const [username, setUsername] = useState(kid?.username || '')
    const [avatar, setAvatar] = useState(kid?.avatar || '🧒')
    const [password, setPassword] = useState('')
    const [confirmPw, setConfirmPw] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleCreate = async () => {
        setError('')
        if (!displayName.trim() || !username.trim() || !password) {
            setError('All fields are required.'); return
        }
        if (password !== confirmPw) { setError('Passwords do not match.'); return }
        if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            setError('Username can only contain letters, numbers, and underscores.'); return
        }

        setLoading(true)
        try {
            // 1. Create Firebase Auth user via REST (parent stays signed in)
            const kidUid = await createKidAuthAccount(username.trim(), password, familyId)

            // 2. Create kid doc in Firestore
            const kidId = generateId()
            const kidDoc = {
                id: kidId,
                displayName: displayName.trim(),
                username: username.trim().toLowerCase(),
                avatar,
                balance: 0,
                firebaseUid: kidUid,
            }
            const { saveDoc } = await import('../firebase/db')
            await saveDoc(familyId, 'kids', kidDoc)

            // 3. Create userProfile for kid
            await setDoc(doc(db, 'userProfiles', kidUid), {
                role: 'kid',
                familyId,
                kidId,
                displayName: displayName.trim(),
                username: username.trim().toLowerCase(),
            })

            onClose()
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async () => {
        setError('')
        setLoading(true)
        try {
            await updateKid(kid.id, { displayName: displayName.trim(), avatar })
            onClose()
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal title={isEdit ? `Edit ${kid.displayName}` : 'Add New Kid'} onClose={onClose}>
            <div className="col">
                <div className="form-group">
                    <label>Display Name</label>
                    <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Bình" autoFocus />
                </div>

                {!isEdit && (
                    <div className="form-group">
                        <label>Username <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: 12 }}>(used to log in)</span></label>
                        <input type="text" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())}
                            placeholder="e.g. binh123 (letters, numbers, underscore)" />
                    </div>
                )}

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

                {!isEdit && (
                    <>
                        <div className="form-group">
                            <label>Initial Password</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                placeholder="At least 6 characters" />
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                        </div>
                        <div style={{
                            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
                            borderRadius: 'var(--radius-md)', padding: '10px 14px', fontSize: 12,
                            color: 'var(--accent-amber)', lineHeight: 1.6,
                        }}>
                            📋 Login info for <strong>{displayName || 'kid'}</strong>:<br />
                            Parent email: <em>your Google email</em><br />
                            Username: <strong>{username || '(set above)'}</strong>
                        </div>
                    </>
                )}

                {error && <p style={{ color: 'var(--accent-red)', fontSize: 13 }}>{error}</p>}

                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button
                        className="btn btn-primary"
                        onClick={isEdit ? handleUpdate : handleCreate}
                        disabled={loading || !displayName.trim() || (!isEdit && (!username.trim() || !password))}
                    >
                        {loading ? 'Saving…' : isEdit ? 'Save Changes' : '+ Create Account'}
                    </button>
                </div>
            </div>
        </Modal>
    )
}
