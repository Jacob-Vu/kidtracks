import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    addWeeks,
    differenceInCalendarWeeks,
    format,
    getISOWeek,
    getISOWeekYear,
    getISOWeeksInYear,
    parseISO,
    startOfISOWeek,
    subWeeks,
} from 'date-fns'
import { useT } from '../i18n/I18nContext'
import useWeeklyReport from '../hooks/useWeeklyReport'
import { formatMoney } from '../utils/format'

const toWeekParam = (date) => `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`

const parseWeekParam = (value) => {
    if (!value) return null
    const match = /^(\d{4})-W(\d{2})$/.exec(value)
    if (!match) return null

    const year = Number(match[1])
    const week = Number(match[2])
    if (!Number.isInteger(year) || !Number.isInteger(week) || week < 1) return null

    const weekAnchor = new Date(year, 0, 4)
    const maxWeeks = getISOWeeksInYear(weekAnchor)
    if (week > maxWeeks) return null

    return addWeeks(startOfISOWeek(weekAnchor), week - 1)
}

const clampToCurrentWeek = (date, currentWeekStart) => (date > currentWeekStart ? currentWeekStart : date)

function CircularProgress({ rate, size = 130, label }) {
    const r = 48
    const cx = size / 2
    const cy = size / 2
    const circumference = 2 * Math.PI * r
    const offset = circumference * (1 - Math.min(Math.max(rate, 0), 1))
    const pct = Math.round(rate * 100)

    const color = pct >= 80 ? 'var(--accent-green)' : pct >= 50 ? 'var(--accent-amber)' : 'var(--accent-red)'

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="weekly-hero-circle">
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
            <circle
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
            <text x={cx} y={cy - 5} textAnchor="middle" fontSize="26" fontWeight="800" fill="white">{pct}%</text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.45)">{label}</text>
        </svg>
    )
}

function TrendBadge({ trend, t }) {
    if (trend === null || trend === undefined) return null
    const pct = Math.round(Math.abs(trend) * 100)
    if (pct === 0) return <span className="weekly-trend-badge weekly-trend-badge--flat">{t('weekly.trendSame')}</span>
    if (trend > 0) return <span className="weekly-trend-badge weekly-trend-badge--up">{t('weekly.trendUp', { pct })}</span>
    return <span className="weekly-trend-badge weekly-trend-badge--down">{t('weekly.trendDown', { pct })}</span>
}

function HeatmapRow({ dailyBreakdown, dayLabels }) {
    const getColor = (rate) => {
        if (rate === null) return 'var(--bg-card)'
        if (rate === 1) return 'var(--accent-green)'
        if (rate >= 0.5) return 'var(--accent-amber)'
        return 'var(--accent-red)'
    }

    return (
        <div>
            <div className="weekly-heatmap">
                {dailyBreakdown.map((d, i) => (
                    <div
                        key={i}
                        className="weekly-heatmap-dot"
                        style={{ background: getColor(d.rate), border: '1px solid var(--border-light)' }}
                        title={d.rate !== null
                            ? `${d.date}: ${d.completed}/${d.total} (${Math.round(d.rate * 100)}%)`
                            : d.date}
                    />
                ))}
            </div>
            <div className="weekly-heatmap-labels">
                {dayLabels.map((l, i) => (
                    <span key={i} className="weekly-heatmap-label">{l}</span>
                ))}
            </div>
        </div>
    )
}

function TaskBarRow({ task }) {
    const pct = task.daysTotal > 0 ? (task.daysCompleted / task.daysTotal) * 100 : 0
    return (
        <div className="weekly-task-bar">
            <div className="weekly-task-bar-label" title={task.title}>{task.title}</div>
            <div className="weekly-task-bar-track">
                <div className="weekly-task-bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="weekly-task-bar-count">{task.daysCompleted}/{task.daysTotal}</div>
        </div>
    )
}

