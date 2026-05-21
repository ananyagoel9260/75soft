export function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

export function isWeekend() {
  const day = new Date().getDay()
  return day === 0 || day === 6
}

export function getDayOfChallenge(startDate) {
  if (!startDate) return 1
  const start = new Date(startDate + 'T00:00:00')
  const today = new Date()
  start.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)
  const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24))
  return Math.min(Math.max(diff + 1, 1), 75)
}

export function formatWeekday(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { weekday: 'long' })
}

export function formatFullDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
}

// Build a Monday-aligned 6-week grid ending on the Sunday of this week
export function buildCalendarGrid() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Find this week's Monday
  const dow = today.getDay()
  const daysToMonday = dow === 0 ? 6 : dow - 1
  const thisMonday = new Date(today)
  thisMonday.setDate(today.getDate() - daysToMonday)

  // Go back 5 more weeks (35 days) to get 6 full weeks
  const startDate = new Date(thisMonday)
  startDate.setDate(thisMonday.getDate() - 35)

  const weeks = []
  for (let w = 0; w < 6; w++) {
    const week = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + w * 7 + d)
      week.push(date.toISOString().split('T')[0])
    }
    weeks.push(week)
  }
  return weeks
}
