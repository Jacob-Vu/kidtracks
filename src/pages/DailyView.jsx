import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { format, addDays, subDays, parseISO } from 'date-fns'
import ReactConfetti from 'react-confetti'
import useStore from '../store/useStore'
import { useFireActions } from '../hooks/useFirebaseSync'
import { useAuth } from '../contexts/AuthContext'
import { useT } from '../i18n/I18nContext'
import Modal from '../components/Modal'
import { formatMoney } from '../utils/format'
import DayJournal from '../components/DayJournal'
import VoiceMicButton from '../components/VoiceMicButton'
import { trackTemplateImported, trackTaskCompleted, trackTaskCreated, trackStreakMilestone } from '../hooks/useAnalytics'
import useStreak from '../hooks/useStreak'
import useKidFeedback from '../hooks/useKidFeedback'

const REWARD_PRESETS = [10000, 20000, 50000]
const PENALTY_PRESETS = [5000, 10000, 20000]
const DATE_PARAM_RE = /^\d{4}-\d{2}-\d{2}$/

export default function DailyView() {
    const t = useT()
    const { kidId: paramKidId } = useParams()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { isParent } = useAuth()
    const { kids, templates, dailyTasks, dayConfigs } = useStore()
    const {
        addDailyTask, updateDailyTask, deleteDailyTask,
        toggleTaskStatus, markTaskFailed,
        syncAssignedTemplatesForDay, setDayConfig, finalizeDay,
        saveRoutine, clearDayTasks, autoLoadRoutine,
    } = useFireActions()

    const queryDate = searchParams.get('date')
    const initialDate = DATE_PARAM_RE.test(queryDate || '') ? queryDate : format(new Date(), 'yyyy-MM-dd')
    const [selectedKidId, setSelectedKidId] = useState(paramKidId || kids[0]?.id || '')
    const [currentDate, setCurrentDate] = useState(initialDate)
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
    const [inlineMessage, setInlineMessage] = useState('')
    const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false)
    const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
    const [routineBanner, setRoutineBanner] = useState(0) // count of auto-loaded tasks
    const [routineSaved, setRoutineSaved] = useState(false)
    const [showClearConfirm, setShowClearConfirm] = useState(false)
    const [pendingTaskIds, setPendingTaskIds] = useState(() => new Set())
    const [pendingActions, setPendingActions] = useState({
        saveRoutine: false,
        clearDay: false,
        saveConfig: false,
        finalizeDay: false,
        saveTask: false,
    })
    const autoLoadKeyRef = useRef(null)
    const pendingTaskIdsRef = useRef(new Set())
    const kidChipsRef = useRef(null)
    const [kidCanScrollLeft, setKidCanScrollLeft] = useState(false)
    const [kidCanScrollRight, setKidCanScrollRight] = useState(false)
    const isMobileLayout = windowSize.width <= 768

    useEffect(() => {
        if (paramKidId) setSelectedKidId(paramKidId)
    }, [paramKidId])

    useEffect(() => {
        if (!selectedKidId && kids.length > 0) setSelectedKidId(kids[0].id)
    }, [kids])

    useEffect(() => {
        if (!DATE_PARAM_RE.test(queryDate || '')) return
        if (queryDate === currentDate) return
        setCurrentDate(queryDate)
    }, [queryDate, currentDate])

    const kid = kids.find((k) => k.id === selectedKidId)
    const tasks = dailyTasks.filter((t) => t.kidId === selectedKidId && t.date === currentDate)
    const config = dayConfigs.find((c) => c.kidId === selectedKidId && c.date === currentDate)
    const { currentStreak } = useStreak(selectedKidId, dailyTasks, dayConfigs)
    const { notifyTaskComplete, notifyDayComplete } = useKidFeedback()

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

    const updateKidChipHints = () => {
        const el = kidChipsRef.current
        if (!el) return
        const maxScrollLeft = Math.max(0, el.scrollWidth - el.clientWidth)
        setKidCanScrollLeft(el.scrollLeft > 2)
        setKidCanScrollRight(el.scrollLeft < maxScrollLeft - 2)
    }

    useEffect(() => {
        updateKidChipHints()
    }, [kids.length, selectedKidId, windowSize.width])

    useEffect(() => {
        if (!selectedKidId) return
        ;[3, 7, 14, 30].forEach((milestone) => {
            if (currentStreak < milestone) return
            const key = `kidstrack-streak-milestone-${selectedKidId}-${milestone}`
            try {
                if (localStorage.getItem(key) === '1') return
                trackStreakMilestone(milestone)
                localStorage.setItem(key, '1')
            } catch {
                trackStreakMilestone(milestone)
            }
        })
    }, [selectedKidId, currentStreak])

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

    // Reset banner and auto-load guard when kid/date changes
    useEffect(() => {
        setRoutineBanner(0)
        setRoutineSaved(false)
    }, [selectedKidId, currentDate])

    // Auto-load routine when today is empty
    useEffect(() => {
        const today = format(new Date(), 'yyyy-MM-dd')
        const key = `${selectedKidId}-${currentDate}`
        if (
            autoLoadKeyRef.current !== key &&
            currentDate === today &&
            !isFinalized &&
            tasks.length === 0 &&
            kid?.routine?.tasks?.length > 0
        ) {
            autoLoadKeyRef.current = key
            autoLoadRoutine(selectedKidId, currentDate, kid.routine.tasks).then((count) => {
                if (count > 0) setRoutineBanner(count)
            })
        }
    }, [selectedKidId, currentDate, tasks.length, isFinalized, kid?.routine])

    const openAddTask = () => {
        if (!selectedKidId) return
        setTaskTitle('')
        setTaskDesc('')
        setShowAddTask(true)
    }

    const openEditTask = (task) => {
        if (!selectedKidId) return
        if (isMobileLayout) {
            navigate(`/daily/${selectedKidId}/task/${task.id}/edit?date=${currentDate}`)
            return
        }
        setEditTask(task)
        setTaskTitle(task.title)
        setTaskDesc(task.description)
    }

    const handleSaveRoutine = async () => {
        if (pendingActions.saveRoutine) return
        setPendingActions((prev) => ({ ...prev, saveRoutine: true }))
        try {
            await saveRoutine(selectedKidId, tasks, currentDate)
            setRoutineSaved(true)
            setTimeout(() => setRoutineSaved(false), 2500)
        } finally {
            setPendingActions((prev) => ({ ...prev, saveRoutine: false }))
        }
    }

    const handleClearAll = async () => {
        if (pendingActions.clearDay) return
        setPendingActions((prev) => ({ ...prev, clearDay: true }))
        try {
            autoLoadKeyRef.current = `${selectedKidId}-${currentDate}`
            await clearDayTasks(selectedKidId, currentDate)
            setShowClearConfirm(false)
            setRoutineBanner(0)
        } finally {
            setPendingActions((prev) => ({ ...prev, clearDay: false }))
        }
    }

    const handleUndoRoutine = async () => {
        autoLoadKeyRef.current = `${selectedKidId}-${currentDate}`
        await clearDayTasks(selectedKidId, currentDate)
        setRoutineBanner(0)
    }

    const handleSaveTask = async () => {
        if (!taskTitle.trim() || pendingActions.saveTask) return
        setPendingActions((prev) => ({ ...prev, saveTask: true }))
        try {
            if (editTask) {
                await updateDailyTask(editTask.id, { title: taskTitle.trim(), description: taskDesc.trim() })
                setEditTask(null)
            } else {
                await addDailyTask(selectedKidId, currentDate, taskTitle.trim(), taskDesc.trim())
                trackTaskCreated({
                    kid_id: selectedKidId,
                    source: 'manual',
                    has_description: !!taskDesc.trim(),
                    task_type: 'daily_task',
                })
                setShowAddTask(false)
            }
        } finally {
            setPendingActions((prev) => ({ ...prev, saveTask: false }))
        }
    }

    const handleToggleTask = async (task) => {
        if (isFinalized || pendingTaskIdsRef.current.has(task.id)) return

        pendingTaskIdsRef.current.add(task.id)
        setPendingTaskIds(new Set(pendingTaskIdsRef.current))

        if (task.status !== 'completed') {
            trackTaskCompleted({
                kid_id: selectedKidId,
                task_id: task.id,
                date: currentDate,
                task_type: 'daily_task',
                has_reward: !!(config && Number(config.rewardAmount) > 0),
            })
        }

        try {
            await toggleTaskStatus(task.id)
            if (task.status !== 'completed') {
                notifyTaskComplete(task.id)
            }
        } finally {
            pendingTaskIdsRef.current.delete(task.id)
            setPendingTaskIds(new Set(pendingTaskIdsRef.current))
        }
    }

    const handleMarkFailed = async (taskId) => {
        if (isFinalized || pendingTaskIdsRef.current.has(taskId)) return
        pendingTaskIdsRef.current.add(taskId)
        setPendingTaskIds(new Set(pendingTaskIdsRef.current))
        try {
            await markTaskFailed(taskId)
        } finally {
            pendingTaskIdsRef.current.delete(taskId)
            setPendingTaskIds(new Set(pendingTaskIdsRef.current))
        }
    }

    const handleDeleteTask = async (taskId) => {
        if (isFinalized || pendingTaskIdsRef.current.has(taskId)) return
        pendingTaskIdsRef.current.add(taskId)
        setPendingTaskIds(new Set(pendingTaskIdsRef.current))
        try {
            await deleteDailyTask(taskId)
        } finally {
            pendingTaskIdsRef.current.delete(taskId)
            setPendingTaskIds(new Set(pendingTaskIdsRef.current))
        }
    }

    const handleOpenConfig = () => {
        if (config) { setRewardAmount(config.rewardAmount); setPenaltyAmount(config.penaltyAmount) }
        setShowConfig(true)
    }

    const handleSaveConfig = async () => {
        if (pendingActions.saveConfig) return
        setPendingActions((prev) => ({ ...prev, saveConfig: true }))
        try {
            const r = customReward ? parseInt(customReward) * 1000 : rewardAmount
            const p = customPenalty ? parseInt(customPenalty) * 1000 : penaltyAmount
            await setDayConfig(selectedKidId, currentDate, r, p)
            setCustomReward(''); setCustomPenalty('')
            setShowConfig(false)
        } finally {
            setPendingActions((prev) => ({ ...prev, saveConfig: false }))
        }
    }

    const handleFinalize = async () => {
        if (pendingActions.finalizeDay) return
        if (!config) { setShowConfig(true); return }
        if (isFinalized) return
        setShowFinalizeConfirm(true)
    }

    const confirmFinalizeDay = async () => {
        if (pendingActions.finalizeDay) return
        setShowFinalizeConfirm(false)
        setPendingActions((prev) => ({ ...prev, finalizeDay: true }))
        try {
            const result = await finalizeDay(selectedKidId, currentDate)
            setFinalizeResult(result)
            notifyDayComplete()
            if (result.allCompleted) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 6000) }
            setTimeout(() => setFinalizeResult(null), 5000)
        } finally {
            setPendingActions((prev) => ({ ...prev, finalizeDay: false }))
        }
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
                            <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{t('daily.addToPocket', { name: kid?.displayName || kid?.name })}</div>
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
            {inlineMessage && <div className="toast-inline" style={{ marginBottom: 16 }}>{inlineMessage}</div>}

            {routineBanner > 0 && (
                <div className="routine-banner">
                    <span>✨ {t('routine.banner', { count: routineBanner })}</span>
                    <button className="routine-banner-undo" onClick={handleUndoRoutine}>{t('routine.undo')}</button>
                </div>
            )}

            <div className="row wrap center between" style={{ marginBottom: 24, gap: 12 }}>
                <div
                    ref={kidChipsRef}
                    className={`chip-group chip-group--scroll chip-group--hint${kidCanScrollLeft ? ' has-left' : ''}${kidCanScrollRight ? ' has-right' : ''}`}
                    style={{ alignItems: 'center' }}
                    onScroll={updateKidChipHints}
                >
                    {kids.map((k) => (
                        <button key={k.id} className={`chip ${k.id === selectedKidId ? 'selected' : ''}`}
                            onClick={() => { setSelectedKidId(k.id); navigate(`/daily/${k.id}`) }}>
                            {k.avatar} {k.displayName || k.name}
                        </button>
                    ))}
                    {currentStreak > 0 && (
                        <span className={`streak-badge${currentStreak >= 3 ? ' streak-badge--hot' : ''}`} style={{ fontSize: 12 }}>
                            🔥 {currentStreak}
                        </span>
                    )}
                </div>
                <div className="date-nav">
                    <button className="btn btn-ghost btn-icon icon-touch-btn" onClick={() => setCurrentDate(format(subDays(parseISO(currentDate), 1), 'yyyy-MM-dd'))} aria-label="Previous day">◀</button>
                    <span>{format(parseISO(currentDate), 'MMM d, yyyy')}</span>
                    <button className="btn btn-ghost btn-icon icon-touch-btn" onClick={() => setCurrentDate(format(addDays(parseISO(currentDate), 1), 'yyyy-MM-dd'))} aria-label="Next day">▶</button>
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
                {isParent && <button className="btn btn-teal" onClick={() => navigate(`/daily/${selectedKidId}/pick-templates?date=${currentDate}`)} disabled={isFinalized}>{t('daily.loadTemplates')}</button>}
                <button className="btn btn-primary" onClick={openAddTask} disabled={isFinalized}>{t('daily.addTask')}</button>
                {tasks.length > 0 && !isFinalized && (
                    <button
                        className={`btn btn-ghost btn-sm routine-save-btn${routineSaved ? ' routine-save-btn--saved' : ''}`}
                        onClick={handleSaveRoutine}
                        title={kid?.routine ? t('routine.updateBtn') : t('routine.saveBtn')}
                        disabled={pendingActions.saveRoutine}
                        aria-busy={pendingActions.saveRoutine ? 'true' : 'false'}
                    >
                        {pendingActions.saveRoutine ? t('common.loading') : `${routineSaved ? '✅' : '⭐'} ${kid?.routine ? t('routine.updateBtn') : t('routine.saveBtn')}`}
                    </button>
                )}
                {tasks.length > 0 && !isFinalized && (
                    <button className="btn btn-ghost btn-sm" onClick={() => setShowClearConfirm(true)} style={{ color: 'var(--accent-red)' }} disabled={pendingActions.clearDay}>
                        🗑️ {t('daily.clearAll')}
                    </button>
                )}
                {isParent && (
                    <button className="btn btn-amber" onClick={handleOpenConfig} disabled={isFinalized}>
                        {t('daily.setRewards', { amount: formatMoney(effectiveReward) })}
                    </button>
                )}
                {isParent && (
                    <button className={`btn ${allDone ? 'btn-green' : 'btn-danger'}`} onClick={handleFinalize}
                        disabled={isFinalized || total === 0 || pendingActions.finalizeDay}
                        aria-busy={pendingActions.finalizeDay ? 'true' : 'false'}
                        style={{ marginLeft: 'auto' }}>
                        {pendingActions.finalizeDay ? t('common.loading') : isFinalized ? t('daily.finalized') : allDone ? t('daily.claimReward') : t('daily.finalizeDay')}
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
                    {tasks.map((task, i) => {
                        const isPending = pendingTaskIds.has(task.id)
                        return (
                            <div key={task.id} className={`task-item ${task.status}${isPending ? ' task-item--pending' : ''}`} style={{ animationDelay: `${i * 30}ms` }}>
                                <button
                                    type="button"
                                    className={`task-checkbox ${task.status === 'completed' ? 'completed' : ''}${isPending ? ' task-checkbox--pending' : ''}`}
                                    onClick={() => handleToggleTask(task)}
                                    title={isPending ? 'Updating task status' : 'Mark complete'}
                                    aria-label={isPending ? 'Updating task status' : 'Mark complete'}
                                    aria-busy={isPending ? 'true' : 'false'}
                                    disabled={isFinalized || isPending}
                                >
                                    {isPending ? <span className="task-checkbox-spinner" aria-hidden /> : (task.status === 'completed' ? '✓' : '')}
                                </button>
                                <div style={{ flex: 1 }}>
                                    <div className={`task-title ${task.status}`}>{task.title}</div>
                                    {task.description && <div className="task-desc">{task.description}</div>}
                                </div>
                                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                                    {!isFinalized && (
                                        <>
                                            <button className={`btn btn-sm icon-touch-btn ${task.status === 'failed' ? 'btn-danger' : 'btn-ghost'}`}
                                                onClick={() => handleMarkFailed(task.id)} title="Mark as failed" aria-label="Mark as failed" disabled={isPending} aria-busy={isPending ? 'true' : 'false'}>❌</button>
                                            <button className="btn btn-ghost btn-sm icon-touch-btn" onClick={() => openEditTask(task)} aria-label="Edit task" disabled={isPending}>✏️</button>
                                            <button className="btn btn-ghost btn-sm icon-touch-btn" onClick={() => handleDeleteTask(task.id)} aria-label="Delete task" disabled={isPending} aria-busy={isPending ? 'true' : 'false'}>🗑️</button>
                                        </>
                                    )}
                                    {task.status === 'failed' && isFinalized && <span className="badge badge-red">Failed</span>}
                                    {task.status === 'completed' && isFinalized && <span className="badge badge-green">Done</span>}
                                    {task.status === 'pending' && isFinalized && <span className="badge badge-amber">Skipped</span>}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {(showAddTask || editTask) && (
                <Modal title={editTask ? t('daily.editTask') : t('daily.addTaskTitle')} onClose={() => { setShowAddTask(false); setEditTask(null) }}>
                    <div className="col">
                        <div className="form-group">
                            <label>{t('tmpl.taskTitle')}</label>
                            <div className="form-group-row">
                                <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                                    placeholder={t('daily.whatTodo')} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSaveTask()} />
                                <VoiceMicButton
                                    field="task_title"
                                    role="parent"
                                    onAppend={(text) => setTaskTitle((prev) => prev ? prev + ' ' + text : text)}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>{t('tmpl.descLabel')}</label>
                            <div className="form-group-row">
                                <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder={t('daily.additionalDetails')} rows={3} />
                                <VoiceMicButton
                                    field="task_description"
                                    role="parent"
                                    onAppend={(text) => setTaskDesc((prev) => prev ? prev + ' ' + text : text)}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => { setShowAddTask(false); setEditTask(null) }}>{t('common.cancel')}</button>
                            <button className="btn btn-primary" onClick={handleSaveTask} disabled={!taskTitle.trim() || pendingActions.saveTask} aria-busy={pendingActions.saveTask ? 'true' : 'false'}>
                                {pendingActions.saveTask ? t('common.loading') : t('common.save')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {showConfig && (
                <Modal mobileSheet={isMobileLayout} title={t('daily.rewardTitle')} onClose={() => setShowConfig(false)}>
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
                            <button className="btn btn-primary" onClick={handleSaveConfig} disabled={pendingActions.saveConfig} aria-busy={pendingActions.saveConfig ? 'true' : 'false'}>
                                {pendingActions.saveConfig ? t('common.loading') : t('daily.saveSettings')}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {showFinalizeConfirm && (
                <Modal title={t('daily.finalizeDay')} onClose={() => setShowFinalizeConfirm(false)}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                        {pendingCount > 0
                            ? t('daily.pendingConfirm', { count: pendingCount })
                            : allDone
                                ? t('daily.finalizeReward', { amount: formatMoney(effectiveReward), name: kid?.displayName || kid?.name })
                                : t('daily.penalties')}
                    </p>
                    <div className="modal-footer">
                        <button className="btn btn-ghost" onClick={() => setShowFinalizeConfirm(false)}>{t('common.cancel')}</button>
                        <button className="btn btn-danger" onClick={confirmFinalizeDay} disabled={pendingActions.finalizeDay} aria-busy={pendingActions.finalizeDay ? 'true' : 'false'}>
                            {pendingActions.finalizeDay ? t('common.loading') : t('daily.finalizeDay')}
                        </button>
                    </div>
                </Modal>
            )}

            {showClearConfirm && (
                <Modal title={t('daily.clearAll')} onClose={() => setShowClearConfirm(false)}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                        {t('daily.clearConfirm', { count: tasks.length })}
                    </p>
                    <div className="modal-footer">
                        <button className="btn btn-ghost" onClick={() => setShowClearConfirm(false)}>{t('common.cancel')}</button>
                        <button className="btn btn-danger" onClick={handleClearAll} disabled={pendingActions.clearDay} aria-busy={pendingActions.clearDay ? 'true' : 'false'}>
                            {pendingActions.clearDay ? t('common.loading') : t('daily.clearAll')}
                        </button>
                    </div>
                </Modal>
            )}

            {kid && (
                <DayJournal kidId={selectedKidId} date={currentDate} role="parent" kidName={kid.displayName || kid.name} />
            )}

        </div>
    )
}