export default function WeeklyReport() {
    const t = useT()
    const navigate = useNavigate()
    const [searchParams, setSearchParams] = useSearchParams()

    const defaultWeekStart = useMemo(() => startOfISOWeek(subWeeks(new Date(), 1)), [])
    const currentWeekStart = useMemo(() => startOfISOWeek(new Date()), [])

    const [selectedWeekStart, setSelectedWeekStart] = useState(() =>
        clampToCurrentWeek(parseWeekParam(searchParams.get('week')) || defaultWeekStart, currentWeekStart),
    )

    const queryWeek = searchParams.get('week')

    useEffect(() => {
        const parsed = parseWeekParam(queryWeek)
        const resolved = clampToCurrentWeek(parsed || defaultWeekStart, currentWeekStart)
        const resolvedParam = toWeekParam(resolved)
        const selectedParam = toWeekParam(selectedWeekStart)

        if (queryWeek !== resolvedParam) {
            setSearchParams({ week: resolvedParam }, { replace: true })
        }
        if (selectedParam !== resolvedParam) {
            setSelectedWeekStart(resolved)
        }
    }, [queryWeek, defaultWeekStart, currentWeekStart, selectedWeekStart, setSearchParams])

    const weekOffset = useMemo(
        () => differenceInCalendarWeeks(selectedWeekStart, defaultWeekStart, { weekStartsOn: 1 }),
        [selectedWeekStart, defaultWeekStart],
    )

    const report = useWeeklyReport(weekOffset)
    const { weekStart, weekEnd, familyStats, kidStats, insights, earnings, tips } = report

    const weekNum = getISOWeek(parseISO(weekStart))
    const weekYear = getISOWeekYear(parseISO(weekStart))
    const dateRange = `${format(parseISO(weekStart), 'MMM d')} – ${format(parseISO(weekEnd), 'MMM d, yyyy')}`
    const hasData = familyStats.totalTasks > 0
    const canGoNext = selectedWeekStart < currentWeekStart

    const dayLabels = [
        t('weekly.dayShortMon'),
        t('weekly.dayShortTue'),
        t('weekly.dayShortWed'),
        t('weekly.dayShortThu'),
        t('weekly.dayShortFri'),
        t('weekly.dayShortSat'),
        t('weekly.dayShortSun'),
    ]

    const dayNameKeys = [
        'weekly.dayNameMon',
        'weekly.dayNameTue',
        'weekly.dayNameWed',
        'weekly.dayNameThu',
        'weekly.dayNameFri',
        'weekly.dayNameSat',
        'weekly.dayNameSun',
    ]

    const moveWeek = (delta) => {
        const next = clampToCurrentWeek(addWeeks(selectedWeekStart, delta), currentWeekStart)
        setSelectedWeekStart(next)
        setSearchParams({ week: toWeekParam(next) })
    }

    return (
        <div className="weekly-report">
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')} style={{ marginBottom: 16 }}>
                ← {t('common.back')}
            </button>

            <div className="page-header" style={{ marginBottom: 20 }}>
                <h1 className="page-title">{t('weekly.title')}</h1>
                <p className="page-subtitle">{dateRange}</p>
            </div>

            <div className="weekly-week-nav">
                <button
                    className="weekly-week-nav-btn"
                    onClick={() => moveWeek(-1)}
                    aria-label={t('weekly.navPrevAria')}
                >
                    ‹
                </button>
                <div className="weekly-week-nav-label">
                    {t('weekly.weekNum', { num: weekNum, year: weekYear })}
                </div>
                <button
                    className="weekly-week-nav-btn"
                    onClick={() => moveWeek(1)}
                    disabled={!canGoNext}
                    aria-label={t('weekly.navNextAria')}
                >
                    ›
                </button>
            </div>

            {!hasData ? (
                <div className="card weekly-no-data">
                    {t('weekly.noData')}
                </div>
            ) : (
                <>
                    <div className="weekly-hero">
                        <div className="weekly-hero-date">{dateRange}</div>
                        <CircularProgress rate={familyStats.completionRate} label={t('weekly.completionLabel')} />
                        <div className="weekly-hero-summary-row">
                            <TrendBadge trend={familyStats.trend} t={t} />
                            <span className="weekly-hero-summary-text">
                                {t('weekly.totalTasks', { done: familyStats.completedTasks, total: familyStats.totalTasks })}
                            </span>
                        </div>
                    </div>

                    <div className="weekly-section-title">{t('weekly.kidsSection')}</div>
                    {kidStats.map((ks) => (
                        <div key={ks.kid.id} className="weekly-kid-card">
                            <div className="weekly-kid-header">
                                <span className="weekly-kid-avatar">{ks.kid.avatar}</span>
                                <div className="weekly-kid-content">
                                    <div className="weekly-kid-name">{ks.kid.displayName || ks.kid.name}</div>
                                    <div className="weekly-kid-meta">
                                        <span className={`weekly-kid-rate ${ks.completionRate >= 0.8
                                            ? 'weekly-kid-rate--good'
                                            : ks.completionRate >= 0.5
                                                ? 'weekly-kid-rate--mid'
                                                : 'weekly-kid-rate--low'
                                            }`}>
                                            {Math.round(ks.completionRate * 100)}%
                                        </span>
                                        <TrendBadge trend={ks.trend} t={t} />
                                        {ks.streak > 0 && (
                                            <span className={`streak-badge${ks.streak >= 3 ? ' streak-badge--hot' : ''}`}>
                                                🔥 {ks.streak}
                                            </span>
                                        )}
                                        {ks.weekEarnings !== 0 && (
                                            <span className={`weekly-kid-earnings ${ks.weekEarnings >= 0 ? 'weekly-kid-earnings--up' : 'weekly-kid-earnings--down'}`}>
                                                {ks.weekEarnings >= 0 ? '+' : ''}{formatMoney(ks.weekEarnings)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <HeatmapRow dailyBreakdown={ks.dailyBreakdown} dayLabels={dayLabels} />

                            {(ks.bestTask || ks.worstTask) && (
                                <div className="weekly-kid-badges">
                                    {ks.bestTask && (
                                        <span className="weekly-task-badge weekly-task-badge--best">⭐ {ks.bestTask.title}</span>
                                    )}
                                    {ks.worstTask && ks.worstTask.title !== ks.bestTask?.title && (
                                        <span className="weekly-task-badge weekly-task-badge--worst">⚠️ {ks.worstTask.title}</span>
                                    )}
                                </div>
                            )}

                            {ks.taskBreakdown.length > 0 && (
                                <div className="weekly-task-bars-wrap">
                                    {ks.taskBreakdown.map((tb, i) => (
                                        <TaskBarRow key={i} task={tb} />
                                    ))}
                                </div>
                            )}

                            <div className="weekly-kid-actions">
                                <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/daily/${ks.kid.id}`)}>
                                    📋 {t('dash.tasks')}
                                </button>
                            </div>
                        </div>
                    ))}

                    {(insights.mostPopularTask || insights.hardestTask || insights.bestDayIndex !== null || insights.worstDayIndex !== null) && (
                        <>
                            <div className="weekly-section-title weekly-section-title--spaced">{t('weekly.insightsSection')}</div>

                            {insights.mostPopularTask && (
                                <div className="weekly-insight-card">
                                    <span className="weekly-insight-icon">🏆</span>
                                    <div>
                                        <div className="weekly-insight-label">{t('weekly.mostPopular')}</div>
                                        <div className="weekly-insight-value">{insights.mostPopularTask}</div>
                                    </div>
                                </div>
                            )}

                            {insights.hardestTask && (
                                <div className="weekly-insight-card">
                                    <span className="weekly-insight-icon">📉</span>
                                    <div>
                                        <div className="weekly-insight-label">{t('weekly.hardest')}</div>
                                        <div className="weekly-insight-value">{insights.hardestTask}</div>
                                    </div>
                                </div>
                            )}

                            {insights.bestDayIndex !== null && (
                                <div className="weekly-insight-card">
                                    <span className="weekly-insight-icon">🎯</span>
                                    <div>
                                        <div className="weekly-insight-label">{t('weekly.bestDay')}</div>
                                        <div className="weekly-insight-value">{t(dayNameKeys[insights.bestDayIndex])}</div>
                                    </div>
                                </div>
                            )}

                            {insights.worstDayIndex !== null && (
                                <div className="weekly-insight-card">
                                    <span className="weekly-insight-icon">😴</span>
                                    <div>
                                        <div className="weekly-insight-label">{t('weekly.worstDay')}</div>
                                        <div className="weekly-insight-value">{t(dayNameKeys[insights.worstDayIndex])}</div>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    <div className="weekly-section-title weekly-section-title--spaced">{t('weekly.earningsSection')}</div>
                    <div className="weekly-earnings">
                        {earnings.perKid.map(({ kid, amount }) => (
                            <div key={kid.id} className="weekly-earnings-row">
                                <div className="weekly-earnings-kid">
                                    <span className="weekly-earnings-kid-avatar">{kid.avatar}</span>
                                    <span className="weekly-earnings-kid-name">{kid.displayName || kid.name}</span>
                                </div>
                                <div className="weekly-earnings-values">
                                    <span className={`weekly-earnings-amount ${amount > 0
                                        ? 'weekly-earnings-amount--up'
                                        : amount < 0
                                            ? 'weekly-earnings-amount--down'
                                            : 'weekly-earnings-amount--flat'
                                        }`}>
                                        {amount > 0 ? '+' : ''}{formatMoney(amount)}
                                    </span>
                                    <span className="weekly-earnings-balance">
                                        {t('weekly.currentBalance')}: {formatMoney(kid.balance)}
                                    </span>
                                </div>
                            </div>
                        ))}

                        <div className="weekly-earnings-row weekly-earnings-row--total">
                            <span>{t('weekly.familyTotal')}</span>
                            <span className={`weekly-earnings-family ${earnings.familyTotal > 0
                                ? 'weekly-earnings-family--up'
                                : earnings.familyTotal < 0
                                    ? 'weekly-earnings-family--down'
                                    : 'weekly-earnings-family--flat'
                                }`}>
                                {earnings.familyTotal > 0 ? '+' : ''}{formatMoney(earnings.familyTotal)}
                            </span>
                        </div>
                    </div>

                    <div className="weekly-section-title">{t('weekly.tipsSection')}</div>
                    {tips.length === 0 ? (
                        <div className="weekly-tip-card">
                            <span className="weekly-tip-icon">✨</span>
                            <div className="weekly-tip-text">{t('weekly.noTips')}</div>
                        </div>
                    ) : (
                        tips.map((tip, i) => (
                            <div key={i} className="weekly-tip-card">
                                <span className="weekly-tip-icon">{tip.icon}</span>
                                <div className="weekly-tip-text">{tip.text}</div>
                            </div>
                        ))
                    )}
                </>
            )}
        </div>
    )
}
