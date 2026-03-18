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

export function trackEvent(eventName, params = {}) {
    log(eventName, params)
}

// Page tracking - call once inside the Router context
export function usePageTracking() {
    const location = useLocation()
    const prevPath = useRef(null)

    useEffect(() => {
        if (location.pathname === prevPath.current) return
        prevPath.current = location.pathname
        log('page_view', { page_path: location.pathname })
    }, [location.pathname])
}

export function trackLogin(method) {
    log('login', { method })
}

export function trackSignUp(method) {
    log('sign_up', { method })
}

export function trackSignupStarted(source, locale) {
    log('signup_started', { source, locale })
}

export function trackSignupCompleted(method) {
    log('signup_completed', { method })
}

export function trackOnboardingStepCompleted(step, packSelected = 0) {
    log('onboarding_step_completed', { step, pack_selected: packSelected })
}

export function trackOnboardingCompleted(kidsCount, tasksCount) {
    log('onboarding_completed', { kids_count: kidsCount, tasks_count: tasksCount })
}

export function trackTaskCompleted(params = {}) {
    // params: { kid_id, task_type, has_reward, task_id, date }
    log('task_completed', params)
}

export function trackTaskCreated(params = {}) {
    // params: { kid_id, source, has_description, task_type }
    log('task_created', params)
}

export function trackVoiceInputUsed(params = {}) {
    // params: { field, mode, success, role }
    log('voice_input_used', params)
}

export function trackBadgeUnlocked(params = {}) {
    // params: { badge_id, kid_id }
    log('badge_unlocked', params)
}

export function trackWeeklyReportViewed(params = {}) {
    // params: { week, via }
    log('weekly_report_viewed', params)
}

export function trackWeeklyReportCtaClicked(via) {
    log('weekly_report_cta_clicked', { via })
}

export function trackWeeklyReportShared(method) {
    log('weekly_report_shared', { method })
}

export function trackGoalCreated(milestoneCount) {
    log('goal_created', { milestone_count: milestoneCount })
}

export function trackGoalCompleted(params = {}) {
    // params: { days_to_complete, target_amount, kid_id }
    log('goal_completed', params)
}

export function trackStreakMilestone(days) {
    if (![3, 7, 14, 30].includes(days)) return
    log('streak_milestone', { days })
}

export function trackSessionStarted(userType) {
    log('session_started', { user_type: userType })
}

export function trackPaywallSeen(featureAttempted) {
    log('paywall_seen', { feature_attempted: featureAttempted })
}

export function trackPaywallConverted(plan, price) {
    log('paywall_converted', { plan, price })
}

export function trackAllTasksDone(params = {}) {
    log('all_tasks_done', params)
}

export function trackJournalSaved(params = {}) {
    log('journal_saved', params)
}

export function trackVoiceRecordingUsed(params = {}) {
    log('voice_recording_used', params)
}

export function trackTemplateImported(params = {}) {
    log('template_imported', params)
}

export function trackFamilyCreated(params = {}) {
    log('family_created', params)
}

export function trackCelebrationShown(params = {}) {
    log('celebration_shown', params)
}

export function trackLedgerEntry(params = {}) {
    log('ledger_entry_added', params)
}

export function trackVoiceTaskInput(params = {}) {
    log('voice_task_input', params)
}
