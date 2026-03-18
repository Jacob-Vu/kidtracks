import { useState } from 'react'
import { useT } from '../i18n/I18nContext'
import useNotifications from '../hooks/useNotifications'

const LS_TIMES = 'kidstrack-notif-times'

export default function NotificationSettings() {
    const t = useT()
    const { isSupported, permission, enabled, setEnabled, requestPermission, DEFAULT_TIMES, getStoredTimes } = useNotifications()
    const [times, setTimes] = useState(() => getStoredTimes())
    const [saved, setSaved] = useState(false)

    if (!isSupported) return null

    const handleToggle = async () => {
        if (!enabled) {
            if (permission !== 'granted') {
                const result = await requestPermission()
                if (result !== 'granted') return
            }
            setEnabled(true)
        } else {
            setEnabled(false)
        }
    }

    const handleSave = () => {
        try { localStorage.setItem(LS_TIMES, JSON.stringify(times)) } catch {}
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const handleTimeChange = (key, val) => {
        setTimes((prev) => ({ ...prev, [key]: val }))
    }

    return (
        <div className="notif-settings card">
            <div className="row between center" style={{ marginBottom: 12 }}>
                <div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>🔔 {t('notif.settingsTitle')}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                        {t('notif.parentModeHint')}
                    </div>
                </div>
                <label className="notif-toggle" aria-label={t('notif.settingsTitle')}>
                    <input
                        type="checkbox"
                        checked={enabled && permission === 'granted'}
                        onChange={handleToggle}
                        aria-label={t('notif.settingsTitle')}
                    />
                    <span className="notif-toggle-slider" />
                </label>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, fontStyle: 'italic' }}>
                {t('notif.defaultParent')}
            </p>
            {permission === 'denied' && (
                <p style={{ fontSize: 12, color: 'var(--accent-red)', marginBottom: 8 }}>
                    {t('notif.permDenied')}
                </p>
            )}
            {enabled && permission === 'granted' && (
                <div className="col" style={{ gap: 10 }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 12 }}>☀️ {t('notif.timeMorning')}</label>
                        <input
                            type="time"
                            value={times.morning}
                            onChange={(e) => handleTimeChange('morning', e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 12 }}>⏰ {t('notif.timeAfternoon')}</label>
                        <input
                            type="time"
                            value={times.afternoon}
                            onChange={(e) => handleTimeChange('afternoon', e.target.value)}
                        />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label style={{ fontSize: 12 }}>🌙 {t('notif.timeEvening')}</label>
                        <input
                            type="time"
                            value={times.evening}
                            onChange={(e) => handleTimeChange('evening', e.target.value)}
                        />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={handleSave} style={{ marginTop: 4 }}>
                        {saved ? `✅ ${t('notif.saved')}` : t('common.save')}
                    </button>
                </div>
            )}
        </div>
    )
}
