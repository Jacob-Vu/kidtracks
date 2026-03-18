import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, getISOWeek, getISOWeekYear, parseISO, subDays } from 'date-fns'
import useStore from '../store/useStore'
import { useFireActions } from '../hooks/useFirebaseSync'
import { useT } from '../i18n/I18nContext'
import { useAuth } from '../contexts/AuthContext'
import KidAccountModal from '../components/KidAccountModal'
import Modal from '../components/Modal'
import OnboardingWizard from '../components/OnboardingWizard'
import NotificationBanner from '../components/NotificationBanner'
import WeeklyReportModal from '../components/WeeklyReportModal'
import GoalCard from '../components/GoalCard'
import GoalModal from '../components/GoalModal'
import { formatMoney } from '../utils/format'
import { linkParentApple, linkParentEmailPassword, linkParentFacebook, linkParentGoogle, upgradeSimpleParentEmail } from '../firebase/auth'
import useStreak from '../hooks/useStreak'
import useNotifications from '../hooks/useNotifications'
import useWeeklyReport from '../hooks/useWeeklyReport'
import useGoalMilestones from '../hooks/useGoalMilestones'
import useBadges from '../hooks/useBadges'
import useLeaderboard from '../hooks/useLeaderboard'
import LeaderboardCard from '../components/LeaderboardCard'
import { trackGoalCreated, trackWeeklyReportCtaClicked } from '../hooks/useAnalytics'
import { GOAL_MILESTONES } from '../utils/goals'

const LS_WEEKLY_MODAL_SEEN = 'kidstrack-weekly-modal-seen'
const toWeekParam = (date) => `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`

function KidStreakBadge({ kid, dailyTasks, dayConfigs }) {
    const { currentStreak } = useStreak(kid.id, dailyTasks, dayConfigs)
    if (currentStreak === 0) return null
    return (
        <span className={`streak-badge${currentStreak >= 3 ? ' streak-badge--hot' : ''}`} style={{ fontSize: 12, marginTop: 4 }}>
            🔥 {currentStreak}
        </span>
    )
}

function KidReport({ kid, dailyTasks, period }) {
    const t = useT()
    const dates = useMemo(() => (
        Array.from({ length: period }, (_, i) =>
            format(subDays(new Date(), period - 1 - i), 'yyyy-MM-dd')
        )
    ), [period])

    const days = dates.map((date) => {
        const tasks = dailyTasks.filter((t) => t.kidId === kid.id && t.date === date)
        if (tasks.length === 0) return { date, rate: null }
        const done = tasks.filter((t) => t.status === 'completed').length
        return { date, rate: done / tasks.length, total: tasks.length, done }
    })

    const activeDays = days.filter((d) => d.rate !== null)
    const avgRate = activeDays.length > 0
        ? Math.round(activeDays.reduce((s, d) => s + d.rate, 0) / activeDays.length * 100)
        : null

    // Current streak: count from today backwards while rate === 1
    let streak = 0
    for (let i = days.length - 1; i >= 0; i--) {
        if (days[i].rate === 1) streak++
        else if (days[i].rate !== null) break
        // skip days with no tasks (null) — don't break streak
    }

    const getColor = (rate) => {
        if (rate === null) return 'var(--bg-card)'
        if (rate === 1) return 'var(--accent-green)'
        if (rate >= 0.5) return 'var(--accent-amber)'
        return 'var(--accent-red)'
    }

    return (
        <div className="report-kid-block">
            <div className="report-kid-header">
                <span style={{ fontSize: 24 }}>{kid.avatar}</span>
                <div>
                    <div style={{ fontWeight: 800, fontSize: 14 }}>{kid.displayName || kid.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {avgRate !== null
                            ? t('dash.reportAvg', { pct: avgRate })
                            : t('dash.reportNoData')
                        }
                        {streak > 0 && <span> · 🔥 {t('dash.reportDayStreak', { count: streak })}</span>}
                    </div>
                </div>
                {avgRate !== null && (
                    <div className="report-avg-badge" style={{
                        background: avgRate >= 80 ? 'rgba(16,185,129,0.15)' : avgRate >= 50 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)',
                        color: avgRate >= 80 ? 'var(--accent-green)' : avgRate >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)',
                    }}>
                        {avgRate}%
                    </div>
                )}
            </div>
            <div className="report-days-grid" style={{ gridTemplateColumns: `repeat(${period}, 1fr)` }}>
                {days.map((d) => (
                    <div
                        key={d.date}
                        className="report-day-cell"
                        style={{ background: getColor(d.rate) }}
                        title={d.rate !== null
                            ? `${d.date}: ${d.done}/${d.total} (${Math.round(d.rate * 100)}%)`
                            : d.date
                        }
                    />
                ))}
            </div>
            <div className="report-day-labels">
                {period === 7 ? (
                    days.map((d) => (
                        <span key={d.date} style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center' }}>
                            {format(new Date(d.date + 'T00:00:00'), 'EEE')}
                        </span>
                    ))
                ) : (
                    <>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                            {t('dash.reportLast30')}
                        </span>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'right' }}>
                            {t('dash.reportToday')}
                        </span>
                    </>
                )}
            </div>
        </div>
    )
}

