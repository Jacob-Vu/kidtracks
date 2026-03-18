import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useT, useLang } from '../i18n/I18nContext'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from '../firebase/auth'
import FeedbackLauncher from './FeedbackLauncher'

export default function MobileHeader({ title }) {
    const navigate = useNavigate()
    const location = useLocation()
    const t = useT()
    const { toggleLang } = useLang()
    const { user, role } = useAuth()

    const isHome = location.pathname === '/' || location.pathname === '/kid'

    const initials = user?.displayName
        ? user.displayName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
        : (user?.email?.[0]?.toUpperCase() || '?')

    return (
        <header className="mobile-header">
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

            <div className="mobile-header-title">{title || t('app.name')}</div>

            <div className="mobile-header-actions">
                <button
                    className="mobile-header-btn mobile-header-lang-btn"
                    onClick={toggleLang}
                    aria-label={t('common.langSwitchAria')}
                >
                    {t('common.langSwitch')}
                </button>

                {role === 'parent' && <FeedbackLauncher compact />}

                {user?.photoURL ? (
                    <img
                        src={user.photoURL}
                        className="mobile-header-avatar mobile-header-avatar--clickable"
                        alt={user.displayName || ''}
                        title={user.displayName || user.email || ''}
                        onClick={() => navigate(role === 'kid' ? '/kid/profile' : '/profile')}
                    />
                ) : (
                    <div
                        className="mobile-header-avatar mobile-header-avatar--initials mobile-header-avatar--clickable"
                        title={user?.displayName || user?.email || ''}
                        aria-label={user?.displayName || user?.email || t('nav.profile')}
                        role="button"
                        tabIndex={0}
                        onClick={() => navigate(role === 'kid' ? '/kid/profile' : '/profile')}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault()
                                navigate(role === 'kid' ? '/kid/profile' : '/profile')
                            }
                        }}
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
