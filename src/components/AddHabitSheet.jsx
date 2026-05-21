import { useState } from 'react'
import { doc, updateDoc, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

const PRESET_EMOJIS = [
  '🧘','🏊','🚴','💧','🥗','📵','💊','🌅','🌙','✍️',
  '🎸','🧹','🌿','🛌','🏃','🎯','🎵','🧗','🤸','🧃',
  '🫁','🪴','🧠','📝','🎨','🪞','🧺','🥊','🧲','⏰',
]

export default function AddHabitSheet({ onClose }) {
  const { user } = useAuth()
  const [emoji, setEmoji] = useState('🎯')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!name.trim() || !user) return
    setSaving(true)
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        customHabits: arrayUnion({ id: `${Date.now()}`, name: name.trim(), emoji }),
      })
      toast.success(`"${name.trim()}" added!`)
      onClose()
    } catch {
      toast.error('Failed to add habit')
    } finally {
      setSaving(false)
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
        className="w-full bg-zinc-900 border-t border-zinc-800 rounded-t-3xl"
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-zinc-700 rounded-full" />
        </div>

        <div className="flex items-center justify-between px-5 py-3">
          <h2 className="text-white font-bold text-lg">Add Your Own Habit ✨</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 space-y-5 pb-10">
          {/* Emoji picker */}
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-3">
              Pick an icon
            </p>
            <div className="grid grid-cols-10 gap-1.5">
              {PRESET_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setEmoji(e)}
                  className={`text-xl w-full aspect-square rounded-xl flex items-center justify-center transition-all ${
                    emoji === e
                      ? 'bg-violet-600 scale-110 shadow-lg shadow-violet-900/40'
                      : 'bg-zinc-800 hover:bg-zinc-700'
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name input */}
          <div>
            <p className="text-zinc-400 text-xs font-semibold uppercase tracking-wider mb-2.5">
              Habit name
            </p>
            <div className="flex items-center gap-3 bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3.5 focus-within:border-violet-500 transition-colors">
              <span className="text-2xl flex-shrink-0">{emoji}</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Meditate 10 min"
                maxLength={40}
                autoFocus
                className="flex-1 bg-transparent text-white text-base placeholder-zinc-500 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="w-full py-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold rounded-2xl disabled:opacity-40 transition-opacity"
          >
            {saving ? 'Adding...' : 'Add Habit'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
