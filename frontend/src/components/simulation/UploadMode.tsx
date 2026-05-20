'use client'
import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { uploadCSV, forecastDemand } from '@/lib/api'
import ForecastChart from '@/components/dashboard/ForecastChart'

type UploadStatus = 'idle' | 'uploading' | 'training' | 'done' | 'error'

export default function UploadMode() {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [forecasts, setForecasts] = useState<any[]>([])
  const [error, setError] = useState('')

  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) return
    setStatus('uploading')
    setProgress(10)
    setMessage('Validating CSV…')
    setError('')

    try {
      setProgress(30)
      setMessage('Parsing demand data…')
      const result = await uploadCSV(files[0])

      setProgress(60)
      setStatus('training')
      setMessage(`Training LSTM on ${result.num_skus} SKUs… (~30s)`)

      // Simulate progress ticks during LSTM training
      for (let p = 60; p < 95; p += 5) {
        await new Promise((r) => setTimeout(r, 800))
        setProgress(p)
      }

      setProgress(100)
      setStatus('done')
      setMessage(`Done! ${result.num_skus} SKUs forecasted.`)
      setForecasts(result.forecasts)
    } catch (e: any) {
      setStatus('error')
      setError(e?.response?.data?.detail || 'Upload failed. Check CSV format.')
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  })

  return (
    <div className="space-y-4">
      {/* CSV format hint */}
      <div className="glass-card p-3 text-xs text-slate-500 space-y-1">
        <div className="text-squid-cyan font-bold mb-1">Required CSV columns:</div>
        <code className="text-squid-amber">date, sku_id, demand, unit_cost, lead_time</code>
        <div className="text-slate-500 mt-1">Example: 2024-01-01, SKU-A, 85, 1200, 5</div>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          isDragActive
            ? 'border-squid-teal bg-squid-teal/10'
            : 'border-squid-ocean hover:border-squid-teal/50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-4xl mb-3">📂</div>
        <div className="text-sm text-slate-300">
          {isDragActive ? 'Drop it here…' : 'Drag & drop your CSV, or click to browse'}
        </div>
        <div className="text-xs text-slate-500 mt-1">Max 10 SKUs, any date range</div>
      </div>

      {/* Progress */}
      <AnimatePresence>
        {status !== 'idle' && status !== 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 space-y-2"
          >
            <div className="flex justify-between text-xs text-slate-500">
              <span>{message}</span>
              <span className="text-squid-cyan font-bold">{progress}%</span>
            </div>
            <div className="h-2 bg-squid-ink rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-squid-teal to-squid-purple rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            {status === 'done' && (
              <div className="text-squid-green text-xs font-bold text-center">
                ✅ Forecasts ready — scroll down to view
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="glass-card p-3 border-squid-coral/50 text-squid-coral text-sm">
          ⚠ {error}
        </div>
      )}

      {/* Forecast results */}
      {forecasts.length > 0 && (
        <div className="space-y-4">
          <h3 className="section-header">
            📡 LSTM Forecasts ({forecasts.length} SKUs)
          </h3>
          {forecasts.map((f) => (
            <ForecastChart
              key={f.sku_id}
              forecast={{
                skuId: f.sku_id,
                method: f.method,
                forecastDays: f.forecast_days,
                predictedDemand: f.predicted_demand,
                confidenceLower: f.confidence_lower,
                confidenceUpper: f.confidence_upper,
                mae: f.mae,
                rmse: f.rmse,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
