'use client'
import { useSimStore } from '@/lib/store'
import { motion } from 'framer-motion'

const VOLATILITY_OPTIONS = ['low', 'medium', 'high'] as const
const PATTERN_OPTIONS = ['random', 'seasonal'] as const
const DAYS_OPTIONS = [30, 90, 180, 365] as const

export default function ConfigPanel({ onStart }: { onStart: () => void }) {
  const { config, setConfig, status } = useSimStore()

  return (
    <div className="glass-card p-6 space-y-5 bg-gradient-to-br from-white to-slate-50">
      <h3 className="section-header">
        🎛️ Simulation Config
      </h3>

      {/* SKUs slider */}
      <div className="space-y-1">
        <label className="text-xs text-slate-600 font-medium flex justify-between">
          <span>SKUs</span>
          <span className="text-squid-cyan font-bold">{config.numSkus}</span>
        </label>
        <input
          type="range" min={1} max={10} value={config.numSkus}
          onChange={(e) => setConfig({ numSkus: +e.target.value })}
          className="w-full h-2 accent-squid-teal rounded-lg"
        />
      </div>

      {/* Lead time */}
      <div className="space-y-1">
        <label className="text-xs text-slate-600 font-medium flex justify-between">
          <span>Lead Time (days)</span>
          <span className="text-squid-cyan font-bold">{config.leadTimeDays}d</span>
        </label>
        <input
          type="range" min={1} max={30} value={config.leadTimeDays}
          onChange={(e) => setConfig({ leadTimeDays: +e.target.value })}
          className="w-full h-2 accent-squid-teal rounded-lg"
        />
      </div>

      {/* Holding cost */}
      <div className="space-y-1">
        <label className="text-xs text-slate-600 font-medium flex justify-between">
          <span>Holding Cost (₨/unit/day)</span>
          <span className="text-squid-cyan font-bold">₨{config.holdingCostPerUnit}</span>
        </label>
        <input
          type="range" min={0.5} max={20} step={0.5} value={config.holdingCostPerUnit}
          onChange={(e) => setConfig({ holdingCostPerUnit: +e.target.value })}
          className="w-full h-2 accent-squid-teal rounded-lg"
        />
      </div>

      {/* Stockout penalty */}
      <div className="space-y-1">
        <label className="text-xs text-slate-600 font-medium flex justify-between">
          <span>Stockout Penalty (₨/unit)</span>
          <span className="text-squid-cyan font-bold">₨{config.stockoutPenalty}</span>
        </label>
        <input
          type="range" min={50} max={2000} step={50} value={config.stockoutPenalty}
          onChange={(e) => setConfig({ stockoutPenalty: +e.target.value })}
          className="w-full h-2 accent-squid-teal rounded-lg"
        />
      </div>

      {/* Demand volatility */}
      <div className="space-y-1">
        <label className="text-xs text-slate-600 font-medium">Demand Volatility</label>
        <div className="flex gap-2">
          {VOLATILITY_OPTIONS.map((v) => (
            <button
              key={v}
              onClick={() => setConfig({ demandVolatility: v })}
              className={`flex-1 py-2 text-sm font-display font-bold rounded-lg border-2 transition-all ${
                config.demandVolatility === v
                  ? 'bg-squid-teal/20 border-squid-teal text-squid-cyan'
                  : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-700'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Demand pattern */}
      <div className="space-y-1">
        <label className="text-xs text-slate-600 font-medium">Demand Pattern</label>
        <div className="flex gap-2">
          {PATTERN_OPTIONS.map((p) => (
            <button
              key={p}
              onClick={() => setConfig({ demandPattern: p })}
              className={`flex-1 py-2 text-sm font-display font-bold rounded-lg border-2 transition-all ${
                config.demandPattern === p
                  ? 'bg-squid-purple/20 border-squid-purple text-squid-purple'
                  : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-700'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Simulation length */}
      <div className="space-y-1">
        <label className="text-xs text-slate-600 font-medium">Simulation Length</label>
        <div className="grid grid-cols-4 gap-1">
          {DAYS_OPTIONS.map((d) => (
            <button
              key={d}
              onClick={() => setConfig({ simulationDays: d })}
              className={`py-2 text-sm font-display font-bold rounded-lg border-2 transition-all ${
                config.simulationDays === d
                  ? 'bg-squid-amber/20 border-squid-amber text-squid-amber'
                  : 'border-slate-300 text-slate-600 hover:border-slate-400 hover:text-slate-700'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      {/* Supply disruption */}
      <div className="space-y-1">
        <label className="text-xs text-slate-600 font-medium flex justify-between">
          <span>Supply Disruption Prob</span>
          <span className="text-squid-coral font-bold">{(config.supplyDisruptionProb * 100).toFixed(0)}%</span>
        </label>
        <input
          type="range" min={0} max={0.5} step={0.01} value={config.supplyDisruptionProb}
          onChange={(e) => setConfig({ supplyDisruptionProb: +e.target.value })}
          className="w-full h-2 accent-squid-coral rounded-lg"
        />
      </div>

      {/* Launch button */}
      <motion.button
        onClick={onStart}
        disabled={status === 'running'}
        className="w-full py-3 rounded-xl font-display font-bold text-sm tracking-widest
          bg-gradient-to-r from-squid-pink to-squid-purple text-white
          disabled:opacity-50 disabled:cursor-not-allowed
          hover:shadow-squid transition-all"
        whileTap={{ scale: 0.97 }}
        whileHover={{ scale: 1.02 }}
      >
        {status === 'running' ? '🌊 SIMULATING…' : '🦑 LAUNCH SIMULATION'}
      </motion.button>
    </div>
  )
}
