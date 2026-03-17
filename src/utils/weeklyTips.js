export function generateTips(weekData, options = {}) {
    const { t } = options
    const tr = (key, params = {}, fallback = key) => {
        if (typeof t === 'function') return t(key, params, fallback)
        return fallback
    }

    const tips = []
    const { kidStats, familyStats } = weekData

    // Weekend completion < 50%
    const weekendRates = []
    kidStats.forEach(ks => {
        const sat = ks.dailyBreakdown[5] // Saturday (Mon=0)
        const sun = ks.dailyBreakdown[6] // Sunday
        if (sat && sat.total > 0) weekendRates.push(sat.rate)
        if (sun && sun.total > 0) weekendRates.push(sun.rate)
    })
    if (weekendRates.length > 0) {
        const avg = weekendRates.reduce((s, r) => s + r, 0) / weekendRates.length
        if (avg < 0.5) {
            tips.push({
                icon: '🏖️',
                text: tr('weekly.tips.weekendLow'),
            })
        }
    }

    // Any task with fail/miss rate > 70% (need at least 3 occurrences)
    const taskStats = {}
    kidStats.forEach(ks => {
        ks.taskBreakdown.forEach(tb => {
            if (!taskStats[tb.title]) taskStats[tb.title] = { completed: 0, total: 0 }
            taskStats[tb.title].completed += tb.daysCompleted
            taskStats[tb.title].total += tb.daysTotal
        })
    })
    Object.entries(taskStats).forEach(([title, { completed, total }]) => {
        if (total >= 3 && (total - completed) / total > 0.7) {
            tips.push({
                icon: '🔧',
                text: tr('weekly.tips.taskMissed', { title }),
            })
        }
    })

    // Any kid with streak >= 7
    kidStats.forEach(ks => {
        if (ks.streak >= 7) {
            const name = ks.kid.displayName || ks.kid.name
            tips.push({
                icon: '🔥',
                text: tr('weekly.tips.longStreak', { name, days: ks.streak }),
            })
        }
    })

    // Family completion increased > 15%
    if (familyStats.trend !== null && familyStats.trend > 0.15) {
        tips.push({
            icon: '🚀',
            text: tr('weekly.tips.familyUp'),
        })
    }

    // Family completion decreased > 15%
    if (familyStats.trend !== null && familyStats.trend < -0.15) {
        tips.push({
            icon: '💬',
            text: tr('weekly.tips.familyDown'),
        })
    }

    // Any kid with >= 3 perfect days (100% completion)
    kidStats.forEach(ks => {
        const perfectDays = ks.dailyBreakdown.filter(d => d.total > 0 && d.rate === 1).length
        if (perfectDays >= 3) {
            const name = ks.kid.displayName || ks.kid.name
            tips.push({
                icon: '⭐',
                text: tr('weekly.tips.perfectDays', { name, days: perfectDays }),
            })
        }
    })

    // Any kid with balance > 200,000
    kidStats.forEach(ks => {
        if (ks.kid.balance > 200000) {
            const name = ks.kid.displayName || ks.kid.name
            tips.push({
                icon: '🏦',
                text: tr('weekly.tips.highBalance', { name, amountK: Math.round(ks.kid.balance / 1000) }),
            })
        }
    })

    return tips
}
