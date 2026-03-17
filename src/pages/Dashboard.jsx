import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, getISOWeek, getISOWeekYear, parseISO, subDays } from 'date-fns'
import useStore from '../store/useStore'
import { useFireActions } from '../hooks/useFirebaseSync'
import { useT, useLang } from '../i18n/I18nContext'
import { useAuth } from '../contexts/AuthContext'
import KidAccountModal from '../components/KidAccountModal'
import Modal from '../components/Modal'
import OnboardingWizard from '../components/OnboardingWizard'
import NotificationBanner from '../components/NotificationBanner'
import NotificationSettings from '../components/NotificationSettings'
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

function KidReport({ kid, dailyTasks, period, lang }) {
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
                            ? `${lang === 'vi' ? 'TB' : 'Avg'} ${avgRate}%`
                            : (lang === 'vi' ? 'Chưa có dữ liệu' : 'No data yet')
                        }
                        {streak > 0 && <> · 🔥 {streak} {lang === 'vi' ? 'ngày' : 'day streak'}</>}
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
                            {lang === 'vi' ? '30 ngày qua' : 'Last 30 days'}
                        </span>
                        <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'right' }}>
                            {lang === 'vi' ? 'Hôm nay' : 'Today'}
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
    const { lang } = useLang()
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

    const handleOpenWeeklyReport = useCallback(() => {
        markWeeklyModalSeen()
        setShowWeeklyModal(false)
        navigate(`/report/weekly?week=${weeklyReportWeek}`)
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
        <div>
            <NotificationBanner />
            <div className="page-header row between center">
                <div>
                    <h1 className="page-title">{t('dash.title')}</h1>
                    <p className="page-subtitle">{t('dash.subtitle')}</p>
                </div>
                <div className="row center" style={{ gap: 8, flexWrap: 'wrap' }}>
                    <button className="btn btn-ghost" onClick={() => navigate('/report/weekly')}>
                        {t('weekly.openReportCta')}
                    </button>
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>{t('dash.addKid')}</button>
                </div>
            </div>

            {shouldShowLinkPrompt && (
                <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(245,158,11,0.35)' }}>
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
                                <div className="row" style={{ marginTop: 16, justifyContent: 'center', gap: 8 }}>
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

                    <div className="card" style={{ marginTop: 24 }}>
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

                    <div className="card" style={{ marginTop: 24 }}>
                        <LeaderboardCard data={leaderboardData} />
                    </div>

                    {/* ── Performance Report ── */}
                    <div className="card" style={{ marginTop: 32 }}>
                        <div className="row between center" style={{ marginBottom: 16 }}>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 16 }}>📊 {t('dash.reportTitle')}</div>
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{t('dash.reportDesc')}</div>
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
                                        lang={lang}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                                {t('dash.reportEmpty')}
                            </div>
                        )}

                        {/* Legend */}
                        <div className="report-legend">
                            <span className="report-legend-dot" style={{ background: 'var(--accent-green)' }} /> {lang === 'vi' ? '100%' : '100%'}
                            <span className="report-legend-dot" style={{ background: 'var(--accent-amber)', marginLeft: 12 }} /> {lang === 'vi' ? 'Một phần' : 'Partial'}
                            <span className="report-legend-dot" style={{ background: 'var(--accent-red)', marginLeft: 12 }} /> {lang === 'vi' ? '0%' : '0%'}
                            <span className="report-legend-dot" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', marginLeft: 12 }} /> {lang === 'vi' ? 'Không có' : 'No tasks'}
                        </div>
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
                onOpenReport={handleOpenWeeklyReport}
                weekKey={weeklyReportWeek}
                weekStart={weeklyReport.weekStart}
                weekEnd={weeklyReport.weekEnd}
                familyStats={weeklyReport.familyStats}
            />
        </div>
    )
}


