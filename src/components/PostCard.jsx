import { useState } from 'react'
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { MessageCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import CommentsSheet from './CommentsSheet'

const REACTIONS = [
  { key: 'reactFire',   emoji: '🔥' },
  { key: 'reactMuscle', emoji: '💪' },
  { key: 'reactParty',  emoji: '🎉' },
  { key: 'reactHeart',  emoji: '❤️' },
]

const HABIT_BADGES = {
  workout:   { label: '🏋️ Workout',  cls: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  steps:     { label: '👟 Steps',    cls: 'bg-blue-500/20   text-blue-300   border-blue-500/30'   },
  reading:   { label: '📖 Reading',  cls: 'bg-amber-500/20  text-amber-300  border-amber-500/30'  },
  noAlcohol: { label: '🚫 Sober',    cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
}

function timeAgo(ts) {
  if (!ts) return 'just now'
  const secs = Math.floor((Date.now() - ts.toMillis()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export default function PostCard({ post }) {
  const { user } = useAuth()
  const [showComments, setShowComments] = useState(false)

  async function toggleReaction(key) {
    if (!user) return
    const uids = post[key] || []
    await updateDoc(doc(db, 'posts', post.id), {
      [key]: uids.includes(user.uid) ? arrayRemove(user.uid) : arrayUnion(user.uid),
    })
  }

  const badge = post.habitTag ? HABIT_BADGES[post.habitTag] : null
  const totalReactions = REACTIONS.reduce((sum, r) => sum + (post[r.key]?.length || 0), 0)

  return (
    <>
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden">
        {/* User row */}
        <div className="flex items-center gap-3 p-4 pb-3">
          {post.photoURL ? (
            <img src={post.photoURL} alt="" className="w-9 h-9 rounded-full flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-violet-700 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {(post.displayName || '?')[0].toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm truncate">{post.displayName || 'Someone'}</p>
            <p className="text-zinc-500 text-xs">{timeAgo(post.createdAt)}</p>
          </div>
          {badge && (
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium flex-shrink-0 ${badge.cls}`}>
              {badge.label}
            </span>
          )}
        </div>

        {/* Image */}
        <div className="w-full aspect-[4/3] bg-zinc-800">
          <img
            src={post.imageData || post.imageURL}
            alt={post.caption || ''}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>

        {/* Caption */}
        {post.caption && (
          <p className="px-4 pt-3 text-zinc-300 text-sm leading-relaxed">{post.caption}</p>
        )}

        {/* Reactions + comments */}
        <div className="px-4 py-3 flex items-center justify-between gap-2">
          {/* Reaction buttons */}
          <div className="flex gap-1.5 flex-wrap">
            {REACTIONS.map(({ key, emoji }) => {
              const uids = post[key] || []
              const reacted = uids.includes(user?.uid)
              return (
                <motion.button
                  key={key}
                  whileTap={{ scale: 1.35 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                  onClick={() => toggleReaction(key)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-sm transition-all ${
                    reacted
                      ? 'bg-zinc-700 text-white'
                      : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                  }`}
                >
                  <span>{emoji}</span>
                  {uids.length > 0 && (
                    <span className="text-xs font-semibold leading-none">{uids.length}</span>
                  )}
                </motion.button>
              )
            })}
          </div>

          {/* Comment button */}
          <button
            onClick={() => setShowComments(true)}
            className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0 text-sm"
          >
            <MessageCircle size={16} />
            {(post.commentCount || 0) > 0 && (
              <span className="text-xs font-semibold">{post.commentCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* Comments sheet */}
      <AnimatePresence>
        {showComments && <CommentsSheet post={post} onClose={() => setShowComments(false)} />}
      </AnimatePresence>
    </>
  )
}
