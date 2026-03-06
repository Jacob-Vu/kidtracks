import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useT, useLang } from '../i18n/I18nContext'
import { signInWithGoogle, signInParentEmail, signUpParentEmail, signInKid, lookupFamilyByParentEmail, createFamily } from '../firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'

export default function Login() {
    const navigate = useNavigate()
    const { user, profile, loading } = useAuth()
    const t = useT()
    const { lang, setLang } = useLang()

    const [tab, setTab] = useState('parent')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

    // Parent: toggle between Google and Email login
    const [parentMode, setParentMode] = useState('choose') // 'choose' | 'email-login' | 'email-signup' | 'setup'

    // Parent setup flow
    const [familyName, setFamilyName] = useState('')

    // Parent email/password
    const [parentEmail, setParentEmail] = useState('')
    const [parentPassword, setParentPassword] = useState('')

    // Kid login
    const [kidParentEmail, setKidParentEmail] = useState(() => localStorage.getItem('kidstrack-parent-email') || '')
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
            if (result.isNew) { setParentMode('setup'); setBusy(false); return }
            navigate('/')
        } catch (err) {
            setError(err.message); setBusy(false)
        }
    }

    const handleEmailLogin = async () => {
        if (!parentEmail.trim() || !parentPassword.trim()) return
        setError(''); setBusy(true)
        try {
            const result = await signInParentEmail(parentEmail.trim(), parentPassword.trim())
            if (result.isNew) { setParentMode('setup'); setBusy(false); return }
            navigate('/')
        } catch (err) {
            const code = err.code
            if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
                setError(lang === 'vi' ? 'Sai email hoặc mật khẩu.' : 'Incorrect email or password.')
            } else {
                setError(err.message)
            }
            setBusy(false)
        }
    }

    const handleEmailSignup = async () => {
        if (!parentEmail.trim() || parentPassword.length < 6) return
        setError(''); setBusy(true)
        try {
            await signUpParentEmail(parentEmail.trim(), parentPassword.trim())
            setParentMode('setup'); setBusy(false)
        } catch (err) {
            const code = err.code
            if (code === 'auth/email-already-in-use') {
                setError(lang === 'vi' ? 'Email này đã được sử dụng. Hãy đăng nhập.' : 'Email already in use. Try signing in.')
            } else if (code === 'auth/weak-password') {
                setError(lang === 'vi' ? 'Mật khẩu quá yếu (tối thiểu 6 ký tự).' : 'Password too weak (min 6 characters).')
            } else {
                setError(err.message)
            }
            setBusy(false)
        }
    }

    const handleCreateFamily = async () => {
        if (!familyName.trim()) return
        setError(''); setBusy(true)
        try {
            await createFamily(user, familyName.trim())
            navigate('/')
        } catch (err) {
            setError(err.message); setBusy(false)
        }
    }

    const handleKidLogin = async () => {
        if (!kidParentEmail.trim() || !kidUsername.trim() || !kidPassword.trim()) return
        setError(''); setBusy(true)
        try {
            const lookup = await lookupFamilyByParentEmail(kidParentEmail.trim())
            if (!lookup?.familyId) { setError(lang === 'vi' ? 'Không tìm thấy gia đình. Kiểm tra lại email.' : 'Family not found. Check parent email.'); setBusy(false); return }
            localStorage.setItem('kidstrack-parent-email', kidParentEmail.trim())
            await signInKid(kidUsername.trim(), kidPassword.trim(), lookup.familyId)
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
                    style={{ position: 'absolute', top: 16, right: 16, width: 'auto' }}>
                    {lang === 'vi' ? '🇬🇧 EN' : '🇻🇳 VN'}
                </button>

                <div className="login-logo">⭐</div>
                <div className="login-title">{t('login.title')}</div>
                <div className="login-subtitle">{t('login.subtitle')}</div>

                <div className="login-tabs">
                    <button className={`login-tab ${tab === 'parent' ? 'active' : ''}`} onClick={() => { setTab('parent'); setError('') }}>
                        {t('login.parentTab')}
                    </button>
                    <button className={`login-tab ${tab === 'kid' ? 'active' : ''}`} onClick={() => { setTab('kid'); setError('') }}>
                        {t('login.kidTab')}
                    </button>
                </div>

                {error && <div className="login-error" style={{ marginBottom: 16 }}>{error}</div>}

                {tab === 'parent' ? (
                    <div className="login-panel">
                        {parentMode === 'setup' ? (
                            /* Family setup after first sign-in */
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
                        ) : parentMode === 'choose' ? (
                            /* Choose: Google or Email */
                            <div className="col" style={{ gap: 14 }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center' }}>
                                    {t('login.parentDesc')}
                                </p>
                                <button className="btn-google" onClick={handleGoogleSignIn} disabled={busy}>
                                    <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" /><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" /><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" /><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" /></svg>
                                    {busy ? t('login.signingIn') : t('login.googleBtn')}
                                </button>

                                <div className="login-divider">
                                    <span>{t('login.or')}</span>
                                </div>

                                <button className="btn btn-primary" onClick={() => setParentMode('email-login')}
                                    style={{ width: '100%', justifyContent: 'center' }}>
                                    ✉️ {t('login.emailBtn')}
                                </button>
                            </div>
                        ) : (
                            /* Email/Password form */
                            <div className="col" style={{ gap: 14 }}>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input type="email" value={parentEmail} onChange={(e) => setParentEmail(e.target.value)}
                                        placeholder={t('login.emailPlaceholder')} autoFocus />
                                </div>
                                <div className="form-group">
                                    <label>{t('login.kidPassword')}</label>
                                    <input type="password" value={parentPassword} onChange={(e) => setParentPassword(e.target.value)}
                                        placeholder={t('login.kidPasswordPlaceholder')}
                                        onKeyDown={(e) => e.key === 'Enter' && (parentMode === 'email-login' ? handleEmailLogin() : handleEmailSignup())} />
                                </div>

                                {parentMode === 'email-login' ? (
                                    <>
                                        <button className="btn btn-primary" onClick={handleEmailLogin} disabled={busy || !parentEmail.trim() || !parentPassword.trim()}
                                            style={{ width: '100%', justifyContent: 'center' }}>
                                            {busy ? t('login.signingIn') : t('login.emailSignIn')}
                                        </button>
                                        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                                            {t('login.noAccount')}{' '}
                                            <button className="btn-link" onClick={() => { setParentMode('email-signup'); setError('') }}>
                                                {t('login.registerLink')}
                                            </button>
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <button className="btn btn-primary" onClick={handleEmailSignup} disabled={busy || !parentEmail.trim() || parentPassword.length < 6}
                                            style={{ width: '100%', justifyContent: 'center' }}>
                                            {busy ? t('login.creating') : t('login.emailSignUp')}
                                        </button>
                                        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                                            {t('login.hasAccount')}{' '}
                                            <button className="btn-link" onClick={() => { setParentMode('email-login'); setError('') }}>
                                                {t('login.loginLink')}
                                            </button>
                                        </p>
                                    </>
                                )}

                                <button className="btn btn-ghost btn-sm" onClick={() => { setParentMode('choose'); setError('') }}
                                    style={{ alignSelf: 'center' }}>
                                    ← {t('login.backToChoose')}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="login-panel">
                        <div className="col" style={{ gap: 14 }}>
                            {kidParentEmail && (
                                <div className="login-cached-parent">
                                    <span>{t('login.cachedParent')} {kidParentEmail}</span>
                                    <button className="btn btn-ghost btn-sm" onClick={() => { setKidParentEmail(''); localStorage.removeItem('kidstrack-parent-email') }}>
                                        {t('login.changeFamily')}
                                    </button>
                                </div>
                            )}
                            {!kidParentEmail && (
                                <div className="form-group">
                                    <label>{t('login.kidParentEmail')}</label>
                                    <input type="text" value={kidParentEmail} onChange={(e) => setKidParentEmail(e.target.value)}
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
