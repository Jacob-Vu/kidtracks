import { useEffect, useRef } from 'react'
import { getGoalProgress, getReachedMilestones, mergeUnlockedMilestones } from '../utils/goals'

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
        }

        onPersist(goal.id, updates)
    }, [goal, currentAmount, onPersist])
}
