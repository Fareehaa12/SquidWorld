'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Area, AreaChart,
} from 'recharts'
import { PKR } from '@/lib/utils'

interface ForecastData {
  skuId: string
  method: string
  forecastDays: number
  predictedDemand: number[]
  confidenceLower: number[]
  confidenceUpper: number[]
  mae?: number
  rmse?: number
}

interface Props {
  forecast: ForecastData
  history?: number[]
}

export default function ForecastChart({ forecast, history = [] }: Props) {
  const historyPoints = history.slice(-30).map((v, i) => ({
    day: i - history.slice(-30).length,
    actual: Math.round(v),
    predicted: null,
    lower: null,
    upper: null,
  }))

  const forecastPoints = forecast.predictedDemand.map((v, i) => ({
    day: i + 1,
    actual: null,
    predicted: Math.round(v),
    lower: Math.round(forecast.confidenceLower[i]),
    upper: Math.round(forecast.confidenceUpper[i]),
  }))

  const data = [...historyPoints, ...forecastPoints]

  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="section-header">
            📡 Forecast — {forecast.skuId}
          </h3>
          <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
            forecast.method === 'lstm'
              ? 'bg-squid-teal/20 text-squid-cyan'
              : 'bg-squid-amber/20 text-squid-amber'
          }`}>
            {forecast.method.toUpperCase()}
          </span>
        </div>
        {forecast.mae != null && (
          <div className="text-right text-xs text-slate-400">
            <div>MAE: {forecast.mae.toFixed(1)}</div>
            <div>RMSE: {forecast.rmse?.toFixed(1)}</div>
          </div>
        )}
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="ciGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#7b2fff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#7b2fff" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="day" stroke="#64748b" tick={{ fontSize: 10 }}
            label={{ value: 'Day', position: 'insideBottomRight', fill: '#64748b', fontSize: 10 }} />
          <YAxis stroke="#64748b" tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{ background: '#0d1b2a', border: '1px solid #00b4d8', borderRadius: 8, fontSize: 12 }}
            labelFormatter={(l) => `Day ${l}`}
          />
          <Area type="monotone" dataKey="upper" stroke="none" fill="url(#ciGrad)" name="CI Upper" />
          <Area type="monotone" dataKey="lower" stroke="none" fill="#0d1b2a" name="CI Lower" />
          <Line type="monotone" dataKey="actual"    stroke="#90e0ef" strokeWidth={2} dot={false} name="Actual" />
          <Line type="monotone" dataKey="predicted" stroke="#7b2fff" strokeWidth={2} dot={false}
            strokeDasharray="5 5" name="Forecast" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
