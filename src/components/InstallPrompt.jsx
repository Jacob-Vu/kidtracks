import { useT } from '../i18n/I18nContext'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { useEffect, useState } from 'react'

export default function InstallPrompt() {
    const t = useT()
    const { isInstallable, isIOS, isStandalone, isPromptDismissed, handleInstall, dismissPrompt } = useInstallPrompt()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted || isStandalone || isPromptDismissed || !isInstallable) return null

    return (
        <div className="install-prompt animate-in">
            <div className="install-prompt-content row center between">
                <div className="row center" style={{ gap: 12, flex: 1 }}>
                    <div className="install-icon">⭐</div>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 14 }}>{t('pwa.title', 'Install KidsTrack')}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {isIOS
                                ? t('pwa.iosInstructions', 'Tap Share ⍐ then "Add to Home Screen"')
                                : t('pwa.androidInstructions', 'Add to home screen for quick access')}
                        </div>
                    </div>
                </div>
                <div className="row center" style={{ gap: 8 }}>
                    {!isIOS && (
                        <button className="btn btn-primary btn-sm" onClick={handleInstall} aria-label={t('pwa.installBtn', 'Install')}>
                            {t('pwa.installBtn', 'Install')}
                        </button>
                    )}
                    <button className="btn btn-ghost btn-icon" onClick={dismissPrompt} style={{ padding: 4 }} aria-label={t('common.close')}>
                        ✕
                    </button>
                </div>
            </div>
        </div>
    )
}
