import { Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useFireSync } from './hooks/useFirebaseSync'
import useStore from './store/useStore'
import Dashboard from './pages/Dashboard'
import Templates from './pages/Templates'
import DailyView from './pages/DailyView'
import Ledger from './pages/Ledger'
import FamilyCodeModal from './components/FamilyCodeModal'
import { useState } from 'react'

const navItems = [
  { path: '/', icon: '🏠', label: 'Dashboard' },
  { path: '/templates', icon: '📋', label: 'Task Templates' },
  { path: '/daily', icon: '📅', label: 'Daily Tasks' },
  { path: '/ledger', icon: '💰', label: 'Pocket Ledger' },
]

export default function App() {
  useFireSync()
  const { isLoading, familyId, firestoreError } = useStore()
  const [showCode, setShowCode] = useState(false)

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16 }}>
        <div style={{ fontSize: 52 }}>⭐</div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 800, background: 'var(--gradient-purple)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          KidsTrack
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Connecting to cloud…</div>
        <div className="spinner" />
      </div>
    )
  }

  if (firestoreError === 'permission-denied') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, padding: 24, textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
        <div style={{ fontSize: 52 }}>🔒</div>
        <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--accent-red)' }}>
          Firestore Permission Denied
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7 }}>
          Your Firebase Firestore security rules are blocking access. Please update the rules in the Firebase console:
        </p>
        <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px 20px', fontFamily: 'monospace', fontSize: 13, textAlign: 'left', width: '100%', color: 'var(--accent-teal)', lineHeight: 1.8 }}>
          rules_version = '2';<br />
          service cloud.firestore {'{'}<br />
          &nbsp;&nbsp;match /databases/{'{'}'database'{'}'}/documents {'{'}<br />
          &nbsp;&nbsp;&nbsp;&nbsp;match /{'{'}'document=**'{'}'} {'{'}<br />
          &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;allow read, write: if true;<br />
          &nbsp;&nbsp;&nbsp;&nbsp;{'}'}<br />
          &nbsp;&nbsp;{'}'}<br />
          {'}'}
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: 12 }}>
          Go to <strong>Firebase Console → Firestore → Rules</strong>, paste the above, and publish. Then refresh this page.
        </p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>
          🔄 Retry
        </button>
      </div>
    )
  }


  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">⭐ KidsTrack</div>
        {navItems.map(({ path, icon, label }) => (
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
          <button
            className="nav-link"
            onClick={() => setShowCode(true)}
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span className="nav-icon">🔑</span>
            Family Code
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
      {showCode && <FamilyCodeModal onClose={() => setShowCode(false)} />}
    </div>
  )
}
