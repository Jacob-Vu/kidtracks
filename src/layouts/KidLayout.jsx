import { NavLink } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { signOut } from '../firebase/auth'
import { formatMoney } from '../utils/format'
import useStore from '../store/useStore'

export default function KidLayout({ children }) {
    const { profile, kidId } = useAuth()
    const { kids } = useStore()
    const kid = kids.find((k) => k.id === kidId)

    const navItems = [
        { path: '/kid', icon: '🏠', label: 'My Dashboard', end: true },
        { path: '/kid/profile', icon: '⚙️', label: 'My Profile' },
    ]

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-logo">⭐ KidsTrack</div>

                {kid && (
                    <div className="kid-sidebar-profile">
                        <span style={{ fontSize: 36 }}>{kid.avatar}</span>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 15 }}>{kid.displayName}</div>
                            <div style={{ color: 'var(--accent-amber)', fontSize: 13, fontWeight: 700 }}>
                                💰 {formatMoney(kid.balance)}
                            </div>
                        </div>
                    </div>
                )}

                <div className="divider" />

                {navItems.map(({ path, icon, label, end }) => (
                    <NavLink
                        key={path}
                        to={path}
                        end={end}
                        className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                    >
                        <span className="nav-icon">{icon}</span>
                        {label}
                    </NavLink>
                ))}

                <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <button
                        className="nav-link"
                        onClick={signOut}
                        style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)' }}
                    >
                        <span className="nav-icon">🚪</span>
                        Log Out
                    </button>
                </div>
            </aside>
            <main className="main-content">{children}</main>
        </div>
    )
}
