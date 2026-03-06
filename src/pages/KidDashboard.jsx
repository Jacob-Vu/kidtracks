import { useState } from 'react'
import { format, subDays, parseISO } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import useStore from '../store/useStore'
import { useFireActions } from '../hooks/useFirebaseSync'
import Modal from '../components/Modal'
import { formatMoney } from '../utils/format'

const TODAY = format(new Date(), 'yyyy-MM-dd')

export default function KidDashboard() {
    const { kidId } = useAuth()
    const { kids, dailyTasks, dayConfigs, ledger } = useStore()
    const { addDailyTask, updateDailyTask, deleteDailyTask, toggleTaskStatus } = useFireActions()

    const kid = kids.find((k) => k.id === kidId)
    const todayTasks = dailyTasks.filter((t) => t.kidId === kidId && t.date === TODAY)
    const completedToday = todayTasks.filter((t) => t.status === 'completed').length
    const total = todayTasks.length
    const progress = total > 0 ? Math.round((completedToday / total) * 100) : 0
    const isFinalized = dayConfigs.find((c) => c.kidId === kidId && c.date === TODAY)?.isFinalized ?? false

    // Recently finalized days (10-day history)
    const last10Days = Array.from({ length: 10 }, (_, i) =>
        format(subDays(new Date(), i), 'yyyy-MM-dd')
    ).reverse()

    // Task modal
    const [showAddTask, setShowAddTask] = useState(false)
    const [editTask, setEditTask] = useState(null)
    const [taskTitle, setTaskTitle] = useState('')
    const [taskDesc, setTaskDesc] = useState('')

    const openEdit = (t) => { setEditTask(t); setTaskTitle(t.title); setTaskDesc(t.description) }
    const openAdd = () => { setEditTask(null); setTaskTitle(''); setTaskDesc(''); setShowAddTask(true) }

    const handleSaveTask = async () => {
        if (!taskTitle.trim()) return
        if (editTask) {
            await updateDailyTask(editTask.id, { title: taskTitle.trim(), description: taskDesc.trim() })
            setEditTask(null)
        } else {
            await addDailyTask(kidId, TODAY, taskTitle.trim(), taskDesc.trim())
            setShowAddTask(false)
        }
    }

    if (!kid) return <div className="empty-state"><span className="empty-state-icon">⏳</span><p>Loading…</p></div>

    return (
        <div>
            {/* Hero card */}
            <div className="kid-hero-card">
                <div className="kid-hero-avatar">{kid.avatar}</div>
                <div>
                    <h1 className="kid-hero-name">Hi, {kid.displayName}! 👋</h1>
                    <div className="kid-hero-balance">
                        <span style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Pocket Money:</span>
                        <span style={{ color: 'var(--accent-amber)', fontWeight: 800, fontSize: 24, marginLeft: 8 }}>
                            {formatMoney(kid.balance)}
                        </span>
                    </div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'center' }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: progress === 100 ? 'var(--accent-green)' : 'var(--text-primary)' }}>
                        {progress}%
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Today</div>
                    <div className="progress-bar" style={{ width: 80, marginTop: 6 }}>
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>

            {/* 10-day history */}
            <div className="card" style={{ marginBottom: 24 }}>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 14, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    📅 Recent 10 Days
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {last10Days.map((date) => {
                        const dayTasks = dailyTasks.filter((t) => t.kidId === kidId && t.date === date)
                        const done = dayTasks.filter((t) => t.status === 'completed').length
                        const tot = dayTasks.length
                        const pct = tot > 0 ? Math.round((done / tot) * 100) : null
                        const isToday = date === TODAY
                        const cfg = dayConfigs.find((c) => c.kidId === kidId && c.date === date)
                        const finalized = cfg?.isFinalized

                        return (
                            <div key={date} style={{
                                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                                padding: '8px 10px', borderRadius: 'var(--radius-md)',
                                background: isToday ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                                border: `1px solid ${isToday ? 'rgba(124,58,237,0.4)' : 'var(--border-light)'}`,
                                minWidth: 48,
                            }}>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                    {format(parseISO(date), 'MMM d')}
                                </div>
                                <div style={{ fontSize: 18 }}>
                                    {pct === null ? '—' : pct === 100 ? '✅' : finalized ? '😞' : `${pct}%`}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Today's Tasks */}
            <div className="row between center" style={{ marginBottom: 16 }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800 }}>
                    📝 Today's Tasks
                    <span className="badge badge-gray" style={{ marginLeft: 10, fontSize: 12 }}>{TODAY}</span>
                </h2>
                {!isFinalized && (
                    <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Task</button>
                )}
            </div>

            {todayTasks.length === 0 ? (
                <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <span className="empty-state-icon">📭</span>
                    <p className="empty-state-title">No tasks yet</p>
                    <p className="empty-state-desc">Your parent hasn't added tasks yet, or you can add your own!</p>
                </div>
            ) : (
                <div className="col">
                    {todayTasks.map((task) => (
                        <div key={task.id} className={`task-item ${task.status}`}>
                            <div
                                className={`task-checkbox ${task.status === 'completed' ? 'completed' : ''}`}
                                onClick={() => !isFinalized && toggleTaskStatus(task.id)}
                            >
                                {task.status === 'completed' ? '✓' : ''}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className={`task-title ${task.status}`}>{task.title}</div>
                                {task.description && <div className="task-desc">{task.description}</div>}
                            </div>
                            {!isFinalized && (
                                <div className="task-actions" style={{ opacity: 1 }}>
                                    <button className="btn btn-ghost btn-sm" onClick={() => { setEditTask(task); setTaskTitle(task.title); setTaskDesc(task.description); setShowAddTask(true) }}>✏️</button>
                                    <button className="btn btn-ghost btn-sm" onClick={() => deleteDailyTask(task.id)}>🗑️</button>
                                </div>
                            )}
                            {isFinalized && task.status === 'completed' && <span className="badge badge-green">Done</span>}
                            {isFinalized && task.status !== 'completed' && <span className="badge badge-amber">Missed</span>}
                        </div>
                    ))}
                </div>
            )}

            {/* Ledger preview */}
            {(() => {
                const myEntries = ledger.filter((e) => e.kidId === kidId).slice(-5).reverse()
                if (myEntries.length === 0) return null
                return (
                    <div style={{ marginTop: 32 }}>
                        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 800, marginBottom: 14 }}>
                            💰 Recent Transactions
                        </h2>
                        <div className="col">
                            {myEntries.map((e) => (
                                <div key={e.id} className="ledger-entry">
                                    <div className={`ledger-dot ${e.amount >= 0 ? 'positive' : 'negative'}`} />
                                    <div style={{ flex: 1, fontSize: 14, fontWeight: 600 }}>{e.label}</div>
                                    <div className={e.amount >= 0 ? 'money-positive' : 'money-negative'} style={{ fontSize: 16 }}>
                                        {e.amount >= 0 ? '+' : ''}{formatMoney(e.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            })()}

            {/* Add/Edit Task Modal */}
            {(showAddTask || editTask) && (
                <Modal title={editTask ? 'Edit Task' : 'Add Task'} onClose={() => { setShowAddTask(false); setEditTask(null) }}>
                    <div className="col">
                        <div className="form-group">
                            <label>Task Title</label>
                            <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                                placeholder="What do you need to do?" autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveTask()} />
                        </div>
                        <div className="form-group">
                            <label>Note (optional)</label>
                            <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} rows={2} />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => { setShowAddTask(false); setEditTask(null) }}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveTask} disabled={!taskTitle.trim()}>Save</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
