'use client'
import { motion } from 'framer-motion'
import { healthColor, PKR } from '@/lib/utils'
import type { SKUState } from '@/lib/store'

interface Props {
  sku: SKUState
  tentacleIndex: number
}

const TENTACLE_EMOJI = ['🦑', '🐙', '🌊', '💧', '🎯', '⚡', '🔥', '💎', '🌟', '🎪']

export default function SKUHealthBar({ sku, tentacleIndex }: Props) {
  const color = healthColor(sku.healthPct)
  const isLow = sku.healthPct < 30
  const isCritical = sku.healthPct < 10

  return (
    <motion.div
      className="glass-card p-3 relative overflow-hidden"
      animate={isCritical ? { borderColor: ['rgba(255,107,107,0.3)', 'rgba(255,107,107,0.8)', 'rgba(255,107,107,0.3)'] } : {}}
      transition={{ duration: 0.6, repeat: Infinity }}
    >
      {/* SKU header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <motion.span 
            className="text-2xl" 
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            {TENTACLE_EMOJI[tentacleIndex % TENTACLE_EMOJI.length]}
          </motion.span>
          <div>
            <div className="font-display font-bold text-base text-purple-700">{sku.skuId}</div>
            <div className="text-xs text-slate-600 truncate max-w-[80px] font-medium">{sku.name}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display font-black text-lg" style={{ color }}>{sku.healthPct.toFixed(0)}%</div>
          <div className="text-xs text-slate-600 font-semibold">{sku.stockLevel} units</div>
        </div>
      </div>

      {/* Health bar */}
      <div className="h-2 bg-squid-ink rounded-full overflow-hidden mb-2">
        <motion.div
          className="h-full rounded-full health-bar-fill"
          style={{ backgroundColor: color }}
          animate={{ width: `${Math.max(2, sku.healthPct)}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* Metrics row */}
      <div className="flex justify-between text-xs text-slate-500">
        <span>D: {sku.demand.toFixed(0)}</span>
        <span className={sku.shortfall > 0 ? 'text-squid-coral' : 'text-squid-green'}>
          {sku.shortfall > 0 ? `−${sku.shortfall.toFixed(0)}` : `✓ ${sku.fulfilled.toFixed(0)}`}
        </span>
        <span className="text-squid-amber">
          {sku.pendingOrder > 0 ? `⏳${sku.pendingOrder}` : '—'}
        </span>
      </div>

      {/* Crisis overlay */}
      {isCritical && (
        <div className="absolute inset-0 bg-squid-coral/5 flex items-center justify-center">
          <motion.span
            className="text-squid-coral text-xs font-bold"
            animate={{ opacity: [1, 0, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            ⚠ STOCKOUT
          </motion.span>
        </div>
      )}
    </motion.div>
  )
}
