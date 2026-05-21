import { useState, useRef } from 'react'
import { addDoc, collection, doc, getDoc, updateDoc, serverTimestamp, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { compressImage } from '../utils/compress'
import { X, ImagePlus, Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const HABIT_OPTIONS = [
  { id: null, label: '✨ General' },
  { id: 'workout', label: '🏋️ Workout' },
  { id: 'steps', label: '👟 Steps' },
  { id: 'reading', label: '📖 Reading' },
  { id: 'noAlcohol', label: '🚫 Sober' },
]

export default function NewPostModal({ onClose }) {
  const { user } = useAuth()
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [caption, setCaption] = useState('')
  const [habitTag, setHabitTag] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 20 * 1024 * 1024) {
      toast.error('Image must be under 20 MB')
      return
    }
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  async function handlePost() {
    if (!image || !user) return
    setUploading(true)
    try {
      const imageData = await compressImage(image)

      await addDoc(collection(db, 'posts'), {
        uid: user.uid,
        displayName: user.displayName,
        photoURL: user.photoURL,
        imageData,
        caption: caption.trim(),
        habitTag,
        reactFire: [], reactMuscle: [], reactParty: [], reactHeart: [],
        commentCount: 0,
        createdAt: serverTimestamp(),
      })

      // Award first_post badge if not yet earned
      const userSnap = await getDoc(doc(db, 'users', user.uid))
      if (!userSnap.data()?.badges?.includes('first_post')) {
        await updateDoc(doc(db, 'users', user.uid), { badges: arrayUnion('first_post') })
        toast.success('📸 Vibe Starter badge unlocked!', { duration: 4000 })
      }

      toast.success('Posted! 🎉')
      onClose()
    } catch (err) {
      console.error(err)
      toast.error('Failed to post. Try again.')
    } finally {
      setUploading(false)
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
        className="w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl max-h-[92vh] overflow-y-auto"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-white font-bold text-lg">Share Your Vibe ✨</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 space-y-4 pb-10">
          {/* Image picker */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />

          {preview ? (
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-800">
              <img src={preview} alt="" className="w-full h-full object-cover" />
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm font-medium"
              >
                Change photo
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center gap-3 text-zinc-500 hover:text-zinc-400 hover:border-zinc-600 active:border-violet-600 transition-colors"
            >
              <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
                <ImagePlus size={28} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Tap to add a photo</p>
                <p className="text-xs text-zinc-600 mt-0.5">Auto-compressed — no storage costs</p>
              </div>
            </button>
          )}

          {/* Caption */}
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a caption... 💬"
            maxLength={300}
            rows={3}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500 resize-none transition-colors leading-relaxed"
          />

          {/* Habit tags */}
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
              Tag a habit
            </p>
            <div className="flex flex-wrap gap-2">
              {HABIT_OPTIONS.map((opt) => (
                <button
                  key={String(opt.id)}
                  onClick={() => setHabitTag(opt.id)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    habitTag === opt.id
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Post button */}
          <button
            onClick={handlePost}
            disabled={!image || uploading}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-opacity text-base shadow-lg shadow-violet-900/30"
          >
            {uploading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Compressing & posting...
              </>
            ) : (
              'Post it! 🚀'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
