import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import useStore from '../store/useStore'
import Modal from '../components/Modal'
import { formatMoney, formatMoneyFull } from '../utils/format'

export default function Ledger() {
    const { kidId: paramKidId } = useParams()
    const navigate = useNavigate()
    const { kids, ledger, addManualTransaction } = useStore()
    const [selectedKidId, setSelectedKidId] = useState(paramKidId || kids[0]?.id || '')
    const [showAdd, setShowAdd] = useState(false)
    const [amount, setAmount] = useState('')
    const [isDeduction, setIsDeduction] = useState(false)
    const [label, setLabel] = useState('')

    const kid = kids.find((k) => k.id === selectedKidId)
    const entries = ledger
        .filter((e) => e.kidId === selectedKidId)
        .sort((a, b) => b.id.localeCompare(a.id))

    const totalEarned = entries.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0)
    const totalPenalties = entries.filter((e) => e.amount < 0).reduce((sum, e) => sum + e.amount, 0)

    const handleAddManual = () => {
        if (!amount || isNaN(parseInt(amount))) return
        const amtRaw = parseInt(amount) * 1000
        addManualTransaction(selectedKidId, isDeduction ? -amtRaw : amtRaw, label.trim() || undefined)
        setAmount('')
        setLabel('')
        setShowAdd(false)
    }

    if (kids.length === 0) {
        return (
            <div className="empty-state">
                <span className="empty-state-icon">💰</span>
                <p className="empty-state-title">No kids yet</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>Go to Dashboard</button>
            </div>
        )
    }

    return (
        <div>
            <div className="page-header row between center">
                <div>
                    <h1 className="page-title">💰 Pocket Ledger</h1>
                    <p className="page-subtitle">Transaction history of rewards and penalties</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Manual Entry</button>
            </div>

            {/* Kid Selector */}
            <div className="chip-group" style={{ marginBottom: 24 }}>
                {kids.map((k) => (
                    <button
                        key={k.id}
                        className={`chip ${k.id === selectedKidId ? 'selected' : ''}`}
                        onClick={() => { setSelectedKidId(k.id); navigate(`/ledger/${k.id}`) }}
                    >
                        {k.avatar} {k.name}
                    </button>
                ))}
            </div>

            {/* Summary Card */}
            {kid && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="row wrap" style={{ gap: 32 }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                                💰 Current Balance
                            </div>
                            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 36, fontWeight: 800, background: 'var(--gradient-amber)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                {formatMoney(kid.balance)}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatMoneyFull(kid.balance)}</div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                                🎉 Total Earned
                            </div>
                            <div className="money-positive" style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28 }}>+{formatMoney(totalEarned)}</div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                                😞 Total Penalties
                            </div>
                            <div className="money-negative" style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28 }}>{formatMoney(totalPenalties)}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Entries */}
            {entries.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-state-icon">📭</span>
                    <p className="empty-state-title">No transactions yet</p>
                    <p className="empty-state-desc">Complete daily tasks and finalize days to see reward and penalty history here.</p>
                </div>
            ) : (
                <div className="col">
                    {entries.map((entry, i) => (
                        <div key={entry.id} className="ledger-entry animate-in" style={{ animationDelay: `${i * 30}ms` }}>
                            <div className={`ledger-dot ${entry.amount >= 0 ? 'positive' : 'negative'}`} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 14 }}>{entry.label}</div>
                                <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
                                    {format(parseISO(entry.date), 'MMM d, yyyy')}
                                </div>
                            </div>
                            <div className={entry.amount >= 0 ? 'money-positive' : 'money-negative'} style={{ fontSize: 18 }}>
                                {entry.amount >= 0 ? '+' : ''}{formatMoney(entry.amount)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Manual Transaction Modal */}
            {showAdd && (
                <Modal title="Manual Transaction" onClose={() => setShowAdd(false)}>
                    <div className="col">
                        <div className="form-group">
                            <label>Type</label>
                            <div className="chip-group">
                                <button className={`chip ${!isDeduction ? 'selected' : ''}`} onClick={() => setIsDeduction(false)}>
                                    🎁 Add Money
                                </button>
                                <button className={`chip ${isDeduction ? 'selected' : ''}`} onClick={() => setIsDeduction(true)}>
                                    💸 Deduct
                                </button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Amount (in thousands đ)</label>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                                placeholder="e.g. 10 = 10,000đ" autoFocus />
                        </div>
                        <div className="form-group">
                            <label>Note (optional)</label>
                            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
                                placeholder="e.g. Bonus for helping around the house" />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
                            <button className={`btn ${isDeduction ? 'btn-danger' : 'btn-green'}`}
                                onClick={handleAddManual} disabled={!amount || isNaN(parseInt(amount))}>
                                {isDeduction ? 'Deduct' : 'Add Money'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
