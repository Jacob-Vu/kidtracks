import { useT } from '../i18n/I18nContext'

export default function BadgeStrip({ recentBadges, totalUnlocked, totalBadges }) {
    const t = useT()

    return (
        <div className="badge-strip" data-testid="badge-strip">
            <div className="badge-strip__header">
                <h2 className="section-title" style={{ marginBottom: 0 }}>
                    [BADGES] {t('badge.stripTitle')}
                </h2>
                <span className="badge-strip__progress" data-testid="badge-strip-progress">
                    {t('badge.progress', { unlocked: totalUnlocked, total: totalBadges })}
                </span>
            </div>

            {recentBadges.length === 0 ? (
                <p className="badge-strip__empty">{t('badge.noneYet')}</p>
            ) : (
                <div className="badge-strip__items">
                    {recentBadges.map((badge) => (
                        <div
                            key={badge.code}
                            className="badge-chip badge-chip--unlocked"
                            data-testid={`badge-chip-${badge.code}`}
                        >
                            <span className="badge-chip__icon">{badge.definition?.icon || 'BADGE'}</span>
                            <span className="badge-chip__name">{t(badge.definition?.nameKey || badge.code)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
