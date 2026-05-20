'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { PKR } from '@/lib/utils'
import { calculateOrderQty } from '@/lib/api'

export default function OrderQtyCalculator() {
  const [annualDemand, setAnnualDemand]       = useState(30000)
  const [orderCost, setOrderCost]             = useState(800)
  const [holdingCostPct, setHoldingCostPct]   = useState(20)  // % of unit cost
  const [unitCost, setUnitCost]               = useState(1200)
  const [result, setResult]                   = useState<any>(null)
  const [loading, setLoading]                 = useState(false)

  const holdingAnnual = (holdingCostPct / 100) * unitCost

  const handleCalc = async () => {
    setLoading(true)
    try {
      const r = await calculateOrderQty(annualDemand, orderCost, holdingAnnual)
      setResult(r)
    } catch {
      const qty = Math.sqrt(2 * annualDemand * orderCost / holdingAnnual)
      setResult({
        order_qty: Math.round(qty),
        num_orders_per_year: Math.round(annualDemand / qty),
        avg_inventory: Math.round(qty / 2),
        total_cost_pkr: Math.round((annualDemand / qty) * orderCost + (qty / 2) * holdingAnnual),
      })
    }
    setLoading(false)
  }

  return (
    <div className="glass-card p-6 space-y-4 bg-gradient-to-br from-white to-slate-50">
      <h3 className="section-header">
        🧮 Order Quantity
      </h3>

      <div className="grid grid-cols-2 gap-3">
        <InputField label="Annual Demand (units)" value={annualDemand}
          onChange={setAnnualDemand} min={100} max={1000000} step={100} />
        <InputField label="Order Cost (₨/order)" value={orderCost}
          onChange={setOrderCost} min={100} max={50000} step={100} />
        <InputField label="Unit Cost (₨)" value={unitCost}
          onChange={setUnitCost} min={10} max={100000} step={10} />
        <div className="space-y-1">
          <label className="text-xs text-slate-600 font-medium flex justify-between">
            <span>Holding Cost</span>
            <span className="text-squid-amber font-bold">{holdingCostPct}% of unit cost</span>
          </label>
          <input type="range" min={5} max={50} step={1} value={holdingCostPct}
            onChange={(e) => setHoldingCostPct(+e.target.value)}
            className="w-full accent-squid-amber" />
          <div className="text-xs text-slate-500">= {PKR(holdingAnnual)}/unit/year</div>
        </div>
      </div>

      <motion.button
        onClick={handleCalc}
        disabled={loading}
        className="w-full py-2.5 rounded-xl font-display font-bold text-xs tracking-widest
          bg-gradient-to-r from-squid-amber/80 to-squid-teal text-squid-ink
          disabled:opacity-50 hover:shadow-squid transition-all"
        whileTap={{ scale: 0.97 }}
      >
        {loading ? 'Calculating…' : '📐 CALCULATE'}
      </motion.button>

      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <ResultCard label="Optimal Order Qty" value={`${result.order_qty} units`} color="#ffb703" />
          <ResultCard label="Orders/Year"       value={String(result.num_orders_per_year)} color="#00b4d8" />
          <ResultCard label="Avg Inventory"     value={`${result.avg_inventory} units`} color="#7b2fff" />
          <ResultCard label="Total Annual Cost" value={PKR(result.total_cost_pkr)} color="#2dc653" />
        </motion.div>
      )}
    </div>
  )
}

function InputField({ label, value, onChange, min, max, step }: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-slate-600 font-medium">{label}</label>
      <input
        type="number" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="w-full bg-white border-2 border-slate-300 rounded-lg px-4 py-2
          text-slate-900 text-sm focus:outline-none focus:border-squid-purple transition-colors"
      />
    </div>
  )
}

function ResultCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="bg-squid-ink/60 rounded-xl p-3 text-center">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="font-display font-bold text-sm" style={{ color }}>{value}</div>
    </div>
  )
}
