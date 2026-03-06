import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null) // { role, familyId, kidId?, displayName, email? }
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser)
                try {
                    const snap = await getDoc(doc(db, 'userProfiles', firebaseUser.uid))
                    setProfile(snap.exists() ? { ...snap.data() } : null)
                } catch {
                    setProfile(null)
                }
            } else {
                setUser(null)
                setProfile(null)
            }
            setLoading(false)
        })
        return unsub
    }, [])

    const refreshProfile = async () => {
        if (!user) return
        const snap = await getDoc(doc(db, 'userProfiles', user.uid))
        if (snap.exists()) setProfile({ ...snap.data() })
    }

    const value = {
        user,
        profile,
        role: profile?.role ?? null,
        familyId: profile?.familyId ?? null,
        kidId: profile?.kidId ?? null,
        isParent: profile?.role === 'parent',
        isKid: profile?.role === 'kid',
        loading,
        setProfile,
        refreshProfile,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
