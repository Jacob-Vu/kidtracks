import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Apple, ChevronLeft, Facebook, Loader2, Mail, Sparkles } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useT, useLang } from '../i18n/I18nContext'
import {
    createFamily,
    lookupFamilyByParentEmail,
    sendParentPasswordReset,
    signInKid,
    signInParentEmail,
    signInParentSimple,
    signInWithApple,
    signInWithFacebook,
    signInWithGoogle,
    signUpParentEmail,
} from '../firebase/auth'

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="social-btn__icon social-btn__icon--google">
        <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.8-6-6.2s2.7-6.2 6-6.2c1.9 0 3.2.8 4 1.5l2.7-2.7C17 2.8 14.7 2 12 2 6.9 2 2.8 6.3 2.8 11.5S6.9 21 12 21c6.9 0 8.6-4.8 8.6-7.3 0-.5-.1-.9-.1-1.3H12Z" />
        <path fill="#34A853" d="M2.8 11.5c0 1.7.6 3.3 1.7 4.6l3-2.3c-.4-.7-.7-1.5-.7-2.3s.2-1.6.7-2.3l-3-2.3c-1.1 1.3-1.7 2.9-1.7 4.6Z" />
        <path fill="#FBBC05" d="M12 21c2.7 0 5-.9 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.9-1.8-5.7-4.2l-3.1 2.4C5 18.6 8.2 21 12 21Z" />
        <path fill="#4285F4" d="M18.6 18.5c1.9-1.8 2.9-4.4 2.9-6.8 0-.5-.1-.9-.1-1.3H12v3.9h5.5c-.3 1.3-1.1 2.4-2.1 3.2l3.2 2.5Z" />
    </svg>
)

const KidsTrackLogo = () => (
    <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="login-logo-svg" aria-hidden="true">
        <defs>
            <linearGradient id="logo-grad" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
                <stop stopColor="#7c3aed" />
                <stop offset="1" stopColor="#ec4899" />
            </linearGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#logo-grad)" opacity="0.12" />
        <path
            d="M32 11 L36.4 24.6 L51 24.6 L39.3 33.4 L43.7 47 L32 38.2 L20.3 47 L24.7 33.4 L13 24.6 L27.6 24.6 Z"
            fill="url(#logo-grad)"
        />
        <circle cx="50" cy="14" r="2.4" fill="#ec4899" opacity="0.8" />
        <circle cx="13" cy="48" r="1.8" fill="#7c3aed" opacity="0.6" />
        <circle cx="52" cy="46" r="1.6" fill="#7c3aed" opacity="0.5" />
        <circle cx="11" cy="17" r="1.6" fill="#ec4899" opacity="0.5" />
    </svg>
)

