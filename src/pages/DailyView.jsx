import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, addDays, subDays, parseISO } from 'date-fns'
import ReactConfetti from 'react-confetti'
import useStore from '../store/useStore'
import { useFireActions } from '../hooks/useFirebaseSync'
import Modal from '../components/Modal'
import { formatMoney } from '../utils/format'

const REWARD_PRESETS = [10000, 20000, 50000]
const PENALTY_PRESETS = [5000, 10000, 20000]

export default function DailyView() {
    const { kidId: paramKidId } = useParams()
    const navigate = useNavigate()
    const { kids, templates, dailyTasks, dayConfigs } = useStore()
    const {
        addDailyTask, updateDailyTask, deleteDailyTask,
        toggleTaskStatus, markTaskFailed,
        loadTemplatesForDay, setDayConfig, finalizeDay,
    } = useFireActions()

    const [selectedKidId, setSelectedKidId] = useState(paramKidId || kids[0]?.id || '')
    const [currentDate, setCurrentDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [showAddTask, setShowAddTask] = useState(false)
    const [editTask, setEditTask] = useState(null)
    const [taskTitle, setTaskTitle] = useState('')
    const [taskDesc, setTaskDesc] = useState('')
    const [showConfig, setShowConfig] = useState(false)
    const [rewardAmount, setRewardAmount] = useState(20000)
    const [penaltyAmount, setPenaltyAmount] = useState(10000)
    const [customReward, setCustomReward] = useState('')
    const [customPenalty, setCustomPenalty] = useState('')
    const [showConfetti, setShowConfetti] = useState(false)
    const [finalizeResult, setFinalizeResult] = useState(null)
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })

    useEffect(() => {
        if (paramKidId) setSelectedKidId(paramKidId)
    }, [paramKidId])

    useEffect(() => {
        if (!selectedKidId && kids.length > 0) setSelectedKidId(kids[0].id)
    }, [kids])

    useEffect(() => {
        const handler = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight })
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])

    const kid = kids.find((k) => k.id === selectedKidId)
    const tasks = dailyTasks.filter((t) => t.kidId === selectedKidId && t.date === currentDate)
    const config = dayConfigs.find((c) => c.kidId === selectedKidId && c.date === currentDate)

    const completedCount = tasks.filter((t) => t.status === 'completed').length
    const failedCount = tasks.filter((t) => t.status === 'failed').length
    const pendingCount = tasks.filter((t) => t.status === 'pending').length
    const total = tasks.length
    const allDone = total > 0 && tasks.every((t) => t.status === 'completed')
    const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0
    const effectiveReward = config?.rewardAmount ?? rewardAmount
    const effectivePenalty = config?.penaltyAmount ?? penaltyAmount
    const isFinalized = config?.isFinalized ?? false

    const prevConfetti = useRef(false)
    useEffect(() => {
        if (allDone && !prevConfetti.current && !isFinalized) {
            setShowConfetti(true)
            setTimeout(() => setShowConfetti(false), 5000)
        }
        prevConfetti.current = allDone
    }, [allDone])

    const openAddTask = () => { setTaskTitle(''); setTaskDesc(''); setShowAddTask(true) }
    const openEditTask = (t) => { setEditTask(t); setTaskTitle(t.title); setTaskDesc(t.description) }

    const handleSaveTask = async () => {
        if (!taskTitle.trim()) return
        if (editTask) {
            await updateDailyTask(editTask.id, { title: taskTitle.trim(), description: taskDesc.trim() })
            setEditTask(null)
        } else {
            await addDailyTask(selectedKidId, currentDate, taskTitle.trim(), taskDesc.trim())
            setShowAddTask(false)
        }
    }

    const handleLoadTemplates = async () => {
        if (templates.length === 0) { alert('No templates found! Create some in Task Templates first.'); return }
        await loadTemplatesForDay(selectedKidId, currentDate)
    }

    const handleOpenConfig = () => {
        if (config) { setRewardAmount(config.rewardAmount); setPenaltyAmount(config.penaltyAmount) }
        setShowConfig(true)
    }

    const handleSaveConfig = async () => {
        const r = customReward ? parseInt(customReward) * 1000 : rewardAmount
        const p = customPenalty ? parseInt(customPenalty) * 1000 : penaltyAmount
        await setDayConfig(selectedKidId, currentDate, r, p)
        setCustomReward(''); setCustomPenalty('')
        setShowConfig(false)
    }

    const handleFinalize = async () => {
        if (!config) { setShowConfig(true); return }
        if (isFinalized) return
        const hasPending = tasks.some((t) => t.status === 'pending')
        if (hasPending && !confirm(`${pendingCount} task(s) are still pending. Finalize anyway? They will be treated as failures.`)) return
        const result = await finalizeDay(selectedKidId, currentDate)
        setFinalizeResult(result)
        if (result.allCompleted) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 6000) }
        setTimeout(() => setFinalizeResult(null), 5000)
    }

    if (kids.length === 0) {
        return (
            <div className="empty-state">
                <span className="empty-state-icon">🧒</span>
                <p className="empty-state-title">No kids yet</p>
                <p className="empty-state-desc">Go to the Dashboard and add your first kid to start tracking daily tasks.</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>Go to Dashboard</button>
            </div>
        )
    }

    return (
        <div>
            {showConfetti && (
                <ReactConfetti width={windowSize.width} height={windowSize.height} recycle={false} numberOfPieces={300}
                    colors={['#7c3aed', '#ec4899', '#10b981', '#f59e0b', '#06b6d4']} />
            )}

            {finalizeResult?.success && (
                <div className="result-toast">
                    {finalizeResult.allCompleted ? (
                        <>
                            <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
                            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>All tasks completed!</div>
                            <div className="money-positive" style={{ fontSize: 22 }}>+{formatMoney(finalizeResult.delta)}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Added to {kid?.name}'s pocket!</div>
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: 28, marginBottom: 8 }}>😞</div>
                            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Day finalized with penalties</div>
                            <div className="money-negative" style={{ fontSize: 22 }}>{formatMoney(finalizeResult.delta)}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Deducted from pocket</div>
                        </>
                    )}
                </div>
            )}

            <div className="page-header">
                <h1 className="page-title">📅 Daily Tasks</h1>
                <p className="page-subtitle">Track and complete tasks for each day</p>
            </div>

            <div className="row wrap center between" style={{ marginBottom: 24, gap: 12 }}>
                <div className="chip-group">
                    {kids.map((k) => (
                        <button key={k.id} className={`chip ${k.id === selectedKidId ? 'selected' : ''}`}
                            onClick={() => { setSelectedKidId(k.id); navigate(`/daily/${k.id}`) }}>
                            {k.avatar} {k.name}
                        </button>
                    ))}
                </div>
                <div className="date-nav">
                    <button className="btn btn-ghost btn-icon" onClick={() => setCurrentDate(format(subDays(parseISO(currentDate), 1), 'yyyy-MM-dd'))}>◀</button>
                    <span>{format(parseISO(currentDate), 'MMM d, yyyy')}</span>
                    <button className="btn btn-ghost btn-icon" onClick={() => setCurrentDate(format(addDays(parseISO(currentDate), 1), 'yyyy-MM-dd'))}>▶</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setCurrentDate(format(new Date(), 'yyyy-MM-dd'))}>Today</button>
                </div>
            </div>

            {kid && (
                <div className="card" style={{ marginBottom: 24 }}>
                    <div className="row between center wrap" style={{ gap: 16 }}>
                        <div className="row center" style={{ gap: 16 }}>
                            <span style={{ fontSize: 36 }}>{kid.avatar}</span>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 18 }}>{kid.name}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                    💰 Pocket: <span style={{ color: 'var(--accent-amber)', fontWeight: 800 }}>{formatMoney(kid.balance)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="row center" style={{ gap: 10, flexWrap: 'wrap' }}>
                            <span className="badge badge-green">✅ {completedCount}</span>
                            <span className="badge badge-red">❌ {failedCount}</span>
                            <span className="badge badge-amber">⏳ {pendingCount}</span>
                            <span className="badge badge-gray">📝 {total} total</span>
                        </div>
                        <div style={{ textAlign: 'right', minWidth: 120 }}>
                            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--accent-green)' }}>{progress}%</div>
                            <div className="progress-bar" style={{ width: 120 }}>
                                <div className="progress-fill" style={{ width: `${progress}%` }} />
                            </div>
                        </div>
                    </div>
                    {allDone && !isFinalized && (
                        <div className="reward-banner" style={{ marginTop: 16 }}>
                            <div style={{ fontSize: 28, marginBottom: 4 }}>🎉</div>
                            <div style={{ fontWeight: 800, fontSize: 16 }}>All tasks completed!</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                                Finalize to add <strong style={{ color: 'var(--accent-green)' }}>{formatMoney(effectiveReward)}</strong> to {kid.name}'s pocket!
                            </div>
                        </div>
                    )}
                    {isFinalized && (
                        <div style={{ marginTop: 16, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                            ✅ This day has been finalized
                        </div>
                    )}
                </div>
            )}

            <div className="row wrap" style={{ marginBottom: 20, gap: 10 }}>
                <button className="btn btn-teal" onClick={handleLoadTemplates} disabled={isFinalized}>📋 Load Templates</button>
                <button className="btn btn-primary" onClick={openAddTask} disabled={isFinalized}>+ Add Task</button>
                <button className="btn btn-amber" onClick={handleOpenConfig} disabled={isFinalized}>
                    💰 Set Rewards ({formatMoney(effectiveReward)})
                </button>
                <button className={`btn ${allDone ? 'btn-green' : 'btn-danger'}`} onClick={handleFinalize}
                    disabled={isFinalized || total === 0} style={{ marginLeft: 'auto' }}>
                    {isFinalized ? '✅ Finalized' : allDone ? '🎁 Claim Reward!' : '🔒 Finalize Day'}
                </button>
            </div>

            {tasks.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-state-icon">📭</span>
                    <p className="empty-state-title">No tasks for this day</p>
                    <p className="empty-state-desc">Load tasks from templates or add individual tasks.</p>
                </div>
            ) : (
                <div className="col">
                    {tasks.map((task, i) => (
                        <div key={task.id} className={`task-item ${task.status}`} style={{ animationDelay: `${i * 30}ms` }}>
                            <div className={`task-checkbox ${task.status === 'completed' ? 'completed' : ''}`}
                                onClick={() => !isFinalized && toggleTaskStatus(task.id)} title="Mark complete">
                                {task.status === 'completed' ? '✓' : ''}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className={`task-title ${task.status}`}>{task.title}</div>
                                {task.description && <div className="task-desc">{task.description}</div>}
                            </div>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                {!isFinalized && (
                                    <>
                                        <button className={`btn btn-sm ${task.status === 'failed' ? 'btn-danger' : 'btn-ghost'}`}
                                            onClick={() => markTaskFailed(task.id)} title="Mark as failed">❌</button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => openEditTask(task)}>✏️</button>
                                        <button className="btn btn-ghost btn-sm" onClick={() => deleteDailyTask(task.id)}>🗑️</button>
                                    </>
                                )}
                                {task.status === 'failed' && isFinalized && <span className="badge badge-red">Failed</span>}
                                {task.status === 'completed' && isFinalized && <span className="badge badge-green">Done</span>}
                                {task.status === 'pending' && isFinalized && <span className="badge badge-amber">Skipped</span>}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {(showAddTask || editTask) && (
                <Modal title={editTask ? 'Edit Task' : 'Add Task'} onClose={() => { setShowAddTask(false); setEditTask(null) }}>
                    <div className="col">
                        <div className="form-group">
                            <label>Task Title</label>
                            <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                                placeholder="What needs to be done?" autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveTask()} />
                        </div>
                        <div className="form-group">
                            <label>Description (optional)</label>
                            <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder="Additional details..." rows={3} />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => { setShowAddTask(false); setEditTask(null) }}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveTask} disabled={!taskTitle.trim()}>Save</button>
                        </div>
                    </div>
                </Modal>
            )}

            {showConfig && (
                <Modal title="💰 Set Day Reward & Penalty" onClose={() => setShowConfig(false)}>
                    <div className="col">
                        <div className="form-group">
                            <label>Reward Amount (if all tasks completed)</label>
                            <div className="chip-group" style={{ marginBottom: 8 }}>
                                {REWARD_PRESETS.map((p) => (
                                    <button key={p} className={`chip ${rewardAmount === p && !customReward ? 'selected' : ''}`}
                                        onClick={() => { setRewardAmount(p); setCustomReward('') }}>
                                        {formatMoney(p)}
                                    </button>
                                ))}
                            </div>
                            <input type="number" value={customReward} onChange={(e) => setCustomReward(e.target.value)}
                                placeholder="Custom (in thousands, e.g. 30 = 30,000đ)" />
                        </div>
                        <div className="divider" />
                        <div className="form-group">
                            <label>Penalty per failed task</label>
                            <div className="chip-group" style={{ marginBottom: 8 }}>
                                {PENALTY_PRESETS.map((p) => (
                                    <button key={p} className={`chip ${penaltyAmount === p && !customPenalty ? 'selected' : ''}`}
                                        onClick={() => { setPenaltyAmount(p); setCustomPenalty('') }}>
                                        {formatMoney(p)}
                                    </button>
                                ))}
                            </div>
                            <input type="number" value={customPenalty} onChange={(e) => setCustomPenalty(e.target.value)}
                                placeholder="Custom (in thousands, e.g. 3 = 3,000đ)" />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowConfig(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveConfig}>Save Settings</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
