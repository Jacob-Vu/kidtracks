import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * ProtectedRoute — guards routes based on auth + role.
 * @param {string} role - 'parent' | 'kid' | undefined (any logged-in user)
 * @param {string} redirect - where to redirect if unauthorized
 */
export default function ProtectedRoute({ children, role, redirect = '/login' }) {
    const { user, role: userRole, loading } = useAuth()

    if (loading) return null // AuthContext still initializing

    if (!user) return <Navigate to="/login" replace />

    if (role && userRole !== role) {
        // Kid trying to access parent route → go to kid dashboard
        // Parent trying to access kid route → go to parent dashboard
        return <Navigate to={userRole === 'kid' ? '/kid' : '/'} replace />
    }

    return children
}
