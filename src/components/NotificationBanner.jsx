import { useState } from 'react'
import { useT } from '../i18n/I18nContext'
import useNotifications from '../hooks/useNotifications'

const LS_DISMISSED = 'kidstrack-notif-dismissed'

export default function NotificationBanner() {
    const t = useT()
    const { isSupported, permission, enabled, setEnabled, requestPermission } = useNotifications()
    const [dismissed, setDismissed] = useState(() => {
        try { return localStorage.getItem(LS_DISMISSED) === 'true' } catch { return false }
    })
    const [toast, setToast] = useState(false)

    // Don't show if: unsupported, already enabled, denied, or dismissed
    if (!isSupported || enabled || permission === 'denied' || dismissed) return null

    const handleEnable = async () => {
        const result = await requestPermission()
        if (result === 'granted') {
            setEnabled(true)
            setToast(true)
            setTimeout(() => setToast(false), 3000)
        }
    }

    const handleDismiss = () => {
        try { localStorage.setItem(LS_DISMISSED, 'true') } catch {}
        setDismissed(true)
    }

    return (
        <>
            <div className="notif-banner">
                <span className="notif-banner-icon">🔔</span>
                <span className="notif-banner-text">{t('notif.bannerText')}</span>
                <div className="notif-banner-actions">
                    <button className="btn btn-primary btn-sm" onClick={handleEnable}>
                        {t('notif.bannerEnable')}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={handleDismiss}>
                        {t('notif.bannerDismiss')}
                    </button>
                </div>
            </div>
            {toast && (
                <div className="notif-toast">
                    ✅ {t('notif.enabledToast')}
                </div>
            )}
        </>
    )
}
