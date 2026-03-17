import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLang } from '../i18n/I18nContext'

export default function ProtectedRoute({ children, role }) {
    const { user, role: userRole, loading } = useAuth()
    const { lang } = useLang()
    const navigate = useNavigate()

    if (loading) return null

    if (!user) {
        return (
            <div className="auth-gate">
                <div className="auth-gate-icon">🔒</div>
                <h2 className="auth-gate-title">
                    {lang === 'vi' ? 'Cần đăng nhập' : 'Sign in to continue'}
                </h2>
                <p className="auth-gate-desc">
                    {lang === 'vi'
                        ? 'Bạn cần tài khoản KidsTrack để truy cập trang này. Hoàn toàn miễn phí!'
                        : 'You need a KidsTrack account to access this page. It\'s completely free!'
                    }
                </p>
                <button className="btn btn-primary" style={{ marginTop: 8 }} onClick={() => navigate('/login')}>
                    {lang === 'vi' ? '🚀 Đăng nhập / Tạo tài khoản' : '🚀 Sign in / Create account'}
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
                    {lang === 'vi' ? '← Về trang chủ' : '← Back to home'}
                </button>
            </div>
        )
    }

    if (role && userRole !== role) {
        return <Navigate to={userRole === 'kid' ? '/kid' : '/'} replace />
    }

    return children
}
