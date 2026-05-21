import { NavLink } from 'react-router-dom'
import { Home, Camera, Users, CalendarDays } from 'lucide-react'

const tabs = [
  { to: '/', icon: Home, label: 'Today' },
  { to: '/feed', icon: Camera, label: 'Vibes' },
  { to: '/squad', icon: Users, label: 'Squad' },
  { to: '/history', icon: CalendarDays, label: 'History' },
]

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 safe-area-bottom z-50">
      <div className="flex items-center justify-around py-2 max-w-md mx-auto">
        {tabs.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-5 py-2 rounded-xl transition-colors ${
                isActive ? 'text-violet-400' : 'text-zinc-500'
              }`
            }
          >
            <Icon size={21} />
            <span className="text-xs font-medium">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
