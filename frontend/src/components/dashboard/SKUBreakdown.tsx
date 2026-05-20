'use client'
import { useSimStore } from '@/lib/store'
import { PKR, healthColor } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell,
} from 'recharts'

export default function SKUBreakdown() {
  const { history, summary } = useSimStore()
  if (!history.length || !summary) return null

  // Aggregate per-SKU over all days
  const skuMap: Record<string, {
    revenue: number; holding: number; stockout: number;
    fulfilled: number; demand: number; stockouts: number
  }> = {}

  for (const snap of history) {
    for (const sku of snap.skus) {
      if (!skuMap[sku.skuId]) {
        skuMap[sku.skuId] = { revenue: 0, holding: 0, stockout: 0, fulfilled: 0, demand: 0, stockouts: 0 }
      }
      skuMap[sku.skuId].revenue  += sku.revenue
      skuMap[sku.skuId].holding  += sku.holdingCost
      skuMap[sku.skuId].stockout += sku.stockoutCost
      skuMap[sku.skuId].fulfilled += sku.fulfilled
      skuMap[sku.skuId].demand    += sku.demand
      if (sku.shortfall > 0) skuMap[sku.skuId].stockouts++
    }
  }

  const barData = Object.entries(skuMap).map(([id, v]) => ({
    name: id,
    'Net Profit': Math.round(v.revenue - v.holding - v.stockout),
    'Holding':    Math.round(v.holding),
    'Stockout':   Math.round(v.stockout),
    'Fill Rate':  v.demand > 0 ? Math.round((v.fulfilled / v.demand) * 100) : 100,
  }))

  const radarData = barData.map((d) => ({
    subject: d.name,
    'Fill Rate': d['Fill Rate'],
    'Profit Score': Math.min(100, Math.max(0, Math.round(
      ((d['Net Profit']) / Math.max(...barData.map(x => Math.abs(x['Net Profit']))) * 100)
    ))),
  }))

  return (
    <div className="space-y-6">
      {/* Bar chart — per-SKU net profit */}
      <motion.div 
        className="glass-card p-6 bg-gradient-to-br from-white to-slate-50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h3 className="section-header mb-6">💰 Net Profit per SKU</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart 
            data={barData} 
            margin={{ top: 10, right: 30, left: 0, bottom: 30 }}
            style={{ fontSize: '12px' }}
          >
            <defs>
              <linearGradient id="profitGradGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6d28d9" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.6}/>
              </linearGradient>
              <linearGradient id="profitGradRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.9}/>
                <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              tick={{ fontSize: 12, fontWeight: 500 }}
              angle={-30} 
              textAnchor="end" 
              height={80}
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
            <Bar dataKey="Net Profit" radius={[8, 8, 0, 0]}>
              {barData.map((entry, i) => (
                <Cell 
                  key={i} 
                  fill={entry['Net Profit'] >= 0 ? 'url(#profitGradGreen)' : 'url(#profitGradRed)'} 
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Fill rate table */}
      <motion.div 
        className="glass-card p-6 bg-gradient-to-br from-white to-slate-50"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h3 className="section-header mb-6">📊 SKU Performance Summary</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-slate-900 border-b-2 border-slate-200 bg-gradient-to-r from-purple-50 to-cyan-50">
                <th className="text-left py-3 px-4 font-display font-black text-base">SKU ID</th>
                <th className="text-right py-3 px-4 font-display font-black text-base">Revenue</th>
                <th className="text-right py-3 px-4 font-display font-black text-base">Holding</th>
                <th className="text-right py-3 px-4 font-display font-black text-base">Stockout</th>
                <th className="text-right py-3 px-4 font-display font-black text-base">Net Profit</th>
                <th className="text-center py-3 px-4 font-display font-black text-base">Fill Rate</th>
              </tr>
            </thead>
            <tbody>
              {barData.map((row, i) => (
                <motion.tr
                  key={row.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-slate-100 hover:bg-purple-50/50 transition-colors"
                >
                  <td className="py-3 px-4 font-display font-bold text-purple-700">
                    {row.name}
                  </td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-semibold">
                    {PKR(skuMap[row.name].revenue)}
                  </td>
                  <td className="py-3 px-4 text-right text-orange-700 font-semibold">
                    {PKR(skuMap[row.name].holding)}
                  </td>
                  <td className="py-3 px-4 text-right text-red-700 font-semibold">
                    {PKR(skuMap[row.name].stockout)}
                  </td>
                  <td className="py-3 px-4 text-right font-bold" 
                    style={{ color: row['Net Profit'] >= 0 ? '#10b981' : '#ef4444' }}>
                    {PKR(row['Net Profit'])}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span 
                      className="inline-block px-3 py-1 rounded-full font-bold text-white"
                      style={{ 
                        background: row['Fill Rate'] >= 95 
                          ? 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
                          : row['Fill Rate'] >= 85
                          ? 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
                          : 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
                      }}>
                      {row['Fill Rate']}%
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