const getPrimaryGoal = (goals, kidId) => {
    const kidGoals = goals
        .filter((goal) => goal.kidId === kidId)
        .sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')))
    return kidGoals.find((goal) => goal.status === 'active') || kidGoals[0] || null
}

function GoalMilestoneSync({ goal, balance, onPersist }) {
    useGoalMilestones(goal, balance, onPersist)
    return null
}

function BadgeSync({ kidId }) {
    useBadges(kidId)
    return null
}

export default function Dashboard() {
    const t = useT()
    const { user, profile, familyId, refreshProfile } = useAuth()
    const { kids, goals, dailyTasks, dayConfigs, ledger, isLoading } = useStore()
    const { deleteKid, addGoal, updateGoal, deleteGoal } = useFireActions()
    const navigate = useNavigate()
    const [showCreate, setShowCreate] = useState(false)
    const [editKid, setEditKid] = useState(null)
    const [deleteKidTarget, setDeleteKidTarget] = useState(null)
    const [showLinkModal, setShowLinkModal] = useState(false)
    const [linkBusy, setLinkBusy] = useState(false)
    const [linkError, setLinkError] = useState('')
    const [linkEmail, setLinkEmail] = useState('')
    const [linkPassword, setLinkPassword] = useState('')
    const [reportPeriod, setReportPeriod] = useState(7)
    const [showWeeklyModal, setShowWeeklyModal] = useState(false)
    const [goalKidId, setGoalKidId] = useState(null)
    const [editGoal, setEditGoal] = useState(null)
    const { enabled, permission, scheduleReminders } = useNotifications()
    const weeklyReport = useWeeklyReport(0)
    const leaderboardData = useLeaderboard(kids, dailyTasks, ledger, dayConfigs)
    const weeklyReportDate = useMemo(() => parseISO(weeklyReport.weekStart), [weeklyReport.weekStart])
    const weeklyReportWeek = useMemo(() => toWeekParam(weeklyReportDate), [weeklyReportDate])
    const weeklyHasData = weeklyReport.familyStats.totalTasks > 0
    const familyCompletionPct = useMemo(() => {
        const pct = (weeklyReport.familyStats.completionRate || 0) * 100
        return Math.round(pct * 10) / 10
    }, [weeklyReport.familyStats.completionRate])
    const weeklyStatsByKid = useMemo(() => {
        const map = new Map()
        weeklyReport.kidStats.forEach((item) => {
            map.set(item.kid.id, item)
        })
        return map
    }, [weeklyReport.kidStats])
    const weeklyBadgesByKid = useMemo(() => {
        const map = new Map()
        weeklyReport.badgeHighlights.perKid.forEach(({ kid, badges }) => {
            map.set(kid.id, badges.length)
        })
        return map
    }, [weeklyReport.badgeHighlights.perKid])

    useEffect(() => {
        if (enabled && permission === 'granted' && kids.length > 0) {
            scheduleReminders(kids, dailyTasks, dayConfigs)
        }
    }, [enabled, permission, kids, dailyTasks, dayConfigs, scheduleReminders])

    useEffect(() => {
        if (profile?.role !== 'parent' || !weeklyHasData) {
            setShowWeeklyModal(false)
            return
        }

        const isMonday = new Date().getDay() === 1
        let seenWeek = ''
        try {
            seenWeek = localStorage.getItem(LS_WEEKLY_MODAL_SEEN) || ''
        } catch {
            seenWeek = ''
        }

        const hasSeen = seenWeek === weeklyReportWeek
        const shouldOpen = (isMonday || !hasSeen) && !hasSeen
        setShowWeeklyModal(shouldOpen)
    }, [profile?.role, weeklyHasData, weeklyReportWeek])

    const markWeeklyModalSeen = useCallback(() => {
        try {
            localStorage.setItem(LS_WEEKLY_MODAL_SEEN, weeklyReportWeek)
        } catch {
            // ignore storage failures
        }
    }, [weeklyReportWeek])

    const handleCloseWeeklyModal = useCallback(() => {
        markWeeklyModalSeen()
        setShowWeeklyModal(false)
    }, [markWeeklyModalSeen])

    const handleOpenWeeklyReport = useCallback((via = 'button') => {
        markWeeklyModalSeen()
        setShowWeeklyModal(false)
        trackWeeklyReportCtaClicked(via)
        navigate(`/report/weekly?week=${weeklyReportWeek}&via=${via}`)
    }, [markWeeklyModalSeen, navigate, weeklyReportWeek])

    const providerIds = (user?.providerData || []).map((p) => p.providerId)
    const hasLinkedAccount = !profile?.simpleLogin && (
        !!user?.email || providerIds.some((id) => ['google.com', 'apple.com', 'facebook.com'].includes(id))
    )
    const shouldShowLinkPrompt = kids.length > 0 && !hasLinkedAccount

    const hasAnyTaskData = useMemo(() => {
        const cutoff = format(subDays(new Date(), reportPeriod - 1), 'yyyy-MM-dd')
        return dailyTasks.some((t) => t.date >= cutoff)
    }, [dailyTasks, reportPeriod])
    const topInsightText = useMemo(() => {
        const dayNameKeys = [
            'weekly.dayNameMon',
            'weekly.dayNameTue',
            'weekly.dayNameWed',
            'weekly.dayNameThu',
            'weekly.dayNameFri',
            'weekly.dayNameSat',
            'weekly.dayNameSun',
        ]
        if (weeklyReport.insights.mostPopularTask) return `${t('weekly.mostPopular')}: ${weeklyReport.insights.mostPopularTask}`
        if (weeklyReport.insights.hardestTask) return `${t('weekly.hardest')}: ${weeklyReport.insights.hardestTask}`
        if (weeklyReport.insights.bestDayIndex !== null) return `${t('weekly.bestDay')}: ${t(dayNameKeys[weeklyReport.insights.bestDayIndex])}`
        if (weeklyReport.insights.worstDayIndex !== null) return `${t('weekly.worstDay')}: ${t(dayNameKeys[weeklyReport.insights.worstDayIndex])}`
        return t('weekly.noTips')
    }, [weeklyReport.insights, t])
    const overviewCompletedTasks = weeklyReport.familyStats.completedTasks || 0
    const overviewTotalTasks = weeklyReport.familyStats.totalTasks || 0
    const overviewEarnings = useMemo(
        () => (weeklyReport.kidStats || []).reduce((sum, kidStat) => sum + (kidStat.weekEarnings || 0), 0),
        [weeklyReport.kidStats],
    )

    const handleLink = async (fn) => {
        setLinkBusy(true)
        setLinkError('')
        try {
            await fn()
            await refreshProfile()
            setShowLinkModal(false)
        } catch (err) {
            setLinkError(err.message)
        } finally {
            setLinkBusy(false)
        }
    }

    const handlePersistGoalMilestones = useCallback(async (goalId, updates) => {
        await updateGoal(goalId, updates)
    }, [updateGoal])

    const handleSaveGoal = useCallback(async (payload) => {
        if (editGoal) {
            await updateGoal(editGoal.id, payload)
        } else if (goalKidId) {
            await addGoal(goalKidId, payload.title, payload.targetAmount, payload.icon, payload.dueDate)
            trackGoalCreated(GOAL_MILESTONES.length)
        }
        setGoalKidId(null)
        setEditGoal(null)
    }, [editGoal, goalKidId, updateGoal, addGoal])

    const handleDeleteGoal = useCallback(async () => {
        if (!editGoal) return
        await deleteGoal(editGoal.id)
        setGoalKidId(null)
        setEditGoal(null)
    }, [editGoal, deleteGoal])

    return (
        <div className="dashboard-page">
            <NotificationBanner />
            <div className="page-header row between center dashboard-page-header">
                <div>
                    <h1 className="page-title">{t('dash.title')}</h1>
                    <p className="page-subtitle">{t('dash.subtitle')}</p>
                </div>
                <div className="row center dashboard-head-stats">
                    <span className="badge badge-purple">{t('dash.kidsSummaryProfiles', { count: kids.length || 0 })}</span>
                    {weeklyHasData && (
                        <span className="badge badge-green">
                            {t('weekly.modalCompletion', { pct: familyCompletionPct })}
                        </span>
                    )}
                </div>
            </div>

            {shouldShowLinkPrompt && (
                <div className="card dashboard-alert-card">
                    <div className="row between center wrap" style={{ gap: 10 }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 15 }}>{t('dash.linkPromptTitle')}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{t('dash.linkPromptDesc')}</div>
                        </div>
                        <button className="btn btn-amber" onClick={() => setShowLinkModal(true)}>
                            {t('dash.linkNow')}
                        </button>
                    </div>
                </div>
            )}

            {kids.length === 0 && !isLoading ? (
                <OnboardingWizard />
            ) : kids.length === 0 ? null : (
                <>
                    <div className="card dashboard-toolbar dashboard-section">
                        <div className="dashboard-toolbar__left">
                            <div style={{ fontWeight: 800, fontSize: 16 }}>{t('dash.primaryActionsTitle')}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t('dash.primaryActionsDesc')}</div>
                        </div>
                        <div className="dashboard-toolbar__actions">
                            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>{t('dash.addKid')}</button>
                            <button className="btn btn-secondary" onClick={() => navigate('/templates')}>{t('tmpl.title')}</button>
                            <button className="btn btn-secondary" onClick={() => handleOpenWeeklyReport('button')}>{t('weekly.openReportCta')}</button>
                        </div>
                    </div>

                    <div className="dashboard-top-grid">
                        <div className="card dashboard-overview-card">
                            <div className="row between center" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                                <div style={{ fontWeight: 800, fontSize: 16 }}>{t('dash.reportTitle')}</div>
                                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t('dash.kidsSummaryProfiles', { count: kids.length })}</span>
                            </div>
                            <div className="dashboard-overview-metrics">
                                <div className="dashboard-overview-metric">
                                    <div className="dashboard-overview-metric__label">
                                        {t('weekly.totalTasks', { done: overviewCompletedTasks, total: overviewTotalTasks })}
                                    </div>
                                </div>
                                <div className="dashboard-overview-metric">
                                    <div className="dashboard-overview-metric__label">
                                        {t('weekly.shareEarnings')}: {formatMoney(overviewEarnings)}
                                    </div>
                                </div>
                                <div className="dashboard-overview-metric">
                                    <div className="dashboard-overview-metric__label">
                                        {t('weekly.modalCompletion', { pct: familyCompletionPct })}
                                    </div>
                                </div>
                            </div>
                            <div className="card-grid">
                                {kids.map((kid) => (
                                    <div
                                        key={kid.id}
                                        className="kid-card"
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => navigate(`/daily/${kid.id}`)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault()
                                                navigate(`/daily/${kid.id}`)
                                            }
                                        }}
                                        aria-label={`Open ${kid.displayName || kid.name} daily tasks`}
                                    >
                                        <BadgeSync kidId={kid.id} />
                                        <span className="kid-avatar">{kid.avatar}</span>
                                        <div className="kid-name">{kid.displayName || kid.name}</div>
                                        {kid.username && (
                                            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>@{kid.username}</div>
                                        )}
                                        <div className="kid-balance">{formatMoney(kid.balance)}</div>
                                        <div className="kid-balance-label">{t('dash.pocketMoney')}</div>
                                        <KidStreakBadge kid={kid} dailyTasks={dailyTasks} dayConfigs={dayConfigs} />
                                        {weeklyHasData && (() => {
                                            const weeklyKid = weeklyStatsByKid.get(kid.id)
                                            const badgeCount = weeklyBadgesByKid.get(kid.id) || 0
                                            const completionPct = weeklyKid ? Math.round((weeklyKid.completionRate || 0) * 100) : 0
                                            return (
                                                <div className="kid-weekly-mini" onClick={(e) => e.stopPropagation()}>
                                                    <div className="kid-weekly-mini__grid">
                                                        <div className="kid-weekly-mini__item">
                                                            <span className="kid-weekly-mini__label">{t('weekly.completionLabel')}</span>
                                                            <span className="kid-weekly-mini__value">{completionPct}%</span>
                                                        </div>
                                                        <div className="kid-weekly-mini__item">
                                                            <span className="kid-weekly-mini__label">{t('weekly.shareNewBadges')}</span>
                                                            <span className="kid-weekly-mini__value">{badgeCount}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })()}
                                        <div className="row kid-card-actions">
                                            <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/profile?kidId=${kid.id}`) }}>{t('nav.profile')}</button>
                                            <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/daily/${kid.id}`) }}>{t('dash.tasks')}</button>
                                            <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/ledger/${kid.id}`) }}>{t('dash.ledger')}</button>
                                            <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setEditKid(kid) }} aria-label="Edit kid">✏️</button>
                                            <button className="btn btn-danger btn-sm" onClick={(e) => {
                                                e.stopPropagation()
                                                setDeleteKidTarget(kid)
                                            }} aria-label="Delete kid">🗑️</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="card dashboard-weekly-panel">
                            <div className="dashboard-weekly-panel__week">{t('weekly.modalWeek', { week: weeklyReportWeek })}</div>
                            <div className="dashboard-weekly-panel__title">{t('weekly.title')}</div>
                            <div className="dashboard-weekly-panel__completion">
                                {t('weekly.modalCompletion', { pct: familyCompletionPct })}
                            </div>
                            <div className="dashboard-weekly-panel__metrics">
                                <div className="dashboard-weekly-panel__metric">
                                    <span className="dashboard-weekly-panel__label">{t('weekly.totalTasks', { done: weeklyReport.familyStats.completedTasks, total: weeklyReport.familyStats.totalTasks })}</span>
                                </div>
                                <div className="dashboard-weekly-panel__metric">
                                    <span className="dashboard-weekly-panel__label">{t('weekly.badgesUnlockedCount', { count: weeklyReport.badgeHighlights.totalUnlocked || 0 })}</span>
                                </div>
                                <div className="dashboard-weekly-panel__metric">
                                    <span className="dashboard-weekly-panel__label">{topInsightText}</span>
                                </div>
                            </div>
                            <button className="btn btn-primary btn-sm" onClick={() => handleOpenWeeklyReport('button')}>
                                {t('weekly.openReportCta')}
                            </button>
                        </div>
                    </div>

                    <div className="card dashboard-section">
                        <div className="row between center" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                            <div style={{ fontWeight: 800, fontSize: 16 }}>🎯 {t('goal.parentSummaryTitle')}</div>
                            <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>{t('goal.parentSummaryDesc')}</span>
                        </div>
                        <div className="goal-grid">
                            {kids.map((kid) => {
                                const goal = getPrimaryGoal(goals, kid.id)
                                return (
                                    <div key={`goal-${kid.id}`}>
                                        <GoalMilestoneSync goal={goal} balance={kid.balance} onPersist={handlePersistGoalMilestones} />
                                        <GoalCard
                                            goal={goal}
                                            currentAmount={kid.balance}
                                            kidName={kid.displayName || kid.name}
                                            onCreate={() => { setGoalKidId(kid.id); setEditGoal(null) }}
                                            onEdit={() => { setGoalKidId(kid.id); setEditGoal(goal) }}
                                            onDelete={async () => {
                                                if (!goal) return
                                                await deleteGoal(goal.id)
                                            }}
                                        />
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    <div className="card dashboard-section">
                        <LeaderboardCard data={leaderboardData} />
                    </div>

                    {/* Trend */}
                    <div className="card dashboard-section dashboard-trend-card">
                        <div className="row between center dashboard-trend-head">
                            <div>
                                <div className="dashboard-trend-title">📈 {t('dash.reportTrendTitle')}</div>
                                <div className="dashboard-trend-subtitle">{t('dash.reportDesc')}</div>
                            </div>
                            <div className="chip-group">
                                <button className={`chip chip--sm${reportPeriod === 7 ? ' selected' : ''}`} onClick={() => setReportPeriod(7)}>
                                    {t('dash.report7d')}
                                </button>
                                <button className={`chip chip--sm${reportPeriod === 30 ? ' selected' : ''}`} onClick={() => setReportPeriod(30)}>
                                    {t('dash.report30d')}
                                </button>
                            </div>
                        </div>

                        {hasAnyTaskData ? (
                            <div className="report-grid">
                                {kids.map((kid) => (
                                    <KidReport
                                        key={kid.id}
                                        kid={kid}
                                        dailyTasks={dailyTasks}
                                        period={reportPeriod}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                                {t('dash.reportEmpty')}
                            </div>
                        )}

                    </div>
                </>
            )}

            {showCreate && <KidAccountModal onClose={() => setShowCreate(false)} />}
            {editKid && <KidAccountModal kid={editKid} onClose={() => setEditKid(null)} />}
            {deleteKidTarget && (
                <Modal title={t('common.delete')} onClose={() => setDeleteKidTarget(null)}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                        {t('dash.removeConfirm', { name: deleteKidTarget.displayName || deleteKidTarget.name })}
                    </p>
                    <div className="modal-footer">
                        <button className="btn btn-ghost" onClick={() => setDeleteKidTarget(null)}>{t('common.cancel')}</button>
                        <button className="btn btn-danger" onClick={() => {
                            deleteKid(deleteKidTarget.id)
                            setDeleteKidTarget(null)
                        }}>
                            {t('common.delete')}
                        </button>
                    </div>
                </Modal>
            )}
            {showLinkModal && (
                <Modal title={t('dash.linkPromptTitle')} onClose={() => setShowLinkModal(false)}>
                    <div className="col" style={{ gap: 10 }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                            {t('dash.linkPromptDesc')}
                        </p>
                        {linkError && <div className="login-error">{linkError}</div>}
                        <button className="btn btn-ghost" disabled={linkBusy} onClick={() => handleLink(() => linkParentGoogle(familyId))}>
                            {t('dash.linkGoogle')}
                        </button>
                        <button className="btn btn-ghost" disabled={linkBusy} onClick={() => handleLink(() => linkParentApple(familyId))}>
                            {t('dash.linkApple')}
                        </button>
                        <button className="btn btn-ghost" disabled={linkBusy} onClick={() => handleLink(() => linkParentFacebook(familyId))}>
                            {t('dash.linkFacebook')}
                        </button>
                        <div className="divider" />
                        <div className="form-group">
                            <label>{t('dash.linkEmailLabel')}</label>
                            <input type="email" value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} placeholder={t('login.emailPlaceholder')} />
                        </div>
                        <div className="form-group">
                            <label>{t('dash.linkPasswordLabel')}</label>
                            <input type="password" value={linkPassword} onChange={(e) => setLinkPassword(e.target.value)} placeholder="••••••••" />
                        </div>
                        <button
                            className="btn btn-primary"
                            disabled={linkBusy || !linkEmail.trim() || linkPassword.length < 6}
                            onClick={() => handleLink(() =>
                                profile?.simpleLogin && profile?.simpleUsername
                                    ? upgradeSimpleParentEmail(profile.simpleUsername, linkEmail.trim(), linkPassword, familyId)
                                    : linkParentEmailPassword(linkEmail.trim(), linkPassword, familyId)
                            )}
                        >
                            {t('dash.linkEmailBtn')}
                        </button>
                    </div>
                </Modal>
            )}
            <GoalModal
                key={editGoal?.id || goalKidId || 'no-goal-modal'}
                isOpen={!!goalKidId}
                goal={editGoal}
                kidName={kids.find((kid) => kid.id === goalKidId)?.displayName || kids.find((kid) => kid.id === goalKidId)?.name || ''}
                onClose={() => { setGoalKidId(null); setEditGoal(null) }}
                onSave={handleSaveGoal}
                onDelete={handleDeleteGoal}
            />
            <WeeklyReportModal
                isOpen={showWeeklyModal}
                onClose={handleCloseWeeklyModal}
                onOpenReport={() => handleOpenWeeklyReport('modal')}
                weekKey={weeklyReportWeek}
                weekStart={weeklyReport.weekStart}
                weekEnd={weeklyReport.weekEnd}
                familyStats={weeklyReport.familyStats}
            />
        </div>
    )
}

