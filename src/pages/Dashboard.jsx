import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../store/useStore'
import { useFireActions } from '../hooks/useFirebaseSync'
import { useT } from '../i18n/I18nContext'
import { useAuth } from '../contexts/AuthContext'
import KidAccountModal from '../components/KidAccountModal'
import Modal from '../components/Modal'
import { formatMoney } from '../utils/format'
import { linkParentApple, linkParentEmailPassword, linkParentFacebook, linkParentGoogle } from '../firebase/auth'

export default function Dashboard() {
    const t = useT()
    const { user, familyId, refreshProfile } = useAuth()
    const { kids } = useStore()
    const { deleteKid } = useFireActions()
    const navigate = useNavigate()
    const [showCreate, setShowCreate] = useState(false)
    const [editKid, setEditKid] = useState(null)
    const [deleteKidTarget, setDeleteKidTarget] = useState(null)
    const [showLinkModal, setShowLinkModal] = useState(false)
    const [linkBusy, setLinkBusy] = useState(false)
    const [linkError, setLinkError] = useState('')
    const [linkEmail, setLinkEmail] = useState('')
    const [linkPassword, setLinkPassword] = useState('')

    const providerIds = (user?.providerData || []).map((p) => p.providerId)
    const hasLinkedAccount = !!user?.email || providerIds.some((id) => ['password', 'google.com', 'apple.com', 'facebook.com'].includes(id))
    const shouldShowLinkPrompt = kids.length > 0 && !hasLinkedAccount

    const handleLink = async (fn) => {
        setLinkBusy(true)
        setLinkError('')
        try {
            await fn()
            await refreshProfile()
            setShowLinkModal(false)
        } catch (err) {
            setLinkError(err.message)
        } finally {
            setLinkBusy(false)
        }
    }

    return (
        <div>
            <div className="page-header row between center">
                <div>
                    <h1 className="page-title">{t('dash.title')}</h1>
                    <p className="page-subtitle">{t('dash.subtitle')}</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowCreate(true)}>{t('dash.addKid')}</button>
            </div>

            {shouldShowLinkPrompt && (
                <div className="card" style={{ marginBottom: 16, borderColor: 'rgba(245,158,11,0.35)' }}>
                    <div className="row between center wrap" style={{ gap: 10 }}>
                        <div>
                            <div style={{ fontWeight: 800, fontSize: 15 }}>{t('dash.linkPromptTitle', 'Protect your data')}</div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                                {t('dash.linkPromptDesc', 'Link an email or social account so your family data can always be recovered.')}
                            </div>
                        </div>
                        <button className="btn btn-amber" onClick={() => setShowLinkModal(true)}>
                            {t('dash.linkNow', 'Link account')}
                        </button>
                    </div>
                </div>
            )}

            {kids.length === 0 ? (
                <div className="empty-state">
                    <span className="empty-state-icon">🧒</span>
                    <p className="empty-state-title">{t('dash.noKids')}</p>
                    <p className="empty-state-desc">{t('dash.noKidsDesc')}</p>
                    <button className="btn btn-primary" onClick={() => setShowCreate(true)}>{t('dash.addFirst')}</button>
                </div>
            ) : (
                <div className="card-grid">
                    {kids.map((kid) => (
                        <div
                            key={kid.id}
                            className="kid-card"
                            role="button"
                            tabIndex={0}
                            onClick={() => navigate(`/daily/${kid.id}`)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    navigate(`/daily/${kid.id}`)
                                }
                            }}
                            aria-label={`Open ${kid.displayName || kid.name} daily tasks`}
                        >
                            <span className="kid-avatar">{kid.avatar}</span>
                            <div className="kid-name">{kid.displayName || kid.name}</div>
                            {kid.username && (
                                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>@{kid.username}</div>
                            )}
                            <div className="kid-balance">{formatMoney(kid.balance)}</div>
                            <div className="kid-balance-label">{t('dash.pocketMoney')}</div>
                            <div className="row" style={{ marginTop: 16, justifyContent: 'center', gap: 8 }}>
                                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/daily/${kid.id}`) }}>{t('dash.tasks')}</button>
                                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); navigate(`/ledger/${kid.id}`) }}>{t('dash.ledger')}</button>
                                <button className="btn btn-ghost btn-sm" onClick={(e) => { e.stopPropagation(); setEditKid(kid) }} aria-label="Edit kid">✏️</button>
                                <button className="btn btn-danger btn-sm" onClick={(e) => {
                                    e.stopPropagation()
                                    setDeleteKidTarget(kid)
                                }} aria-label="Delete kid">🗑️</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showCreate && <KidAccountModal onClose={() => setShowCreate(false)} />}
            {editKid && <KidAccountModal kid={editKid} onClose={() => setEditKid(null)} />}
            {deleteKidTarget && (
                <Modal title={t('common.delete')} onClose={() => setDeleteKidTarget(null)}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
                        {t('dash.removeConfirm', { name: deleteKidTarget.displayName || deleteKidTarget.name })}
                    </p>
                    <div className="modal-footer">
                        <button className="btn btn-ghost" onClick={() => setDeleteKidTarget(null)}>{t('common.cancel')}</button>
                        <button className="btn btn-danger" onClick={() => {
                            deleteKid(deleteKidTarget.id)
                            setDeleteKidTarget(null)
                        }}>
                            {t('common.delete')}
                        </button>
                    </div>
                </Modal>
            )}
            {showLinkModal && (
                <Modal title={t('dash.linkPromptTitle', 'Protect your data')} onClose={() => setShowLinkModal(false)}>
                    <div className="col" style={{ gap: 10 }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>
                            {t('dash.linkPromptDesc', 'Link an email or social account so your family data can always be recovered.')}
                        </p>
                        {linkError && <div className="login-error">{linkError}</div>}
                        <button className="btn btn-ghost" disabled={linkBusy} onClick={() => handleLink(() => linkParentGoogle(familyId))}>
                            {t('dash.linkGoogle', 'Link Google')}
                        </button>
                        <button className="btn btn-ghost" disabled={linkBusy} onClick={() => handleLink(() => linkParentApple(familyId))}>
                            {t('dash.linkApple', 'Link Apple')}
                        </button>
                        <button className="btn btn-ghost" disabled={linkBusy} onClick={() => handleLink(() => linkParentFacebook(familyId))}>
                            {t('dash.linkFacebook', 'Link Facebook')}
                        </button>
                        <div className="divider" />
                        <div className="form-group">
                            <label>{t('dash.linkEmailLabel', 'Email')}</label>
                            <input type="email" value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} placeholder={t('login.emailPlaceholder')} />
                        </div>
                        <div className="form-group">
                            <label>{t('dash.linkPasswordLabel', 'Password')}</label>
                            <input type="password" value={linkPassword} onChange={(e) => setLinkPassword(e.target.value)} placeholder="••••••••" />
                        </div>
                        <button
                            className="btn btn-primary"
                            disabled={linkBusy || !linkEmail.trim() || linkPassword.length < 6}
                            onClick={() => handleLink(() => linkParentEmailPassword(linkEmail.trim(), linkPassword, familyId))}
                        >
                            {t('dash.linkEmailBtn', 'Link email')}
                        </button>
                    </div>
                </Modal>
            )}
        </div>
    )
}
