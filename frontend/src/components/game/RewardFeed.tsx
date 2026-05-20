'use client'
import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimStore } from '@/lib/store'
import { PKR } from '@/lib/utils'

const MAX_FEED = 6

export default function RewardFeed() {
  const { history } = useSimStore()
  const recent = history.slice(-MAX_FEED).reverse()

  return (
    <div className="glass-card p-6 space-y-3 bg-gradient-to-br from-white to-slate-50">
      <h3 className="section-header">
        📡 Live Reward Feed
      </h3>
      <div className="space-y-2 min-h-[120px]">
        <AnimatePresence initial={false}>
          {recent.map((snap) => (
            <motion.div
              key={snap.day}
              initial={{ opacity: 0, x: 20, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="flex justify-between items-center text-sm py-2 px-2 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <span className="font-display font-bold text-base text-purple-700">📅 Day {snap.day}</span>
              <span className={`font-bold ${snap.isCrisis ? 'text-squid-coral' : snap.reward >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {snap.isCrisis ? '⚡ ' : ''}{snap.reward >= 0 ? '+' : ''}{PKR(snap.reward)}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
        {!recent.length && (
          <div className="text-center text-slate-600 text-xs pt-4">
            Waiting for simulation…
          </div>
        )}
      </div>
    </div>
  )
}
