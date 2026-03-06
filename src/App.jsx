import { Routes, Route, NavLink } from 'react-router-dom'
import { useEffect } from 'react'
import { useFireSync } from './hooks/useFirebaseSync'
import { useAuth } from './contexts/AuthContext'
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

const PARENT_NAV = [
  { path: '/', icon: '🏠', label: 'Dashboard' },
  { path: '/templates', icon: '📋', label: 'Task Templates' },
  { path: '/daily', icon: '📅', label: 'Daily Tasks' },
  { path: '/ledger', icon: '💰', label: 'Pocket Ledger' },
]

// Inner component so hooks can access AuthContext
function AppContent() {
  const { user, isKid, isParent, loading, profile } = useAuth()
  const { isLoading, firestoreError } = useStore()
  useFireSync()

  // Loading screen (auth + firestore init)
  if (loading || (user && profile && isLoading)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <div style={{ fontSize: 52 }}>⭐</div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 800, background: 'var(--gradient-purple)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          KidsTrack
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Loading your family…</div>
        <div className="spinner" />
      </div>
    )
  }

  // Firestore error screen
  if (firestoreError === 'permission-denied') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, padding: 24, textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ fontSize: 52 }}>🔒</div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--accent-red)' }}>Firestore Permission Denied</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
          Update your Firestore security rules in the Firebase Console (see implementation plan for full rules).
        </p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>🔄 Retry</button>
      </div>
    )
  }

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Kid routes */}
      <Route path="/kid" element={
        <ProtectedRoute role="kid">
          <KidLayout><KidDashboard /></KidLayout>
        </ProtectedRoute>
      } />
      <Route path="/kid/profile" element={
        <ProtectedRoute role="kid">
          <KidLayout><KidProfile /></KidLayout>
        </ProtectedRoute>
      } />

      {/* Parent routes — shared layout */}
      <Route path="/*" element={
        <ProtectedRoute role="parent">
          <ParentLayout />
        </ProtectedRoute>
      } />
    </Routes>
  )
}

function ParentLayout() {
  const { user } = useAuth()
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">⭐ KidsTrack</div>
        {PARENT_NAV.map(({ path, icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            {label}
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
          <button
            className="nav-link"
            onClick={signOut}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent-red)' }}
          >
            <span className="nav-icon">🚪</span>
            Sign Out
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
