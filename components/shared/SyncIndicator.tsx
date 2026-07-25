'use client'

import { useSyncQueue } from '@/hooks/useOnlineStatus'
import { WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

export function SyncIndicator() {
  const { isOnline, syncing, pendingCount } = useSyncQueue()
  const [showSuccess, setShowSuccess] = useState(false)

  // Show a brief success message when we come back online and finish syncing
  useEffect(() => {
    if (isOnline && !syncing && pendingCount === 0) {
      setShowSuccess(true)
      const timer = setTimeout(() => setShowSuccess(false), 3000)
      return () => clearTimeout(timer)
    }
    return undefined
  }, [isOnline, syncing, pendingCount])

  if (isOnline && pendingCount === 0 && !showSuccess) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-4 py-2 rounded-full shadow-lg text-sm font-medium border"
        style={{
          backgroundColor: !isOnline ? 'var(--destructive)' : showSuccess ? '#10b981' : 'var(--card)',
          color: !isOnline || showSuccess ? '#fff' : 'var(--foreground)',
          borderColor: !isOnline ? 'var(--destructive)' : showSuccess ? '#10b981' : 'var(--border)',
        }}
      >
        {!isOnline && (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Offline ({pendingCount} pending)</span>
          </>
        )}

        {isOnline && syncing && (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
            <span>Syncing {pendingCount} changes...</span>
          </>
        )}

        {isOnline && showSuccess && !syncing && (
          <>
            <CheckCircle2 className="w-4 h-4" />
            <span>Back online & synced</span>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
