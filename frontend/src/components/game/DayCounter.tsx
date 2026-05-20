'use client'
import { motion } from 'framer-motion'
import { useSimStore } from '@/lib/store'

const SEASON_EMOJI: Record<string, string> = {
  spring: '🌸', summer: '☀️', autumn: '🍂', winter: '❄️',
}

function getSeason(day: number): string {
  const m = Math.floor(((day % 365) / 365) * 12)
  if (m < 3) return 'winter'
  if (m < 6) return 'spring'
  if (m < 9) return 'summer'
  return 'autumn'
}

export default function DayCounter() {
  const { currentDay, totalDays, status } = useSimStore()
  const season = getSeason(currentDay)
  const pct = totalDays > 0 ? (currentDay / totalDays) * 100 : 0
  const month = Math.floor((currentDay / 365) * 12) + 1
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

  return (
    <div className="glass-card p-4 flex items-center gap-4">
      <motion.div
        className="text-3xl"
        animate={status === 'running' ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {SEASON_EMOJI[season]}
      </motion.div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline mb-1">
          <span className="font-display font-bold text-base text-purple-700">
            Day {currentDay}
          </span>
          <span className="text-xs text-slate-500">
            {months[Math.min(month - 1, 11)]} · {season}
          </span>
        </div>
        <div className="h-1.5 bg-squid-ink rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-squid-teal via-squid-purple to-squid-amber"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500 mt-0.5">
          <span>Business Year</span>
          <span>{pct.toFixed(0)}% complete</span>
        </div>
      </div>
    </div>
  )
}
