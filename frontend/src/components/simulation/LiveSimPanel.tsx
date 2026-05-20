'use client'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimStore } from '@/lib/store'
import SKUHealthBar from '@/components/game/SKUHealthBar'
import Scoreboard from '@/components/game/Scoreboard'
import DayCounter from '@/components/game/DayCounter'
import RewardFeed from '@/components/game/RewardFeed'
import CrisisOverlay from '@/components/game/CrisisOverlay'

const OceanScene = dynamic(() => import('@/components/game/OceanScene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-squid-teal text-sm">
      🌊 Loading ocean…
    </div>
  ),
})

export default function LiveSimPanel() {
  const { skuStates, status, crisisActive } = useSimStore()

  return (
    <div className={`relative flex flex-col gap-4 ${crisisActive ? 'crisis-active' : ''}`}>
      {/* Global crisis toast */}
      <CrisisOverlay />

      {/* Day counter */}
      <DayCounter />

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        {/* Left: 3D scene + scoreboard */}
        <div className="xl:col-span-3 flex flex-col gap-4">
          {/* 3D ocean scene */}
          <div className="glass-card overflow-hidden rounded-2xl" style={{ height: '260px' }}>
            <OceanScene />
          </div>
          {/* Scoreboard */}
          <Scoreboard />
        </div>

        {/* Right: SKU health bars + reward feed */}
        <div className="xl:col-span-2 flex flex-col gap-4">
          <RewardFeed />

          {skuStates.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-display text-squid-cyan font-bold tracking-wider">
                🦑 TENTACLE STATUS
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
                {skuStates.map((sku, i) => (
                  <SKUHealthBar key={sku.skuId} sku={sku} tentacleIndex={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Idle placeholder */}
      {status === 'idle' && skuStates.length === 0 && (
        <div className="glass-card p-10 text-center text-slate-500">
          <motion.div
            className="text-5xl mb-3 inline-block"
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🦑
          </motion.div>
          <div className="text-sm">Configure & launch a simulation to see the octopus manage inventory live.</div>
        </div>
      )}

      {/* Done banner */}
      <AnimatePresence>
        {status === 'done' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 text-center border-squid-green/40"
          >
            <div className="text-squid-green font-display font-bold text-sm tracking-wider">
              ✅ SIMULATION COMPLETE — Check Analytics tab for results
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
