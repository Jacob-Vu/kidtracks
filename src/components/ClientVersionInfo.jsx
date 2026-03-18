import { useMemo, useState } from 'react'
import { useT } from '../i18n/I18nContext'
import clientVersion from '../generated/client-version.json'

export default function ClientVersionInfo() {
    const t = useT()
    const [copied, setCopied] = useState(false)

    const versionText = useMemo(() => {
        const suffix = clientVersion.commitHash ? ` (${clientVersion.commitHash})` : ''
        return `${clientVersion.display}${suffix}`
    }, [])

    const handleCopyVersion = async () => {
        try {
            await navigator.clipboard.writeText(versionText)
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
        } catch {
            setCopied(false)
        }
    }

    return (
        <div className="client-version-info" data-testid="client-version-info">
            <div className="client-version-info__title">{t('app.versionLabel')}</div>
            <div className="client-version-info__meta">
                <code className="client-version-info__value">{versionText}</code>
                <button type="button" className="btn btn-ghost btn-sm" onClick={handleCopyVersion}>
                    {copied ? t('app.versionCopied') : t('app.versionCopy')}
                </button>
            </div>
        </div>
    )
}
