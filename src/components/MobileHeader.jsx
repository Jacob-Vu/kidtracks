import { useNavigate, useLocation } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useT } from '../i18n/I18nContext'
import { signOut } from '../firebase/auth'

export default function MobileHeader({ title }) {
    const navigate = useNavigate()
    const location = useLocation()
    const t = useT()

    const isHome = location.pathname === '/' || location.pathname === '/kid'

    return (
        <header className="mobile-header">
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
            <div className="mobile-header-title">{title || t('app.name')}</div>
            <button
                className="mobile-header-btn"
                onClick={signOut}
                aria-label={t('nav.signout')}
                title={t('nav.signout')}
            >
                <LogOut size={16} strokeWidth={2.2} />
            </button>
        </header>
    )
}
