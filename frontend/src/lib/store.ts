import { create } from 'zustand'

export type Mode = 'demo' | 'upload'
export type SimStatus = 'idle' | 'running' | 'done' | 'error'

export interface SKUState {
  skuId: string
  name: string
  stockLevel: number
  maxStock: number
  demand: number
  fulfilled: number
  shortfall: number
  pendingOrder: number
  healthPct: number    // 0-100
  lastOrder: number
  revenue: number
  holdingCost: number
  stockoutCost: number
}

export interface DaySnapshot {
  day: number
  reward: number
  skus: SKUState[]
  isCrisis: boolean
}

export interface SimSummary {
  totalDays: number
  totalRevenue: number
  totalHoldingCost: number
  totalStockoutCost: number
  totalOrderingCost: number
  netProfit: number
  serviceLevel: number
  fillRate: number
  avgInventory: number
  numStockouts: number
  numOrders: number
  baselineProfit: number
  ppoVsBaselineSavings: number
  ppoVsBaselinePct: number
}

export interface AppConfig {
  numSkus: number
  leadTimeDays: number
  holdingCostPerUnit: number
  stockoutPenalty: number
  orderingCost: number
  demandVolatility: 'low' | 'medium' | 'high'
  demandPattern: 'random' | 'seasonal'
  seasonalPatterns: boolean
  simulationDays: 30 | 90 | 180 | 365
  supplyDisruptionProb: number
}

interface SimStore {
  mode: Mode
  status: SimStatus
  config: AppConfig
  currentDay: number
  totalDays: number
  history: DaySnapshot[]
  skuStates: SKUState[]
  summary: SimSummary | null
  ppoScore: number
  baselineScore: number
  crisisActive: boolean
  jobId: string | null

  setMode: (m: Mode) => void
  setStatus: (s: SimStatus) => void
  setConfig: (c: Partial<AppConfig>) => void
  pushSnapshot: (snap: DaySnapshot) => void
  setSummary: (s: SimSummary) => void
  setScores: (ppo: number, eoq: number) => void
  setCrisis: (v: boolean) => void
  setJobId: (id: string | null) => void
  reset: () => void
}

const DEFAULT_CONFIG: AppConfig = {
  numSkus: 5,
  leadTimeDays: 5,
  holdingCostPerUnit: 2.5,
  stockoutPenalty: 150,
  orderingCost: 800,
  demandVolatility: 'medium',
  demandPattern: 'seasonal',
  seasonalPatterns: true,
  simulationDays: 365,
  supplyDisruptionProb: 0.05,
}

export const useSimStore = create<SimStore>((set) => ({
  mode: 'demo',
  status: 'idle',
  config: DEFAULT_CONFIG,
  currentDay: 0,
  totalDays: 365,
  history: [],
  skuStates: [],
  summary: null,
  ppoScore: 0,
  baselineScore: 0,
  crisisActive: false,
  jobId: null,

  setMode: (m) => set({ mode: m }),
  setStatus: (s) => set({ status: s }),
  setConfig: (c) => set((st) => ({ config: { ...st.config, ...c } })),
  pushSnapshot: (snap) =>
    set((st) => ({
      history: [...st.history, snap],
      currentDay: snap.day,
      skuStates: snap.skus,
      crisisActive: snap.isCrisis,
    })),
  setSummary: (s) => set({ summary: s }),
  setScores: (ppo, baseline) => set({ ppoScore: ppo, baselineScore: baseline }),
  setCrisis: (v) => set({ crisisActive: v }),
  setJobId: (id) => set({ jobId: id }),
  reset: () =>
    set({
      status: 'idle',
      currentDay: 0,
      history: [],
      skuStates: [],
      summary: null,
      ppoScore: 0,
      baselineScore: 0,
      crisisActive: false,
      jobId: null,
    }),
}))
