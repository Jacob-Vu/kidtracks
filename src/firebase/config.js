import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getAnalytics, isSupported } from 'firebase/analytics'

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const PROD_PROJECT_ID = 'kidstrack-71632'
const allowProdInDev = import.meta.env.VITE_ALLOW_PROD_IN_DEV === 'true'
if (import.meta.env.DEV && firebaseConfig.projectId === PROD_PROJECT_ID && !allowProdInDev) {
    throw new Error(
        'Safety check: local development is pointing to production Firebase project. ' +
            'Use .env.development.local with a dev Firebase project, or set VITE_ALLOW_PROD_IN_DEV=true to override intentionally.',
    )
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const auth = getAuth(app)

// Analytics is async-initialized to handle environments where it's not supported (e.g., localhost without HTTPS)
export let analytics = null
isSupported().then((supported) => {
    if (supported) analytics = getAnalytics(app)
})
