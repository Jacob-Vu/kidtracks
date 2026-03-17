import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { logEvent as firebaseLogEvent } from 'firebase/analytics'
import { analytics } from '../firebase/config'

function log(eventName, params = {}) {
    if (!analytics) return
    try {
        firebaseLogEvent(analytics, eventName, params)
    } catch {
        // silently ignore if analytics not ready
    }
}

// Page tracking — call once inside the Router context
export function usePageTracking() {
    const location = useLocation()
    const prevPath = useRef(null)

    useEffect(() => {
        if (location.pathname === prevPath.current) return
        prevPath.current = location.pathname
        log('page_view', { page_path: location.pathname })
    }, [location.pathname])
}

// ── Key event helpers ─────────────────────────────────────────────────────────

export function trackLogin(method) {
    log('login', { method }) // GA4 recommended event
}

export function trackSignUp(method) {
    log('sign_up', { method }) // GA4 recommended event
}

export function trackTaskCompleted(params = {}) {
    // params: { kid_id, task_id, date }
    log('task_completed', params)
}

export function trackAllTasksDone(params = {}) {
    // params: { kid_id, date, total_tasks }
    log('all_tasks_done', params)
}

export function trackJournalSaved(params = {}) {
    // params: { kid_id, date, role, has_audio, has_text }
    log('journal_saved', params)
}

export function trackVoiceRecordingUsed(params = {}) {
    // params: { kid_id, date, role, duration_seconds }
    log('voice_recording_used', params)
}

export function trackTemplateImported(params = {}) {
    // params: { pack_name, task_count }
    log('template_imported', params)
}

export function trackFamilyCreated(params = {}) {
    // params: { method: 'quick_start' | 'email' | 'social' }
    log('family_created', params)
}

export function trackCelebrationShown(params = {}) {
    // params: { kid_id, date }
    log('celebration_shown', params)
}

export function trackLedgerEntry(params = {}) {
    // params: { kid_id, amount, type }
    log('ledger_entry_added', params)
}

export function trackVoiceTaskInput(params = {}) {
    // params: { field: 'title' | 'description', role: 'kid' | 'parent' }
    log('voice_task_input', params)
}
