import { useMemo, useState } from 'react'
import { useT } from '../i18n/I18nContext'
import clientVersion from '../generated/client-version.json'

function to2Digits(value) {
    return String(value).padStart(2, '0')
}

function formatReleaseStamp(isoText) {
    if (!isoText) return ''
    const date = new Date(isoText)
    if (Number.isNaN(date.getTime())) return ''
    const mm = to2Digits(date.getUTCMonth() + 1)
    const dd = to2Digits(date.getUTCDate())
    const hh = to2Digits(date.getUTCHours())
    const min = to2Digits(date.getUTCMinutes())
    return `${mm}.${dd}.${hh}.${min}`
}

export default function ClientVersionInfo() {
    const t = useT()
    const [copied, setCopied] = useState(false)

    const versionText = useMemo(() => {
        const commitPart = clientVersion.commitHash ? `commit:${clientVersion.commitHash}` : ''
        const releaseStamp = clientVersion.releaseStamp || formatReleaseStamp(clientVersion.deployedAt)
        return [clientVersion.display, commitPart, releaseStamp].filter(Boolean).join(' | ')
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
