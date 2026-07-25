'use client'

import { useState, useEffect, useCallback } from 'react'
import { getSyncQueue, removeSyncAction, type SyncAction } from '@/lib/offlineStore'
import { supabase } from '@/lib/supabase'

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine)

    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return isOnline
}

export function useSyncQueue() {
  const isOnline = useOnlineStatus()
  const [syncing, setSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const refreshCount = useCallback(() => {
    setPendingCount(getSyncQueue().length)
  }, [])

  // Process the sync queue when coming back online
  const processQueue = useCallback(async () => {
    const queue = getSyncQueue()
    if (queue.length === 0) return

    setSyncing(true)

    for (const action of queue) {
      try {
        await processAction(action)
        removeSyncAction(action.id)
      } catch (err) {
        console.error('Sync failed for action:', action.id, err)
        // Leave it in the queue to retry later
        break
      }
    }

    setSyncing(false)
    refreshCount()
  }, [refreshCount])

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline) {
      processQueue()
    }
    refreshCount()
  }, [isOnline, processQueue, refreshCount])

  // Listen for SW sync messages
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'SYNC_PENDING') {
        processQueue()
      }
    }
    navigator.serviceWorker?.addEventListener('message', handler)
    return () => navigator.serviceWorker?.removeEventListener('message', handler)
  }, [processQueue])

  return { isOnline, syncing, pendingCount, processQueue, refreshCount }
}

async function processAction(action: SyncAction): Promise<void> {
  const { type, table, payload } = action

  switch (type) {
    case 'create': {
      const { error } = await supabase.from(table).insert(payload)
      if (error) throw error
      break
    }
    case 'update': {
      const { id, ...rest } = payload
      const { error } = await supabase.from(table).update(rest).eq('id', id as string)
      if (error) throw error
      break
    }
    case 'delete': {
      const { error } = await supabase.from(table).delete().eq('id', payload.id as string)
      if (error) throw error
      break
    }
  }
}
