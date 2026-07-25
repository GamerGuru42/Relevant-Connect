/**
 * Offline storage utility using localStorage.
 * Caches Supabase data locally so the app works without internet.
 * Queues mutations (writes) made offline and syncs them when back online.
 */

const CACHE_PREFIX = 'rp_cache_'
const SYNC_QUEUE_KEY = 'rp_sync_queue'
const CACHE_TTL = 1000 * 60 * 60 // 1 hour default TTL

export interface CachedData<T> {
  data: T
  timestamp: number
  ttl: number
}

export interface SyncAction {
  id: string
  type: 'create' | 'update' | 'delete'
  table: string
  payload: Record<string, unknown>
  createdAt: number
}

// ─── Read Cache ───────────────────────────────────────────────

export function getCached<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null

    const cached: CachedData<T> = JSON.parse(raw)

    // Return data even if expired (stale) — caller can decide to refetch
    return cached.data
  } catch {
    return null
  }
}

export function isCacheStale(key: string): boolean {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return true
    const cached = JSON.parse(raw)
    return Date.now() - cached.timestamp > cached.ttl
  } catch {
    return true
  }
}

// ─── Write Cache ──────────────────────────────────────────────

export function setCache<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
  try {
    const entry: CachedData<T> = { data, timestamp: Date.now(), ttl }
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
  } catch (e) {
    // localStorage full — clear oldest entries
    clearOldestCache()
    try {
      const entry: CachedData<T> = { data, timestamp: Date.now(), ttl }
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(entry))
    } catch {
      // Still failing, skip
    }
  }
}

export function removeCache(key: string): void {
  localStorage.removeItem(CACHE_PREFIX + key)
}

// ─── Sync Queue (offline mutations) ──────────────────────────

export function addToSyncQueue(action: Omit<SyncAction, 'id' | 'createdAt'>): void {
  const queue = getSyncQueue()
  queue.push({
    ...action,
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: Date.now(),
  })
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
}

export function getSyncQueue(): SyncAction[] {
  try {
    const raw = localStorage.getItem(SYNC_QUEUE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function removeSyncAction(id: string): void {
  const queue = getSyncQueue().filter((a) => a.id !== id)
  localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue))
}

export function clearSyncQueue(): void {
  localStorage.removeItem(SYNC_QUEUE_KEY)
}

export function hasPendingSync(): boolean {
  return getSyncQueue().length > 0
}

// ─── Helpers ─────────────────────────────────────────────────

function clearOldestCache(): void {
  const keys: { key: string; timestamp: number }[] = []

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith(CACHE_PREFIX)) {
      try {
        const cached = JSON.parse(localStorage.getItem(key) || '')
        keys.push({ key, timestamp: cached.timestamp || 0 })
      } catch {
        keys.push({ key, timestamp: 0 })
      }
    }
  }

  // Remove the 5 oldest entries
  keys
    .sort((a, b) => a.timestamp - b.timestamp)
    .slice(0, 5)
    .forEach((k) => localStorage.removeItem(k.key))
}