export default function Login() {
    const navigate = useNavigate()
    const { user, profile, loading } = useAuth()
    const t = useT()
    const { lang, setLang } = useLang()

    const [tab, setTab] = useState('parent')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)
    const [resetSent, setResetSent] = useState(false)

    // Parent modes: choose, email-login, email-signup, simple, setup
    const [parentMode, setParentMode] = useState('choose')

    const [familyName, setFamilyName] = useState('')
    const [parentEmail, setParentEmail] = useState('')
    const [parentPassword, setParentPassword] = useState('')
    const [parentSimpleUsername, setParentSimpleUsername] = useState('')

    const savedKidParentEmail = localStorage.getItem('kidstrack-parent-email') || ''
    const [kidParentEmail, setKidParentEmail] = useState(savedKidParentEmail)
    const [isEditingKidParentEmail, setIsEditingKidParentEmail] = useState(!savedKidParentEmail)
    const [kidUsername, setKidUsername] = useState('')
    const [kidPassword, setKidPassword] = useState('')

    useEffect(() => {
        if (!loading && user && profile?.role === 'parent' && !profile.familyId) {
            setParentMode('setup')
        }
    }, [loading, user, profile])

    if (!loading && user && profile) {
        if (profile.role === 'kid') {
            navigate('/kid', { replace: true })
            return null
        }
        if (profile.role === 'parent' && profile.familyId) {
            navigate('/', { replace: true })
            return null
        }
    }

    const goToMode = (mode) => { setParentMode(mode); setError(''); setResetSent(false) }
    const goToTab = (newTab) => { setTab(newTab); setError(''); setResetSent(false) }

    const handleSocialSignIn = async (signInFn) => {
        setError('')
        setBusy(true)
        try {
            const result = await signInFn()
            if (result.isNew) {
                setParentMode('setup')
                setBusy(false)
                return
            }
            navigate('/')
        } catch (err) {
            setError(err.message)
            setBusy(false)
        }
    }

    const handleEmailLogin = async () => {
        if (!parentEmail.trim() || !parentPassword.trim()) return
        setError('')
        setResetSent(false)
        setBusy(true)
        try {
            const result = await signInParentEmail(parentEmail.trim(), parentPassword.trim())
            if (result.isNew) {
                setParentMode('setup')
                setBusy(false)
                return
            }
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
        setError('')
        setBusy(true)
        try {
            await signUpParentEmail(parentEmail.trim(), parentPassword.trim())
            setParentMode('setup')
            setBusy(false)
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

    const handleForgotPassword = async () => {
        if (!parentEmail.trim()) {
            setError(lang === 'vi' ? 'Nhập email trước khi đặt lại mật khẩu.' : 'Enter your email address first.')
            return
        }
        setError('')
        setBusy(true)
        try {
            await sendParentPasswordReset(parentEmail.trim())
            setResetSent(true)
        } catch (err) {
            setError(err.message)
        }
        setBusy(false)
    }

    const handleSimpleLogin = async () => {
        const username = parentSimpleUsername.trim().toLowerCase().replace(/\s+/g, '')
        if (!username) return
        if (username.length < 3) {
            setError(lang === 'vi' ? 'Username phải có ít nhất 3 ký tự.' : 'Username must be at least 3 characters.')
            return
        }
        setError('')
        setBusy(true)
        try {
            const result = await signInParentSimple(username, username)
            if (result.isNew) {
                setParentMode('setup')
                setBusy(false)
                return
            }
            navigate('/')
        } catch (err) {
            setError(err.message)
            setBusy(false)
        }
    }

    const handleCreateFamily = async () => {
        if (!familyName.trim()) return
        setError('')
        setBusy(true)
        try {
            await createFamily(user, familyName.trim())
            navigate('/')
        } catch (err) {
            setError(err.message)
            setBusy(false)
        }
    }

    const handleKidLogin = async () => {
        if (!kidParentEmail.trim() || !kidUsername.trim() || !kidPassword.trim()) return
        setError('')
        setBusy(true)
        try {
            const lookup = await lookupFamilyByParentEmail(kidParentEmail.trim())
            if (!lookup?.familyId) {
                setError(lang === 'vi' ? 'Không tìm thấy gia đình. Kiểm tra lại email.' : 'Family not found. Check parent email.')
                setBusy(false)
                return
            }
            localStorage.setItem('kidstrack-parent-email', kidParentEmail.trim())
            await signInKid(kidUsername.trim(), kidPassword.trim(), lookup.familyId)
            navigate('/kid')
        } catch (err) {
            setError(
                err.code === 'auth/invalid-credential'
                    ? (lang === 'vi' ? 'Sai tên đăng nhập hoặc mật khẩu.' : 'Wrong username or password.')
                    : err.message
            )
            setBusy(false)
        }
    }

    return (
        <div className="login-page">
            <div className="login-blob login-blob-1" />
            <div className="login-blob login-blob-2" />

            <div className="login-card">
                {/* Language toggle */}
                <button
                    className="login-lang-btn"
                    onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
                    aria-label={lang === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
                >
                    {lang === 'vi' ? '🇬🇧 EN' : '🇻🇳 VN'}
                </button>

                {/* Logo + branding */}
                <div className="login-logo">
                    <KidsTrackLogo />
                </div>
                <div className="login-title">{t('login.title')}</div>
                <div className="login-subtitle">{t('login.subtitle')}</div>

                {/* Tabs */}
                <div className="login-tabs" role="tablist">
                    <button
                        role="tab"
                        aria-selected={tab === 'parent'}
                        className={`login-tab ${tab === 'parent' ? 'active' : ''}`}
                        onClick={() => goToTab('parent')}
                    >
                        {t('login.parentTab')}
                    </button>
                    <button
                        role="tab"
                        aria-selected={tab === 'kid'}
                        className={`login-tab ${tab === 'kid' ? 'active' : ''}`}
                        onClick={() => goToTab('kid')}
                    >
                        {t('login.kidTab')}
                    </button>
                </div>

                <div key={tab} className="login-content-area">

                {/* Global messages */}
                {error && (
                    <div className="login-error" role="alert">{error}</div>
                )}
                {resetSent && (
                    <div className="login-success" role="status">{t('login.resetSent')}</div>
                )}

                {tab === 'parent' ? (
                    <div key={parentMode} className="login-panel">

                        {/* ── Setup: family name ─────────────────── */}
                        {parentMode === 'setup' && (
                            <div className="col" style={{ gap: 16 }}>
                                <div className="login-setup-hero">
                                    <span>👨‍👩‍👧</span><span>⭐</span><span>👨‍👩‍👦</span>
                                </div>
                                <p style={{ fontWeight: 800, fontSize: 18, textAlign: 'center' }}>
                                    {t('login.setupTitle')}
                                </p>
                                <p className="login-mode-desc">{t('login.setupDesc')}</p>
                                <div className="form-group">
                                    <label htmlFor="family-name">{t('login.familyName')}</label>
                                    <input
                                        id="family-name"
                                        type="text"
                                        value={familyName}
                                        onChange={(e) => setFamilyName(e.target.value)}
                                        placeholder={t('login.familyPlaceholder')}
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFamily()}
                                    />
                                </div>
                                <button
                                    className="btn btn-primary btn--full"
                                    onClick={handleCreateFamily}
                                    disabled={busy || !familyName.trim()}
                                >
                                    {busy
                                        ? <><Loader2 size={15} className="login-spin" /> {t('login.creating')}</>
                                        : t('login.createFamily')
                                    }
                                </button>
                            </div>
                        )}

                        {/* ── Choose: social + options ────────────── */}
                        {parentMode === 'choose' && (
                            <div className="col" style={{ gap: 12 }}>
                                <p className="login-mode-desc">{t('login.parentDesc')}</p>

                                <div className="social-login-list">
                                    <button
                                        className="social-btn social-btn--google"
                                        onClick={() => handleSocialSignIn(signInWithGoogle)}
                                        disabled={busy}
                                    >
                                        <span className="social-btn__icon-wrap"><GoogleIcon /></span>
                                        <span className="social-btn__label">
                                            {busy ? <><Loader2 size={14} className="login-spin" /> {t('login.signingIn')}</> : t('login.googleBtn')}
                                        </span>
                                    </button>

                                    <button
                                        className="social-btn social-btn--apple"
                                        onClick={() => handleSocialSignIn(signInWithApple)}
                                        disabled={busy}
                                    >
                                        <span className="social-btn__icon-wrap"><Apple size={18} strokeWidth={2.2} /></span>
                                        <span className="social-btn__label">
                                            {busy ? <><Loader2 size={14} className="login-spin" /> {t('login.signingIn')}</> : t('login.appleBtn')}
                                        </span>
                                    </button>

                                    <button
                                        className="social-btn social-btn--facebook"
                                        onClick={() => handleSocialSignIn(signInWithFacebook)}
                                        disabled={busy}
                                    >
                                        <span className="social-btn__icon-wrap"><Facebook size={18} strokeWidth={2.2} /></span>
                                        <span className="social-btn__label">
                                            {busy ? <><Loader2 size={14} className="login-spin" /> {t('login.signingIn')}</> : t('login.facebookBtn')}
                                        </span>
                                    </button>
                                </div>

                                <div className="login-divider"><span>{t('login.or')}</span></div>

                                <button
                                    className="btn btn-ghost btn--full"
                                    onClick={() => goToMode('simple')}
                                    disabled={busy}
                                >
                                    <Sparkles size={15} strokeWidth={2.3} />
                                    {t('login.simpleBtn')}
                                </button>

                                <button
                                    className="btn btn-ghost btn--full"
                                    onClick={() => goToMode('email-login')}
                                    disabled={busy}
                                >
                                    <Mail size={15} strokeWidth={2.3} />
                                    {t('login.emailBtn')}
                                </button>
                            </div>
                        )}

                        {/* ── Quick start (username only) ─────────── */}
                        {parentMode === 'simple' && (
                            <div className="col" style={{ gap: 14 }}>
                                <div className="login-info-box">
                                    <Sparkles size={14} strokeWidth={2.2} style={{ flexShrink: 0, marginTop: 1 }} />
                                    <span>{t('login.simpleDesc')}</span>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="simple-username">{t('login.simpleUsernameLabel')}</label>
                                    <input
                                        id="simple-username"
                                        type="text"
                                        value={parentSimpleUsername}
                                        onChange={(e) => setParentSimpleUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                                        placeholder={t('login.simpleUsernamePlaceholder')}
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSimpleLogin()}
                                    />
                                </div>
                                <button
                                    className="btn btn-primary btn--full"
                                    onClick={handleSimpleLogin}
                                    disabled={busy || parentSimpleUsername.trim().length < 3}
                                >
                                    {busy
                                        ? <><Loader2 size={15} className="login-spin" /> {t('login.signingIn')}</>
                                        : t('login.simpleLoginBtn')
                                    }
                                </button>
                                <button
                                    className="btn btn-ghost btn-sm login-back-btn"
                                    onClick={() => goToMode('choose')}
                                    aria-label={t('login.backToChoose')}
                                >
                                    <ChevronLeft size={15} />
                                    {t('login.backToChoose')}
                                </button>
                            </div>
                        )}

                        {/* ── Email login / signup ────────────────── */}
                        {(parentMode === 'email-login' || parentMode === 'email-signup') && (
                            <div className="col" style={{ gap: 14 }}>
                                <div className="form-group">
                                    <label htmlFor="parent-email">Email</label>
                                    <input
                                        id="parent-email"
                                        type="email"
                                        value={parentEmail}
                                        onChange={(e) => setParentEmail(e.target.value)}
                                        placeholder={t('login.emailPlaceholder')}
                                        autoFocus
                                        autoComplete="email"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="parent-password">{t('login.parentPassword')}</label>
                                    <input
                                        id="parent-password"
                                        type="password"
                                        value={parentPassword}
                                        onChange={(e) => setParentPassword(e.target.value)}
                                        placeholder={t('login.kidPasswordPlaceholder')}
                                        autoComplete={parentMode === 'email-login' ? 'current-password' : 'new-password'}
                                        onKeyDown={(e) => e.key === 'Enter' && (parentMode === 'email-login' ? handleEmailLogin() : handleEmailSignup())}
                                    />
                                </div>

                                {parentMode === 'email-login' ? (
                                    <>
                                        <button
                                            className="btn btn-primary btn--full"
                                            onClick={handleEmailLogin}
                                            disabled={busy || !parentEmail.trim() || !parentPassword.trim()}
                                        >
                                            {busy
                                                ? <><Loader2 size={15} className="login-spin" /> {t('login.signingIn')}</>
                                                : t('login.emailSignIn')
                                            }
                                        </button>
                                        <button
                                            className="btn-link login-forgot"
                                            onClick={handleForgotPassword}
                                            disabled={busy}
                                            type="button"
                                        >
                                            {t('login.forgotPassword')}
                                        </button>
                                        <p className="login-switch-text">
                                            {t('login.noAccount')}{' '}
                                            <button className="btn-link" onClick={() => { setParentMode('email-signup'); setError(''); setResetSent(false) }}>
                                                {t('login.registerLink')}
                                            </button>
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            className="btn btn-primary btn--full"
                                            onClick={handleEmailSignup}
                                            disabled={busy || !parentEmail.trim() || parentPassword.length < 6}
                                        >
                                            {busy
                                                ? <><Loader2 size={15} className="login-spin" /> {t('login.creating')}</>
                                                : t('login.emailSignUp')
                                            }
                                        </button>
                                        <p className="login-switch-text">
                                            {t('login.hasAccount')}{' '}
                                            <button className="btn-link" onClick={() => { setParentMode('email-login'); setError(''); setResetSent(false) }}>
                                                {t('login.loginLink')}
                                            </button>
                                        </p>
                                    </>
                                )}

                                <button
                                    className="btn btn-ghost btn-sm login-back-btn"
                                    onClick={() => goToMode('choose')}
                                    aria-label={t('login.backToChoose')}
                                >
                                    <ChevronLeft size={15} />
                                    {t('login.backToChoose')}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* ── Kid login ───────────────────────────── */
                    <div className="login-panel">
                        <div className="col" style={{ gap: 14 }}>
                            <p className="login-mode-desc">{t('login.kidLoginDesc')}</p>

                            {!isEditingKidParentEmail && savedKidParentEmail ? (
                                <div className="login-cached-parent">
                                    <span>{t('login.cachedParent')} <strong>{savedKidParentEmail}</strong></span>
                                    <button
                                        className="btn btn-ghost btn-sm"
                                        onClick={() => {
                                            setKidParentEmail('')
                                            setIsEditingKidParentEmail(true)
                                            localStorage.removeItem('kidstrack-parent-email')
                                        }}
                                    >
                                        {t('login.changeFamily')}
                                    </button>
                                </div>
                            ) : (
                                <div className="form-group">
                                    <label htmlFor="kid-parent-email">{t('login.kidParentEmail')}</label>
                                    <input
                                        id="kid-parent-email"
                                        type="email"
                                        value={kidParentEmail}
                                        onChange={(e) => setKidParentEmail(e.target.value)}
                                        placeholder={t('login.kidParentPlaceholder')}
                                        autoComplete="email"
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label htmlFor="kid-username">{t('login.kidUsername')}</label>
                                <input
                                    id="kid-username"
                                    type="text"
                                    value={kidUsername}
                                    onChange={(e) => setKidUsername(e.target.value)}
                                    placeholder={t('login.kidUsernamePlaceholder')}
                                    autoComplete="username"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="kid-password">{t('login.kidPassword')}</label>
                                <input
                                    id="kid-password"
                                    type="password"
                                    value={kidPassword}
                                    onChange={(e) => setKidPassword(e.target.value)}
                                    placeholder={t('login.kidPasswordPlaceholder')}
                                    autoComplete="current-password"
                                    onKeyDown={(e) => e.key === 'Enter' && handleKidLogin()}
                                />
                            </div>
                            <button
                                className="btn btn-primary btn--full"
                                onClick={handleKidLogin}
                                disabled={busy || !kidParentEmail.trim() || !kidUsername.trim() || !kidPassword.trim()}
                            >
                                {busy
                                    ? <><Loader2 size={15} className="login-spin" /> {t('login.kidLoggingIn')}</>
                                    : t('login.kidLoginBtn')
                                }
                            </button>
                        </div>
                    </div>
                )}

                </div>{/* /login-content-area */}
            </div>
        </div>
    )
}
