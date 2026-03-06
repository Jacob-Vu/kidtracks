import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useT, useLang } from '../i18n/I18nContext'
import { signInWithGoogle, signInKid, lookupFamilyByParentEmail } from '../firebase/auth'
import { doc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function Login() {
    const navigate = useNavigate()
    const { user, profile, loading } = useAuth()
    const t = useT()
    const { lang, setLang } = useLang()

    const [tab, setTab] = useState('parent')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    // Parent setup flow
    const [showSetup, setShowSetup] = useState(false)
    const [familyName, setFamilyName] = useState('')

    // Kid login
    const [parentEmail, setParentEmail] = useState(() => localStorage.getItem('kidstrack-parent-email') || '')
    const [kidUsername, setKidUsername] = useState('')
    const [kidPassword, setKidPassword] = useState('')

    // Redirect if already logged in
    if (!loading && user && profile) {
        if (profile.role === 'kid') { navigate('/kid', { replace: true }); return null }
        navigate('/', { replace: true }); return null
    }

    const handleGoogleSignIn = async () => {
        setError(''); setBusy(true)
        try {
            const result = await signInWithGoogle()
            if (result.isNewUser) { setShowSetup(true); setBusy(false); return }
            navigate('/')
        } catch (err) {
            setError(err.message); setBusy(false)
        }
    }

    const handleCreateFamily = async () => {
        if (!familyName.trim()) return
        setError(''); setBusy(true)
        try {
            const familyId = 'fam_' + user.uid
            await setDoc(doc(db, 'families', familyId), { name: familyName.trim(), parentUids: [user.uid], createdAt: new Date().toISOString() })
            await setDoc(doc(db, 'users', user.uid), { role: 'parent', familyId, email: user.email, displayName: user.displayName })
            navigate('/')
        } catch (err) {
            setError(err.message); setBusy(false)
        }
    }

    const handleKidLogin = async () => {
        if (!parentEmail.trim() || !kidUsername.trim() || !kidPassword.trim()) return
        setError(''); setBusy(true)
        try {
            const familyId = await lookupFamilyByParentEmail(parentEmail.trim())
            if (!familyId) { setError(lang === 'vi' ? 'Không tìm thấy gia đình. Kiểm tra lại email.' : 'Family not found. Check parent email.'); setBusy(false); return }
            localStorage.setItem('kidstrack-parent-email', parentEmail.trim())
            await signInKid(kidUsername.trim(), familyId, kidPassword.trim())
            navigate('/kid')
        } catch (err) {
            setError(err.code === 'auth/invalid-credential'
                ? (lang === 'vi' ? 'Sai tên đăng nhập hoặc mật khẩu.' : 'Wrong username or password.')
                : err.message)
            setBusy(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-blob login-blob-1" />
            <div className="login-blob login-blob-2" />

            <div className="login-card">
                {/* Language switcher top-right */}
                <button className="lang-switch" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
                    style={{ position: 'absolute', top: 16, right: 16 }}>
                    {lang === 'vi' ? '🇬🇧 EN' : '🇻🇳 VN'}
                </button>

                <div className="login-logo">⭐</div>
                <div className="login-title">{t('login.title')}</div>
                <div className="login-subtitle">{t('login.subtitle')}</div>

                <div className="login-tabs">
                    <button className={`login-tab ${tab === 'parent' ? 'active' : ''}`} onClick={() => setTab('parent')}>
                        {t('login.parentTab')}
                    </button>
                    <button className={`login-tab ${tab === 'kid' ? 'active' : ''}`} onClick={() => setTab('kid')}>
                        {t('login.kidTab')}
                    </button>
                </div>

                {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}

                {tab === 'parent' ? (
                    <div className="login-panel">
                        {showSetup ? (
                            <div className="col" style={{ gap: 16 }}>
                                <p style={{ fontWeight: 800, fontSize: 18, textAlign: 'center' }}>{t('login.setupTitle')}</p>
                                <div className="form-group">
                                    <label>{t('login.familyName')}</label>
                                    <input type="text" value={familyName} onChange={(e) => setFamilyName(e.target.value)}
                                        placeholder={t('login.familyPlaceholder')} autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFamily()} />
                                </div>
                                <button className="btn btn-primary" onClick={handleCreateFamily} disabled={busy || !familyName.trim()}
                                    style={{ width: '100%', justifyContent: 'center' }}>
                                    {busy ? t('login.creating') : t('login.createFamily')}
                                </button>
                            </div>
                        ) : (
                            <div className="col" style={{ gap: 16 }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center' }}>
                                    {t('login.parentDesc')}
                                </p>
                                <button className="btn-google" onClick={handleGoogleSignIn} disabled={busy}>
                                    <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
                                    {busy ? t('login.signingIn') : t('login.googleBtn')}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="login-panel">
                        <div className="col" style={{ gap: 14 }}>
                            {parentEmail && (
                                <div className="login-cached-parent">
                                    <span>{t('login.cachedParent')} {parentEmail}</span>
                                    <button className="btn btn-ghost btn-sm" onClick={() => { setParentEmail(''); localStorage.removeItem('kidstrack-parent-email') }}>
                                        {t('login.changeFamily')}
                                    </button>
                                </div>
                            )}
                            {!parentEmail && (
                                <div className="form-group">
                                    <label>{t('login.kidParentEmail')}</label>
                                    <input type="text" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)}
                                        placeholder={t('login.kidParentPlaceholder')} />
                                </div>
                            )}
                            <div className="form-group">
                                <label>{t('login.kidUsername')}</label>
                                <input type="text" value={kidUsername} onChange={(e) => setKidUsername(e.target.value)}
                                    placeholder={t('login.kidUsernamePlaceholder')} />
                            </div>
                            <div className="form-group">
                                <label>{t('login.kidPassword')}</label>
                                <input type="password" value={kidPassword} onChange={(e) => setKidPassword(e.target.value)}
                                    placeholder={t('login.kidPasswordPlaceholder')}
                                    onKeyDown={(e) => e.key === 'Enter' && handleKidLogin()} />
                            </div>
                            <button className="btn btn-primary" onClick={handleKidLogin} disabled={busy}
                                style={{ width: '100%', justifyContent: 'center' }}>
                                {busy ? t('login.kidLoggingIn') : t('login.kidLoginBtn')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
