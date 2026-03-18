import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useT, useLang } from '../i18n/I18nContext'
import { signOut } from '../firebase/auth'
import useStore from '../store/useStore'
import { formatMoney } from '../utils/format'
import MobileHeader from '../components/MobileHeader'

export default function KidLayout({ children }) {
    const navigate = useNavigate()
    const t = useT()
    const { lang, toggleLang } = useLang()
    const { profile } = useAuth()
    const { kids } = useStore()
    const kid = kids.find((k) => k.id === profile?.kidId)
    const isVi = lang.startsWith('vi')

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">⭐ {t('app.name')}</div>

                {kid && (
                    <button
                        type="button"
                        className="kid-sidebar-profile kid-sidebar-profile--button"
                        onClick={() => navigate('/kid/profile')}
                    >
                        <span style={{ fontSize: 28 }}>{kid.avatar}</span>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 14 }}>{kid.displayName || kid.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--accent-amber)', fontWeight: 700 }}>{formatMoney(kid.balance)}</div>
                        </div>
                    </button>
                )}

                <NavLink to="/kid" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <span className="nav-icon">🌟</span>{t('nav.kidDashboard')}
                </NavLink>
                <NavLink to="/kid/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <span className="nav-icon">👤</span>{t('nav.kidProfile')}
                </NavLink>

                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <button
                        className="lang-switch lang-switch--flag-only"
                        onClick={toggleLang}
                        title={t('common.langSwitchAria')}
                        aria-label={t('common.langSwitchAria')}
                    >
                        <span className="lang-switch__flag" aria-hidden>
                            <img
                                className="lang-switch__flag-img"
                                src={isVi ? '/flags/vn.svg' : '/flags/us.svg'}
                                alt=""
                            />
                        </span>
                    </button>
                    <button
                        className="nav-link"
                        onClick={signOut}
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)' }}
                    >
                        <span className="nav-icon">🚪</span>{t('nav.logout')}
                    </button>
                </div>
            </aside>
            <div className="main-wrapper">
                <MobileHeader />
                <main className="main-content">
                    {children || <Outlet />}
                </main>
                <nav className="bottom-nav">
                    <NavLink to="/kid" end className={({ isActive }) => `bottom-nav-link${isActive ? ' active' : ''}`}>
                        <span className="bottom-nav-icon">🌟</span>
                        <span className="bottom-nav-label">{t('nav.kidDashboard')}</span>
                    </NavLink>
                    <NavLink to="/kid/profile" className={({ isActive }) => `bottom-nav-link${isActive ? ' active' : ''}`}>
                        <span className="bottom-nav-icon">👤</span>
                        <span className="bottom-nav-label">{t('nav.kidProfile')}</span>
                    </NavLink>
                </nav>
            </div>
        </div>
    )
}

