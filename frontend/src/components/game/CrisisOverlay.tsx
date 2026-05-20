'use client'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSimStore } from '@/lib/store'

const CRISIS_MESSAGES = [
  '🌊 TSUNAMI ALERT — Supply routes disrupted!',
  '⚡ POWER OUTAGE — Warehouse offline!',
  '🚢 PORT STRIKE — Deliveries delayed!',
  '🌪️ STORM — Lead times doubled!',
  '🔥 SUPPLIER FIRE — Partial stock loss!',
  '🦠 QUARANTINE — Cross-border shipments halted!',
]

export default function CrisisOverlay() {
  const { crisisActive } = useSimStore()
  const [message, setMessage] = useState('')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (crisisActive) {
      setMessage(CRISIS_MESSAGES[Math.floor(Math.random() * CRISIS_MESSAGES.length)])
      setVisible(true)
      const t = setTimeout(() => setVisible(false), 3500)
      return () => clearTimeout(t)
    }
  }, [crisisActive])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -80, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -80, opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50
            bg-squid-coral/95 text-white px-6 py-3 rounded-2xl
            border border-white/20 shadow-coral text-sm font-bold
            flex items-center gap-3 max-w-sm text-center"
        >
          <motion.span
            animate={{ rotate: [0, -10, 10, -5, 0] }}
            transition={{ duration: 0.5 }}
            className="text-2xl flex-shrink-0"
          >
            ⚡
          </motion.span>
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
