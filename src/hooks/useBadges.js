import { useEffect, useMemo } from 'react'
import useStore from '../store/useStore'
import { useFireActions } from './useFirebaseSync'
import { evaluateBadgesForKid } from '../utils/badges'

export default function useBadges(kidId) {
    const { dailyTasks, dayConfigs, goals, badges } = useStore()
    const { upsertBadge } = useFireActions()

    const evaluated = useMemo(() => evaluateBadgesForKid({
        kidId,
        dailyTasks,
        dayConfigs,
        goals,
        badges,
    }), [kidId, dailyTasks, dayConfigs, goals, badges])

    useEffect(() => {
        if (!kidId || evaluated.newlyUnlocked.length === 0) return

        evaluated.newlyUnlocked.forEach((badge) => {
            upsertBadge(kidId, badge.code, badge.unlockedAt)
        })
    }, [kidId, evaluated.newlyUnlocked, upsertBadge])

    return {
        unlockedBadges: evaluated.unlocked,
        lockedBadges: evaluated.locked,
        recentBadges: evaluated.recentUnlocked,
        newlyUnlocked: evaluated.newlyUnlocked,
        totalUnlocked: evaluated.unlocked.length,
        totalBadges: evaluated.unlocked.length + evaluated.locked.length,
    }
}
