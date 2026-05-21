import { useState, useEffect } from 'react'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import { Flame, CheckCircle2, Circle } from 'lucide-react'

function Avatar({ user }) {
  if (user.photoURL) {
    return <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
  }
  return (
    <div className="w-10 h-10 rounded-full bg-violet-700 flex items-center justify-center text-white font-bold flex-shrink-0">
      {(user.displayName || user.email || '?')[0].toUpperCase()}
    </div>
  )
}

function RankBadge({ rank }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
  if (medals[rank]) {
    return <span className="text-xl w-7 text-center flex-shrink-0">{medals[rank]}</span>
  }
  return (
    <span className="text-zinc-500 font-bold text-sm w-7 text-center flex-shrink-0">{rank}</span>
  )
}

function MiniRing({ count, total }) {
  const pct = total > 0 ? count / total : 0
  const r = 10
  const circ = 2 * Math.PI * r
  const offset = circ - pct * circ
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" className="-rotate-90">
      <circle cx="14" cy="14" r={r} fill="none" stroke="#27272a" strokeWidth="3.5" />
      <circle
        cx="14"
        cy="14"
        r={r}
        fill="none"
        stroke="#7c3aed"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
      />
    </svg>
  )
}

export default function Leaderboard() {
  const { user } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('currentStreak', 'desc'))
    getDocs(q)
      .then((snap) => {
        setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 pb-28">
      <div className="px-5 pt-14 pb-6">
        <h1 className="text-2xl font-black text-white">The Squad 🏆</h1>
        <p className="text-zinc-500 text-sm mt-1">Ranked by current streak</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <p className="text-center text-zinc-600 py-16">No participants yet. Share the link!</p>
      ) : (
        <div className="px-4 space-y-2.5">
          {users.map((u, i) => {
            const isMe = u.id === user?.uid
            const streak = u.currentStreak ?? 0
            const todayCount = u.todayCount ?? 0
            const todayTotal = u.todayTotal ?? 4
            const todayDone = u.todayComplete ?? false

            return (
              <div
                key={u.id}
                className={`flex items-center gap-3.5 p-4 rounded-2xl border transition-colors ${
                  isMe
                    ? 'bg-violet-950/40 border-violet-600/40'
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <RankBadge rank={i + 1} />
                <Avatar user={u} />

                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">
                    {u.displayName || u.email || 'Unknown'}
                    {isMe && (
                      <span className="text-violet-400 text-xs font-normal ml-2">you</span>
                    )}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Flame size={12} className="text-orange-400 flex-shrink-0" />
                    <span className="text-zinc-400 text-xs">
                      {streak} day{streak !== 1 ? 's' : ''} streak
                    </span>
                  </div>
                </div>

                {/* Today's progress mini ring */}
                <div className="flex flex-col items-center gap-0.5">
                  <MiniRing count={todayCount} total={todayTotal} />
                  <span className="text-zinc-600 text-xs">
                    {todayCount}/{todayTotal}
                  </span>
                </div>

                {todayDone ? (
                  <CheckCircle2 size={20} className="text-emerald-400 flex-shrink-0" />
                ) : (
                  <Circle size={20} className="text-zinc-700 flex-shrink-0" />
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Stats bar for current user */}
      {users.length > 0 && (() => {
        const me = users.find((u) => u.id === user?.uid)
        if (!me) return null
        return (
          <div className="mx-4 mt-6 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
            <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3">
              Your Stats
            </p>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                { label: 'Streak', value: `${me.currentStreak ?? 0} 🔥` },
                { label: 'Best', value: `${me.longestStreak ?? 0} 🏅` },
                { label: 'Total', value: `${me.totalComplete ?? 0} ✅` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-white font-black text-lg">{value}</p>
                  <p className="text-zinc-600 text-xs">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      <Navbar />
    </div>
  )
}
