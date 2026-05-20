'use client'
import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ConfigPanel from '@/components/simulation/ConfigPanel'
import LiveSimPanel from '@/components/simulation/LiveSimPanel'
import UploadMode from '@/components/simulation/UploadMode'
import TrainingProgress from '@/components/simulation/TrainingProgress'
import CostSavingsChart from '@/components/dashboard/CostSavingsChart'
import PPOvsBaselineChart from '@/components/dashboard/PPOvsBaselineChart'
import MetricsCards from '@/components/dashboard/MetricsCards'
import InventoryTable from '@/components/dashboard/InventoryTable'
import SKUBreakdown from '@/components/dashboard/SKUBreakdown'
import OrderQtyCalculator from '@/components/dashboard/OrderQtyCalculator'
import { useSimStore } from '@/lib/store'
import { runSimulation } from '@/lib/api'
import type { SKUState, DaySnapshot } from '@/lib/store'

type Tab = 'simulate' | 'upload' | 'analytics'

export default function Home() {
  const [tab, setTab] = useState<Tab>('simulate')
  const {
    config, status, setStatus, pushSnapshot, setSummary,
    setScores, reset, summary,
  } = useSimStore()

  const handleStart = useCallback(async () => {
    reset()
    setStatus('running')
    setTab('simulate')

    const payload = {
      num_skus: config.numSkus,
      simulation_days: config.simulationDays,
      demand_pattern: config.demandPattern,
      demand_volatility: config.demandVolatility,
      seasonal_amplitude: config.seasonalPatterns ? 0.35 : 0.0,
      supply_disruption_prob: config.supplyDisruptionProb,
    }

    try {
      const result = await runSimulation(payload)
      const { summary: s } = result
      const chartData = result.chart_data

      if (chartData?.day) {
        for (let i = 0; i < chartData.day.length; i++) {
          const avgStock = chartData.avg_stock?.[i] ?? 100
          const snap: DaySnapshot = {
            day: chartData.day[i],
            reward: chartData.net_reward?.[i] ?? 0,
            isCrisis: (chartData.total_stockout?.[i] ?? 0) > 500,
            skus: Array.from({ length: config.numSkus }, (_, idx): SKUState => ({
              skuId: `SKU-${String(idx + 1).padStart(2, '0')}`,
              name:  `SKU-${String(idx + 1).padStart(2, '0')}`,
              stockLevel:   Math.max(0, Math.round(avgStock)),
              maxStock:     500,
              demand:       (chartData.total_demand?.[i]    ?? 0) / config.numSkus,
              fulfilled:    (chartData.total_fulfilled?.[i] ?? 0) / config.numSkus,
              shortfall:    Math.max(0, ((chartData.total_demand?.[i] ?? 0) - (chartData.total_fulfilled?.[i] ?? 0)) / config.numSkus),
              pendingOrder: 0,
              healthPct:    Math.min(100, Math.max(0, (avgStock / 400) * 100)),
              lastOrder:    0,
              revenue:      (chartData.total_revenue?.[i]  ?? 0) / config.numSkus,
              holdingCost:  (chartData.total_holding?.[i]  ?? 0) / config.numSkus,
              stockoutCost: (chartData.total_stockout?.[i] ?? 0) / config.numSkus,
            })),
          }
          pushSnapshot(snap)
        }
      }

      setSummary({
        totalDays:         s.total_days,
        totalRevenue:      s.total_revenue,
        totalHoldingCost:  s.total_holding_cost,
        totalStockoutCost: s.total_stockout_cost,
        totalOrderingCost: s.total_ordering_cost,
        netProfit:         s.net_profit,
        serviceLevel:      s.service_level,
        fillRate:          s.fill_rate,
        avgInventory:      s.avg_inventory,
        numStockouts:      s.num_stockouts,
        numOrders:         s.num_orders,
        baselineProfit:       s.baseline_profit,
        ppoVsBaselineSavings: s.ppo_vs_baseline_savings,
        ppoVsBaselinePct:     s.ppo_vs_baseline_pct,
      })
      setScores(s.net_profit, s.baseline_profit)
      setStatus('done')
      setTab('analytics')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }, [config, reset, setStatus, pushSnapshot, setSummary, setScores])

  const TABS = [
    { id: 'simulate'  as Tab, label: '🌊 SIMULATE',  sub: 'Quick Demo' },
    { id: 'upload'    as Tab, label: '📂 UPLOAD',     sub: 'Your Data'  },
    { id: 'analytics' as Tab, label: '📊 ANALYTICS',  sub: 'Cost Savings' },
  ]

  return (
    <main className="min-h-screen ocean-bg">
      {/* Header */}
      <header className="border-b border-squid-ocean px-4 md:px-6 py-4 sticky top-0 z-30 bg-white/90 backdrop-blur-md shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Cute Squid Logo */}
            <motion.span
              className="text-5xl md:text-6xl inline-block"
              animate={{ 
                y: [0, -8, 0],
                rotate: [-2, 2, -2],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              🦑
            </motion.span>
            
            {/* Branding */}
            <div>
              <div className="flex items-baseline gap-2">
                <h1 className="font-display font-black text-2xl md:text-4xl bg-gradient-to-r from-squid-purple via-squid-cyan to-squid-purple bg-clip-text text-transparent tracking-widest drop-shadow-sm">
                  SQUID
                </h1>
                <motion.span 
                  className="text-xl md:text-2xl"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  🌊
                </motion.span>
              </div>
              <p className="text-xs md:text-sm text-transparent bg-gradient-to-r from-squid-cyan to-squid-purple bg-clip-text font-display font-semibold tracking-wide hidden sm:block">
                Smart Queue Unleashing Inventory Dominance
              </p>
            </div>
          </div>

          {/* Tab Buttons */}
          <div className="flex items-center gap-2 md:gap-3">
            <div className="flex gap-1.5">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`font-display font-bold tracking-wider text-xs md:text-sm px-3 md:px-4 py-2 rounded-lg transition-all ${
                    tab === t.id
                      ? 'bg-gradient-to-r from-squid-pink to-squid-purple text-white shadow-lg hover:shadow-xl'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 md:gap-3 ml-2 border-l border-slate-300 pl-2 md:pl-3">
              <span className="hidden md:block text-xs text-slate-500 font-semibold">8 arms. Zero stockouts.</span>
              <span className="text-xs px-3 py-1 rounded-full bg-squid-amber/10 border border-squid-amber/40 text-squid-amber font-bold">
                ₨ PKR
              </span>
              {status === 'running' && (
                <motion.div
                  className="flex items-center gap-1.5 text-xs text-squid-cyan"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  <div className="w-2 h-2 rounded-full bg-squid-cyan" />
                  <span className="hidden sm:inline">Running…</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <AnimatePresence mode="wait">

          {/* ── SIMULATE TAB ── */}
          {tab === 'simulate' && (
            <motion.div
              key="simulate"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              <div className="lg:col-span-1 space-y-4">
                <ConfigPanel onStart={handleStart} />
                <TrainingProgress />
              </div>
              <div className="lg:col-span-2">
                <LiveSimPanel />
              </div>
            </motion.div>
          )}

          {/* ── UPLOAD TAB ── */}
          {tab === 'upload' && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="mb-5">
                <h2 className="font-display text-squid-cyan font-bold tracking-wider text-base">
                  📂 UPLOAD YOUR DEMAND DATA
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Upload CSV → LSTM trains on your data → PPO runs with LSTM forecasts → compare vs Naive (s,Q) Baseline
                </p>
              </div>
              <UploadMode />
            </motion.div>
          )}

          {/* ── ANALYTICS TAB ── */}
          {tab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {summary ? (
                <>
                  <MetricsCards />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CostSavingsChart />
                    <PPOvsBaselineChart />
                  </div>
                  <SKUBreakdown />
                  <InventoryTable />
                  <OrderQtyCalculator />
                </>
              ) : (
                <div className="glass-card p-16 text-center">
                  <motion.div
                    className="text-6xl mb-4 inline-block"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    🦑
                  </motion.div>
                  <div className="text-lg font-display font-bold text-squid-cyan mb-2">No data yet</div>
                  <div className="text-sm text-slate-500 mb-6">Run a simulation to unlock full analytics</div>
                  <button
                    onClick={() => setTab('simulate')}
                    className="px-6 py-2.5 rounded-full bg-squid-cyan text-white
                      text-sm font-display font-bold hover:opacity-90 transition-all shadow-squid"
                  >
                    🌊 GO TO SIMULATE
                  </button>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </main>
  )
}
