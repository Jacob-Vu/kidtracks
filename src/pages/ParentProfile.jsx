import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import useStore from '../store/useStore'
import { useT } from '../i18n/I18nContext'
import { formatMoney } from '../utils/format'
import NotificationSettings from '../components/NotificationSettings'
import ClientVersionInfo from '../components/ClientVersionInfo'

export default function ParentProfile() {
    const t = useT()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const { user } = useAuth()
    const { kids } = useStore()

    const selectedKidId = searchParams.get('kidId') || ''
    const selectedKid = useMemo(() => {
        if (!selectedKidId) return null
        return kids.find((kid) => kid.id === selectedKidId) || null
    }, [kids, selectedKidId])

    return (
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div className="page-header">
                <h1 className="page-title">{t('nav.profile')}</h1>
                <p className="page-subtitle">{t('parent.profileSubtitle')}</p>
            </div>

            <div className="card" style={{ marginBottom: 16 }}>
                <div className="row between center" style={{ gap: 12, flexWrap: 'wrap' }}>
                    <div>
                        <div style={{ fontWeight: 800, fontSize: 16 }}>{user?.displayName || user?.email || t('parent.accountFallback')}</div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{user?.email || t('parent.noLinkedEmail')}</div>
                    </div>
                    <span className="badge badge-purple">{t('dash.kidsSummaryProfiles', { count: kids.length })}</span>
                </div>
            </div>

            {selectedKid && (
                <div className="card" style={{ marginBottom: 16 }}>
                    <div className="row between center" style={{ gap: 10, flexWrap: 'wrap' }}>
                        <div className="row center" style={{ gap: 10 }}>
                            <span style={{ fontSize: 42 }}>{selectedKid.avatar}</span>
                            <div>
                                <div style={{ fontWeight: 800, fontSize: 16 }}>{selectedKid.displayName || selectedKid.name}</div>
                                <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{formatMoney(selectedKid.balance)}</div>
                            </div>
                        </div>
                        <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/daily/${selectedKid.id}`)}>{t('dash.tasks')}</button>
                    </div>
                </div>
            )}

            <div className="card">
                <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>{t('dash.kidsSummaryTitle')}</div>
                <div className="card-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                    {kids.map((kid) => (
                        <button
                            key={kid.id}
                            className="kid-profile-link"
                            type="button"
                            onClick={() => navigate(`/profile?kidId=${kid.id}`)}
                        >
                            <span className="kid-profile-link__avatar" aria-hidden>{kid.avatar}</span>
                            <span className="kid-profile-link__name">{kid.displayName || kid.name}</span>
                            <span className="kid-profile-link__balance">{formatMoney(kid.balance)}</span>
                        </button>
                    ))}
                </div>
            </div>

            <NotificationSettings />
            <ClientVersionInfo />
        </div>
    )
}
