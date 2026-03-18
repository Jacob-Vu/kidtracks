import { Suspense, lazy } from 'react'
import { Routes, Route, NavLink, Navigate, useNavigate } from 'react-router-dom'
import { useFireSync } from './hooks/useFirebaseSync'
import { useAuth } from './contexts/AuthContext'
import { useT, useLang } from './i18n/I18nContext'
import { useTheme, THEMES } from './contexts/ThemeContext'
import { signOut } from './firebase/auth'
import useStore from './store/useStore'
import KidLayout from './layouts/KidLayout'
import ProtectedRoute from './components/ProtectedRoute'
import MobileHeader from './components/MobileHeader'
import InstallPrompt from './components/InstallPrompt'
import { usePageTracking } from './hooks/useAnalytics'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const Templates = lazy(() => import('./pages/Templates'))
const DailyView = lazy(() => import('./pages/DailyView'))
const Ledger = lazy(() => import('./pages/Ledger'))
const Login = lazy(() => import('./pages/Login'))
const KidDashboard = lazy(() => import('./pages/KidDashboard'))
const KidProfile = lazy(() => import('./pages/KidProfile'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const TemplatePickerPage = lazy(() => import('./pages/TemplatePickerPage'))
const WeeklyReport = lazy(() => import('./pages/WeeklyReport'))
const ParentProfile = lazy(() => import('./pages/ParentProfile'))

function RouteLoader() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: 12 }}>
      <div className="spinner" />
      <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Loading...</div>
    </div>
  )
}

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
  usePageTracking()

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
    <>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<Suspense fallback={<RouteLoader />}><Login /></Suspense>} />
        <Route path="/kid" element={<ProtectedRoute role="kid"><KidLayout><Suspense fallback={<RouteLoader />}><KidDashboard /></Suspense></KidLayout></ProtectedRoute>} />
        <Route path="/kid/profile" element={<ProtectedRoute role="kid"><KidLayout><Suspense fallback={<RouteLoader />}><KidProfile /></Suspense></KidLayout></ProtectedRoute>} />
        <Route path="/*" element={<ProtectedRoute role="parent"><ParentLayout /></ProtectedRoute>} />
      </Routes>
      <InstallPrompt />
    </>
  )
}

function HomeRoute() {
  const { user, loading, role } = useAuth()
  if (loading) return null
  if (!user) return <Suspense fallback={<RouteLoader />}><LandingPage /></Suspense>
  if (role === 'kid') return <Navigate to="/kid" replace />
  return <ProtectedRoute role="parent"><ParentLayout /></ProtectedRoute>
}

function ParentLayout() {
  const t = useT()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
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
            <button
              type="button"
              onClick={() => navigate('/profile')}
              style={{ padding: '8px 12px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', color: 'inherit' }}
            >
              {user.photoURL && <img src={user.photoURL} style={{ width: 36, height: 36, borderRadius: '50%' }} alt="" />}
              <span style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.displayName || user.email}
              </span>
            </button>
          )}
          <div className="theme-sidebar-picker">
            {THEMES.map((th) => (
              <button
                key={th.id}
                className={`theme-sidebar-dot${theme === th.id ? ' theme-sidebar-dot--active' : ''}`}
                style={{ background: `linear-gradient(135deg, ${th.colors[0]}, ${th.colors[1]})` }}
                onClick={() => setTheme(th.id)}
                title={th.name}
                aria-label={th.name}
              />
            ))}
          </div>
          <LangSwitcher />
          <button className="nav-link" onClick={signOut}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)' }}>
            <span className="nav-icon">🚪</span>{t('nav.signout')}
          </button>
        </div>
      </aside>
      <div className="main-wrapper">
        <MobileHeader />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Suspense fallback={<RouteLoader />}><Dashboard /></Suspense>} />
            <Route path="/templates" element={<Suspense fallback={<RouteLoader />}><Templates /></Suspense>} />
            <Route path="/daily" element={<Suspense fallback={<RouteLoader />}><DailyView /></Suspense>} />
            <Route path="/daily/:kidId" element={<Suspense fallback={<RouteLoader />}><DailyView /></Suspense>} />
            <Route path="/daily/:kidId/pick-templates" element={<Suspense fallback={<RouteLoader />}><TemplatePickerPage /></Suspense>} />
            <Route path="/ledger" element={<Suspense fallback={<RouteLoader />}><Ledger /></Suspense>} />
            <Route path="/ledger/:kidId" element={<Suspense fallback={<RouteLoader />}><Ledger /></Suspense>} />
            <Route path="/report/weekly" element={<Suspense fallback={<RouteLoader />}><WeeklyReport /></Suspense>} />
            <Route path="/profile" element={<Suspense fallback={<RouteLoader />}><ParentProfile /></Suspense>} />
          </Routes>
        </main>
        <nav className="bottom-nav">
          {NAV.map(({ path, icon, label }) => (
            <NavLink key={path} to={path} end={path === '/'}
              className={({ isActive }) => `bottom-nav-link${isActive ? ' active' : ''}`}>
              <span className="bottom-nav-icon">{icon}</span>
              <span className="bottom-nav-label">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default function App() {
  return <AppContent />
}
