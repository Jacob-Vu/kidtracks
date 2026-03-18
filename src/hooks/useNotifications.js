import { useState, useEffect, useRef, useCallback } from 'react'
import { getISOWeek, getISOWeekYear } from 'date-fns'
import { useLang, useT } from '../i18n/I18nContext'

const LS_ENABLED = 'kidstrack-notif-enabled'
const LS_TIMES = 'kidstrack-notif-times'
const LS_WEEKLY_SENT = 'kidstrack-weekly-push-sent'

const DEFAULT_TIMES = {
    morning: '08:00',
    afternoon: '15:00',
    evening: '20:00',
}
const WEEKLY_REMINDER_TIME = '08:00'

function getStoredTimes() {
    try {
        const raw = localStorage.getItem(LS_TIMES)
        return raw ? { ...DEFAULT_TIMES, ...JSON.parse(raw) } : DEFAULT_TIMES
    } catch {
        return DEFAULT_TIMES
    }
}

function msUntil(timeStr) {
    const [h, m] = timeStr.split(':').map(Number)
    const now = new Date()
    const target = new Date(now)
    target.setHours(h, m, 0, 0)
    if (target <= now) return null
    return target.getTime() - now.getTime()
}

function msUntilNextMondayAt(timeStr) {
    const [h, m] = timeStr.split(':').map(Number)
    const now = new Date()
    const target = new Date(now)
    const daysUntilMonday = (8 - target.getDay()) % 7
    target.setDate(target.getDate() + daysUntilMonday)
    target.setHours(h, m, 0, 0)
    if (target <= now) target.setDate(target.getDate() + 7)
    return target.getTime() - now.getTime()
}

function toWeekParam(date) {
    return `${getISOWeekYear(date)}-W${String(getISOWeek(date)).padStart(2, '0')}`
}

function getWeeklyPushSent() {
    try {
        return localStorage.getItem(LS_WEEKLY_SENT) || ''
    } catch {
        return ''
    }
}

function setWeeklyPushSent(weekKey) {
    try {
        localStorage.setItem(LS_WEEKLY_SENT, weekKey)
    } catch {
        // ignore storage failures
    }
}

function showNotification(title, body, options = {}) {
    if (Notification.permission !== 'granted') return
    const { url = '/', tag = 'kidstrack-reminder' } = options

    try {
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                title,
                body,
                url,
                tag,
            })
        } else {
            const notification = new Notification(title, {
                body,
                icon: '/pwa-192x192.png',
                tag,
                data: { url },
            })

            notification.onclick = () => {
                window.focus()
                if (url) window.location.href = url
                notification.close()
            }
        }
    } catch {
        // fallback silently
    }
}

export default function useNotifications() {
    const t = useT()
    const { lang } = useLang()
    const isSupported = typeof window !== 'undefined' && 'Notification' in window
    const [permission, setPermission] = useState(
        isSupported ? Notification.permission : 'denied',
    )
    const [enabled, setEnabledState] = useState(() => {
        try {
            return localStorage.getItem(LS_ENABLED) === 'true'
        } catch {
            return false
        }
    })
    const status = !isSupported
        ? 'unsupported'
        : permission === 'denied'
            ? 'blocked'
            : enabled && permission === 'granted'
                ? 'active'
                : 'inactive'
    const timersRef = useRef([])

    const requestPermission = useCallback(async () => {
        if (!isSupported) return 'denied'
        const result = await Notification.requestPermission()
        setPermission(result)
        return result
    }, [isSupported])

    const setEnabled = useCallback((val) => {
        try {
            localStorage.setItem(LS_ENABLED, val ? 'true' : 'false')
        } catch {
            // ignore storage failures
        }
        setEnabledState(val)
    }, [])

    const clearTimers = useCallback(() => {
        timersRef.current.forEach(clearTimeout)
        timersRef.current = []
    }, [])

    const scheduleReminders = useCallback((kids, dailyTasks, _dayConfigs) => {
        clearTimers()
        if (!isSupported || Notification.permission !== 'granted') return
        if (!enabled) return

        const times = getStoredTimes()
        const today = new Date().toISOString().slice(0, 10)

        const morningMs = msUntil(times.morning)
        if (morningMs !== null) {
            timersRef.current.push(setTimeout(() => {
                showNotification('KidsTrack', 'Good morning! Time to assign tasks for today 📋')
            }, morningMs))
        }

        const afternoonMs = msUntil(times.afternoon)
        if (afternoonMs !== null) {
            timersRef.current.push(setTimeout(() => {
                kids.forEach((kid) => {
                    const todayTasks = dailyTasks.filter(
                        (task) => task.kidId === kid.id && task.date === today,
                    )
                    const pending = todayTasks.filter((task) => task.status !== 'completed').length
                    if (pending > 0) {
                        const name = kid.displayName || kid.name
                        showNotification(
                            'KidsTrack',
                            `${name} has ${pending} task${pending > 1 ? 's' : ''} remaining today ⏰`,
                        )
                    }
                })
            }, afternoonMs))
        }

        const eveningMs = msUntil(times.evening)
        if (eveningMs !== null) {
            timersRef.current.push(setTimeout(() => {
                showNotification('KidsTrack', 'Time to review today! Finalize the day for your kids 🌙')
            }, eveningMs))
        }

        const scheduleWeeklyReminder = () => {
            const weeklyDelay = msUntilNextMondayAt(WEEKLY_REMINDER_TIME)
            timersRef.current.push(setTimeout(() => {
                const weekKey = toWeekParam(new Date())
                if (getWeeklyPushSent() !== weekKey) {
                    showNotification(
                        t('notif.weeklyTitle'),
                        t('notif.weeklyBody'),
                        { url: '/report/weekly', tag: `kidstrack-weekly-${weekKey}` },
                    )
                    setWeeklyPushSent(weekKey)
                }
                scheduleWeeklyReminder()
            }, weeklyDelay))
        }

        scheduleWeeklyReminder()
    }, [isSupported, enabled, clearTimers, t, lang])

    useEffect(() => () => clearTimers(), [clearTimers])

    return {
        isSupported,
        permission,
        enabled,
        status,
        setEnabled,
        requestPermission,
        scheduleReminders,
        clearTimers,
        getStoredTimes,
        DEFAULT_TIMES,
    }
}
