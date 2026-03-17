import { useState, useEffect, useRef, useCallback } from 'react'

const LS_ENABLED = 'kidstrack-notif-enabled'
const LS_TIMES = 'kidstrack-notif-times'

const DEFAULT_TIMES = {
    morning: '08:00',
    afternoon: '15:00',
    evening: '20:00',
}

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
    if (target <= now) return null // already passed today
    return target.getTime() - now.getTime()
}

function showNotification(title, body) {
    if (Notification.permission !== 'granted') return
    try {
        // Use service worker if available for better mobile support
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
                type: 'SHOW_NOTIFICATION',
                title,
                body,
            })
        } else {
            new Notification(title, { body, icon: '/icons/icon-192x192.png' })
        }
    } catch {
        // fallback silently
    }
}

export default function useNotifications() {
    const isSupported = typeof window !== 'undefined' && 'Notification' in window
    const [permission, setPermission] = useState(
        isSupported ? Notification.permission : 'denied'
    )
    const [enabled, setEnabledState] = useState(() => {
        try { return localStorage.getItem(LS_ENABLED) === 'true' } catch { return false }
    })
    const timersRef = useRef([])

    const requestPermission = useCallback(async () => {
        if (!isSupported) return 'denied'
        const result = await Notification.requestPermission()
        setPermission(result)
        return result
    }, [isSupported])

    const setEnabled = useCallback((val) => {
        try { localStorage.setItem(LS_ENABLED, val ? 'true' : 'false') } catch {}
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

        // Morning
        const morningMs = msUntil(times.morning)
        if (morningMs !== null) {
            timersRef.current.push(setTimeout(() => {
                showNotification('KidsTrack', 'Good morning! Time to assign tasks for today 📋')
            }, morningMs))
        }

        // Afternoon — per kid with pending tasks
        const afternoonMs = msUntil(times.afternoon)
        if (afternoonMs !== null) {
            timersRef.current.push(setTimeout(() => {
                kids.forEach((kid) => {
                    const todayTasks = dailyTasks.filter(
                        (t) => t.kidId === kid.id && t.date === today
                    )
                    const pending = todayTasks.filter((t) => t.status !== 'completed').length
                    if (pending > 0) {
                        const name = kid.displayName || kid.name
                        showNotification(
                            'KidsTrack',
                            `${name} has ${pending} task${pending > 1 ? 's' : ''} remaining today ⏰`
                        )
                    }
                })
            }, afternoonMs))
        }

        // Evening
        const eveningMs = msUntil(times.evening)
        if (eveningMs !== null) {
            timersRef.current.push(setTimeout(() => {
                showNotification('KidsTrack', 'Time to review today! Finalize the day for your kids 🌙')
            }, eveningMs))
        }
    }, [isSupported, enabled, clearTimers])

    // Clean up on unmount
    useEffect(() => () => clearTimers(), [clearTimers])

    return {
        isSupported,
        permission,
        enabled,
        setEnabled,
        requestPermission,
        scheduleReminders,
        clearTimers,
        getStoredTimes,
        DEFAULT_TIMES,
    }
}
