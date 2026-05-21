import { useState } from 'react'
import { signInWithPopup } from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db, googleProvider } from '../firebase'
import { getTodayStr } from '../utils/dates'
import toast from 'react-hot-toast'

const rules = [
  { icon: '🏋️', title: 'Work Out Daily', desc: 'At least 45 minutes of exercise' },
  { icon: '👟', title: '8K Steps', desc: '8,000 steps every single day' },
  { icon: '📖', title: 'Read Daily', desc: '20 minutes of reading' },
  { icon: '🍸', title: 'Weekend Drinks Only', desc: 'No alcohol on weekdays' },
]

export default function Login() {
  const [loading, setLoading] = useState(false)

  async function handleGoogle() {
    setLoading(true)
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user
      const userRef = doc(db, 'users', user.uid)
      const snap = await getDoc(userRef)
      if (!snap.exists()) {
        await setDoc(userRef, {
          displayName: user.displayName,
          photoURL: user.photoURL,
          email: user.email,
          startDate: getTodayStr(),
          currentStreak: 0,
          longestStreak: 0,
          totalComplete: 0,
          todayComplete: false,
          todayCount: 0,
          todayTotal: 4,
          joinedAt: serverTimestamp(),
        })
      }
    } catch {
      toast.error('Sign in failed. Check your pop-up blocker and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
      {/* Hero */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 mb-5 text-4xl shadow-lg shadow-violet-900/40">
          💪
        </div>
        <h1 className="text-5xl font-black text-white tracking-tight">75 SOFT</h1>
        <p className="text-zinc-400 mt-2 text-sm">Challenge your limits. Build your lifestyle.</p>
      </div>

      {/* Rules */}
      <div className="w-full max-w-sm space-y-2.5 mb-8">
        {rules.map((rule) => (
          <div
            key={rule.title}
            className="flex items-center gap-4 bg-zinc-900 rounded-2xl p-4 border border-zinc-800"
          >
            <span className="text-2xl">{rule.icon}</span>
            <div>
              <p className="text-white font-semibold text-sm">{rule.title}</p>
              <p className="text-zinc-500 text-xs">{rule.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sign In */}
      <button
        onClick={handleGoogle}
        disabled={loading}
        className="w-full max-w-sm bg-white text-zinc-900 font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-zinc-100 active:bg-zinc-200 transition-colors disabled:opacity-60 shadow-lg"
      >
        {loading ? (
          <div className="w-5 h-5 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Join with Google
          </>
        )}
      </button>

      <p className="text-zinc-700 text-xs mt-6 text-center">
        75 days · 4 habits · Your best self
      </p>
    </div>
  )
}
