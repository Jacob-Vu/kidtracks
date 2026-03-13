import { useNavigate, useLocation } from 'react-router-dom'
import { useT } from '../i18n/I18nContext'

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
                <button className="mobile-header-btn" onClick={() => navigate(-1)} title={t('common.back', 'Back')}>
                    ❮
                </button>
            )}
            <div className="mobile-header-title">{title || t('app.name')}</div>
            <div style={{ width: 36 }}></div>
        </header>
    )
}
