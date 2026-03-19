import { useState, useEffect } from 'react'

const LANDING_CTA_DISMISS_KEY = 'pwa_landing_cta_dismissed_until'
const LANDING_CTA_COOLDOWN_MS = 24 * 60 * 60 * 1000 // 24 hours

export function useInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [isPromptDismissed, setIsPromptDismissed] = useState(false)

    useEffect(() => {
        // Multi-signal standalone detection
        const checkStandalone = () => {
            return (
                window.matchMedia('(display-mode: standalone)').matches ||
                window.navigator.standalone === true ||
                document.referrer.includes('android-app://')
            )
        }
        setIsStandalone(checkStandalone())

        // Also react to display-mode changes (e.g. user installs mid-session)
        const mql = window.matchMedia('(display-mode: standalone)')
        const onMqlChange = (e) => { if (e.matches) setIsStandalone(true) }
        mql.addEventListener('change', onMqlChange)

        // Check user preferences (global banner dismiss — permanent)
        const dismissed = localStorage.getItem('pwa_prompt_dismissed')
        if (dismissed === 'true') {
            setIsPromptDismissed(true)
        }

        // Detect iOS (iOS Safari requires manual Add to Home Screen)
        const ua = window.navigator.userAgent
        const webkit = !!ua.match(/WebKit/i)
        const isIOSDevice = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i)
        setIsIOS(isIOSDevice && webkit && !ua.match(/CriOS/i))

        // Android / Chrome desktop: beforeinstallprompt
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault() // Prevent default mini-infobar
            setDeferredPrompt(e)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        // appinstalled: clear deferred prompt once installed
        const handleAppInstalled = () => {
            setDeferredPrompt(null)
            setIsStandalone(true)
        }
        window.addEventListener('appinstalled', handleAppInstalled)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
            window.removeEventListener('appinstalled', handleAppInstalled)
            mql.removeEventListener('change', onMqlChange)
        }
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setDeferredPrompt(null)
            setIsStandalone(true)
        }
    }

    const dismissPrompt = () => {
        localStorage.setItem('pwa_prompt_dismissed', 'true')
        setIsPromptDismissed(true)
    }

    // Landing CTA dismiss — 24h cooldown
    const isLandingCtaDismissed = (() => {
        const until = localStorage.getItem(LANDING_CTA_DISMISS_KEY)
        return !!until && Date.now() < Number(until)
    })()

    const dismissLandingCTA = () => {
        localStorage.setItem(LANDING_CTA_DISMISS_KEY, String(Date.now() + LANDING_CTA_COOLDOWN_MS))
    }

    return {
        isInstallable: !!deferredPrompt || (isIOS && !isStandalone),
        isNativePromptAvailable: !!deferredPrompt,
        isIOS,
        isStandalone,
        isPromptDismissed,
        isLandingCtaDismissed,
        handleInstall,
        dismissPrompt,
        dismissLandingCTA,
    }
}
