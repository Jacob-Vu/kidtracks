export const GOAL_MILESTONES = [25, 50, 75, 100]

export function normalizeMoneyAmount(value) {
    const num = Number(value)
    if (!Number.isFinite(num)) return 0
    return Math.max(0, Math.round(num))
}

export function getGoalProgress(goal, currentAmount) {
    const targetAmount = normalizeMoneyAmount(goal?.targetAmount)
    const amount = normalizeMoneyAmount(currentAmount)
    const progressPercent = targetAmount > 0 ? Math.min(100, Math.round((amount / targetAmount) * 100)) : 0
    const remainingAmount = Math.max(0, targetAmount - amount)
    const isCompleted = goal?.status === 'completed' || (targetAmount > 0 && progressPercent >= 100)

    return {
        amount,
        targetAmount,
        progressPercent,
        remainingAmount,
        isCompleted,
    }
}

export function getReachedMilestones(progressPercent) {
    return GOAL_MILESTONES.filter((milestone) => progressPercent >= milestone)
}

export function mergeUnlockedMilestones(existing = [], reached = []) {
    const set = new Set([...existing, ...reached].filter((m) => GOAL_MILESTONES.includes(m)))
    return GOAL_MILESTONES.filter((m) => set.has(m))
}
