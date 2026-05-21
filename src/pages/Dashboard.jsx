import { useState, useEffect } from 'react'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { signOut } from 'firebase/auth'
import { auth, db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { useToday } from '../hooks/useToday'
import { getDayOfChallenge, formatWeekday, formatFullDate, getTodayStr } from '../utils/dates'
import ProgressRing from '../components/ProgressRing'
import HabitCard from '../components/HabitCard'
import AddHabitSheet from '../components/AddHabitSheet'
import Navbar from '../components/Navbar'
import { Flame, LogOut, Plus } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

function getMotivation(completed, total) {
  if (completed === 0) return "Let's get started — pick your first habit!"
  if (completed === total) return "Perfect day! You crushed every habit! 🎉"
  if (completed === total - 1) return "Almost there — one more to go!"
  if (completed >= Math.ceil(total / 2)) return "Over halfway! Keep the momentum going."
  return "Good start! Every habit counts."
}

function Avatar({ user, onClick }) {
  if (user?.photoURL) {
    return (
      <img
        src={user.photoURL}
        alt=""
        onClick={onClick}
        className="w-9 h-9 rounded-full cursor-pointer ring-2 ring-zinc-700 hover:ring-violet-500 transition-all"
      />
    )
  }
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-full bg-violet-700 flex items-center justify-center text-white font-bold text-sm"
    >
      {(user?.displayName || '?')[0].toUpperCase()}
    </button>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [userData, setUserData] = useState(null)
  const [showSignOut, setShowSignOut] = useState(false)
  const [showAddHabit, setShowAddHabit] = useState(false)

  const customHabits = userData?.customHabits || []
  const { log, loading, saving, updateHabit, updateCustomHabit, customDone, completed, total, weekend } = useToday(user, customHabits)

  useEffect(() => {
    if (!user) return
    const ref = doc(db, 'users', user.uid)
    getDoc(ref).then((snap) => {
      if (snap.exists()) setUserData(snap.data())
    })
  }, [user?.uid])

  async function deleteCustomHabit(id) {
    const ref = doc(db, 'users', user.uid)
    const next = customHabits.filter((h) => h.id !== id)
    await updateDoc(ref, { customHabits: next })
    setUserData((prev) => ({ ...prev, customHabits: next }))
  }

  const today = getTodayStr()
  const dayNum = getDayOfChallenge(userData?.startDate)
  const allDone = completed === total

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 pb-28">
      {/* Header */}
      <div className="px-5 pt-14 pb-2 flex items-center justify-between">
        <div>
          <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">
            Day {dayNum} of 75
          </p>
          <h1 className="text-white font-bold text-xl mt-0.5">
            {formatWeekday(today)},{' '}
            <span className="text-zinc-400 font-normal">{formatFullDate(today)}</span>
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          {(userData?.currentStreak ?? 0) > 0 && (
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-full">
              <Flame size={13} className="text-orange-400" />
              <span className="text-white text-sm font-bold">{userData.currentStreak}</span>
            </div>
          )}
          <Avatar user={user} onClick={() => setShowSignOut((s) => !s)} />
        </div>
      </div>

      {/* Sign-out dropdown */}
      <AnimatePresence>
        {showSignOut && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-5 top-24 z-50 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-xl overflow-hidden"
          >
            <button
              onClick={() => signOut(auth)}
              className="flex items-center gap-2.5 px-5 py-3.5 text-zinc-300 hover:text-white hover:bg-zinc-800 w-full transition-colors text-sm"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Ring */}
      <div className="flex flex-col items-center py-7">
        <ProgressRing completed={completed} total={total} size={160} />

        <p className="text-zinc-400 text-sm mt-4 text-center px-10">
          {getMotivation(completed, total)}
        </p>

        <AnimatePresence>
          {allDone && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 bg-emerald-500/10 border border-emerald-500/25 px-4 py-2 rounded-full"
            >
              <span className="text-emerald-400 text-sm font-semibold">
                All habits complete today!
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Habit Cards */}
      <div className="px-4 space-y-3">
        <HabitCard
          icon="🏋️"
          name="Workout"
          description="At least 45 minutes"
          checked={log.workout}
          value={log.workoutMinutes}
          unit="minutes"
          minValue={45}
          onToggle={() => updateHabit('workout', !log.workout)}
          onValueChange={(v) => updateHabit('workoutMinutes', v)}
        />
        <HabitCard
          icon="👟"
          name="Steps"
          description="8,000+ steps today"
          checked={log.steps}
          value={log.stepsCount}
          unit="steps"
          minValue={8000}
          onToggle={() => updateHabit('steps', !log.steps)}
          onValueChange={(v) => updateHabit('stepsCount', v)}
        />
        <HabitCard
          icon="📖"
          name="Reading"
          description="20 minutes of reading"
          checked={log.reading}
          value={log.readingMinutes}
          unit="minutes"
          minValue={20}
          onToggle={() => updateHabit('reading', !log.reading)}
          onValueChange={(v) => updateHabit('readingMinutes', v)}
        />
        {!weekend && (
          <HabitCard
            icon="🚫"
            name="No Alcohol"
            description="Alcohol-free weekday"
            checked={log.noAlcohol}
            onToggle={() => updateHabit('noAlcohol', !log.noAlcohol)}
          />
        )}
        {weekend && (
          <div className="text-center py-3 text-zinc-600 text-sm">
            🎉 It's the weekend — drinking rule doesn't apply today
          </div>
        )}

        {/* Custom habits */}
        {customHabits.map((habit) => (
          <HabitCard
            key={habit.id}
            icon={habit.emoji}
            name={habit.name}
            description="Your custom habit"
            checked={!!customDone[habit.id]}
            onToggle={() => updateCustomHabit(habit.id, !customDone[habit.id])}
            onDelete={() => deleteCustomHabit(habit.id)}
          />
        ))}

        {/* Add habit button */}
        <button
          onClick={() => setShowAddHabit(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl border border-dashed border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-500 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Add your own habit
        </button>
      </div>

      <AnimatePresence>
        {showAddHabit && (
          <AddHabitSheet
            onClose={() => {
              setShowAddHabit(false)
              // Refresh userData so new habit appears
              getDoc(doc(db, 'users', user.uid)).then((snap) => {
                if (snap.exists()) setUserData(snap.data())
              })
            }}
          />
        )}
      </AnimatePresence>

      {/* Auto-save indicator */}
      <AnimatePresence>
        {saving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-4 right-4 bg-zinc-800 border border-zinc-700 px-3 py-1.5 rounded-full text-xs text-zinc-400 z-40"
          >
            Saving...
          </motion.div>
        )}
      </AnimatePresence>

      <Navbar />
    </div>
  )
}
