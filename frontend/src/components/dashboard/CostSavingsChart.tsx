'use client'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import { PKR } from '@/lib/utils'
import { useSimStore } from '@/lib/store'

export default function CostSavingsChart() {
  const { history } = useSimStore()

  const data = history.map((snap) => {
    const totalRev = snap.skus.reduce((s, sk) => s + sk.revenue, 0)
    const totalHolding = snap.skus.reduce((s, sk) => s + sk.holdingCost, 0)
    const totalStockout = snap.skus.reduce((s, sk) => s + sk.stockoutCost, 0)
    return {
      day: snap.day,
      'Daily Profit': Math.round(snap.reward),
      Revenue: Math.round(totalRev),
      'Holding Cost': -Math.round(totalHolding),
      'Stockout Cost': -Math.round(totalStockout),
    }
  }).filter((_, i) => i % 7 === 0)  // weekly sample

  if (!data.length) {
    return (
      <motion.div 
        className="glass-card p-6 flex flex-col items-center justify-center h-64 text-slate-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="text-3xl mb-2">📈</div>
        <p className="font-display font-semibold">Run a simulation to view profit trends</p>
      </motion.div>
    )
  }

  return (
    <motion.div 
      className="glass-card p-6 bg-gradient-to-br from-white to-slate-50"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h3 className="section-header mb-6">📈 Daily Profit Trend</h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart 
          data={data} 
          margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
          style={{ fontSize: '12px' }}
        >
          <defs>
            <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#6d28d9" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6d28d9" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10b981" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="rgba(0,0,0,0.06)" 
            vertical={false}
          />
          <XAxis 
            dataKey="day" 
            stroke="#64748b" 
            tick={{ fontSize: 12, fontWeight: 500 }}
            label={{ value: 'Day', position: 'insideBottomRight', offset: -5, fill: '#64748b' }}
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
            labelFormatter={(l) => `Day ${l}`}
            labelStyle={{ color: '#1e1b4b' }}
          />
          <ReferenceLine 
            y={0} 
            stroke="rgba(0,0,0,0.15)" 
            strokeDasharray="3 3"
            label={{ value: 'Break-even', position: 'right', fill: '#64748b', fontSize: 11 }}
          />
          <Area 
            type="monotone" 
            dataKey="Daily Profit" 
            stroke="#6d28d9" 
            fill="url(#profitGrad)" 
            strokeWidth={3}
            dot={false}
            isAnimationActive={true}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  )
}
