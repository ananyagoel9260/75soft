import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, setPersistence, indexedDBLocalPersistence, browserLocalStoragePersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

// Guard against missing env vars during local dev / first-time setup
export const isConfigured = !!import.meta.env.VITE_FIREBASE_API_KEY

let auth, db, googleProvider

if (isConfigured) {
  const app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  googleProvider = new GoogleAuthProvider()

  // Use IndexedDB persistence so auth survives on iOS PWA standalone mode
  // Falls back to localStorage if IndexedDB isn't available
  setPersistence(auth, indexedDBLocalPersistence).catch(() =>
    setPersistence(auth, browserLocalStoragePersistence).catch(() => {})
  )
}

export { auth, db, googleProvider }
