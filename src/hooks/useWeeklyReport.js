import { useMemo } from 'react'
import {
    format, startOfISOWeek, endOfISOWeek, addWeeks, subWeeks,
    eachDayOfInterval, parseISO, subDays,
} from 'date-fns'
import useStore from '../store/useStore'
import { generateTips } from '../utils/weeklyTips'
import { useLang, useT } from '../i18n/I18nContext'
import { getBadgeDefinition } from '../utils/badges'

const EMPTY_SET = new Set()

// weekOffset=0 → last completed week, -1 → week before that, +1 → current week
export default function useWeeklyReport(weekOffset = 0) {
    const { kids, dailyTasks, dayConfigs, ledger, badges } = useStore()
    const { lang } = useLang()
    const t = useT()

    return useMemo(() => {
        const now = new Date()
        // Base: start of last completed week
        const lastWeekStart = startOfISOWeek(subWeeks(now, 1))
        const weekStartDate = addWeeks(lastWeekStart, weekOffset)
        const weekEndDate = endOfISOWeek(weekStartDate)
        const weekStart = format(weekStartDate, 'yyyy-MM-dd')
        const weekEnd = format(weekEndDate, 'yyyy-MM-dd')

        // All 7 days Mon–Sun as strings
        const weekDates = eachDayOfInterval({ start: weekStartDate, end: weekEndDate })
            .map(d => format(d, 'yyyy-MM-dd'))

        // Previous week for trend comparison
        const prevStart = format(startOfISOWeek(subWeeks(weekStartDate, 1)), 'yyyy-MM-dd')
        const prevEnd = format(endOfISOWeek(subWeeks(weekStartDate, 1)), 'yyyy-MM-dd')

        const weekTasks = []
        const prevTasks = []
        const weekTasksByKid = new Map()
        const prevTasksByKid = new Map()
        const weekTasksByKidDate = new Map()
        const weekTaskSummaryByDate = new Map()
        let completedTasks = 0
        let prevCompleted = 0

        for (const task of dailyTasks) {
            if (task.date >= weekStart && task.date <= weekEnd) {
                weekTasks.push(task)
                if (task.status === 'completed') completedTasks++

                if (!weekTasksByKid.has(task.kidId)) weekTasksByKid.set(task.kidId, [])
                weekTasksByKid.get(task.kidId).push(task)

                if (!weekTasksByKidDate.has(task.kidId)) weekTasksByKidDate.set(task.kidId, new Map())
                const kidDateMap = weekTasksByKidDate.get(task.kidId)
                if (!kidDateMap.has(task.date)) kidDateMap.set(task.date, [])
                kidDateMap.get(task.date).push(task)

                if (!weekTaskSummaryByDate.has(task.date)) {
                    weekTaskSummaryByDate.set(task.date, { total: 0, completed: 0 })
                }
                const daySummary = weekTaskSummaryByDate.get(task.date)
                daySummary.total += 1
                if (task.status === 'completed') daySummary.completed += 1
                continue
            }

            if (task.date >= prevStart && task.date <= prevEnd) {
                prevTasks.push(task)
                if (task.status === 'completed') prevCompleted++
                if (!prevTasksByKid.has(task.kidId)) prevTasksByKid.set(task.kidId, [])
                prevTasksByKid.get(task.kidId).push(task)
            }
        }

        const taskSummaryByKidDate = new Map()
        for (const task of dailyTasks) {
            const key = `${task.kidId}|${task.date}`
            if (!taskSummaryByKidDate.has(key)) taskSummaryByKidDate.set(key, { total: 0, completed: 0 })
            const summary = taskSummaryByKidDate.get(key)
            summary.total += 1
            if (task.status === 'completed') summary.completed += 1
        }

        const perfectDatesByKid = new Map()
        for (const config of dayConfigs) {
            if (!config.isFinalized) continue
            const key = `${config.kidId}|${config.date}`
            const summary = taskSummaryByKidDate.get(key)
            if (!summary || summary.total === 0 || summary.completed !== summary.total) continue
            if (!perfectDatesByKid.has(config.kidId)) perfectDatesByKid.set(config.kidId, new Set())
            perfectDatesByKid.get(config.kidId).add(config.date)
        }

        const weekEarningsByKid = new Map()
        for (const entry of ledger) {
            if (entry.date < weekStart || entry.date > weekEnd) continue
            const prevAmount = weekEarningsByKid.get(entry.kidId) || 0
            weekEarningsByKid.set(entry.kidId, prevAmount + (entry.amount || 0))
        }

        // Family stats
        const totalTasks = weekTasks.length
        const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0

        const prevTotal = prevTasks.length
        const prevWeekRate = prevTotal > 0 ? prevCompleted / prevTotal : null

        const familyStats = {
            totalTasks,
            completedTasks,
            completionRate,
            prevWeekRate,
            trend: prevWeekRate !== null ? completionRate - prevWeekRate : null,
        }

        // Per-kid stats
        const yesterday = format(subDays(now, 1), 'yyyy-MM-dd')

        const kidStats = kids.map(kid => {
            const kWeek = weekTasksByKid.get(kid.id) || []
            const kPrev = prevTasksByKid.get(kid.id) || []

            const kTotal = kWeek.length
            const kCompleted = kWeek.reduce((sum, task) => sum + (task.status === 'completed' ? 1 : 0), 0)
            const kRate = kTotal > 0 ? kCompleted / kTotal : 0

            const kPrevTotal = kPrev.length
            const kPrevCompleted = kPrev.reduce((sum, task) => sum + (task.status === 'completed' ? 1 : 0), 0)
            const kPrevRate = kPrevTotal > 0 ? kPrevCompleted / kPrevTotal : null

            // Daily breakdown (Mon=index 0 … Sun=index 6)
            const dailyBreakdown = weekDates.map(date => {
                const dayTasks = weekTasksByKidDate.get(kid.id)?.get(date) || []
                if (dayTasks.length === 0) return { date, total: 0, completed: 0, rate: null }
                const done = dayTasks.reduce((sum, task) => sum + (task.status === 'completed' ? 1 : 0), 0)
                return { date, total: dayTasks.length, completed: done, rate: done / dayTasks.length }
            })

            // Streak as of weekEnd (or yesterday for current/future weeks)
            const streakRef = weekEnd <= yesterday ? weekEnd : yesterday
            const perfectDates = perfectDatesByKid.get(kid.id) || EMPTY_SET
            let streak = 0
            let checkDate = streakRef
            while (perfectDates.has(checkDate)) {
                streak++
                checkDate = format(subDays(parseISO(checkDate), 1), 'yyyy-MM-dd')
            }

            // Week earnings from ledger
            const weekEarnings = weekEarningsByKid.get(kid.id) || 0

            // Task breakdown
            const taskMap = {}
            kWeek.forEach(t => {
                if (!taskMap[t.title]) taskMap[t.title] = { title: t.title, daysCompleted: 0, daysTotal: 0 }
                taskMap[t.title].daysTotal++
                if (t.status === 'completed') taskMap[t.title].daysCompleted++
            })
            const taskBreakdown = Object.values(taskMap)
                .sort((a, b) => b.daysCompleted - a.daysCompleted)

            const bestTask = taskBreakdown[0] || null
            const sortedWorst = [...taskBreakdown].sort(
                (a, b) => (a.daysCompleted / Math.max(a.daysTotal, 1)) - (b.daysCompleted / Math.max(b.daysTotal, 1))
            )
            const worstTask = sortedWorst[0] || null

            return {
                kid, completionRate: kRate, prevWeekRate: kPrevRate,
                trend: kPrevRate !== null ? kRate - kPrevRate : null,
                streak, weekEarnings, dailyBreakdown, bestTask, worstTask, taskBreakdown,
            }
        })

        // Insights
        const allTaskStats = {}
        kidStats.forEach(ks => {
            ks.taskBreakdown.forEach(tb => {
                if (!allTaskStats[tb.title]) allTaskStats[tb.title] = { completed: 0, total: 0 }
                allTaskStats[tb.title].completed += tb.daysCompleted
                allTaskStats[tb.title].total += tb.daysTotal
            })
        })
        const taskEntries = Object.entries(allTaskStats)
        let mostPopularTask = null
        let hardestTask = null
        if (taskEntries.length > 0) {
            mostPopularTask = taskEntries.reduce((b, c) =>
                c[1].completed > b[1].completed ? c : b
            )[0]
            const withData = taskEntries.filter(([, v]) => v.total >= 2)
            if (withData.length > 0) {
                hardestTask = withData.reduce((w, c) =>
                    (c[1].completed / c[1].total) < (w[1].completed / w[1].total) ? c : w
                )[0]
            }
        }

        // Best/worst day of week
        const dayRates = weekDates.map((date, i) => {
            const summary = weekTaskSummaryByDate.get(date)
            if (!summary || summary.total === 0) return null
            return { date, rate: summary.completed / summary.total, i }
        }).filter(Boolean)

        const bestDayEntry = dayRates.length > 0
            ? dayRates.reduce((b, c) => c.rate > b.rate ? c : b)
            : null
        const worstDayEntry = dayRates.length > 0
            ? dayRates.reduce((w, c) => c.rate < w.rate ? c : w)
            : null

        const insights = {
            mostPopularTask,
            hardestTask: hardestTask !== mostPopularTask ? hardestTask : null,
            bestDayIndex: bestDayEntry ? bestDayEntry.i : null,
            worstDayIndex: worstDayEntry && worstDayEntry.date !== bestDayEntry?.date
                ? worstDayEntry.i : null,
        }

        // Earnings per kid
        const perKid = kids.map(kid => ({
            kid,
            amount: weekEarningsByKid.get(kid.id) || 0,
        }))
        const familyTotal = perKid.reduce((sum, p) => sum + p.amount, 0)

        const badgeHighlightsPerKid = kids
            .map((kid) => {
                const unlocked = badges
                    .filter((badge) => {
                        if (badge.kidId !== kid.id) return false
                        const unlockedAt = String(badge.unlockedAt || '').slice(0, 10)
                        return unlockedAt >= weekStart && unlockedAt <= weekEnd
                    })
                    .map((badge) => ({
                        ...badge,
                        definition: getBadgeDefinition(badge.code),
                    }))
                    .sort((a, b) => {
                        if (a.unlockedAt !== b.unlockedAt) return String(a.unlockedAt).localeCompare(String(b.unlockedAt))
                        return String(a.code).localeCompare(String(b.code))
                    })

                return { kid, badges: unlocked }
            })
            .filter((entry) => entry.badges.length > 0)

        // Smart tips
        const tips = generateTips({ kidStats, familyStats }, { lang, t })

        return {
            weekStart, weekEnd, weekDates,
            familyStats, kidStats, insights,
            earnings: { perKid, familyTotal },
            badgeHighlights: {
                perKid: badgeHighlightsPerKid,
                totalUnlocked: badgeHighlightsPerKid.reduce((sum, entry) => sum + entry.badges.length, 0),
            },
            tips,
        }
    }, [kids, dailyTasks, dayConfigs, ledger, badges, weekOffset, lang, t])
}
