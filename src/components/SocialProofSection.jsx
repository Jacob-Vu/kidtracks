import { useT } from '../i18n/I18nContext'

const TRUST_METRICS = [
    { id: 'families', value: '12,500+' },
    { id: 'tasks', value: '1.8M+' },
    { id: 'streak', value: '4.7' },
]

const TESTIMONIALS = [
    { id: 1, avatar: '👩', nameKey: 'landing.social.testimonial1.name', roleKey: 'landing.social.testimonial1.role', quoteKey: 'landing.social.testimonial1.quote' },
    { id: 2, avatar: '👨', nameKey: 'landing.social.testimonial2.name', roleKey: 'landing.social.testimonial2.role', quoteKey: 'landing.social.testimonial2.quote' },
    { id: 3, avatar: '👩‍🦱', nameKey: 'landing.social.testimonial3.name', roleKey: 'landing.social.testimonial3.role', quoteKey: 'landing.social.testimonial3.quote' },
]

export default function SocialProofSection({ mode = 'full', onPrimaryAction }) {
    const t = useT()
    const showTrustStrip = mode === 'full' || mode === 'trust'
    const showExtended = mode === 'full' || mode === 'extended'

    if (!showTrustStrip && !showExtended) return null

    return (
        <section className={`landing-social-proof landing-social-proof--${mode}`} aria-label={t('landing.social.sectionAria')}>
            {showTrustStrip && (
                <div className="landing-trust-strip" data-testid="trust-metrics-strip">
                    {TRUST_METRICS.map((metric) => (
                        <article key={metric.id} className="landing-trust-metric">
                            <div className="landing-trust-metric__value">{metric.value}</div>
                            <div className="landing-trust-metric__label">{t(`landing.social.metrics.${metric.id}`)}</div>
                        </article>
                    ))}
                </div>
            )}

            {showExtended && (
                <>
                    <div className="landing-testimonials" data-testid="testimonials-section">
                        <h2 className="landing-section-title">{t('landing.social.testimonialsTitle')}</h2>
                        <div className="landing-testimonials-grid">
                            {TESTIMONIALS.map((item) => (
                                <article key={item.id} className="landing-testimonial-card">
                                    <p className="landing-testimonial-quote">"{t(item.quoteKey)}"</p>
                                    <div className="landing-testimonial-author">
                                        <span className="landing-testimonial-avatar" aria-hidden>{item.avatar}</span>
                                        <div>
                                            <div className="landing-testimonial-name">{t(item.nameKey)}</div>
                                            <div className="landing-testimonial-role">{t(item.roleKey)}</div>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>

                    <article className="landing-community-proof" data-testid="community-proof-block">
                        <div className="landing-community-proof__eyebrow">{t('landing.social.communityEyebrow')}</div>
                        <h3 className="landing-community-proof__title">{t('landing.social.communityTitle')}</h3>
                        <p className="landing-community-proof__desc">{t('landing.social.communityDesc')}</p>
                        <div className="landing-community-proof__actions">
                            <p className="landing-community-proof__trust-copy">{t('landing.social.communityTrustCopy')}</p>
                            <button className="btn btn-primary landing-cta-primary" onClick={onPrimaryAction}>
                                {t('landing.social.communityCta')}
                            </button>
                        </div>
                    </article>
                </>
            )}
        </section>
    )
}
