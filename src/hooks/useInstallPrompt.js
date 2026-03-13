import { useState, useEffect } from 'react'

export function useInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null)
    const [isIOS, setIsIOS] = useState(false)
    const [isStandalone, setIsStandalone] = useState(false)
    const [isPromptDismissed, setIsPromptDismissed] = useState(false)

    useEffect(() => {
        // Detect if standalone (already installed)
        const checkStandalone = () => {
            return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://')
        }
        setIsStandalone(checkStandalone())

        // Check user preferences
        const dismissed = localStorage.getItem('pwa_prompt_dismissed')
        if (dismissed === 'true') {
            setIsPromptDismissed(true)
        }

        // Detect iOS (iOS Safari specific workarounds needed)
        const ua = window.navigator.userAgent
        const webkit = !!ua.match(/WebKit/i)
        const isIOSDevice = !!ua.match(/iPad/i) || !!ua.match(/iPhone/i)
        const isSafari = isIOSDevice && webkit && !ua.match(/CriOS/i)
        setIsIOS(isIOSDevice)

        // Android / Chrome desktop triggers
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault() // Prevent standard banner
            setDeferredPrompt(e)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

        return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }, [])

    const handleInstall = async () => {
        if (!deferredPrompt) return
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setDeferredPrompt(null)
            setIsStandalone(true) // assume success
        }
    }

    const dismissPrompt = () => {
        localStorage.setItem('pwa_prompt_dismissed', 'true')
        setIsPromptDismissed(true)
    }

    return {
        isInstallable: !!deferredPrompt || (isIOS && !isStandalone),
        isIOS,
        isStandalone,
        isPromptDismissed,
        handleInstall,
        dismissPrompt
    }
}
