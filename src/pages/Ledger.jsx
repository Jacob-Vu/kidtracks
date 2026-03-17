import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import useStore from '../store/useStore'
import { useFireActions } from '../hooks/useFirebaseSync'
import { useT } from '../i18n/I18nContext'
import Modal from '../components/Modal'
import { formatMoney, formatMoneyFull } from '../utils/format'

export default function Ledger() {
    const t = useT()
    const { kidId: paramKidId } = useParams()
    const navigate = useNavigate()
    const { kids, ledger } = useStore()
    const { addManualTransaction } = useFireActions()
    const [selectedKidId, setSelectedKidId] = useState(paramKidId || kids[0]?.id || '')
    const [showAdd, setShowAdd] = useState(false)
    const [amount, setAmount] = useState('')
    const [isDeduction, setIsDeduction] = useState(false)
    const [label, setLabel] = useState('')

    const kid = kids.find((k) => k.id === selectedKidId)
    const entries = ledger.filter((e) => e.kidId === selectedKidId).sort((a, b) => b.id.localeCompare(a.id))
    const totalEarned = entries.filter((e) => e.amount > 0).reduce((sum, e) => sum + e.amount, 0)
    const totalPenalties = entries.filter((e) => e.amount < 0).reduce((sum, e) => sum + e.amount, 0)

    const handleAddManual = async () => {
        if (!amount || isNaN(parseInt(amount))) return
        const amtRaw = parseInt(amount) * 1000
        await addManualTransaction(selectedKidId, isDeduction ? -amtRaw : amtRaw, label.trim() || undefined)
        setAmount(''); setLabel(''); setShowAdd(false)
    }

    if (kids.length === 0) {
        return (
            <div className="empty-state">
                <span className="empty-state-icon">💰</span>
                <p className="empty-state-title">{t('daily.noKids')}</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>{t('daily.goToDash')}</button>
            </div>
        )
    }

    return (
        <div>
            <div className="page-header row between center">
                <div>
                    <h1 className="page-title">{t('ledger.title')}</h1>
                    <p className="page-subtitle">{t('ledger.subtitle')}</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}>{t('ledger.addManual')}</button>
            </div>

            <div className="chip-group" style={{ marginBottom: 24 }}>
                {kids.map((k) => (
                    <button key={k.id} className={`chip ${k.id === selectedKidId ? 'selected' : ''}`}
                        onClick={() => { setSelectedKidId(k.id); navigate(`/ledger/${k.id}`) }}>
                        {k.avatar} {k.displayName || k.name}
                    </button>
                ))}
            </div>

            {kid && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="row wrap" style={{ gap: 32 }}>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                                💰 {t('kidDash.balance')}
                            </div>
                            <div style={{ fontFamily: 'Outfit, sans-serif', fontSize: 36, fontWeight: 800, background: 'var(--gradient-amber)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                                {formatMoney(kid.balance)}
                            </div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{formatMoneyFull(kid.balance)}</div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                                🎉 {t('ledger.allKids').replace('📊 ', '')}
                            </div>
                            <div className="money-positive" style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28 }}>+{formatMoney(totalEarned)}</div>
                        </div>
                        <div style={{ flex: 1, textAlign: 'center' }}>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                                😞 {t('ledger.penalties')}
                            </div>
                            <div className="money-negative" style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28 }}>{formatMoney(totalPenalties)}</div>
                        </div>
                    </div>
                </div>
            )}

            {entries.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-state-icon">📭</span>
                    <p className="empty-state-title">{t('ledger.noEntries')}</p>
                    <p className="empty-state-desc">{t('ledger.noEntriesDesc')}</p>
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

            {showAdd && (
                <Modal title={t('ledger.manualTitle')} onClose={() => setShowAdd(false)}>
                    <div className="col">
                        <div className="form-group">
                            <label>{t('ledger.type')}</label>
                            <div className="chip-group">
                                <button className={`chip ${!isDeduction ? 'selected' : ''}`} onClick={() => setIsDeduction(false)}>🎁 {t('ledger.add')}</button>
                                <button className={`chip ${isDeduction ? 'selected' : ''}`} onClick={() => setIsDeduction(true)}>💸 {t('ledger.deduct')}</button>
                            </div>
                        </div>
                        <div className="form-group">
                            <label>{t('ledger.amount')}</label>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                                placeholder={t('ledger.amountPlaceholder')} autoFocus />
                        </div>
                        <div className="form-group">
                            <label>{t('ledger.label')}</label>
                            <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
                                placeholder={t('ledger.labelPlaceholder')} />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowAdd(false)}>{t('common.cancel')}</button>
                            <button className={`btn ${isDeduction ? 'btn-danger' : 'btn-green'}`}
                                onClick={handleAddManual} disabled={!amount || isNaN(parseInt(amount))}>
                                {t('ledger.addTransaction')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
