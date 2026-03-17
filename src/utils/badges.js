import { getISOWeek, getISOWeekYear, parseISO } from 'date-fns'

export const BADGE_DEFINITIONS = [
    {
        code: 'consistency_3_day_streak',
        icon: '3D',
        nameKey: 'badge.consistency3Name',
        descKey: 'badge.consistency3Desc',
        categoryKey: 'badge.categoryConsistency',
    },
    {
        code: 'consistency_7_day_streak',
        icon: '7D',
        nameKey: 'badge.consistency7Name',
        descKey: 'badge.consistency7Desc',
        categoryKey: 'badge.categoryConsistency',
    },
    {
        code: 'completion_first_10_tasks',
        icon: '10X',
        nameKey: 'badge.completion10Name',
        descKey: 'badge.completion10Desc',
        categoryKey: 'badge.categoryCompletion',
    },
    {
        code: 'completion_perfect_week',
        icon: 'WEEK',
        nameKey: 'badge.perfectWeekName',
        descKey: 'badge.perfectWeekDesc',
        categoryKey: 'badge.categoryCompletion',
    },
    {
        code: 'finance_first_goal_reached',
        icon: 'GOAL',
        nameKey: 'badge.financeGoalName',
        descKey: 'badge.financeGoalDesc',
        categoryKey: 'badge.categoryFinance',
    },
    {
        code: 'responsibility_morning_evening',
        icon: 'AMPM',
        nameKey: 'badge.routineName',
        descKey: 'badge.routineDesc',
        categoryKey: 'badge.categoryResponsibility',
    },
]

const BADGE_MAP = new Map(BADGE_DEFINITIONS.map((def) => [def.code, def]))

const toDateOnly = (value) => {
    if (!value) return null
    const text = String(value)
    return text.length >= 10 ? text.slice(0, 10) : null
}

const normalizeText = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const sortDateAsc = (a, b) => a.localeCompare(b)

const sortByUnlockedRecent = (a, b) => {
    const dA = a.unlockedAt || ''
    const dB = b.unlockedAt || ''
    if (dA !== dB) return dB.localeCompare(dA)
    return a.code.localeCompare(b.code)
}

const computePerfectDates = (kidId, dailyTasks, dayConfigs) => {
    const tasksByDate = new Map()

    for (const task of dailyTasks) {
        if (task.kidId !== kidId) continue
        if (!tasksByDate.has(task.date)) tasksByDate.set(task.date, [])
        tasksByDate.get(task.date).push(task)
    }

    const perfectDates = []
    for (const config of dayConfigs) {
        if (config.kidId !== kidId || !config.isFinalized) continue
        const tasks = tasksByDate.get(config.date) || []
        if (tasks.length === 0) continue
        if (tasks.every((task) => task.status === 'completed')) {
            perfectDates.push(config.date)
        }
    }

    perfectDates.sort(sortDateAsc)
    return { perfectDates, tasksByDate }
}

const computeStreakReachedDate = (perfectDates, targetRun) => {
    if (perfectDates.length === 0) return null
    let run = 0
    let prevTime = null

    for (const date of perfectDates) {
        const time = parseISO(date).getTime()
        if (Number.isNaN(time)) continue

        if (prevTime !== null && time - prevTime === 86400000) {
            run += 1
        } else {
            run = 1
        }

        if (run >= targetRun) return date
        prevTime = time
    }

    return null
}

const computeFirstNCompletedTaskDate = (kidId, dailyTasks, count) => {
    const completed = dailyTasks
        .filter((task) => task.kidId === kidId && task.status === 'completed' && task.date)
        .sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date)
            return String(a.id || '').localeCompare(String(b.id || ''))
        })

    if (completed.length < count) return null
    return completed[count - 1].date
}

const computePerfectWeekDate = (perfectDates) => {
    const byWeek = new Map()

    for (const date of perfectDates) {
        const parsed = parseISO(date)
        if (Number.isNaN(parsed.getTime())) continue
        const weekKey = `${getISOWeekYear(parsed)}-W${String(getISOWeek(parsed)).padStart(2, '0')}`
        if (!byWeek.has(weekKey)) byWeek.set(weekKey, new Set())
        byWeek.get(weekKey).add(date)
    }

    for (const [, days] of byWeek) {
        if (days.size === 7) {
            return Array.from(days).sort(sortDateAsc)[6]
        }
    }

    return null
}

const computeFirstGoalReachedDate = (kidId, goals) => {
    const completedGoals = goals
        .filter((goal) => goal.kidId === kidId && goal.status === 'completed')
        .map((goal) => toDateOnly(goal.completedAt) || toDateOnly(goal.createdAt))
        .filter(Boolean)
        .sort(sortDateAsc)

    return completedGoals[0] || null
}

const computeMorningEveningDate = (tasksByDate) => {
    const morningTokens = ['morning', 'sang']
    const eveningTokens = ['evening', 'toi']

    for (const [date, tasks] of Array.from(tasksByDate.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
        let hasMorning = false
        let hasEvening = false

        for (const task of tasks) {
            if (task.status !== 'completed') continue
            const text = normalizeText(task.title)
            if (!hasMorning && morningTokens.some((token) => text.includes(token))) hasMorning = true
            if (!hasEvening && eveningTokens.some((token) => text.includes(token))) hasEvening = true
            if (hasMorning && hasEvening) return date
        }
    }

    return null
}

export const getBadgeDefinition = (code) => BADGE_MAP.get(code) || null

export const getBadgeWithDefinition = (badge) => ({
    ...badge,
    definition: getBadgeDefinition(badge.code),
})

export function evaluateBadgesForKid({ kidId, dailyTasks, dayConfigs, goals, badges }) {
    if (!kidId) {
        return {
            unlocked: [],
            locked: BADGE_DEFINITIONS,
            recentUnlocked: [],
            newlyUnlocked: [],
        }
    }

    const existingByCode = new Map(
        badges
            .filter((badge) => badge.kidId === kidId)
            .map((badge) => [badge.code, badge]),
    )

    const { perfectDates, tasksByDate } = computePerfectDates(kidId, dailyTasks, dayConfigs)

    const unlockByCode = {
        consistency_3_day_streak: computeStreakReachedDate(perfectDates, 3),
        consistency_7_day_streak: computeStreakReachedDate(perfectDates, 7),
        completion_first_10_tasks: computeFirstNCompletedTaskDate(kidId, dailyTasks, 10),
        completion_perfect_week: computePerfectWeekDate(perfectDates),
        finance_first_goal_reached: computeFirstGoalReachedDate(kidId, goals),
        responsibility_morning_evening: computeMorningEveningDate(tasksByDate),
    }

    const unlocked = []
    const locked = []
    const newlyUnlocked = []

    for (const definition of BADGE_DEFINITIONS) {
        const reachedAt = unlockByCode[definition.code]
        const existing = existingByCode.get(definition.code)

        if (reachedAt || existing) {
            const unlockedAt = existing?.unlockedAt || reachedAt
            const badge = {
                id: existing?.id || `${kidId}_${definition.code}`,
                kidId,
                code: definition.code,
                unlockedAt,
                definition,
            }
            unlocked.push(badge)
            if (!existing && reachedAt) {
                newlyUnlocked.push(badge)
            }
        } else {
            locked.push(definition)
        }
    }

    unlocked.sort(sortByUnlockedRecent)

    return {
        unlocked,
        locked,
        recentUnlocked: unlocked.slice(0, 3),
        newlyUnlocked,
    }
}
