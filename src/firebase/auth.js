import {
    EmailAuthProvider,
    FacebookAuthProvider,
    GoogleAuthProvider,
    OAuthProvider,
    createUserWithEmailAndPassword,
    linkWithCredential,
    linkWithPopup,
    reauthenticateWithCredential,
    signInWithCustomToken,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut as fbSignOut,
    updateEmail,
    updatePassword,
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { getFunctions, httpsCallable } from 'firebase/functions'
import { app, auth, db } from './config'
import { clearE2EState, getE2EState, isE2EMode, updateE2EState } from '../testing/e2e'

const generateId = () => Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
const functions = getFunctions(app, 'asia-southeast1')

// Sanitize email for Firestore doc ID (dots not allowed)
export const sanitizeEmail = (email) => email.toLowerCase().replace(/\./g, ',')

// Synthetic kid email for Firebase Auth
export const kidAuthEmail = (username, familyId) =>
    `${username.toLowerCase()}@${familyId}.kidstrack`

const getProfileState = async (user) => {
    const profileSnap = await getDoc(doc(db, 'userProfiles', user.uid))
    return { isNew: !profileSnap.exists(), user }
}

export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return getProfileState(result.user)
}

export const signInWithFacebook = async () => {
    const provider = new FacebookAuthProvider()
    const result = await signInWithPopup(auth, provider)
    return getProfileState(result.user)
}

export const signInWithApple = async () => {
    const provider = new OAuthProvider('apple.com')
    const result = await signInWithPopup(auth, provider)
    return getProfileState(result.user)
}

export const signUpParentEmail = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password)
    return { isNew: true, user: result.user }
}

export const signInParentEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password)
    return getProfileState(result.user)
}

export const signInParentSimple = async (username, displayName) => {
    if (isE2EMode()) {
        const user = { uid: `simple_${username}`, displayName: displayName || username, email: null }
        updateE2EState((state) => ({
            ...state,
            user,
            profile: state.profile || {
                role: 'parent',
                displayName: displayName || username,
                simpleLogin: true,
                simpleUsername: username,
            },
        }))
        return { isNew: !getE2EState().profile?.familyId, user }
    }

    const call = httpsCallable(functions, 'signInParentSimple')
    const result = await call({ username, displayName })
    const token = result.data?.token
    if (!token) throw new Error('Unable to start simple login.')

    const signInResult = await signInWithCustomToken(auth, token)
    return { isNew: !!result.data?.isNew, user: signInResult.user }
}

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
        email: user.email || null,
    }, { merge: true })

    // Public lookup only available after parent has a linked email.
    if (user.email) {
        await setDoc(doc(db, 'parentEmailLookup', sanitizeEmail(user.email)), {
            familyId,
            parentName: user.displayName || 'Parent',
        })
    }
    return familyId
}

export const lookupFamilyByParentEmail = async (parentEmail) => {
    if (isE2EMode()) {
        const state = getE2EState()
        const lookup = state.authFixtures?.familyLookup?.[sanitizeEmail(parentEmail)]
        if (!lookup) throw new Error('No family found for that parent email.')
        return lookup
    }
    const snap = await getDoc(doc(db, 'parentEmailLookup', sanitizeEmail(parentEmail)))
    if (!snap.exists()) throw new Error('No family found for that parent email.')
    return snap.data() // { familyId, parentName }
}

export const signInKid = async (username, password, familyId) => {
    if (isE2EMode()) {
        const state = getE2EState()
        const normalizedUsername = username.trim().toLowerCase()
        const account = state.authFixtures?.kidAccounts?.find((item) =>
            item.username === normalizedUsername &&
            item.password === password &&
            item.familyId === familyId
        )

        if (!account) {
            const error = new Error('Wrong username or password.')
            error.code = 'auth/invalid-credential'
            throw error
        }

        updateE2EState((current) => ({
            ...current,
            user: account.user,
            profile: account.profile,
        }))

        return account.user
    }
    const email = kidAuthEmail(username, familyId)
    const result = await signInWithEmailAndPassword(auth, email, password)
    return result.user
}

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
    return data.localId
}

export const resetKidPasswordAdmin = async () => {
    throw new Error('Use KidProfile to change password (kid must do it themselves).')
}

export const changeKidPassword = async (currentPassword, newPassword) => {
    if (isE2EMode()) return
    const user = auth.currentUser
    if (!user) throw new Error('Not signed in')
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    await updatePassword(user, newPassword)
}

export const linkKidEmail = async (currentPassword, newEmail) => {
    if (isE2EMode()) {
        updateE2EState((state) => ({
            ...state,
            user: state.user ? { ...state.user, email: newEmail } : state.user,
            profile: state.profile ? { ...state.profile, linkedEmail: newEmail, email: newEmail } : state.profile,
        }))
        return
    }
    const user = auth.currentUser
    if (!user) throw new Error('Not signed in')
    const credential = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, credential)
    await updateEmail(user, newEmail)
    await setDoc(doc(db, 'userProfiles', user.uid), { linkedEmail: newEmail }, { merge: true })
}

const mergeParentProfile = async (user, familyId) => {
    await setDoc(doc(db, 'userProfiles', user.uid), {
        role: 'parent',
        familyId: familyId || null,
        displayName: user.displayName || 'Parent',
        email: user.email || null,
        simpleLogin: false,
    }, { merge: true })

    if (user.email && familyId) {
        await setDoc(doc(db, 'parentEmailLookup', sanitizeEmail(user.email)), {
            familyId,
            parentName: user.displayName || 'Parent',
        }, { merge: true })
    }
}

export const linkParentGoogle = async (familyId) => {
    const user = auth.currentUser
    if (!user) throw new Error('Not signed in')
    const provider = new GoogleAuthProvider()
    const result = await linkWithPopup(user, provider)
    await mergeParentProfile(result.user, familyId)
    return result.user
}

export const linkParentApple = async (familyId) => {
    const user = auth.currentUser
    if (!user) throw new Error('Not signed in')
    const provider = new OAuthProvider('apple.com')
    const result = await linkWithPopup(user, provider)
    await mergeParentProfile(result.user, familyId)
    return result.user
}

export const linkParentFacebook = async (familyId) => {
    const user = auth.currentUser
    if (!user) throw new Error('Not signed in')
    const provider = new FacebookAuthProvider()
    const result = await linkWithPopup(user, provider)
    await mergeParentProfile(result.user, familyId)
    return result.user
}

export const linkParentEmailPassword = async (email, password, familyId) => {
    const user = auth.currentUser
    if (!user) throw new Error('Not signed in')
    const credential = EmailAuthProvider.credential(email, password)
    const result = await linkWithCredential(user, credential)
    await mergeParentProfile(result.user, familyId)
    return result.user
}

export const signOut = () => {
    if (isE2EMode()) {
        clearE2EState()
        return Promise.resolve()
    }
    return fbSignOut(auth)
}
