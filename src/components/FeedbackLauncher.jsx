import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useT } from '../i18n/I18nContext'
import { trackEvent } from '../hooks/useAnalytics'

export default function FeedbackLauncher({ compact = false }) {
    const t = useT()
    const { role } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    if (role !== 'parent') return null

    const handleOpen = () => {
        trackEvent('feedback_bubble_opened', {
            page: location.pathname,
        })
        navigate(`/feedback/new?from=${encodeURIComponent(location.pathname)}`, {
            state: { from: location.pathname },
        })
    }

    return (
        <button
            type="button"
            className={`feedback-launcher-btn${compact ? ' feedback-launcher-btn--compact' : ''}`}
            onClick={handleOpen}
            title={t('feedback.reportBtn')}
            aria-label={t('feedback.reportBtn')}
        >
            {compact ? '✉' : t('feedback.reportBtn')}
        </button>
    )
}
