'use client'
import { motion } from 'framer-motion'
import { PKR } from '@/lib/utils'
import { useSimStore } from '@/lib/store'

interface MetricProps { label: string; value: string; sub?: string; color: string; icon: string; gradient: string }

function MetricCard({ label, value, sub, color, icon, gradient }: MetricProps) {
  return (
    <motion.div
      className="glass-card p-4 text-center group"
      whileHover={{ scale: 1.05, y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`text-3xl mb-2 transition-transform group-hover:scale-110`}>{icon}</div>
      <div className="text-xs uppercase tracking-wider font-display font-bold text-slate-500 mb-2">{label}</div>
      <div className={`font-display font-black text-base bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}>{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-2 font-medium">{sub}</div>}
    </motion.div>
  )
}

export default function MetricsCards() {
  const { summary } = useSimStore()

  if (!summary) return null

  const cards: MetricProps[] = [
    {
      label: 'Net Profit',
      value: PKR(summary.netProfit),
      icon: '💰',
      color: summary.netProfit > 0 ? '#10b981' : '#ef4444',
      gradient: summary.netProfit > 0 ? 'from-emerald-600 to-emerald-400' : 'from-red-600 to-red-400',
    },
    {
      label: 'PPO Advantage',
      value: PKR(summary.ppoVsBaselineSavings),
      sub: `${(summary.ppoVsBaselinePct ?? 0) > 0 ? '+' : ''}${(summary.ppoVsBaselinePct ?? 0).toFixed(1)}% vs baseline`,
      icon: '🚀',
      color: '#f97316',
      gradient: 'from-orange-600 to-orange-400',
    },
    {
      label: 'Service Level',
      value: `${(summary.serviceLevel * 100).toFixed(1)}%`,
      sub: `Fill rate ${(summary.fillRate * 100).toFixed(1)}%`,
      icon: '✅',
      color: '#0891b2',
      gradient: 'from-cyan-600 to-cyan-400',
    },
    {
      label: 'Stockout Events',
      value: String(summary.numStockouts),
      sub: `${summary.totalDays} day period`,
      icon: summary.numStockouts === 0 ? '⭐' : '⚠️',
      color: summary.numStockouts === 0 ? '#10b981' : '#ef4444',
      gradient: summary.numStockouts === 0 ? 'from-emerald-600 to-emerald-400' : 'from-red-600 to-red-400',
    },
    {
      label: 'Avg Inventory',
      value: `${summary.avgInventory.toFixed(0)} units`,
      sub: `${summary.numOrders} orders placed`,
      icon: '📦',
      color: '#6d28d9',
      gradient: 'from-purple-600 to-purple-400',
    },
    {
      label: 'Holding Cost',
      value: PKR(summary.totalHoldingCost),
      sub: 'Carrying cost',
      icon: '🏭',
      color: '#0891b2',
      gradient: 'from-cyan-600 to-blue-400',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map((c, i) => (
        <motion.div
          key={c.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
        >
          <MetricCard {...c} />
        </motion.div>
      ))}
    </div>
  )
}
