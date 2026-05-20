import axios from 'axios'

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const api = axios.create({ baseURL: BASE })

export interface SimConfigPayload {
  num_skus: number
  simulation_days: number
  demand_pattern: string
  demand_volatility: string
  seasonal_amplitude: number
  supply_disruption_prob: number
  seed?: number
}

export const runSimulation = (cfg: SimConfigPayload) =>
  api.post('/simulation/run', cfg).then((r) => r.data)

export const createStreamSession = (cfg: SimConfigPayload) =>
  api.post('/simulation/stream/create', cfg).then((r) => r.data)

export const startTraining = (cfg: SimConfigPayload) =>
  api.post('/training/start', cfg).then((r) => r.data)

export const getTrainingStatus = (jobId: string) =>
  api.get(`/training/status/${jobId}`).then((r) => r.data)

export const forecastDemand = (skuId: string, history: number[], days = 30) =>
  api.post('/forecast/predict', {
    sku_id: skuId,
    demand_history: history,
    forecast_days: days,
  }).then((r) => r.data)

export const uploadCSV = (file: File) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/forecast/upload-csv', form).then((r) => r.data)
}

export const calculateOrderQty = (annualDemand: number, orderCost: number, holdingCostAnnual: number) =>
  api.post('/analytics/order-qty', {
    annual_demand: annualDemand,
    ordering_cost: orderCost,
    holding_cost_annual: holdingCostAnnual,
  }).then((r) => r.data)

export function openSSEStream(simId: string, onMessage: (data: any) => void, onDone: () => void) {
  const es = new EventSource(`${BASE}/simulation/stream/${simId}`)
  es.onmessage = (e) => {
    const data = JSON.parse(e.data)
    if (data.done) {
      onDone()
      es.close()
    } else {
      onMessage(data)
    }
  }
  es.onerror = () => es.close()
  return () => es.close()
}
