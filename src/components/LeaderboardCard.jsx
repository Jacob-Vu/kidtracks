import { formatMoney } from '../utils/format'
import { useT } from '../i18n/I18nContext'

export default function LeaderboardCard({ data, variant = 'parent', currentKidId = null }) {
    const t = useT()

    if (!data) return null

    const isKid = variant === 'kid'
    const visibleRankings = isKid ? data.rankings.slice(0, 3) : data.rankings
    const currentKidInVisible = visibleRankings.some((row) => row.kidId === currentKidId)
    const currentKidRow = isKid && !currentKidInVisible
        ? data.rankings.find((row) => row.kidId === currentKidId) || null
        : null

    return (
        <div className={`leaderboard-card${isKid ? ' leaderboard-card--kid' : ''}`}>
            <div className="leaderboard-card__header">
                <div>
                    <div className="leaderboard-card__title">
                        {isKid ? t('leaderboard.kidTitle') : t('leaderboard.title')}
                    </div>
                    <div className="leaderboard-card__subtitle">{t('leaderboard.subtitle', { days: data.windowDays })}</div>
                </div>
                {data.fairnessGate && (
                    <span className="leaderboard-card__window">{t('leaderboard.window', { days: data.windowDays })}</span>
                )}
            </div>

            {!data.fairnessGate ? (
                <div className="leaderboard-card__empty">
                    <div className="leaderboard-card__empty-title">{t('leaderboard.hiddenTitle')}</div>
                    <div className="leaderboard-card__empty-desc">
                        {t('leaderboard.hiddenDesc', { minKids: 2 })}
                    </div>
                </div>
            ) : (
                <>
                    <div className="leaderboard-highlights">
                        {data.mostImprovedKidId && (
                            <span className="leaderboard-chip leaderboard-chip--improved">
                                {t('leaderboard.mostImproved')}: {data.rankings.find((row) => row.kidId === data.mostImprovedKidId)?.kidName}
                            </span>
                        )}
                        {data.streakStarKidId && (
                            <span className="leaderboard-chip leaderboard-chip--streak">
                                {t('leaderboard.streakStar')}: {data.rankings.find((row) => row.kidId === data.streakStarKidId)?.kidName}
                            </span>
                        )}
                    </div>

                    <div className="leaderboard-table" role="table" aria-label={t('leaderboard.title')}>
                        <div className="leaderboard-table__head" role="row">
                            <span>{t('leaderboard.rank')}</span>
                            <span>{t('leaderboard.kid')}</span>
                            <span>{t('leaderboard.completion')}</span>
                            <span>{t('leaderboard.earnings')}</span>
                            <span>{t('leaderboard.streak')}</span>
                        </div>

                        {visibleRankings.map((row) => {
                            const isCurrentKid = row.kidId === currentKidId
                            const improved = row.completionImprovement
                            return (
                                <div
                                    key={row.kidId}
                                    className={`leaderboard-table__row${isCurrentKid ? ' leaderboard-table__row--me' : ''}`}
                                    role="row"
                                >
                                    <span className="leaderboard-rank">#{row.rank}</span>
                                    <span className="leaderboard-kid-cell">
                                        <span>{row.kidAvatar}</span>
                                        <span>{row.kidName}</span>
                                        {isCurrentKid && <span className="leaderboard-me-tag">{t('leaderboard.you')}</span>}
                                    </span>
                                    <span>{row.completionRate}%</span>
                                    <span>{formatMoney(row.weeklyEarnings)}</span>
                                    <span>
                                        {row.currentStreak > 0 ? `?? ${row.currentStreak}` : '—'}
                                        {improved !== null && improved > 0 && (
                                            <em className="leaderboard-improve">{t('leaderboard.improvedBy', { value: improved })}</em>
                                        )}
                                    </span>
                                </div>
                            )
                        })}

                        {currentKidRow && (
                            <div className="leaderboard-table__row leaderboard-table__row--me" role="row">
                                <span className="leaderboard-rank">#{currentKidRow.rank}</span>
                                <span className="leaderboard-kid-cell">
                                    <span>{currentKidRow.kidAvatar}</span>
                                    <span>{currentKidRow.kidName}</span>
                                    <span className="leaderboard-me-tag">{t('leaderboard.you')}</span>
                                </span>
                                <span>{currentKidRow.completionRate}%</span>
                                <span>{formatMoney(currentKidRow.weeklyEarnings)}</span>
                                <span>{currentKidRow.currentStreak > 0 ? `?? ${currentKidRow.currentStreak}` : '—'}</span>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}
