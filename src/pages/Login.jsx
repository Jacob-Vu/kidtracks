import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import {
    signInWithGoogle,
    createFamily,
    lookupFamilyByParentEmail,
    signInKid,
} from '../firebase/auth'

const CACHED_PARENT_EMAIL_KEY = 'kidstrack-parent-email'

export default function Login() {
    const navigate = useNavigate()
    const [tab, setTab] = useState('parent') // 'parent' | 'kid'

    // Parent state
    const [parentLoading, setParentLoading] = useState(false)
    const [parentError, setParentError] = useState('')
    const [showSetup, setShowSetup] = useState(false)
    const [pendingUser, setPendingUser] = useState(null)
    const [familyName, setFamilyName] = useState('')
    const [setupLoading, setSetupLoading] = useState(false)

    // Kid state
    const [kidParentEmail, setKidParentEmail] = useState(
        () => localStorage.getItem(CACHED_PARENT_EMAIL_KEY) || ''
    )
    const [kidUsername, setKidUsername] = useState('')
    const [kidPassword, setKidPassword] = useState('')
    const [kidLoading, setKidLoading] = useState(false)
    const [kidError, setKidError] = useState('')
    const [cachedParentName, setCachedParentName] = useState(
        localStorage.getItem('kidstrack-parent-name') || ''
    )

    // ── Parent Google Login ──────────────────────────────────────────────────
    const handleGoogleSignIn = async () => {
        setParentLoading(true)
        setParentError('')
        try {
            const { isNew, user } = await signInWithGoogle()
            if (isNew) {
                setPendingUser(user)
                setFamilyName('')
                setShowSetup(true)
            } else {
                navigate('/')
            }
        } catch (e) {
            setParentError(e.message)
        } finally {
            setParentLoading(false)
        }
    }

    const handleCreateFamily = async () => {
        if (!familyName.trim()) return
        setSetupLoading(true)
        try {
            await createFamily(pendingUser, familyName.trim())
            navigate('/')
        } catch (e) {
            setParentError(e.message)
        } finally {
            setSetupLoading(false)
        }
    }

    // ── Kid Login ────────────────────────────────────────────────────────────
    const handleKidLogin = async (e) => {
        e.preventDefault()
        if (!kidParentEmail.trim() || !kidUsername.trim() || !kidPassword) return
        setKidLoading(true)
        setKidError('')
        try {
            const { familyId, parentName } = await lookupFamilyByParentEmail(kidParentEmail.trim())
            await signInKid(kidUsername.trim(), kidPassword, familyId)
            // Cache for next time
            localStorage.setItem(CACHED_PARENT_EMAIL_KEY, kidParentEmail.trim())
            localStorage.setItem('kidstrack-parent-name', parentName)
            navigate('/kid')
        } catch (e) {
            setKidError(e.message.includes('INVALID_LOGIN') || e.message.includes('auth/invalid')
                ? 'Incorrect username or password.'
                : e.message)
        } finally {
            setKidLoading(false)
        }
    }

    const clearCachedParent = () => {
        localStorage.removeItem(CACHED_PARENT_EMAIL_KEY)
        localStorage.removeItem('kidstrack-parent-name')
        setKidParentEmail('')
        setCachedParentName('')
    }

    return (
        <div className="login-page">
            {/* Background blobs */}
            <div className="login-blob login-blob-1" />
            <div className="login-blob login-blob-2" />

            <div className="login-card">
                <div className="login-logo">⭐</div>
                <h1 className="login-title">KidsTrack</h1>
                <p className="login-subtitle">Motivate your kids, every day</p>

                {/* Tab switcher */}
                <div className="login-tabs">
                    <button
                        className={`login-tab ${tab === 'parent' ? 'active' : ''}`}
                        onClick={() => setTab('parent')}
                    >
                        👨‍👩‍👧 Parent
                    </button>
                    <button
                        className={`login-tab ${tab === 'kid' ? 'active' : ''}`}
                        onClick={() => setTab('kid')}
                    >
                        🧒 Kid
                    </button>
                </div>

                {/* ── Parent Panel ── */}
                {tab === 'parent' && (
                    <div className="login-panel">
                        {!showSetup ? (
                            <>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 1.6 }}>
                                    Sign in with your Google account to manage your family's tasks and rewards.
                                </p>
                                <button
                                    className="btn-google"
                                    onClick={handleGoogleSignIn}
                                    disabled={parentLoading}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                    {parentLoading ? 'Signing in…' : 'Continue with Google'}
                                </button>
                                {parentError && <p className="login-error">{parentError}</p>}
                            </>
                        ) : (
                            /* Family setup step */
                            <div className="col">
                                <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                    <div style={{ fontSize: 40, marginBottom: 8 }}>🏠</div>
                                    <div style={{ fontWeight: 800, fontSize: 18 }}>Welcome, {pendingUser?.displayName}!</div>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 6 }}>
                                        Let's set up your family. You can change this later.
                                    </p>
                                </div>
                                <div className="form-group">
                                    <label>Family Name</label>
                                    <input
                                        type="text"
                                        value={familyName}
                                        onChange={(e) => setFamilyName(e.target.value)}
                                        placeholder="e.g. The Nguyen Family"
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFamily()}
                                    />
                                </div>
                                {parentError && <p className="login-error">{parentError}</p>}
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCreateFamily}
                                    disabled={setupLoading || !familyName.trim()}
                                    style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                                >
                                    {setupLoading ? 'Creating…' : '🚀 Create My Family'}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ── Kid Panel ── */}
                {tab === 'kid' && (
                    <div className="login-panel">
                        <form onSubmit={handleKidLogin} className="col">
                            {/* Parent email row */}
                            {cachedParentName && kidParentEmail ? (
                                <div className="login-cached-parent">
                                    <span>🏠 Logging into <strong>{cachedParentName}</strong>'s family</span>
                                    <button type="button" className="btn btn-ghost btn-sm" onClick={clearCachedParent}>
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label>Parent's Google Email</label>
                                    <input
                                        type="email"
                                        value={kidParentEmail}
                                        onChange={(e) => setKidParentEmail(e.target.value)}
                                        placeholder="dad@gmail.com"
                                        autoFocus
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label>Your Username</label>
                                <input
                                    type="text"
                                    value={kidUsername}
                                    onChange={(e) => setKidUsername(e.target.value)}
                                    placeholder="your username"
                                    autoFocus={!!(cachedParentName && kidParentEmail)}
                                />
                            </div>

                            <div className="form-group">
                                <label>Password</label>
                                <input
                                    type="password"
                                    value={kidPassword}
                                    onChange={(e) => setKidPassword(e.target.value)}
                                    placeholder="••••••••"
                                />
                            </div>

                            {kidError && <p className="login-error">{kidError}</p>}

                            <button
                                type="submit"
                                className="btn btn-primary"
                                disabled={kidLoading || !kidParentEmail || !kidUsername || !kidPassword}
                                style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
                            >
                                {kidLoading ? 'Logging in…' : '🧒 Log In'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    )
}
