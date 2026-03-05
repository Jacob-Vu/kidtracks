import { Routes, Route, NavLink, useNavigate, useLocation } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Templates from './pages/Templates'
import DailyView from './pages/DailyView'
import Ledger from './pages/Ledger'

const navItems = [
  { path: '/', icon: '🏠', label: 'Dashboard' },
  { path: '/templates', icon: '📋', label: 'Task Templates' },
  { path: '/daily', icon: '📅', label: 'Daily Tasks' },
  { path: '/ledger', icon: '💰', label: 'Pocket Ledger' },
]

export default function App() {
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
