import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import Modal from '../components/Modal'
import { formatMoney } from '../utils/format'

const AVATARS = ['🧒', '👦', '👧', '🧑', '👶', '🦸', '🧙', '👸', '🤴', '🦊', '🐱', '🐶']

export default function Dashboard() {
    const { kids, addKid, updateKid, deleteKid } = useStore()
    const navigate = useNavigate()
    const [showAdd, setShowAdd] = useState(false)
    const [editKid, setEditKid] = useState(null)
    const [name, setName] = useState('')
    const [avatar, setAvatar] = useState(AVATARS[0])

    const openAdd = () => { setName(''); setAvatar(AVATARS[0]); setShowAdd(true) }
    const openEdit = (kid, e) => { e.stopPropagation(); setEditKid(kid); setName(kid.name); setAvatar(kid.avatar); }

    const handleSave = () => {
        if (!name.trim()) return
        if (editKid) {
            updateKid(editKid.id, { name: name.trim(), avatar })
            setEditKid(null)
        } else {
            addKid(name.trim(), avatar)
            setShowAdd(false)
        }
        setName('')
    }

    const handleDelete = (kid, e) => {
        e.stopPropagation()
        if (confirm(`Remove ${kid.name}? All their data will be lost.`)) deleteKid(kid.id)
    }

    return (
        <div>
            <div className="page-header row between center">
                <div>
                    <h1 className="page-title">👨‍👩‍👧‍👦 Dashboard</h1>
                    <p className="page-subtitle">Manage your kids and their pocket balances</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    + Add Kid
                </button>
            </div>

            {kids.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-state-icon">🧒</span>
                    <p className="empty-state-title">No kids added yet</p>
                    <p className="empty-state-desc">Add your kids to start tracking their daily tasks and rewards.</p>
                    <button className="btn btn-primary" onClick={openAdd}>+ Add First Kid</button>
                </div>
            ) : (
                <div className="card-grid">
                    {kids.map((kid) => (
                        <div key={kid.id} className="kid-card" onClick={() => navigate(`/daily/${kid.id}`)}>
                            <span className="kid-avatar">{kid.avatar}</span>
                            <div className="kid-name">{kid.name}</div>
                            <div className="kid-balance">{formatMoney(kid.balance)}</div>
                            <div className="kid-balance-label">💰 Pocket Money</div>
                            <div className="row" style={{ marginTop: 16, justifyContent: 'center', gap: 8 }}>
                                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/daily/${kid.id}`) }}>
                                    📅 Tasks
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/ledger/${kid.id}`) }}>
                                    💰 Ledger
                                </button>
                                <button className="btn btn-ghost btn-sm" onClick={(e) => openEdit(kid, e)}>✏️</button>
                                <button className="btn btn-danger btn-sm" onClick={(e) => handleDelete(kid, e)}>🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Kid Modal */}
            {showAdd && (
                <KidModal
                    title="Add Kid"
                    name={name} setName={setName}
                    avatar={avatar} setAvatar={setAvatar}
                    onSave={handleSave}
                    onClose={() => setShowAdd(false)}
                />
            )}

            {/* Edit Kid Modal */}
            {editKid && (
                <KidModal
                    title="Edit Kid"
                    name={name} setName={setName}
                    avatar={avatar} setAvatar={setAvatar}
                    onSave={handleSave}
                    onClose={() => setEditKid(null)}
                />
            )}
        </div>
    )
}

function KidModal({ title, name, setName, avatar, setAvatar, onSave, onClose }) {
    const AVATARS = ['🧒', '👦', '👧', '🧑', '👶', '🦸', '🧙', '👸', '🤴', '🏃', '🦊', '🐱', '🐶', '🐻', '🦁', '🐯']
    return (
        <Modal title={title} onClose={onClose}>
            <div className="col">
                <div className="form-group">
                    <label>Name</label>
                    <input
                        type="text" value={name} onChange={(e) => setName(e.target.value)}
                        placeholder="Enter child's name" autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && onSave()}
                    />
                </div>
                <div className="form-group">
                    <label>Avatar</label>
                    <div className="chip-group">
                        {AVATARS.map((a) => (
                            <button
                                key={a}
                                onClick={() => setAvatar(a)}
                                style={{
                                    background: avatar === a ? 'var(--gradient-purple)' : 'rgba(255,255,255,0.05)',
                                    border: `2px solid ${avatar === a ? 'transparent' : 'var(--border)'}`,
                                    borderRadius: 10, fontSize: 24, padding: '6px 10px', cursor: 'pointer',
                                    transition: 'all 0.2s', transform: avatar === a ? 'scale(1.15)' : 'scale(1)',
                                }}
                            >
                                {a}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                    <button className="btn btn-primary" onClick={onSave} disabled={!name.trim()}>Save</button>
                </div>
            </div>
        </Modal>
    )
}
