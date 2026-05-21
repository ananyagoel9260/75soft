import { useState, useEffect } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../hooks/useAuth'
import { getTodayStr, buildCalendarGrid } from '../utils/dates'
import Navbar from '../components/Navbar'

function cellStyle(log, dateStr, today) {
  if (dateStr > today) return 'bg-zinc-900 text-zinc-700'
  if (!log) return 'bg-zinc-800/60 text-zinc-600'
  if (log.completedAll) return 'bg-emerald-500 text-white'
  if ((log.completedCount ?? 0) > 0) return 'bg-yellow-500 text-zinc-900'
  return 'bg-rose-900/60 text-rose-400'
}

function calcStreak(logMap, today) {
  let streak = 0
  const d = new Date(today + 'T00:00:00')
  while (streak < 75) {
    const s = d.toISOString().split('T')[0]
    if (!logMap[s]?.completedAll) break
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

export default function History() {
  const { user } = useAuth()
  const [logMap, setLogMap] = useState({})
  const [loading, setLoading] = useState(true)
  const today = getTodayStr()
  const weeks = buildCalendarGrid()

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'logs'), where('uid', '==', user.uid))
    getDocs(q)
      .then((snap) => {
        const m = {}
        snap.docs.forEach((d) => {
          const data = d.data()
          m[data.date] = data
        })
        setLogMap(m)
      })
      .finally(() => setLoading(false))
  }, [user?.uid])

  const allDays = weeks.flat()
  const pastDays = allDays.filter((d) => d <= today)
  const completeDays = pastDays.filter((d) => logMap[d]?.completedAll).length
  const streak = calcStreak(logMap, today)
  const logged = Object.keys(logMap).length

  return (
    <div className="min-h-screen bg-zinc-950 pb-28">
      <div className="px-5 pt-14 pb-4">
        <h1 className="text-2xl font-black text-white">Your History 📅</h1>
        <p className="text-zinc-500 text-sm mt-1">
          {completeDays} perfect day{completeDays !== 1 ? 's' : ''} in the last 6 weeks
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="px-4">
          {/* Day headers — Monday first */}
          <div className="grid grid-cols-7 mb-2">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="text-center text-zinc-600 text-xs font-semibold py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="space-y-1.5">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 gap-1.5">
                {week.map((dateStr) => {
                  const log = logMap[dateStr]
                  const dayNum = parseInt(dateStr.split('-')[2], 10)
                  const isToday = dateStr === today
                  return (
                    <div
                      key={dateStr}
                      title={dateStr}
                      className={`aspect-square rounded-xl flex items-center justify-center text-xs font-bold select-none ${cellStyle(log, dateStr, today)} ${
                        isToday
                          ? 'ring-2 ring-violet-500 ring-offset-1 ring-offset-zinc-950'
                          : ''
                      }`}
                    >
                      {dayNum}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-5 justify-center flex-wrap">
            {[
              { cls: 'bg-emerald-500', label: 'Complete' },
              { cls: 'bg-yellow-500', label: 'Partial' },
              { cls: 'bg-rose-900/60', label: 'Missed' },
              { cls: 'bg-zinc-800/60', label: 'No data' },
            ].map(({ cls, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-sm ${cls}`} />
                <span className="text-zinc-500 text-xs">{label}</span>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Perfect Days', value: completeDays, color: 'text-emerald-400' },
              { label: 'Streak', value: `${streak} 🔥`, color: 'text-orange-400' },
              { label: 'Days Logged', value: logged, color: 'text-violet-400' },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-center"
              >
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-zinc-500 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <Navbar />
    </div>
  )
}
