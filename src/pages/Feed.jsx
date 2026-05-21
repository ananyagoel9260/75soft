import { useState, useEffect } from 'react'
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'
import PostCard from '../components/PostCard'
import NewPostModal from '../components/NewPostModal'
import Navbar from '../components/Navbar'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'

export default function Feed() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(40))
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-4 flex items-center justify-between">
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

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center">
          <div className="w-20 h-20 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-4xl mb-5">
            📸
          </div>
          <h2 className="text-white font-bold text-xl">No vibes yet</h2>
          <p className="text-zinc-500 text-sm mt-2 max-w-xs">
            Be the first to share a moment from your 75 Soft journey!
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
          {posts.map((post, i) => (
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
        {showModal && <NewPostModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>

      <Navbar />
    </div>
  )
}
