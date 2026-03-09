import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format, addDays, subDays, parseISO } from 'date-fns'
import ReactConfetti from 'react-confetti'
import useStore from '../store/useStore'
import { useFireActions } from '../hooks/useFirebaseSync'
import { useAuth } from '../contexts/AuthContext'
import { useT } from '../i18n/I18nContext'
import Modal from '../components/Modal'
import { formatMoney } from '../utils/format'

const REWARD_PRESETS = [10000, 20000, 50000]
const PENALTY_PRESETS = [5000, 10000, 20000]

export default function DailyView() {
    const t = useT()
    const { kidId: paramKidId } = useParams()
    const navigate = useNavigate()
    const { isParent } = useAuth()
    const { kids, templates, dailyTasks, dayConfigs } = useStore()
    const {
        addDailyTask, updateDailyTask, deleteDailyTask,
        toggleTaskStatus, markTaskFailed,
        loadTemplatesForDay, syncAssignedTemplatesForDay, setDayConfig, finalizeDay,
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

    const kid = kids.find((k) => k.id === selectedKidId)
    const tasks = dailyTasks.filter((t) => t.kidId === selectedKidId && t.date === currentDate)
    const config = dayConfigs.find((c) => c.kidId === selectedKidId && c.date === currentDate)

    useEffect(() => {
        if (selectedKidId && currentDate && !config?.isFinalized) {
            syncAssignedTemplatesForDay(selectedKidId, currentDate)
        }
    }, [selectedKidId, currentDate, config?.isFinalized])

    useEffect(() => {
        const handler = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight })
        window.addEventListener('resize', handler)
        return () => window.removeEventListener('resize', handler)
    }, [])

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
        if (templates.length === 0) { alert(t('daily.noTemplatesAlert')); return }
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
        if (hasPending && !confirm(t('daily.pendingConfirm', { count: pendingCount }))) return
        const result = await finalizeDay(selectedKidId, currentDate)
        setFinalizeResult(result)
        if (result.allCompleted) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 6000) }
        setTimeout(() => setFinalizeResult(null), 5000)
    }

    if (kids.length === 0) {
        return (
            <div className="empty-state">
                <span className="empty-state-icon">🧒</span>
                <p className="empty-state-title">{t('daily.noKids')}</p>
                <p className="empty-state-desc">{t('daily.noKidsDesc')}</p>
                <button className="btn btn-primary" onClick={() => navigate('/')}>{t('daily.goToDash')}</button>
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
                            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{t('daily.allCompleted')}</div>
                            <div className="money-positive" style={{ fontSize: 22 }}>+{formatMoney(finalizeResult.delta)}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{t('daily.addToPocker', { name: kid?.displayName || kid?.name })}</div>
                        </>
                    ) : (
                        <>
                            <div style={{ fontSize: 28, marginBottom: 8 }}>😞</div>
                            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{t('daily.penalties')}</div>
                            <div className="money-negative" style={{ fontSize: 22 }}>{formatMoney(finalizeResult.delta)}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{t('daily.deducted')}</div>
                        </>
                    )}
                </div>
            )}

            <div className="page-header">
                <h1 className="page-title">{t('daily.title')}</h1>
                <p className="page-subtitle">{t('daily.subtitle')}</p>
            </div>

            <div className="row wrap center between" style={{ marginBottom: 24, gap: 12 }}>
                <div className="chip-group">
                    {kids.map((k) => (
                        <button key={k.id} className={`chip ${k.id === selectedKidId ? 'selected' : ''}`}
                            onClick={() => { setSelectedKidId(k.id); navigate(`/daily/${k.id}`) }}>
                            {k.avatar} {k.displayName || k.name}
                        </button>
                    ))}
                </div>
                <div className="date-nav">
                    <button className="btn btn-ghost btn-icon" onClick={() => setCurrentDate(format(subDays(parseISO(currentDate), 1), 'yyyy-MM-dd'))}>◀</button>
                    <span>{format(parseISO(currentDate), 'MMM d, yyyy')}</span>
                    <button className="btn btn-ghost btn-icon" onClick={() => setCurrentDate(format(addDays(parseISO(currentDate), 1), 'yyyy-MM-dd'))}>▶</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setCurrentDate(format(new Date(), 'yyyy-MM-dd'))}>{t('daily.today')}</button>
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
                                    💰 {t('daily.pocket')}: <span style={{ color: 'var(--accent-amber)', fontWeight: 800 }}>{formatMoney(kid.balance)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="row center" style={{ gap: 10, flexWrap: 'wrap' }}>
                            <span className="badge badge-green">✅ {completedCount}</span>
                            <span className="badge badge-red">❌ {failedCount}</span>
                            <span className="badge badge-amber">⏳ {pendingCount}</span>
                            <span className="badge badge-gray">📝 {total} {t('daily.total')}</span>
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
                            <div style={{ fontWeight: 800, fontSize: 16 }}>{t('daily.allCompleted')}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>
                                {t('daily.finalizeReward', { amount: formatMoney(effectiveReward), name: kid.displayName || kid.name })}
                            </div>
                        </div>
                    )}
                    {isFinalized && (
                        <div style={{ marginTop: 16, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>
                            {t('daily.dayFinalized')}
                        </div>
                    )}
                </div>
            )}

            <div className="row wrap" style={{ marginBottom: 20, gap: 10 }}>
                {isParent && <button className="btn btn-teal" onClick={handleLoadTemplates} disabled={isFinalized}>{t('daily.loadTemplates')}</button>}
                <button className="btn btn-primary" onClick={openAddTask} disabled={isFinalized}>{t('daily.addTask')}</button>
                {isParent && (
                    <button className="btn btn-amber" onClick={handleOpenConfig} disabled={isFinalized}>
                        {t('daily.setRewards', { amount: formatMoney(effectiveReward) })}
                    </button>
                )}
                {isParent && (
                    <button className={`btn ${allDone ? 'btn-green' : 'btn-danger'}`} onClick={handleFinalize}
                        disabled={isFinalized || total === 0} style={{ marginLeft: 'auto' }}>
                        {isFinalized ? t('daily.finalized') : allDone ? t('daily.claimReward') : t('daily.finalizeDay')}
                    </button>
                )}
            </div>

            {tasks.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-state-icon">📭</span>
                    <p className="empty-state-title">{t('daily.noTasks')}</p>
                    <p className="empty-state-desc">{t('daily.noTasksDesc')}</p>
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
                <Modal title={editTask ? t('daily.editTask') : t('daily.addTaskTitle')} onClose={() => { setShowAddTask(false); setEditTask(null) }}>
                    <div className="col">
                        <div className="form-group">
                            <label>{t('tmpl.taskTitle')}</label>
                            <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                                placeholder={t('daily.whatTodo')} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveTask()} />
                        </div>
                        <div className="form-group">
                            <label>{t('tmpl.descLabel')}</label>
                            <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder={t('daily.additionalDetails')} rows={3} />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => { setShowAddTask(false); setEditTask(null) }}>{t('common.cancel')}</button>
                            <button className="btn btn-primary" onClick={handleSaveTask} disabled={!taskTitle.trim()}>{t('common.save')}</button>
                        </div>
                    </div>
                </Modal>
            )}

            {showConfig && (
                <Modal title={t('daily.rewardTitle')} onClose={() => setShowConfig(false)}>
                    <div className="col">
                        <div className="form-group">
                            <label>{t('daily.rewardLabel')}</label>
                            <div className="chip-group" style={{ marginBottom: 8 }}>
                                {REWARD_PRESETS.map((p) => (
                                    <button key={p} className={`chip ${rewardAmount === p && !customReward ? 'selected' : ''}`}
                                        onClick={() => { setRewardAmount(p); setCustomReward('') }}>
                                        {formatMoney(p)}
                                    </button>
                                ))}
                            </div>
                            <input type="number" value={customReward} onChange={(e) => setCustomReward(e.target.value)}
                                placeholder={t('daily.customReward')} />
                        </div>
                        <div className="divider" />
                        <div className="form-group">
                            <label>{t('daily.penaltyLabel')}</label>
                            <div className="chip-group" style={{ marginBottom: 8 }}>
                                {PENALTY_PRESETS.map((p) => (
                                    <button key={p} className={`chip ${penaltyAmount === p && !customPenalty ? 'selected' : ''}`}
                                        onClick={() => { setPenaltyAmount(p); setCustomPenalty('') }}>
                                        {formatMoney(p)}
                                    </button>
                                ))}
                            </div>
                            <input type="number" value={customPenalty} onChange={(e) => setCustomPenalty(e.target.value)}
                                placeholder={t('daily.customPenalty')} />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => setShowConfig(false)}>{t('common.cancel')}</button>
                            <button className="btn btn-primary" onClick={handleSaveConfig}>{t('daily.saveSettings')}</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
}
