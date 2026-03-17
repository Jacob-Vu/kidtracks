import { useMemo } from 'react'
import { format, subDays, parseISO } from 'date-fns'

export default function useStreak(kidId, dailyTasks, dayConfigs) {
    return useMemo(() => {
        if (!kidId) return { currentStreak: 0, bestStreak: 0, lastCompletedDate: null }

        // Build set of dates where the day was finalized AND all tasks completed
        const perfectDates = new Set()
        dayConfigs.forEach((c) => {
            if (c.kidId !== kidId || !c.isFinalized) return
            const tasks = dailyTasks.filter((t) => t.kidId === kidId && t.date === c.date)
            if (tasks.length > 0 && tasks.every((t) => t.status === 'completed')) {
                perfectDates.add(c.date)
            }
        })

        // Current streak: walk backwards from yesterday (today is in-progress)
        let currentStreak = 0
        let lastCompletedDate = null
        let checkDate = format(subDays(new Date(), 1), 'yyyy-MM-dd')

        while (perfectDates.has(checkDate)) {
            if (currentStreak === 0) lastCompletedDate = checkDate
            currentStreak++
            checkDate = format(subDays(parseISO(checkDate), 1), 'yyyy-MM-dd')
        }

        // Best streak: walk all perfect dates sorted ascending
        const sorted = Array.from(perfectDates).sort()
        let bestStreak = currentStreak
        let run = 0
        let prev = null

        for (const d of sorted) {
            if (prev === null) {
                run = 1
            } else {
                const diff = Math.round((parseISO(d) - parseISO(prev)) / 86400000)
                run = diff === 1 ? run + 1 : 1
            }
            if (run > bestStreak) bestStreak = run
            prev = d
        }

        return { currentStreak, bestStreak, lastCompletedDate }
    }, [kidId, dailyTasks, dayConfigs])
}
