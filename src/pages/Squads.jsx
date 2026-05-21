import { useState, useEffect } from 'react'
import {
  collection, doc, getDoc, getDocs, query, where,
  addDoc, updateDoc, onSnapshot, serverTimestamp,
  arrayUnion, arrayRemove,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import { Copy, LogOut, Flame, CheckCircle2, Circle, Plus, Hash } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'

const BADGE_EMOJI = {
  first_complete: '✅',
  streak_7: '🔥',
  streak_30: '💎',
  streak_75: '🏆',
  first_post: '📸',
}

function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function Avatar({ u }) {
  if (u?.photoURL) return <img src={u.photoURL} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
  return (
    <div className="w-10 h-10 rounded-full bg-violet-700 flex items-center justify-center text-white font-bold flex-shrink-0">
      {(u?.displayName || u?.email || '?')[0].toUpperCase()}
    </div>
  )
}

function RankBadge({ rank }) {
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' }
  if (medals[rank]) return <span className="text-xl w-7 text-center flex-shrink-0">{medals[rank]}</span>
  return <span className="text-zinc-500 font-bold text-sm w-7 text-center flex-shrink-0">{rank}</span>
}

export default function Squads() {
  const { user } = useAuth()
  const [userData, setUserData] = useState(null)
  const [squad, setSquad] = useState(null)
  const [members, setMembers] = useState([])
  const [view, setView] = useState('home')
  const [squadName, setSquadName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user) return
    const unsub = onSnapshot(doc(db, 'users', user.uid), async (snap) => {
      const data = snap.data() || {}
      setUserData(data)

      if (data.squadId) {
        try {
          const squadSnap = await getDoc(doc(db, 'squads', data.squadId))
          if (squadSnap.exists()) {
            const squadData = { id: squadSnap.id, ...squadSnap.data() }
            setSquad(squadData)
            const memberDocs = await Promise.all(
              (squadData.members || []).map((id) => getDoc(doc(db, 'users', id)))
            )
            setMembers(
              memberDocs
                .filter((d) => d.exists())
                .map((d) => ({ id: d.id, ...d.data() }))
                .sort((a, b) => (b.currentStreak || 0) - (a.currentStreak || 0))
            )
          }
        } catch {}
      } else {
        setSquad(null)
        setMembers([])
      }
      setLoading(false)
    })
    return unsub
  }, [user?.uid])

  async function handleCreate() {
    if (!squadName.trim() || !user) return
    setBusy(true)
    try {
      const code = generateCode()
      const ref = await addDoc(collection(db, 'squads'), {
        name: squadName.trim(),
        code,
        createdBy: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'users', user.uid), { squadId: ref.id })
      toast.success('Squad created! 🎉')
      setView('home')
    } catch {
      toast.error('Failed to create squad')
    } finally {
      setBusy(false)
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase()
    if (code.length !== 6 || !user) return
    setBusy(true)
    try {
      const q = query(collection(db, 'squads'), where('code', '==', code))
      const snap = await getDocs(q)
      if (snap.empty) { toast.error('No squad with that code'); return }
      const squadDoc = snap.docs[0]
      if (squadDoc.data().members?.includes(user.uid)) {
        toast("You're already in this squad!"); return
      }
      await updateDoc(doc(db, 'squads', squadDoc.id), { members: arrayUnion(user.uid) })
      await updateDoc(doc(db, 'users', user.uid), { squadId: squadDoc.id })
      toast.success(`Joined ${squadDoc.data().name}! 🎉`)
      setView('home')
    } catch {
      toast.error('Failed to join squad')
    } finally {
      setBusy(false)
    }
  }

  async function handleLeave() {
    if (!squad || !user) return
    setBusy(true)
    try {
      await updateDoc(doc(db, 'squads', squad.id), { members: arrayRemove(user.uid) })
      await updateDoc(doc(db, 'users', user.uid), { squadId: null })
      toast.success('Left the squad')
    } catch {
      toast.error('Failed to leave')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-28">
      {squad ? (
        <>
          {/* Squad header */}
          <div className="px-5 pt-14 pb-5">
            <p className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Your Squad</p>
            <h1 className="text-2xl font-black text-white mt-0.5">{squad.name}</h1>

            {/* Invite code */}
            <div className="mt-3 flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3">
              <Hash size={15} className="text-violet-400 flex-shrink-0" />
              <span className="text-white font-mono font-bold tracking-widest flex-1 text-lg">
                {squad.code}
              </span>
              <button
                onClick={() => { navigator.clipboard.writeText(squad.code); toast.success('Code copied!') }}
                className="flex items-center gap-1.5 text-violet-400 text-sm font-semibold"
              >
                <Copy size={14} /> Copy
              </button>
            </div>
            <p className="text-zinc-600 text-xs mt-2 text-center">
              Share this code with friends to invite them
            </p>
          </div>

          {/* Member leaderboard */}
          <div className="px-4 space-y-2.5">
            {members.map((m, i) => {
              const isMe = m.id === user?.uid
              return (
                <div
                  key={m.id}
                  className={`flex items-center gap-3.5 p-4 rounded-2xl border ${
                    isMe ? 'bg-violet-950/40 border-violet-600/40' : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <RankBadge rank={i + 1} />
                  <Avatar u={m} />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate">
                      {m.displayName || m.email}
                      {isMe && <span className="text-violet-400 text-xs font-normal ml-2">you</span>}
                    </p>
                    {m.badges?.length > 0 && (
                      <p className="text-sm mt-0.5 leading-none">
                        {m.badges.slice(0, 5).map((b) => BADGE_EMOJI[b] || '').join(' ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {m.todayComplete ? (
                      <CheckCircle2 size={18} className="text-emerald-400" />
                    ) : (
                      <Circle size={18} className="text-zinc-700" />
                    )}
                    <Flame size={15} className="text-orange-400" />
                    <span className="text-white font-bold text-sm">{m.currentStreak || 0}</span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Leave squad */}
          <div className="px-4 mt-6">
            <button
              onClick={handleLeave}
              disabled={busy}
              className="w-full py-3 rounded-2xl border border-zinc-800 text-zinc-500 text-sm font-medium flex items-center justify-center gap-2 hover:border-rose-800 hover:text-rose-400 transition-colors disabled:opacity-40"
            >
              <LogOut size={15} /> Leave Squad
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="px-5 pt-14 pb-4">
            <h1 className="text-2xl font-black text-white">Squads 🏟️</h1>
            <p className="text-zinc-500 text-sm mt-1">Compete with your crew</p>
          </div>

          <AnimatePresence mode="wait">
            {view === 'home' && (
              <motion.div
                key="home"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="px-4"
              >
                <div className="flex flex-col items-center py-10 text-center">
                  <div className="text-6xl mb-4">🏟️</div>
                  <p className="text-white font-bold text-lg">No squad yet</p>
                  <p className="text-zinc-500 text-sm mt-2 max-w-xs">
                    Create a squad and share your code, or enter a code your friend gave you.
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={() => setView('create')}
                    className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-violet-900/30"
                  >
                    <Plus size={18} /> Create a Squad
                  </button>
                  <button
                    onClick={() => setView('join')}
                    className="w-full py-4 bg-zinc-900 border border-zinc-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
                  >
                    <Hash size={18} /> Join with a Code
                  </button>
                </div>
              </motion.div>
            )}

            {view === 'create' && (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                className="px-4 space-y-4"
              >
                <button onClick={() => setView('home')} className="text-violet-400 text-sm font-semibold">
                  ← Back
                </button>
                <div>
                  <p className="text-white font-bold text-xl">Name your squad</p>
                  <p className="text-zinc-500 text-sm mt-1">Something your friends will recognise</p>
                </div>
                <input
                  value={squadName}
                  onChange={(e) => setSquadName(e.target.value)}
                  placeholder="e.g. Grind Gang 💪"
                  maxLength={30}
                  autoFocus
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-4 text-white text-base placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
                <button
                  onClick={handleCreate}
                  disabled={!squadName.trim() || busy}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {busy ? 'Creating...' : 'Create Squad 🚀'}
                </button>
              </motion.div>
            )}

            {view === 'join' && (
              <motion.div
                key="join"
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                className="px-4 space-y-4"
              >
                <button onClick={() => setView('home')} className="text-violet-400 text-sm font-semibold">
                  ← Back
                </button>
                <div>
                  <p className="text-white font-bold text-xl">Enter squad code</p>
                  <p className="text-zinc-500 text-sm mt-1">Ask your friend for their 6-letter code</p>
                </div>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="GRND7X"
                  maxLength={6}
                  autoFocus
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-5 text-white text-3xl font-mono font-black tracking-[0.3em] placeholder-zinc-700 focus:outline-none focus:border-violet-500 transition-colors text-center uppercase"
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                />
                <button
                  onClick={handleJoin}
                  disabled={joinCode.length !== 6 || busy}
                  className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {busy ? 'Joining...' : 'Join Squad 🎉'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <Navbar />
    </div>
  )
}
