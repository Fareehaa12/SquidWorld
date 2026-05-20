'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getTrainingStatus } from '@/lib/api'
import { useSimStore } from '@/lib/store'
import { PKR } from '@/lib/utils'

export default function TrainingProgress() {
  const { jobId } = useSimStore()
  const [status, setStatus] = useState<any>(null)

  useEffect(() => {
    if (!jobId) return
    const interval = setInterval(async () => {
      try {
        const s = await getTrainingStatus(jobId)
        setStatus(s)
        if (s.status === 'completed' || s.status === 'failed') {
          clearInterval(interval)
        }
      } catch {}
    }, 2000)
    return () => clearInterval(interval)
  }, [jobId])

  if (!jobId || !status) return null

  const isDone = status.status === 'completed'
  const isFailed = status.status === 'failed'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 space-y-4 bg-gradient-to-br from-white to-slate-50"
      >
        <div className="flex items-center justify-between">
          <h3 className="section-header">
            🧠 PPO Training
          </h3>
          <span className={`text-xs px-2 py-1 rounded-full font-bold ${
            isDone   ? 'bg-squid-green/20 text-squid-green' :
            isFailed ? 'bg-squid-coral/20 text-squid-coral' :
                       'bg-squid-teal/20 text-squid-cyan'
          }`}>
            {status.status.toUpperCase()}
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-slate-500">
            <span>Step {(status.current_step || 0).toLocaleString()}</span>
            <span>{status.progress_pct?.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-squid-ink rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isDone ? 'bg-squid-green' : 'bg-gradient-to-r from-squid-teal to-squid-purple'}`}
              animate={{ width: `${status.progress_pct || 0}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-squid-ink/50 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Mean Reward</div>
            <div className="text-squid-cyan font-display font-bold text-sm">
              {status.mean_reward != null ? PKR(status.mean_reward) : '—'}
            </div>
          </div>
          <div className="bg-squid-ink/50 rounded-xl p-3 text-center">
            <div className="text-xs text-slate-500 mb-1">Total Steps</div>
            <div className="text-squid-purple font-display font-bold text-sm">
              {(status.total_steps || 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 italic">{status.message}</div>

        {isDone && (
          <div className="text-center text-squid-green font-bold text-sm">
            ✅ Model saved — ready for simulation!
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
