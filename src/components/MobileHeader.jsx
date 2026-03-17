import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useT, useLang } from '../i18n/I18nContext'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from '../firebase/auth'

export default function MobileHeader({ title }) {
    const navigate = useNavigate()
    const location = useLocation()
    const t = useT()
    const { lang, setLang } = useLang()
    const { user } = useAuth()

    const isHome = location.pathname === '/' || location.pathname === '/kid'

    const initials = user?.displayName
        ? user.displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
        : (user?.email?.[0]?.toUpperCase() || '?')

    return (
        <header className="mobile-header">
            {/* Left slot */}
            <div className="mobile-header-left">
                {isHome ? (
                    <div className="mobile-header-logo">⭐</div>
                ) : (
                    <button
                        className="mobile-header-btn"
                        onClick={() => navigate(-1)}
                        title={t('common.back')}
                        aria-label={t('common.back')}
                    >
                        ❮
                    </button>
                )}
            </div>

            {/* Center: title */}
            <div className="mobile-header-title">{title || t('app.name')}</div>

            {/* Right slot: lang + avatar + logout */}
            <div className="mobile-header-actions">
                <button
                    className="mobile-header-btn mobile-header-lang-btn"
                    onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
                    aria-label={lang === 'vi' ? 'Switch to English' : 'Chuyển sang tiếng Việt'}
                >
                    {lang === 'vi' ? 'EN' : 'VN'}
                </button>

                {user?.photoURL ? (
                    <img
                        src={user.photoURL}
                        className="mobile-header-avatar"
                        alt={user.displayName || ''}
                        title={user.displayName || user.email || ''}
                    />
                ) : (
                    <div
                        className="mobile-header-avatar mobile-header-avatar--initials"
                        title={user?.displayName || user?.email || ''}
                        aria-label={user?.displayName || user?.email || t('nav.profile')}
                    >
                        {initials}
                    </div>
                )}

                <button
                    className="mobile-header-btn"
                    onClick={signOut}
                    aria-label={t('nav.signout')}
                    title={t('nav.signout')}
                >
                    <LogOut size={16} strokeWidth={2.2} />
                </button>
            </div>
        </header>
    )
}
