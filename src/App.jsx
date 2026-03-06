import { Routes, Route, NavLink } from 'react-router-dom'
import { useFireSync } from './hooks/useFirebaseSync'
import { useAuth } from './contexts/AuthContext'
import { useT, useLang } from './i18n/I18nContext'
import { signOut } from './firebase/auth'
import useStore from './store/useStore'
import Dashboard from './pages/Dashboard'
import Templates from './pages/Templates'
import DailyView from './pages/DailyView'
import Ledger from './pages/Ledger'
import Login from './pages/Login'
import KidDashboard from './pages/KidDashboard'
import KidProfile from './pages/KidProfile'
import KidLayout from './layouts/KidLayout'
import ProtectedRoute from './components/ProtectedRoute'

function LangSwitcher() {
  const { lang, setLang } = useLang()
  return (
    <button
      className="lang-switch"
      onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}
      title={lang === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
    >
      {lang === 'vi' ? '🇬🇧 EN' : '🇻🇳 VN'}
    </button>
  )
}

function AppContent() {
  const t = useT()
  const { user, profile, loading } = useAuth()
  const { isLoading, firestoreError } = useStore()
  useFireSync()

  if (loading || (user && profile && isLoading)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <div style={{ fontSize: 52 }}>⭐</div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 800, background: 'var(--gradient-purple)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          {t('app.name')}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{t('app.loading')}</div>
        <div className="spinner" />
      </div>
    )
  }

  if (firestoreError === 'permission-denied') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, padding: 24, textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ fontSize: 52 }}>🔒</div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--accent-red)' }}>{t('common.permissionDenied')}</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>{t('common.permissionDesc')}</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>{t('common.retry')}</button>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/kid" element={<ProtectedRoute role="kid"><KidLayout><KidDashboard /></KidLayout></ProtectedRoute>} />
      <Route path="/kid/profile" element={<ProtectedRoute role="kid"><KidLayout><KidProfile /></KidLayout></ProtectedRoute>} />
      <Route path="/*" element={<ProtectedRoute role="parent"><ParentLayout /></ProtectedRoute>} />
    </Routes>
  )
}

function ParentLayout() {
  const t = useT()
  const { user } = useAuth()
  const NAV = [
    { path: '/', icon: '🏠', label: t('nav.dashboard') },
    { path: '/templates', icon: '📋', label: t('nav.templates') },
    { path: '/daily', icon: '📅', label: t('nav.daily') },
    { path: '/ledger', icon: '💰', label: t('nav.ledger') },
  ]

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">⭐ {t('app.name')}</div>
        {NAV.map(({ path, icon, label }) => (
          <NavLink key={path} to={path} end={path === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span className="nav-icon">{icon}</span>{label}
          </NavLink>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          {user && (
            <div style={{ padding: '8px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              {user.photoURL && <img src={user.photoURL} style={{ width: 28, height: 28, borderRadius: '50%' }} alt="" />}
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.displayName || user.email}
              </span>
            </div>
          )}
          <LangSwitcher />
          <button className="nav-link" onClick={signOut}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)' }}>
            <span className="nav-icon">🚪</span>{t('nav.signout')}
          </button>
        </div>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/daily" element={<DailyView />} />
          <Route path="/daily/:kidId" element={<DailyView />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/ledger/:kidId" element={<Ledger />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return <AppContent />
}
