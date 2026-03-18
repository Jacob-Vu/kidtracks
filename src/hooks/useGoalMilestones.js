import { useEffect, useRef } from 'react'
import { getGoalProgress, getReachedMilestones, mergeUnlockedMilestones } from '../utils/goals'
import { trackGoalCompleted } from './useAnalytics'

export default function useGoalMilestones(goal, currentAmount, onPersist) {
    const signatureRef = useRef('')

    useEffect(() => {
        if (!goal?.id || typeof onPersist !== 'function') return

        const { progressPercent, isCompleted } = getGoalProgress(goal, currentAmount)
        const reached = getReachedMilestones(progressPercent)
        const merged = mergeUnlockedMilestones(goal.milestonesUnlocked || [], reached)
        const changed = merged.length !== (goal.milestonesUnlocked || []).length ||
            merged.some((m, idx) => m !== (goal.milestonesUnlocked || [])[idx])

        if (!changed && !(isCompleted && goal.status !== 'completed')) return

        const signature = `${goal.id}:${merged.join(',')}:${isCompleted ? 'done' : 'active'}`
        if (signatureRef.current === signature) return
        signatureRef.current = signature

        const updates = {
            milestonesUnlocked: merged,
        }
        if (isCompleted && goal.status !== 'completed') {
            updates.status = 'completed'
            updates.completedAt = goal.completedAt || new Date().toISOString()
            const createdAt = new Date(goal.createdAt || Date.now())
            const completedAt = new Date(updates.completedAt)
            const daysToComplete = Math.max(0, Math.round((completedAt - createdAt) / 86400000))
            trackGoalCompleted({
                days_to_complete: daysToComplete,
                target_amount: Number(goal.targetAmount) || 0,
                kid_id: goal.kidId || '',
            })
        }

        onPersist(goal.id, updates)
    }, [goal, currentAmount, onPersist])
}
