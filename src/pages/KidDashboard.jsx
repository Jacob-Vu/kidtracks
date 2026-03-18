import { useAuth } from '../contexts/AuthContext'
import { useT } from '../i18n/I18nContext'
import useStore from '../store/useStore'
import { useFireActions } from '../hooks/useFirebaseSync'
import useStreak from '../hooks/useStreak'
import { format, subDays } from 'date-fns'
import { formatMoney } from '../utils/format'
import { useState, useEffect, useRef } from 'react'
import Modal from '../components/Modal'
import CelebrationOverlay from '../components/CelebrationOverlay'
import DayJournal from '../components/DayJournal'
import VoiceMicButton from '../components/VoiceMicButton'
import GoalCard from '../components/GoalCard'
import GoalModal from '../components/GoalModal'
import useGoalMilestones from '../hooks/useGoalMilestones'
import { trackTaskCompleted, trackAllTasksDone, trackCelebrationShown } from '../hooks/useAnalytics'
import BadgeStrip from '../components/BadgeStrip'
import useBadges from '../hooks/useBadges'
import useKidFeedback from '../hooks/useKidFeedback'
import useLeaderboard from '../hooks/useLeaderboard'
import LeaderboardCard from '../components/LeaderboardCard'

export default function KidDashboard() {
    const t = useT()
    const { profile } = useAuth()
    const { kids, goals, dailyTasks, dayConfigs, ledger } = useStore()
    const { toggleTaskStatus, addDailyTask, updateDailyTask, syncAssignedTemplatesForDay, saveRoutine, clearDayTasks, autoLoadRoutine, addGoal, updateGoal, deleteGoal } = useFireActions()

    const kid = kids.find((k) => k.id === profile?.kidId)
    const today = format(new Date(), 'yyyy-MM-dd')

    const todayTasks = kid ? dailyTasks.filter((t) => t.kidId === kid.id && t.date === today) : []
    const completedToday = todayTasks.filter((t) => t.status === 'completed').length
    const totalToday = todayTasks.length
    const kidGoals = kid ? goals.filter((g) => g.kidId === kid.id) : []
    const activeGoal = kidGoals.find((g) => g.status === 'active') || kidGoals[0] || null

    const celebrationKey = `kidstrack-celebrated-${kid?.id}-${today}`

    // All hooks must be before any early return
    const [showAdd, setShowAdd] = useState(false)
    const [editTask, setEditTask] = useState(null)
    const [taskTitle, setTaskTitle] = useState('')
    const [taskDesc, setTaskDesc] = useState('')
    const [showCelebration, setShowCelebration] = useState(false)
    const [routineBanner, setRoutineBanner] = useState(0)
    const [routineSaved, setRoutineSaved] = useState(false)
    const [showGoalModal, setShowGoalModal] = useState(false)
    const [editGoal, setEditGoal] = useState(null)
    const autoLoadKeyRef = useRef(null)
    const { currentStreak, bestStreak } = useStreak(kid?.id, dailyTasks, dayConfigs)
    const { recentBadges, totalUnlocked, totalBadges, newlyUnlocked } = useBadges(kid?.id)
    const leaderboardData = useLeaderboard(kids, dailyTasks, ledger, dayConfigs)
    const {
        reducedMotion,
        taskPopId,
        badgeUnlock,
        notifyTaskComplete,
        notifyDayComplete,
        notifyBadgeUnlock,
    } = useKidFeedback()

    useEffect(() => {
        if (kid?.id && today) {
            syncAssignedTemplatesForDay(kid.id, today)
        }
    }, [kid?.id, today])

    useEffect(() => {
        if (completedToday > 0 && completedToday === totalToday && totalToday > 0) {
            if (!localStorage.getItem(celebrationKey)) {
                localStorage.setItem(celebrationKey, '1')
                notifyDayComplete()
                setShowCelebration(true)
                trackAllTasksDone({ kid_id: kid?.id, date: today, total_tasks: totalToday })
                trackCelebrationShown({ kid_id: kid?.id, date: today })
            }
        }
    }, [completedToday, totalToday, celebrationKey, notifyDayComplete])

    useEffect(() => {
        if (newlyUnlocked.length === 0) return
        newlyUnlocked.forEach((badge) => notifyBadgeUnlock(badge))
    }, [newlyUnlocked, notifyBadgeUnlock])

    useGoalMilestones(activeGoal, kid?.balance || 0, async (goalId, updates) => {
        await updateGoal(goalId, updates)
    })

    // Auto-load routine when today is empty
    useEffect(() => {
        const key = kid?.id ? `${kid.id}-${today}` : null
        if (
            key &&
            autoLoadKeyRef.current !== key &&
            totalToday === 0 &&
            kid?.routine?.tasks?.length > 0
        ) {
            autoLoadKeyRef.current = key
            autoLoadRoutine(kid.id, today, kid.routine.tasks).then((count) => {
                if (count > 0) setRoutineBanner(count)
            })
        }
    }, [kid?.id, today, totalToday, kid?.routine])

    if (!kid) return <div className="empty-state"><span className="empty-state-icon">⏳</span><p>{t('common.loading')}</p></div>

    // 10-day history
    const last10 = Array.from({ length: 10 }, (_, i) => {
        const d = format(subDays(new Date(), 9 - i), 'yyyy-MM-dd')
        const tasks = dailyTasks.filter((t) => t.kidId === kid.id && t.date === d)
        const done = tasks.filter((t) => t.status === 'completed').length
        return { date: d, total: tasks.length, done, day: format(subDays(new Date(), 9 - i), 'EEE') }
    })

    const recentLedger = ledger.filter((e) => e.kidId === kid.id).sort((a, b) => b.id.localeCompare(a.id)).slice(0, 8)

    const openAdd = () => { setTaskTitle(''); setTaskDesc(''); setShowAdd(true) }
    const openEdit = (task) => { setEditTask(task); setTaskTitle(task.title); setTaskDesc(task.description) }

    const handleSaveRoutine = async () => {
        await saveRoutine(kid.id, todayTasks, today)
        setRoutineSaved(true)
        setTimeout(() => setRoutineSaved(false), 2500)
    }

    const handleUndoRoutine = async () => {
        await clearDayTasks(kid.id, today)
        setRoutineBanner(0)
        autoLoadKeyRef.current = null
    }

    const handleSave = async () => {
        if (!taskTitle.trim()) return
        if (editTask) {
            await updateDailyTask(editTask.id, { title: taskTitle.trim(), description: taskDesc.trim() })
            setEditTask(null)
        } else {
            await addDailyTask(kid.id, today, taskTitle.trim(), taskDesc.trim())
            setShowAdd(false)
        }
    }

    const handleSaveGoal = async (payload) => {
        if (!kid) return
        if (editGoal) {
            await updateGoal(editGoal.id, payload)
        } else {
            await addGoal(kid.id, payload.title, payload.targetAmount, payload.icon, payload.dueDate)
        }
        setShowGoalModal(false)
        setEditGoal(null)
    }

    const handleDeleteGoal = async () => {
        if (!editGoal) return
        await deleteGoal(editGoal.id)
        setShowGoalModal(false)
        setEditGoal(null)
    }

    return (
        <div data-feedback-reduced-motion={reducedMotion ? 'true' : 'false'}>
            {/* Hero */}
            <div className="kid-hero-card">
                <span className="kid-hero-avatar">{kid.avatar}</span>
                <div style={{ flex: 1 }}>
                    <div className="kid-hero-name">{kid.displayName || kid.name}</div>
                    <div className="kid-hero-balance">
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t('kidDash.balance')}:</span>
                        <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: 'var(--accent-amber)', marginLeft: 6 }}>
                            {formatMoney(kid.balance)}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    {currentStreak > 0 ? (
                        <span className={`streak-badge${currentStreak >= 3 ? ' streak-badge--hot' : ''}`}>
                            {t('streak.days', { count: currentStreak })}
                        </span>
                    ) : (
                        <span className="streak-badge streak-badge--zero">{t('streak.startNew')}</span>
                    )}
                    {bestStreak > currentStreak && bestStreak > 0 && (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{t('streak.best', { count: bestStreak })}</span>
                    )}
                </div>
            </div>

            {badgeUnlock && (
                <div
                    className={`badge-unlock-toast${reducedMotion ? ' badge-unlock-toast--reduced' : ''}`}
                    data-testid="badge-unlock-toast"
                >
                    <span className="badge-unlock-toast__icon" aria-hidden>✨</span>
                    <span className="badge-unlock-toast__text">
                        {t('feedback.badgeUnlocked', { badge: t(badgeUnlock.definition?.nameKey || badgeUnlock.code) })}
                    </span>
                </div>
            )}

            {/* Routine banner */}
            {routineBanner > 0 && (
                <div className="routine-banner">
                    <span>✨ {t('routine.banner', { count: routineBanner })}</span>
                    <button className="routine-banner-undo" onClick={handleUndoRoutine}>{t('routine.undo')}</button>
                </div>
            )}

            {/* Today's tasks — primary critical section first */}
            <div className="row between center" style={{ marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                <h2 className="section-title" style={{ marginBottom: 0 }}>
                    {t('kidDash.todayTasks')} ({completedToday}/{totalToday})
                </h2>
                <div className="row center" style={{ gap: 8 }}>
                    {todayTasks.length > 0 && (
                        <button
                            className={`btn btn-ghost btn-sm routine-save-btn${routineSaved ? ' routine-save-btn--saved' : ''}`}
                            onClick={handleSaveRoutine}
                            title={kid?.routine ? t('routine.updateBtn') : t('routine.saveBtn')}
                        >
                            {routineSaved ? '✅' : '⭐'}
                        </button>
                    )}
                    <button className="btn btn-primary btn-sm" onClick={openAdd}>+ {t('daily.addTask')}</button>
                </div>
            </div>

            {todayTasks.length === 0 ? (
                <div className="empty-state" style={{ padding: '30px 20px' }}>
                    <p className="empty-state-title">{t('kidDash.noTasks')}</p>
                </div>
            ) : (
                <div className="col" style={{ marginBottom: 28 }}>
                    {todayTasks.map((task) => (
                        <div key={task.id} className={`task-item ${task.status}${taskPopId === task.id ? ' task-item--feedback-pop' : ''}`}>
                            <div className={`task-checkbox ${task.status === 'completed' ? 'completed' : ''}`}
                                onClick={() => {
                                    if (task.status !== 'completed') {
                                        trackTaskCompleted({ kid_id: kid.id, task_id: task.id, date: today })
                                        notifyTaskComplete(task.id)
                                    }
                                    toggleTaskStatus(task.id)
                                }}>
                                {task.status === 'completed' ? '✓' : ''}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div className={`task-title ${task.status}`}>{task.title}</div>
                                {task.description && <div className="task-desc">{task.description}</div>}
                            </div>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(task)}>✏️</button>
                        </div>
                    ))}
                </div>
            )}

            {/* 10-day progress strip — secondary context */}
            <h2 className="section-title">📊 {t('kidDash.last10Days')}</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 28, overflowX: 'auto' }}>
                {last10.map((d) => {
                    const pct = d.total > 0 ? Math.round((d.done / d.total) * 100) : 0
                    const isToday = d.date === today
                    return (
                        <div key={d.date} style={{
                            minWidth: 52, textAlign: 'center', padding: '8px 6px', borderRadius: 'var(--radius-md)',
                            background: isToday ? 'rgba(124,58,237,0.15)' : 'var(--bg-card)',
                            border: `1px solid ${isToday ? 'rgba(124,58,237,0.4)' : 'var(--border-light)'}`,
                        }}>
                            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700 }}>{d.day}</div>
                            <div style={{
                                fontSize: 18, fontWeight: 800, marginTop: 4,
                                color: pct === 100 ? 'var(--accent-green)' : pct > 0 ? 'var(--accent-amber)' : 'var(--text-muted)',
                            }}>
                                {d.total === 0 ? '–' : pct === 100 ? '⭐' : `${pct}%`}
                            </div>
                            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{d.done}/{d.total}</div>
                        </div>
                    )
                })}
            </div>

            {/* Savings goal */}
            <h2 className="section-title">🎯 {t('goal.sectionTitle')}</h2>
            <div style={{ marginBottom: 24 }}>
                <GoalCard
                    goal={activeGoal}
                    currentAmount={kid.balance}
                    onCreate={() => { setEditGoal(null); setShowGoalModal(true) }}
                    onEdit={() => { setEditGoal(activeGoal); setShowGoalModal(true) }}
                    onDelete={async () => {
                        if (!activeGoal) return
                        await deleteGoal(activeGoal.id)
                    }}
                />
            </div>

            <BadgeStrip recentBadges={recentBadges} totalUnlocked={totalUnlocked} totalBadges={totalBadges} />
            <LeaderboardCard data={leaderboardData} variant="kid" currentKidId={kid.id} />

            {/* Recent history */}
            <h2 className="section-title">{t('kidDash.recentHistory')}</h2>
            {recentLedger.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('kidDash.noHistory')}</p>
            ) : (
                <div className="col">
                    {recentLedger.map((e) => (
                        <div key={e.id} className="ledger-entry">
                            <div className={`ledger-dot ${e.amount >= 0 ? 'positive' : 'negative'}`} />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{e.label}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{e.date}</div>
                            </div>
                            <span className={e.amount >= 0 ? 'money-positive' : 'money-negative'} style={{ fontSize: 15 }}>
                                {e.amount >= 0 ? '+' : ''}{formatMoney(e.amount)}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <DayJournal kidId={kid.id} date={today} role="kid" kidName={kid.displayName || kid.name} />

            {/* Add/Edit modal */}
            {(showAdd || editTask) && (
                <Modal title={editTask ? t('daily.editTask') : t('daily.addTaskTitle')} onClose={() => { setShowAdd(false); setEditTask(null) }}>
                    <div className="col">
                        <div className="form-group">
                            <label>{t('tmpl.taskTitle')}</label>
                            <div className="form-group-row">
                                <input type="text" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)}
                                    placeholder={t('daily.whatTodo')} autoFocus onKeyDown={(e) => e.key === 'Enter' && handleSave()} />
                                <VoiceMicButton onAppend={(text) => setTaskTitle((prev) => prev ? prev + ' ' + text : text)} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>{t('tmpl.descLabel')}</label>
                            <div className="form-group-row">
                                <textarea value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} placeholder={t('daily.additionalDetails')} rows={3} />
                                <VoiceMicButton onAppend={(text) => setTaskDesc((prev) => prev ? prev + ' ' + text : text)} />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-ghost" onClick={() => { setShowAdd(false); setEditTask(null) }}>{t('common.cancel')}</button>
                            <button className="btn btn-primary" onClick={handleSave} disabled={!taskTitle.trim()}>{t('common.save')}</button>
                        </div>
                    </div>
                </Modal>
            )}

            <GoalModal
                key={editGoal?.id || (showGoalModal ? 'new-goal' : 'closed')}
                isOpen={showGoalModal}
                goal={editGoal}
                onClose={() => { setShowGoalModal(false); setEditGoal(null) }}
                onSave={handleSaveGoal}
                onDelete={handleDeleteGoal}
            />

            {showCelebration && <CelebrationOverlay kid={kid} reducedMotion={reducedMotion} onClose={() => setShowCelebration(false)} />}
        </div>
    )
}
