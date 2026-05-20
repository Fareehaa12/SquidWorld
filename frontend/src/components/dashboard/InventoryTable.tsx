'use client'
import { useSimStore } from '@/lib/store'
import { PKR, healthColor } from '@/lib/utils'
import { motion } from 'framer-motion'

export default function InventoryTable() {
  const { skuStates, currentDay } = useSimStore()

  if (!skuStates.length) return null

  return (
    <div className="glass-card p-6 bg-gradient-to-br from-white to-slate-50">
      <h3 className="section-header mb-6">
        📦 Inventory Status
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-900 border-b-2 border-slate-200 bg-gradient-to-r from-purple-50 to-cyan-50">
              <th className="text-left py-3 px-4 font-display font-black text-base">SKU</th>
              <th className="text-right py-3 px-4 font-display font-black text-base">Stock</th>
              <th className="text-right py-3 px-4 font-display font-black text-base">Demand</th>
              <th className="text-right py-3 px-4 font-display font-black text-base">Fulfilled</th>
              <th className="text-right py-3 px-4 font-display font-black text-base">Pending</th>
              <th className="text-right py-3 px-4 font-display font-black text-base">Revenue</th>
              <th className="text-right py-3 px-4 font-display font-black text-base">Health</th>
            </tr>
          </thead>
          <tbody>
            {skuStates.map((sku, i) => {
              const color = healthColor(sku.healthPct)
              return (
                <motion.tr
                  key={sku.skuId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border-b border-slate-100 hover:bg-purple-50/50 transition-colors"
                >
                  <td className="py-3 px-4 font-display font-bold text-purple-700">{sku.skuId}</td>
                  <td className="py-3 px-4 text-right text-slate-600 font-semibold">{sku.stockLevel}</td>
                  <td className="py-3 px-4 text-right text-slate-500">{sku.demand.toFixed(0)}</td>
                  <td className="py-3 px-4 text-right text-emerald-700 font-semibold">{sku.fulfilled.toFixed(0)}</td>
                  <td className="py-3 px-4 text-right text-amber-600 font-semibold">
                    {sku.pendingOrder > 0 ? sku.pendingOrder : '—'}
                  </td>
                  <td className="py-3 px-4 text-right text-cyan-700 font-semibold">{PKR(sku.revenue)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-12 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${sku.healthPct}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="font-semibold" style={{ color }}>{sku.healthPct.toFixed(0)}%</span>
                    </div>
                  </td>
                </motion.tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
