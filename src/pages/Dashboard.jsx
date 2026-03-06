import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { useFireActions } from '../hooks/useFirebaseSync'
import KidAccountModal from '../components/KidAccountModal'
import Modal from '../components/Modal'
import { formatMoney } from '../utils/format'

export default function Dashboard() {
    const { kids } = useStore()
    const { deleteKid } = useFireActions()
    const navigate = useNavigate()
    const [showCreate, setShowCreate] = useState(false)
    const [editKid, setEditKid] = useState(null)

    return (
        <div>
            <div className="page-header row between center">
                <div>
                    <h1 className="page-title">👨‍👩‍👧‍👦 Dashboard</h1>
                    <p className="page-subtitle">Manage your kids and their pocket balances</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Add Kid</button>
            </div>

            {kids.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-state-icon">🧒</span>
                    <p className="empty-state-title">No kids added yet</p>
                    <p className="empty-state-desc">Add your first kid and create their login credentials.</p>
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Add First Kid</button>
                </div>
            ) : (
                <div className="card-grid">
                    {kids.map((kid) => (
                        <div key={kid.id} className="kid-card" onClick={() => navigate(`/daily/${kid.id}`)}>
                            <span className="kid-avatar">{kid.avatar}</span>
                            <div className="kid-name">{kid.displayName || kid.name}</div>
                            {kid.username && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
                                    @{kid.username}
                                </div>
                            )}
                            <div className="kid-balance">{formatMoney(kid.balance)}</div>
                            <div className="kid-balance-label">💰 Pocket Money</div>
                            <div className="row" style={{ marginTop: 16, justifyContent: 'center', gap: 8 }}>
                                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/daily/${kid.id}`) }}>📅 Tasks</button>
                                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/ledger/${kid.id}`) }}>💰 Ledger</button>
                                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setEditKid(kid) }}>✏️</button>
                                <button className="btn btn-danger btn-sm" onClick={(e) => {
                                    e.stopPropagation()
                                    if (confirm(`Remove ${kid.displayName || kid.name}? This cannot be undone.`)) deleteKid(kid.id)
                                }}>🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showCreate && <KidAccountModal onClose={() => setShowCreate(false)} />}
            {editKid && <KidAccountModal kid={editKid} onClose={() => setEditKid(null)} />}
        </div>
    )
}
