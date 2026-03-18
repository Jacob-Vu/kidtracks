import { useCallback, useEffect, useRef, useState } from 'react'

export const LS_FEEDBACK_SOUND = 'kidstrack-feedback-sound-enabled'
export const LS_LOW_STIMULATION = 'kidstrack-low-stimulation-mode'
const AUDIO_DEBUG_EVENT = 'kidstrack:feedback-audio'

const readSoundSetting = () => {
    if (typeof window === 'undefined') return true

    try {
        const raw = localStorage.getItem(LS_FEEDBACK_SOUND)
        if (raw === null) return true
        return raw === 'true'
    } catch {
        return true
    }
}

const readReducedMotion = () => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const readLowStimulationMode = () => {
    if (typeof window === 'undefined') return false

    try {
        const raw = localStorage.getItem(LS_LOW_STIMULATION)
        if (raw === null) return false
        return raw === 'true'
    } catch {
        return false
    }
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value))

const createTone = (ctx, { frequency, duration, type = 'sine', gain = 0.02, delay = 0 }) => {
    const osc = ctx.createOscillator()
    const amp = ctx.createGain()
    const startAt = ctx.currentTime + delay
    const endAt = startAt + duration

    osc.type = type
    osc.frequency.value = frequency

    amp.gain.setValueAtTime(0.0001, startAt)
    amp.gain.exponentialRampToValueAtTime(clamp(gain, 0.0001, 0.3), startAt + 0.01)
    amp.gain.exponentialRampToValueAtTime(0.0001, endAt)

    osc.connect(amp)
    amp.connect(ctx.destination)

    osc.start(startAt)
    osc.stop(endAt)
}

export default function useKidFeedback() {
    const [soundEnabled, setSoundEnabled] = useState(readSoundSetting)
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(readReducedMotion)
    const [lowStimulationMode, setLowStimulationMode] = useState(readLowStimulationMode)
    const [taskPopId, setTaskPopId] = useState(null)
    const [badgeUnlock, setBadgeUnlock] = useState(null)
    const reducedMotion = prefersReducedMotion || lowStimulationMode

    const taskPopTimerRef = useRef(null)
    const badgeTimerRef = useRef(null)
    const audioContextRef = useRef(null)

    useEffect(() => {
        if (typeof window === 'undefined') return

        try {
            localStorage.setItem(LS_FEEDBACK_SOUND, soundEnabled ? 'true' : 'false')
        } catch {
            // Ignore localStorage failures in private mode.
        }
    }, [soundEnabled])

    useEffect(() => {
        if (typeof window === 'undefined') return

        try {
            localStorage.setItem(LS_LOW_STIMULATION, lowStimulationMode ? 'true' : 'false')
        } catch {
            // Ignore localStorage failures in private mode.
        }
    }, [lowStimulationMode])

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return undefined

        const media = window.matchMedia('(prefers-reduced-motion: reduce)')
        const update = () => setPrefersReducedMotion(media.matches)
        update()

        if (typeof media.addEventListener === 'function') {
            media.addEventListener('change', update)
            return () => media.removeEventListener('change', update)
        }

        media.addListener(update)
        return () => media.removeListener(update)
    }, [])

    useEffect(() => () => {
        if (taskPopTimerRef.current) clearTimeout(taskPopTimerRef.current)
        if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current)
    }, [])

    const playSound = useCallback((eventType) => {
        if (!soundEnabled || lowStimulationMode || typeof window === 'undefined') return

        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (!AudioCtx) return

        // Dispatch debug event first so tests can always detect when sound was requested,
        // even if the actual AudioContext operations fail in headless/test environments.
        window.dispatchEvent(new CustomEvent(AUDIO_DEBUG_EVENT, { detail: { eventType } }))

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioCtx()
            }

            const ctx = audioContextRef.current
            if (ctx.state === 'suspended') {
                ctx.resume().catch(() => {})
            }

            if (eventType === 'task_complete') {
                createTone(ctx, { frequency: 740, duration: 0.08, gain: 0.018, type: 'triangle' })
            }

            if (eventType === 'day_complete') {
                createTone(ctx, { frequency: 660, duration: 0.11, gain: 0.02, type: 'triangle' })
                createTone(ctx, { frequency: 880, duration: 0.15, gain: 0.022, delay: 0.1, type: 'triangle' })
            }

            if (eventType === 'badge_unlock') {
                createTone(ctx, { frequency: 520, duration: 0.08, gain: 0.018, type: 'sine' })
                createTone(ctx, { frequency: 780, duration: 0.1, gain: 0.018, delay: 0.08, type: 'sine' })
                createTone(ctx, { frequency: 1040, duration: 0.13, gain: 0.02, delay: 0.15, type: 'sine' })
            }
        } catch {
            // Ignore audio API failures.
        }
    }, [soundEnabled, lowStimulationMode])

    const notifyTaskComplete = useCallback((taskId) => {
        playSound('task_complete')

        if (reducedMotion || !taskId) return

        if (taskPopTimerRef.current) clearTimeout(taskPopTimerRef.current)
        setTaskPopId(taskId)
        taskPopTimerRef.current = setTimeout(() => setTaskPopId(null), 420)
    }, [playSound, reducedMotion])

    const notifyDayComplete = useCallback(() => {
        playSound('day_complete')
    }, [playSound])

    const notifyBadgeUnlock = useCallback((badge) => {
        playSound('badge_unlock')

        if (lowStimulationMode) return

        if (badgeTimerRef.current) clearTimeout(badgeTimerRef.current)
        setBadgeUnlock(badge)
        badgeTimerRef.current = setTimeout(() => setBadgeUnlock(null), 2400)
    }, [playSound, lowStimulationMode])

    return {
        soundEnabled,
        setSoundEnabled,
        lowStimulationMode,
        setLowStimulationMode,
        reducedMotion,
        taskPopId,
        badgeUnlock,
        notifyTaskComplete,
        notifyDayComplete,
        notifyBadgeUnlock,
    }
}
