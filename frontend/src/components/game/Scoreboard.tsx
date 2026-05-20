'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { PKR } from '@/lib/utils'
import { useSimStore } from '@/lib/store'

export default function Scoreboard() {
  const { ppoScore, baselineScore, currentDay, totalDays, crisisActive, status } = useSimStore()
  const diff = (ppoScore || 0) - (baselineScore || 0)
  const progress = totalDays > 0 ? (currentDay / totalDays) * 100 : 0

  return (
    <div className="glass-card p-6 space-y-4 bg-gradient-to-br from-white to-slate-50">
      {/* Title with gradient */}
      <div className="flex items-center justify-between">
        <h3 className="section-header">🏆 SCOREBOARD</h3>
        {crisisActive && (
          <motion.span
            className="text-white text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r from-red-500 to-red-600"
            animate={{ opacity: [1, 0.4, 1], scale: [1, 1.05, 1] }}
            transition={{ duration: 0.6, repeat: Infinity }}
          >
            ⚡ CRISIS
          </motion.span>
        )}
      </div>

      {/* Day counter with gradient bar */}
      <div className="space-y-2">
        <div className="flex justify-between font-display font-bold text-base text-purple-700">
          <span>Day {currentDay}</span>
          <span>{totalDays} days total</span>
        </div>
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden relative">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-600 via-cyan-500 to-emerald-500 rounded-full shadow-lg"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Scores with enhanced styling */}
      <div className="grid grid-cols-2 gap-3 mt-4">
        <ScoreCard 
          label="🤖 PPO" 
          value={ppoScore || 0} 
          color="#6d28d9"
          gradient="from-purple-600 to-purple-400"
        />
        <ScoreCard 
          label="📊 Baseline" 
          value={baselineScore || 0} 
          color="#0891b2"
          gradient="from-cyan-600 to-cyan-400"
        />
      </div>

      {/* Delta with enhanced styling */}
      <AnimatePresence>
        {Math.abs(diff) > 100 && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            className={`text-center p-3 rounded-lg ${
              diff > 0 
                ? 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700' 
                : 'bg-gradient-to-r from-red-100 to-red-50 text-red-700'
            }`}
          >
            <div className="text-xs uppercase tracking-wider font-display font-bold mb-1">
              {diff > 0 ? '🎉 PPO Wins!' : '⚠️ PPO Trails'}
            </div>
            <div className="font-display font-black text-lg">
              {PKR(Math.abs(diff))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status indicator */}
      {status === 'running' && (
        <motion.div 
          className="flex items-center justify-center gap-2 text-xs font-semibold text-purple-600 py-2 px-3 bg-purple-50 rounded-lg"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-2 h-2 rounded-full bg-purple-600"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <span>Simulation in progress…</span>
        </motion.div>
      )}
    </div>
  )
}

function ScoreCard({ label, value, color, gradient }: { label: string; value: number; color: string; gradient: string }) {
  return (
    <motion.div 
      className={`bg-gradient-to-br ${gradient} rounded-xl p-4 text-white text-center shadow-lg hover:shadow-xl transition-shadow`}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.2 }}
    >
      <div className="text-xs uppercase tracking-wider font-display font-bold mb-2 opacity-90">{label}</div>
      <motion.div
        className="text-lg font-display font-black"
        key={Math.round(value / 1000)}
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {PKR(value)}
      </motion.div>
    </motion.div>
  )
}
