import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useT, useLang } from '../i18n/I18nContext'
import { signOut } from '../firebase/auth'
import useStore from '../store/useStore'
import { formatMoney } from '../utils/format'

export default function KidLayout({ children }) {
    const t = useT()
    const { lang, setLang } = useLang()
    const { profile } = useAuth()
    const { kids } = useStore()
    const kid = kids.find((k) => k.id === profile?.kidId)

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">⭐ {t('app.name')}</div>

                {kid && (
                    <div className="kid-sidebar-profile">
                        <span style={{ fontSize: 28 }}>{kid.avatar}</span>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 14 }}>{kid.displayName || kid.name}</div>
                            <div style={{ fontSize: 12, color: 'var(--accent-amber)', fontWeight: 700 }}>{formatMoney(kid.balance)}</div>
                        </div>
                    </div>
                )}

                <NavLink to="/kid" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <span className="nav-icon">🌟</span>{t('nav.kidDashboard')}
                </NavLink>
                <NavLink to="/kid/profile" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
                    <span className="nav-icon">👤</span>{t('nav.kidProfile')}
                </NavLink>

                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <button className="lang-switch" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}>
                        {lang === 'vi' ? '🇬🇧 EN' : '🇻🇳 VN'}
                    </button>
                    <button className="nav-link" onClick={signOut}
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)' }}>
                        <span className="nav-icon">🚪</span>{t('nav.logout')}
                    </button>
                </div>
            </aside>
            <main className="main-content">
                {children || <Outlet />}
            </main>
        </div>
    )
}
