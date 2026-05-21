import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

export default function HabitCard({
  icon,
  name,
  description,
  checked,
  value,
  unit,
  minValue,
  onToggle,
  onValueChange,
  onDelete,
}) {
  const goalMet = value !== undefined && value >= minValue

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-2xl border cursor-pointer transition-colors duration-200 ${
        checked
          ? 'bg-violet-950/40 border-violet-600/40'
          : 'bg-zinc-900 border-zinc-800 active:border-zinc-700'
      }`}
      onClick={onToggle}
    >
      <div className="flex items-center gap-4 p-4">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-colors duration-200 ${
            checked ? 'bg-violet-600' : 'bg-zinc-800'
          }`}
        >
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <p className={`font-semibold ${checked ? 'text-violet-200' : 'text-white'}`}>{name}</p>
          <p className="text-sm text-zinc-500">{description}</p>
        </div>

        <div
          className={`w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
            checked ? 'bg-violet-600 border-violet-600' : 'border-zinc-600'
          }`}
        >
          {checked && <Check size={15} className="text-white" strokeWidth={3} />}
        </div>

        {onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-600 hover:text-rose-400 hover:bg-rose-400/10 transition-colors flex-shrink-0"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {checked && onValueChange && (
        <div
          className="px-4 pb-4 flex items-center gap-3"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="number"
            value={value}
            min={0}
            onChange={(e) => onValueChange(Number(e.target.value))}
            className="w-24 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
          <span className="text-zinc-400 text-sm">{unit}</span>
          {goalMet ? (
            <span className="text-emerald-400 text-xs font-medium">Goal met ✓</span>
          ) : (
            <span className="text-zinc-600 text-xs">
              need {minValue} {unit}
            </span>
          )}
        </div>
      )}
    </motion.div>
  )
}
