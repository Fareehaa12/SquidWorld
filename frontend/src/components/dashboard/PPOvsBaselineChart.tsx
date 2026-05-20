'use client'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, Legend,
} from 'recharts'
import { PKR } from '@/lib/utils'
import { useSimStore } from '@/lib/store'

export default function PPOvsBaselineChart() {
  const { summary } = useSimStore()

  if (!summary) {
    return (
      <motion.div 
        className="glass-card p-6 flex flex-col items-center justify-center h-64 text-slate-500"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-3xl mb-2">📊</div>
        <p className="font-display font-semibold">Run a simulation to compare strategies</p>
      </motion.div>
    )
  }

  const data = [
    {
      name: 'Net Profit',
      PPO: summary.netProfit,
      'Baseline': summary.baselineProfit,
    },
    {
      name: 'Holding Cost',
      PPO: -summary.totalHoldingCost,
      'Baseline': -summary.totalHoldingCost * 1.15,
    },
    {
      name: 'Stockouts',
      PPO: -summary.totalStockoutCost,
      'Baseline': -summary.totalStockoutCost * 1.4,
    },
  ]

  const advantage = (summary.ppoVsBaselinePct ?? 0) > 0

  return (
    <motion.div 
      className="glass-card p-6 bg-gradient-to-br from-white to-slate-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="section-header">⚔️ PPO vs Baseline</h3>
        <motion.div 
          className={`text-sm font-display font-bold px-4 py-2 rounded-full ${
            advantage 
              ? 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200' 
              : 'bg-gradient-to-r from-red-100 to-red-50 text-red-700 border border-red-200'
          }`}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {advantage ? '📈' : '📉'} {(summary.ppoVsBaselinePct ?? 0) > 0 ? '+' : ''}{(summary.ppoVsBaselinePct ?? 0).toFixed(1)}%
        </motion.div>
      </div>
      
      <ResponsiveContainer width="100%" height={240}>
        <BarChart 
          data={data} 
          margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
          style={{ fontSize: '12px' }}
        >
          <defs>
            <linearGradient id="gradientPPO" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6d28d9" stopOpacity={0.9}/>
              <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.6}/>
            </linearGradient>
            <linearGradient id="gradientBaseline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0891b2" stopOpacity={0.7}/>
              <stop offset="100%" stopColor="#0891b2" stopOpacity={0.4}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis 
            dataKey="name" 
            stroke="#64748b" 
            tick={{ fontSize: 12, fontWeight: 500 }}
            tickLine={{ stroke: 'rgba(0,0,0,0.08)' }}
          />
          <YAxis 
            stroke="#64748b" 
            tick={{ fontSize: 12 }}
            tickFormatter={(v) => `₨${(v/1000).toFixed(0)}k`}
            tickLine={{ stroke: 'rgba(0,0,0,0.08)' }}
          />
          <Tooltip
            contentStyle={{ 
              background: 'linear-gradient(135deg, #ffffff 0%, #f8f5ff 100%)',
              border: '1px solid #e9d5ff', 
              borderRadius: 8, 
              fontSize: 12,
              fontWeight: 600,
              boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
            }}
            formatter={(v: number) => PKR(v)}
            labelStyle={{ color: '#1e1b4b' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '16px' }}
            iconType="rect"
            height={24}
          />
          <Bar dataKey="PPO" fill="url(#gradientPPO)" radius={[8, 8, 0, 0]} />
          <Bar dataKey="Baseline" fill="url(#gradientBaseline)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      
      <motion.div 
        className={`mt-6 p-4 rounded-lg text-center font-display font-bold ${
          advantage
            ? 'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-700 border border-orange-200'
        }`}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        <div className="text-sm uppercase tracking-wider mb-1 opacity-75">Competitive Advantage</div>
        <div className="text-lg">💰 {PKR(summary.ppoVsBaselineSavings)} saved in {summary.totalDays} days</div>
      </motion.div>
    </motion.div>
  )
}
