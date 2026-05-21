import { useState, useEffect, useRef } from 'react'
import {
  collection, query, orderBy, onSnapshot,
  addDoc, updateDoc, doc, increment, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { X, Send } from 'lucide-react'
import { motion } from 'framer-motion'

function timeAgo(ts) {
  if (!ts) return 'just now'
  const secs = Math.floor((Date.now() - ts.toMillis()) / 1000)
  if (secs < 60) return 'just now'
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

export default function CommentsSheet({ post, onClose }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef()

  useEffect(() => {
    const q = query(
      collection(db, 'posts', post.id, 'comments'),
      orderBy('createdAt', 'asc')
    )
    return onSnapshot(q, (snap) => {
      setComments(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
  }, [post.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function sendComment() {
    const trimmed = text.trim()
    if (!trimmed || !user || sending) return
    setSending(true)
    setText('')
    try {
      await addDoc(collection(db, 'posts', post.id, 'comments'), {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        text: trimmed,
        createdAt: serverTimestamp(),
      })
      await updateDoc(doc(db, 'posts', post.id), { commentCount: increment(1) })
    } finally {
      setSending(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl flex flex-col"
        style={{ maxHeight: '80vh' }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 flex-shrink-0">
          <h2 className="text-white font-bold">
            Comments
            {comments.length > 0 && (
              <span className="text-zinc-500 font-normal text-sm ml-2">{comments.length}</span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {comments.length === 0 && (
            <p className="text-center text-zinc-600 py-10 text-sm">
              No comments yet — be the first! 💬
            </p>
          )}
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              {c.photoURL ? (
                <img src={c.photoURL} alt="" className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-violet-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  {(c.displayName || '?')[0].toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-3.5 py-2.5">
                  <p className="text-violet-300 text-xs font-semibold mb-0.5">{c.displayName}</p>
                  <p className="text-white text-sm leading-snug">{c.text}</p>
                </div>
                <p className="text-zinc-600 text-xs mt-1 ml-1">{timeAgo(c.createdAt)}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-zinc-800 px-4 py-3 flex gap-2.5 items-center">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendComment()}
            placeholder="Add a comment..."
            maxLength={200}
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={sendComment}
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center disabled:opacity-40 flex-shrink-0"
          >
            <Send size={15} className="text-white" />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  )
}
