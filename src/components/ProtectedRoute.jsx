import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useT } from '../i18n/I18nContext'

export default function ProtectedRoute({ children, role }) {
    const { user, role: userRole, loading } = useAuth()
    const t = useT()
    const navigate = useNavigate()

    if (loading) return null

    if (!user) {
        return (
            <div className="auth-gate">
                <div className="auth-gate-icon">🔒</div>
                <h2 className="auth-gate-title">{t('authGate.title')}</h2>
                <p className="auth-gate-desc">{t('authGate.desc')}</p>
                <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => navigate('/login')}>
                    {t('authGate.cta')}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
                    {t('authGate.backHome')}
                </button>
            </div>
        )
    }

    if (role && userRole !== role) {
        return <Navigate to={userRole === 'kid' ? '/kid' : '/'} replace />
    }

    return children
}
