import { useState, useEffect, useCallback, useRef } from 'react'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, arrayUnion, deleteField } from 'firebase/firestore'
import { db } from '../firebase'
import { getTodayStr, isWeekend } from '../utils/dates'
import toast from 'react-hot-toast'

const DEFAULTS = {
  workout: false,
  workoutMinutes: 45,
  steps: false,
  stepsCount: 8000,
  reading: false,
  readingMinutes: 20,
  noAlcohol: false,
}

const BADGE_TOASTS = {
  first_complete: '✅ First Win unlocked!',
  streak_7:       '🔥 Week Warrior badge!',
  streak_30:      '💎 Diamond Mind badge!',
  streak_75:      '🏆 Champion! You finished 75 Soft!',
}

function countCompleted(log, weekend) {
  let c = 0
  if (log.workout) c++
  if (log.steps) c++
  if (log.reading) c++
  if (!weekend && log.noAlcohol) c++
  return c
}

export function useToday(user, customHabits = []) {
  const today = getTodayStr()
  const weekend = isWeekend()
  const total = (weekend ? 3 : 4) + customHabits.length

  const [log, setLog] = useState({ ...DEFAULTS })
  const [customDone, setCustomDone] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const timer = useRef(null)

  useEffect(() => {
    if (!user) return
    setLoading(true)
    const ref = doc(db, 'logs', `${user.uid}_${today}`)
    getDoc(ref)
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data()
          setLog({ ...DEFAULTS, ...data })
          setCustomDone(data.customDone || {})
        }
      })
      .finally(() => setLoading(false))
  }, [user?.uid])

  const save = useCallback(
    async (newLog) => {
      if (!user) return
      setSaving(true)
      const completed = countCompleted(newLog, weekend)
      const completedAll = completed === total
      const logRef = doc(db, 'logs', `${user.uid}_${today}`)
      const userRef = doc(db, 'users', user.uid)

      try {
        await setDoc(
          logRef,
          { ...newLog, uid: user.uid, date: today, completedCount: completed, totalRequired: total, completedAll, updatedAt: serverTimestamp() },
          { merge: true }
        )

        const userSnap = await getDoc(userRef)
        const userData = userSnap.data() || {}
        const updateData = {
          todayComplete: completedAll,
          todayCount: completed,
          todayTotal: total,
          lastActive: serverTimestamp(),
        }

        if (completedAll) {
          const yesterday = new Date(today + 'T00:00:00')
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayStr = yesterday.toISOString().split('T')[0]

          let newStreak = 1
          if (userData.lastCompleteDate === today) {
            newStreak = userData.currentStreak || 1
          } else if (userData.lastCompleteDate === yesterdayStr) {
            newStreak = (userData.currentStreak || 0) + 1
          }

          updateData.currentStreak = newStreak
          updateData.lastCompleteDate = today
          updateData.longestStreak = Math.max(userData.longestStreak || 0, newStreak)
          if (userData.lastCompleteDate !== today) {
            updateData.totalComplete = (userData.totalComplete || 0) + 1
          }

          // Award badges
          const existing = userData.badges || []
          const toAward = []
          if (!existing.includes('first_complete')) toAward.push('first_complete')
          if (newStreak >= 7  && !existing.includes('streak_7'))  toAward.push('streak_7')
          if (newStreak >= 30 && !existing.includes('streak_30')) toAward.push('streak_30')
          if (newStreak >= 75 && !existing.includes('streak_75')) toAward.push('streak_75')
          if (toAward.length > 0) {
            updateData.badges = arrayUnion(...toAward)
            toAward.forEach((b) => toast.success(BADGE_TOASTS[b], { duration: 4000 }))
          }
        }

        await updateDoc(userRef, updateData)
      } finally {
        setSaving(false)
      }
    },
    [user?.uid, weekend, total, today]
  )

  const updateHabit = useCallback(
    (key, value) => {
      setLog((prev) => {
        const next = { ...prev, [key]: value }
        if (timer.current) clearTimeout(timer.current)
        timer.current = setTimeout(() => save(next), 700)
        return next
      })
    },
    [save]
  )

  const updateCustomHabit = useCallback(
    async (id, value) => {
      setCustomDone((prev) => ({ ...prev, [id]: value }))
      const logRef = doc(db, 'logs', `${user.uid}_${today}`)
      await setDoc(logRef, { customDone: { [id]: value }, updatedAt: serverTimestamp() }, { merge: true })
    },
    [user?.uid, today]
  )

  const completed = countCompleted(log, weekend) + customHabits.filter((h) => customDone[h.id]).length
  return { log, loading, saving, updateHabit, updateCustomHabit, customDone, completed, total, weekend }
}
