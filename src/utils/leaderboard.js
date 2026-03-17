import { format, parseISO, subDays } from 'date-fns'

export const LEADERBOARD_MIN_TASKS = 5
export const LEADERBOARD_MIN_ACTIVE_DAYS = 2

const toDateKey = (value) => format(value, 'yyyy-MM-dd')

const buildWindowDates = (referenceDate, days) => (
    Array.from({ length: days }, (_, idx) => toDateKey(subDays(referenceDate, days - 1 - idx)))
)

const computeCurrentStreak = (kidId, dailyTasks, dayConfigs, referenceDate) => {
    if (!kidId) return 0

    const perfectDates = new Set()
    dayConfigs.forEach((cfg) => {
        if (cfg.kidId !== kidId || !cfg.isFinalized) return
        const tasks = dailyTasks.filter((task) => task.kidId === kidId && task.date === cfg.date)
        if (tasks.length > 0 && tasks.every((task) => task.status === 'completed')) {
            perfectDates.add(cfg.date)
        }
    })

    let streak = 0
    let cursor = toDateKey(subDays(referenceDate, 1))
    while (perfectDates.has(cursor)) {
        streak += 1
        cursor = toDateKey(subDays(parseISO(cursor), 1))
    }

    return streak
}

const summarizeKidWindow = (kid, datesSet, dailyTasks, ledger, dayConfigs, referenceDate) => {
    const tasks = dailyTasks.filter((task) => task.kidId === kid.id && datesSet.has(task.date))
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((task) => task.status === 'completed').length
    const activeDays = new Set(tasks.map((task) => task.date)).size
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : null

    const weeklyEarnings = ledger
        .filter((entry) => entry.kidId === kid.id && datesSet.has(entry.date))
        .reduce((sum, entry) => sum + (Number(entry.amount) || 0), 0)

    return {
        kidId: kid.id,
        kidName: kid.displayName || kid.name,
        kidAvatar: kid.avatar,
        completionRate,
        totalTasks,
        completedTasks,
        activeDays,
        weeklyEarnings,
        currentStreak: computeCurrentStreak(kid.id, dailyTasks, dayConfigs, referenceDate),
    }
}

const sortRankings = (a, b) => {
    const rateA = a.completionRate ?? -1
    const rateB = b.completionRate ?? -1
    if (rateB !== rateA) return rateB - rateA
    if (b.weeklyEarnings !== a.weeklyEarnings) return b.weeklyEarnings - a.weeklyEarnings
    if (b.currentStreak !== a.currentStreak) return b.currentStreak - a.currentStreak
    return a.kidName.localeCompare(b.kidName)
}

export function computeWeeklyLeaderboard(
    kids,
    dailyTasks,
    ledger,
    dayConfigs,
    {
        referenceDate = new Date(),
        windowDays = 7,
        minTasks = LEADERBOARD_MIN_TASKS,
        minActiveDays = LEADERBOARD_MIN_ACTIVE_DAYS,
    } = {},
) {
    if (!Array.isArray(kids) || kids.length === 0) {
        return {
            fairnessGate: false,
            rankings: [],
            eligibleCount: 0,
            totalKids: 0,
            mostImprovedKidId: null,
            streakStarKidId: null,
            windowDays,
        }
    }

    const dates = buildWindowDates(referenceDate, windowDays)
    const datesSet = new Set(dates)

    const prevDates = buildWindowDates(subDays(referenceDate, windowDays), windowDays)
    const prevDatesSet = new Set(prevDates)

    const summaries = kids.map((kid) => {
        const current = summarizeKidWindow(kid, datesSet, dailyTasks, ledger, dayConfigs, referenceDate)
        const previous = summarizeKidWindow(kid, prevDatesSet, dailyTasks, ledger, dayConfigs, subDays(referenceDate, windowDays))

        const improvement =
            current.completionRate !== null && previous.completionRate !== null
                ? current.completionRate - previous.completionRate
                : null

        return {
            ...current,
            prevCompletionRate: previous.completionRate,
            completionImprovement: improvement,
            eligible: current.totalTasks >= minTasks && current.activeDays >= minActiveDays,
        }
    })

    const rankings = summaries
        .filter((entry) => entry.eligible)
        .sort(sortRankings)
        .map((entry, index) => ({ ...entry, rank: index + 1 }))

    const fairnessGate = rankings.length >= 2

    const mostImproved = rankings
        .filter((entry) => entry.completionImprovement !== null && entry.completionImprovement > 0)
        .sort((a, b) => b.completionImprovement - a.completionImprovement)[0] || null

    const streakStar = rankings
        .filter((entry) => entry.currentStreak > 0)
        .sort((a, b) => b.currentStreak - a.currentStreak || sortRankings(a, b))[0] || null

    return {
        fairnessGate,
        rankings,
        eligibleCount: rankings.length,
        totalKids: kids.length,
        mostImprovedKidId: mostImproved?.kidId || null,
        streakStarKidId: streakStar?.kidId || null,
        windowDays,
    }
}
