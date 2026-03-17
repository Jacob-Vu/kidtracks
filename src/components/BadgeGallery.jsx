import { useT } from '../i18n/I18nContext'
import { BADGE_DEFINITIONS } from '../utils/badges'

export default function BadgeGallery({ unlockedBadges }) {
    const t = useT()
    const unlockedByCode = new Map(unlockedBadges.map((badge) => [badge.code, badge]))

    return (
        <div className="badge-gallery" data-testid="badge-gallery">
            {BADGE_DEFINITIONS.map((definition) => {
                const unlocked = unlockedByCode.get(definition.code)
                return (
                    <div
                        key={definition.code}
                        className={`badge-card${unlocked ? ' badge-card--unlocked' : ' badge-card--locked'}`}
                        data-testid={`badge-card-${definition.code}`}
                        data-badge-status={unlocked ? 'unlocked' : 'locked'}
                    >
                        <div className="badge-card__icon" aria-hidden>{definition.icon}</div>
                        <div className="badge-card__content">
                            <div className="badge-card__name">{t(definition.nameKey)}</div>
                            <div className="badge-card__desc">{t(definition.descKey)}</div>
                            <div className="badge-card__meta">
                                <span className="badge-card__category">{t(definition.categoryKey)}</span>
                                {unlocked && (
                                    <span className="badge-card__date">
                                        {t('badge.unlockedOn', { date: unlocked.unlockedAt })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
