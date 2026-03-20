import { useCallback, useEffect, useRef, useState } from 'react'

export const LS_FEEDBACK_SOUND = 'kidstrack-feedback-sound-enabled'
export const LS_LOW_STIMULATION = 'kidstrack-low-stimulation-mode'
const AUDIO_DEBUG_EVENT = 'kidstrack:feedback-audio'
export const AUDIO_UNLOCK_EVENT = 'kidstrack:feedback-audio-unlock-needed'

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
    const unlockRequestedRef = useRef(false)

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

    const ensureAudioUnlocked = useCallback(async () => {
        if (typeof window === 'undefined') return false

        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (!AudioCtx) return false

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioCtx()
            }

            const ctx = audioContextRef.current
            if (ctx.state === 'running') {
                unlockRequestedRef.current = false
                return true
            }

            await ctx.resume()
            unlockRequestedRef.current = false
            return ctx.state === 'running'
        } catch {
            return false
        }
    }, [])

    const requestAudioUnlock = useCallback((eventType) => {
        if (typeof window === 'undefined') return
        if (unlockRequestedRef.current) return
        unlockRequestedRef.current = true
        window.dispatchEvent(new CustomEvent(AUDIO_UNLOCK_EVENT, { detail: { eventType } }))
    }, [])

    const playSound = useCallback(async (eventType) => {
        if (!soundEnabled || lowStimulationMode || typeof window === 'undefined') return false

        const AudioCtx = window.AudioContext || window.webkitAudioContext
        if (!AudioCtx) return false

        // Dispatch debug event first so tests can always detect when sound was requested,
        // even if the actual AudioContext operations fail in headless/test environments.
        window.dispatchEvent(new CustomEvent(AUDIO_DEBUG_EVENT, { detail: { eventType } }))

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioCtx()
            }

            let ctx = audioContextRef.current
            if (ctx.state !== 'running') {
                const unlocked = await ensureAudioUnlocked()
                ctx = audioContextRef.current
                if (!unlocked || !ctx || ctx.state !== 'running') {
                    requestAudioUnlock(eventType)
                    return false
                }
            }

            if (eventType === 'task_complete') {
                createTone(ctx, { frequency: 740, duration: 0.08, gain: 0.018, type: 'triangle' })
            }

            if (eventType === 'day_complete') {
                createTone(ctx, { frequency: 523, duration: 0.12, gain: 0.03, type: 'triangle' })
                createTone(ctx, { frequency: 659, duration: 0.14, gain: 0.034, delay: 0.08, type: 'triangle' })
                createTone(ctx, { frequency: 784, duration: 0.18, gain: 0.038, delay: 0.18, type: 'triangle' })
                createTone(ctx, { frequency: 1047, duration: 0.26, gain: 0.045, delay: 0.3, type: 'sine' })
            }

            if (eventType === 'badge_unlock') {
                createTone(ctx, { frequency: 520, duration: 0.08, gain: 0.018, type: 'sine' })
                createTone(ctx, { frequency: 780, duration: 0.1, gain: 0.018, delay: 0.08, type: 'sine' })
                createTone(ctx, { frequency: 1040, duration: 0.13, gain: 0.02, delay: 0.15, type: 'sine' })
            }
            return true
        } catch {
            requestAudioUnlock(eventType)
            return false
        }
    }, [soundEnabled, lowStimulationMode, ensureAudioUnlocked, requestAudioUnlock])

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
        ensureAudioUnlocked,
        notifyTaskComplete,
        notifyDayComplete,
        notifyBadgeUnlock,
    }
}
