import { formatMoney } from '../utils/format'
import { useT } from '../i18n/I18nContext'
import { GOAL_MILESTONES, getGoalProgress } from '../utils/goals'

function formatDate(dateValue) {
    if (!dateValue) return ''
    const date = new Date(dateValue)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString()
}

export default function GoalCard({
    goal,
    currentAmount = 0,
    kidName = '',
    onCreate,
    onEdit,
    onDelete,
}) {
    const t = useT()

    if (!goal) {
        return (
            <div className="goal-card goal-card--empty" data-testid="goal-empty">
                <div>
                    <div className="goal-title">{t('goal.emptyTitle')}</div>
                    <div className="goal-subtitle">{t('goal.emptyDesc')}</div>
                </div>
                <button className="btn btn-primary btn-sm" onClick={onCreate} data-testid="goal-create-btn">
                    {t('goal.createBtn')}
                </button>
            </div>
        )
    }

    const progress = getGoalProgress(goal, currentAmount)
    const unlocked = goal.milestonesUnlocked || []
    const statusLabel = progress.isCompleted ? t('goal.statusCompleted') : t('goal.statusActive')

    return (
        <div className={`goal-card${progress.isCompleted ? ' goal-card--completed' : ''}`} data-testid="goal-card">
            <div className="row between center wrap" style={{ gap: 8 }}>
                <div className="goal-heading">
                    <span className="goal-icon">{goal.icon || '🎯'}</span>
                    <div>
                        <div className="goal-title">{goal.title}</div>
                        <div className="goal-subtitle">
                            {kidName ? t('goal.forKid', { name: kidName }) : statusLabel}
                        </div>
                    </div>
                </div>
                <div className="row center" style={{ gap: 8 }}>
                    <span className={`goal-status-chip${progress.isCompleted ? ' done' : ''}`}>{statusLabel}</span>
                    <button className="btn btn-ghost btn-sm" onClick={onEdit}>{t('common.edit')}</button>
                    <button className="btn btn-danger btn-sm" onClick={onDelete}>{t('common.delete')}</button>
                </div>
            </div>

            <div className="goal-progress-line">
                <span>{formatMoney(progress.amount)}</span>
                <span>/ {formatMoney(progress.targetAmount)}</span>
            </div>
            <div className="progress-bar goal-progress-bar">
                <div className="progress-fill" style={{ width: `${progress.progressPercent}%` }} />
            </div>
            <div className="goal-progress-meta">
                <span data-testid="goal-progress-value">{progress.progressPercent}%</span>
                <span>
                    {progress.isCompleted
                        ? t('goal.completedOn', { date: formatDate(goal.completedAt || goal.createdAt) })
                        : t('goal.remaining', { amount: formatMoney(progress.remainingAmount) })}
                </span>
            </div>

            <div className="goal-milestones" data-testid="goal-milestones">
                {GOAL_MILESTONES.map((milestone) => {
                    const isUnlocked = unlocked.includes(milestone)
                    return (
                        <span
                            key={milestone}
                            className={`goal-milestone${isUnlocked ? ' unlocked' : ''}`}
                        >
                            {milestone}%
                        </span>
                    )
                })}
            </div>

            {goal.dueDate && <div className="goal-due-date">{t('goal.dueDate', { date: formatDate(goal.dueDate) })}</div>}
        </div>
    )
}
