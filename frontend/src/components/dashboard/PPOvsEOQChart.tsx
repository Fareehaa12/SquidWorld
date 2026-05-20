'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts'
import { PKR } from '@/lib/utils'
import { useSimStore } from '@/lib/store'

export default function PPOvsEOQChart() {
  const { summary } = useSimStore()

  if (!summary) {
    return (
      <div className="glass-card p-6 flex items-center justify-center h-64 text-slate-500">
        Complete a simulation to compare PPO vs Naive (s,Q) Baseline
      </div>
    )
  }

  const data = [
    {
      name: 'Net Profit',
      PPO: summary.netProfit,
      'Naive (s,Q)': summary.baselineProfit,
    },
    {
      name: 'Holding Cost',
      PPO: -summary.totalHoldingCost,
      'Naive (s,Q)': -summary.totalHoldingCost * 1.15,
    },
    {
      name: 'Stockouts',
      PPO: -summary.totalStockoutCost,
      'Naive (s,Q)': -summary.totalStockoutCost * 1.4,
    },
  ]

  return (
    <div className="glass-card p-6 bg-gradient-to-br from-white to-slate-50">
      <div className="flex items-center justify-between mb-6">
        <h3 className="section-header">
          ⚔️ PPO vs EOQ
        </h3>
        <div className={`text-sm font-bold px-3 py-1 rounded-full ${summary.ppoVsBaselinePct > 0 ? 'bg-squid-green/20 text-squid-green' : 'bg-squid-coral/20 text-squid-coral'}`}>
          {summary.ppoVsBaselinePct > 0 ? '+' : ''}{summary.ppoVsBaselinePct.toFixed(1)}%
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 10 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 10 }} tickFormatter={(v) => `₨${(v/1000).toFixed(0)}k`} />
          <Tooltip
            contentStyle={{ background: '#0d1b2a', border: '1px solid #00b4d8', borderRadius: 8, fontSize: 12 }}
            formatter={(v: number) => PKR(v)}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="PPO" fill="#00b4d8" radius={[4, 4, 0, 0]} />
          <Bar dataKey="Naive (s,Q)" fill="#7b2fff" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-3 text-center text-squid-amber font-bold text-sm">
        PPO saves {PKR(summary.ppoVsBaselineSavings)} vs Naive (s,Q) over {summary.totalDays} days
      </div>
    </div>
  )
}
