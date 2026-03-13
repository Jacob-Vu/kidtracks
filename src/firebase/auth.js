import {
    GoogleAuthProvider,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as fbSignOut,
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updateEmail,
} from 'firebase/auth'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { auth, db } from './config'
import { clearE2EState, isE2EMode } from '../testing/e2e'

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36)

// Sanitize email for Firestore doc ID (dots not allowed)
export const sanitizeEmail = (email) => email.toLowerCase().replace(/\./g, ',')

// Synthetic kid email for Firebase Auth
export const kidAuthEmail = (username, familyId) =>
    `${username.toLowerCase()}@${familyId}.kidstrack`

// ─── Parent: Google Sign-In ──────────────────────────────────────────────────
export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    const user = result.user
    const profileSnap = await getDoc(doc(db, 'userProfiles', user.uid))
    return { isNew: !profileSnap.exists(), user }
}

// ─── Parent: Email/Password Sign Up ──────────────────────────────────────────
export const signUpParentEmail = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    return { isNew: true, user: result.user }
}

// ─── Parent: Email/Password Sign In ──────────────────────────────────────────
export const signInParentEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    const user = result.user
    const profileSnap = await getDoc(doc(db, 'userProfiles', user.uid))
    return { isNew: !profileSnap.exists(), user }
}

// ─── Parent: Create Family (first-time setup) ────────────────────────────────
export const createFamily = async (user, familyName) => {
    const familyId = generateId()
    await setDoc(doc(db, 'families', familyId), {
        name: familyName,
        parentUids: [user.uid],
        createdAt: new Date().toISOString(),
    })
    await setDoc(doc(db, 'userProfiles', user.uid), {
        role: 'parent',
        familyId,
        displayName: user.displayName || 'Parent',
        email: user.email,
    })
    // Public lookup: kids find family by parent email
    await setDoc(doc(db, 'parentEmailLookup', sanitizeEmail(user.email)), {
        familyId,
        parentName: user.displayName || 'Parent',
    })
    return familyId
}

// ─── Kid: Lookup family by parent email (public, pre-auth) ──────────────────
export const lookupFamilyByParentEmail = async (parentEmail) => {
    const snap = await getDoc(doc(db, 'parentEmailLookup', sanitizeEmail(parentEmail)))
    if (!snap.exists()) throw new Error('No family found for that parent email.')
    return snap.data() // { familyId, parentName }
}

// ─── Kid: Sign in ────────────────────────────────────────────────────────────
export const signInKid = async (username, password, familyId) => {
    const email = kidAuthEmail(username, familyId)
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
}

// ─── Parent: Create kid account (via REST so parent stays signed in) ─────────
export const createKidAuthAccount = async (username, password, familyId) => {
    const email = kidAuthEmail(username, familyId)
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY
    const res = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, returnSecureToken: false }),
        }
    )
    if (!res.ok) {
        const err = await res.json()
        const msg = err.error?.message || 'Failed to create account'
        if (msg === 'EMAIL_EXISTS') throw new Error('That username is already taken.')
        throw new Error(msg)
    }
    const data = await res.json()
    return data.localId // Firebase UID of the new kid
}

// ─── Parent: Reset kid password via REST ─────────────────────────────────────
export const resetKidPasswordAdmin = async (username, newPassword, familyId) => {
    // 1. Get kid's Firebase UID from Firestore
    const email = kidAuthEmail(username, familyId)
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY

    // Need to get idToken of a user with the email — can't do this client-side without signing in.
    // Instead, parent temporarily signs in as kid using current password, then resets.
    // But we won't have the current password. Use Admin SDK approach workaround:
    // Store a "pendingPasswordReset" flag in Firestore; kid sees it and is forced to change pw on next login.
    // For now, we'll just update a flag so parent knows.
    // A simpler UX: parent sets NEW password directly via the API (requires knowing current password).
    // We'll store a temp password in Firestore (encrypted discussion is out of scope for now).
    // Practical solution: parent sets temp password, kid must change it.
    // We sign in as kid briefly, change password, sign back out, then sign parent back in.
    throw new Error('Use KidProfile to change password (kid must do it themselves).')
}

// ─── Kid: Change own password ─────────────────────────────────────────────────
export const changeKidPassword = async (currentPassword, newPassword) => {
    const user = auth.currentUser
    if (!user) throw new Error('Not signed in')
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, newPassword)
}

// ─── Kid: Link real email ────────────────────────────────────────────────────
export const linkKidEmail = async (currentPassword, newEmail) => {
    const user = auth.currentUser
    if (!user) throw new Error('Not signed in')
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    await updateEmail(user, newEmail)
    // Update userProfile
    await setDoc(doc(db, 'userProfiles', user.uid), { linkedEmail: newEmail }, { merge: true })
}

// ─── Sign out ─────────────────────────────────────────────────────────────────
export const signOut = () => {
    if (isE2EMode()) {
        clearE2EState()
        return Promise.resolve()
    }
    return fbSignOut(auth)
}
