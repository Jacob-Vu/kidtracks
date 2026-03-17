import { format, parseISO } from 'date-fns'
import Modal from './Modal'
import { useT } from '../i18n/I18nContext'

function FamilyTrendBadge({ trend, t }) {
    if (trend === null || trend === undefined) return null
    const pct = Math.round(Math.abs(trend) * 100)

    if (pct === 0) {
        return <span className="weekly-trend-badge weekly-trend-badge--flat">{t('weekly.trendSame')}</span>
    }
    if (trend > 0) {
        return <span className="weekly-trend-badge weekly-trend-badge--up">{t('weekly.trendUp', { pct })}</span>
    }
    return <span className="weekly-trend-badge weekly-trend-badge--down">{t('weekly.trendDown', { pct })}</span>
}

export default function WeeklyReportModal({
    isOpen,
    onClose,
    onOpenReport,
    weekKey,
    weekStart,
    weekEnd,
    familyStats,
}) {
    const t = useT()
    if (!isOpen || !familyStats) return null

    const completionPct = Math.round((familyStats.completionRate || 0) * 100)
    const weekRange = weekStart && weekEnd
        ? `${format(parseISO(weekStart), 'MMM d')} – ${format(parseISO(weekEnd), 'MMM d, yyyy')}`
        : weekKey

    return (
        <Modal title={t('weekly.modalTitle')} onClose={onClose}>
            <div className="weekly-modal-summary">
                <div className="weekly-modal-week">{t('weekly.modalWeek', { week: weekKey })}</div>
                <div className="weekly-modal-range">{weekRange}</div>
                <div className="weekly-modal-completion">{t('weekly.modalCompletion', { pct: completionPct })}</div>
                <div className="weekly-modal-count">
                    {t('weekly.totalTasks', { done: familyStats.completedTasks, total: familyStats.totalTasks })}
                </div>
                <FamilyTrendBadge trend={familyStats.trend} t={t} />
            </div>
            <div className="modal-footer">
                <button className="btn btn-ghost" onClick={onClose}>{t('weekly.modalLater')}</button>
                <button className="btn btn-primary" onClick={onOpenReport}>{t('weekly.modalOpen')}</button>
            </div>
        </Modal>
    )
}
