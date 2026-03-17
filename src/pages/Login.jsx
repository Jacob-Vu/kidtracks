import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useT, useLang } from '../i18n/I18nContext'
import {
    createFamily,
    lookupFamilyByParentEmail,
    signInKid,
    signInParentEmail,
    signInParentSimple,
    signInWithApple,
    signInWithFacebook,
    signInWithGoogle,
    signUpParentEmail,
} from '../firebase/auth'

export default function Login() {
    const navigate = useNavigate()
    const { user, profile, loading } = useAuth()
    const t = useT()
    const { lang, setLang } = useLang()

    const [tab, setTab] = useState('parent')
    const [error, setError] = useState('')
    const [busy, setBusy] = useState(false)

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

    const handleSimpleLogin = async () => {
        const username = parentSimpleUsername.trim().toLowerCase().replace(/\s+/g, '')
        if (!username) return
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
                <button
                    className="lang-switch"
                    onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
                    style={{ position: 'absolute', top: 16, right: 16, width: 'auto' }}
                >
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
                            <div className="col" style={{ gap: 16 }}>
                                <p style={{ fontWeight: 800, fontSize: 18, textAlign: 'center' }}>{t('login.setupTitle')}</p>
                                <div className="form-group">
                                    <label>{t('login.familyName')}</label>
                                    <input
                                        type="text"
                                        value={familyName}
                                        onChange={(e) => setFamilyName(e.target.value)}
                                        placeholder={t('login.familyPlaceholder')}
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleCreateFamily()}
                                    />
                                </div>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleCreateFamily}
                                    disabled={busy || !familyName.trim()}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    {busy ? t('login.creating') : t('login.createFamily')}
                                </button>
                            </div>
                        ) : parentMode === 'choose' ? (
                            <div className="col" style={{ gap: 12 }}>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 14, textAlign: 'center' }}>
                                    {t('login.parentDesc')}
                                </p>

                                <button className="btn-google" onClick={() => handleSocialSignIn(signInWithGoogle)} disabled={busy}>
                                    {busy ? t('login.signingIn') : t('login.googleBtn')}
                                </button>

                                <button className="btn btn-ghost" onClick={() => handleSocialSignIn(signInWithApple)} disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
                                     {t('login.appleBtn', 'Continue with Apple')}
                                </button>

                                <button className="btn btn-ghost" onClick={() => handleSocialSignIn(signInWithFacebook)} disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
                                    f {t('login.facebookBtn', 'Continue with Facebook')}
                                </button>

                                <div className="login-divider">
                                    <span>{t('login.or')}</span>
                                </div>

                                <button className="btn btn-primary" onClick={() => setParentMode('simple')} style={{ width: '100%', justifyContent: 'center' }}>
                                    {t('login.simpleBtn', 'Quick start with username')}
                                </button>

                                <button className="btn btn-primary" onClick={() => setParentMode('email-login')} style={{ width: '100%', justifyContent: 'center' }}>
                                    ✉️ {t('login.emailBtn')}
                                </button>
                            </div>
                        ) : parentMode === 'simple' ? (
                            <div className="col" style={{ gap: 14 }}>
                                <div className="form-group">
                                    <label>{t('login.simpleUsernameLabel', 'Username')}</label>
                                    <input
                                        type="text"
                                        value={parentSimpleUsername}
                                        onChange={(e) => setParentSimpleUsername(e.target.value.replace(/\s/g, '').toLowerCase())}
                                        placeholder={t('login.simpleUsernamePlaceholder', 'e.g. myfamily')}
                                        autoFocus
                                        onKeyDown={(e) => e.key === 'Enter' && handleSimpleLogin()}
                                    />
                                </div>
                                <button className="btn btn-primary" onClick={handleSimpleLogin} disabled={busy || !parentSimpleUsername.trim()} style={{ width: '100%', justifyContent: 'center' }}>
                                    {busy ? t('login.signingIn') : t('login.simpleLoginBtn', 'Start now')}
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={() => { setParentMode('choose'); setError('') }} style={{ alignSelf: 'center' }}>
                                    ← {t('login.backToChoose')}
                                </button>
                            </div>
                        ) : (
                            <div className="col" style={{ gap: 14 }}>
                                <div className="form-group">
                                    <label>Email</label>
                                    <input
                                        type="email"
                                        value={parentEmail}
                                        onChange={(e) => setParentEmail(e.target.value)}
                                        placeholder={t('login.emailPlaceholder')}
                                        autoFocus
                                    />
                                </div>
                                <div className="form-group">
                                    <label>{t('login.kidPassword')}</label>
                                    <input
                                        type="password"
                                        value={parentPassword}
                                        onChange={(e) => setParentPassword(e.target.value)}
                                        placeholder={t('login.kidPasswordPlaceholder')}
                                        onKeyDown={(e) => e.key === 'Enter' && (parentMode === 'email-login' ? handleEmailLogin() : handleEmailSignup())}
                                    />
                                </div>

                                {parentMode === 'email-login' ? (
                                    <>
                                        <button className="btn btn-primary" onClick={handleEmailLogin} disabled={busy || !parentEmail.trim() || !parentPassword.trim()} style={{ width: '100%', justifyContent: 'center' }}>
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
                                        <button className="btn btn-primary" onClick={handleEmailSignup} disabled={busy || !parentEmail.trim() || parentPassword.length < 6} style={{ width: '100%', justifyContent: 'center' }}>
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

                                <button className="btn btn-ghost btn-sm" onClick={() => { setParentMode('choose'); setError('') }} style={{ alignSelf: 'center' }}>
                                    ← {t('login.backToChoose')}
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="login-panel">
                        <div className="col" style={{ gap: 14 }}>
                            {!isEditingKidParentEmail && savedKidParentEmail && (
                                <div className="login-cached-parent">
                                    <span>{t('login.cachedParent')} {savedKidParentEmail}</span>
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
                            )}
                            {isEditingKidParentEmail && (
                                <div className="form-group">
                                    <label>{t('login.kidParentEmail')}</label>
                                    <input
                                        type="text"
                                        value={kidParentEmail}
                                        onChange={(e) => setKidParentEmail(e.target.value)}
                                        placeholder={t('login.kidParentPlaceholder')}
                                    />
                                </div>
                            )}
                            <div className="form-group">
                                <label>{t('login.kidUsername')}</label>
                                <input
                                    type="text"
                                    value={kidUsername}
                                    onChange={(e) => setKidUsername(e.target.value)}
                                    placeholder={t('login.kidUsernamePlaceholder')}
                                />
                            </div>
                            <div className="form-group">
                                <label>{t('login.kidPassword')}</label>
                                <input
                                    type="password"
                                    value={kidPassword}
                                    onChange={(e) => setKidPassword(e.target.value)}
                                    placeholder={t('login.kidPasswordPlaceholder')}
                                    onKeyDown={(e) => e.key === 'Enter' && handleKidLogin()}
                                />
                            </div>
                            <button className="btn btn-primary" onClick={handleKidLogin} disabled={busy} style={{ width: '100%', justifyContent: 'center' }}>
                                {busy ? t('login.kidLoggingIn') : t('login.kidLoginBtn')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
