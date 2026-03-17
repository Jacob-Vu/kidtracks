import { useMemo } from 'react'
import { computeWeeklyLeaderboard } from '../utils/leaderboard'

export default function useLeaderboard(kids, dailyTasks, ledger, dayConfigs, options = {}) {
    return useMemo(() => (
        computeWeeklyLeaderboard(kids, dailyTasks, ledger, dayConfigs, options)
    ), [kids, dailyTasks, ledger, dayConfigs, options])
}
