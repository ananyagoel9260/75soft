import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import PostCard from '../components/PostCard'
import NewPostModal from '../components/NewPostModal'
import Navbar from '../components/Navbar'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, Globe, Users } from 'lucide-react'

export default function Feed() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [tab, setTab] = useState('public')
  const [userSquadId, setUserSquadId] = useState(null)

  // Load user's squadId
  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'users', user.uid)).then((snap) => {
      setUserSquadId(snap.data()?.squadId || null)
    })
  }, [user?.uid])

  // Real-time posts feed
  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(60))
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  // Filter based on active tab
  const visiblePosts = posts.filter((p) => {
    if (tab === 'squad') {
      return p.squadId && p.squadId === userSquadId
    }
    // Public tab: show posts that aren't squad-only, or squad posts from your own squad
    return p.audience !== 'squad' || p.squadId === userSquadId
  })

  return (
    <div className="min-h-screen bg-zinc-950 pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Vibes 📸</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Share your journey</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-900/40 active:scale-95 transition-transform"
        >
          <Plus size={22} className="text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* Tabs */}
      <div className="px-5 pb-4 flex gap-2">
        <button
          onClick={() => setTab('public')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
            tab === 'public'
              ? 'bg-violet-600 border-violet-500 text-white'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
          }`}
        >
          <Globe size={13} /> Everyone
        </button>
        <button
          onClick={() => userSquadId && setTab('squad')}
          disabled={!userSquadId}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
            tab === 'squad'
              ? 'bg-violet-600 border-violet-500 text-white'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          <Users size={13} /> My Squad
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : visiblePosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-4xl mb-5">
            {tab === 'squad' ? '🏟️' : '📸'}
          </div>
          <h2 className="text-white font-bold text-xl">
            {tab === 'squad' ? 'No squad posts yet' : 'No vibes yet'}
          </h2>
          <p className="text-zinc-500 text-sm mt-2 max-w-xs">
            {tab === 'squad'
              ? 'Post something and share it with your squad!'
              : 'Be the first to share a moment from your 75 Soft journey!'}
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-6 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold px-6 py-3 rounded-2xl text-sm shadow-lg shadow-violet-900/30"
          >
            Share a moment
          </button>
        </div>
      ) : (
        <div className="px-4 space-y-4">
          {visiblePosts.map((post, i) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
            >
              <PostCard post={post} />
            </motion.div>
          ))}
        </div>
      )}

      {/* New Post Modal */}
      <AnimatePresence>
        {showModal && (
          <NewPostModal
            onClose={() => setShowModal(false)}
            userSquadId={userSquadId}
          />
        )}
      </AnimatePresence>

      <Navbar />
    </div>
  )
}
