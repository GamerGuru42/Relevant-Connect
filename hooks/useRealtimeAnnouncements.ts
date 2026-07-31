'use client'

import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Announcement } from '@/types'

type RealtimeCallback = (announcements: Announcement[]) => void

const mapRow = (row: any): Announcement => ({
  id: row.id,
  title: row.title,
  body: row.body,
  imageUrl: row.image_url ?? null,
  category: row.category,
  publishAt: row.publish_at ? new Date(row.publish_at) : null,
  createdBy: row.created_by,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
})

/**
 * Subscribes to realtime changes on the announcements table.
 * Client-side filters by:
 *  - deleted_at must be null
 *  - publish_at must be in the past
 *  - Respects target_audience if present (global shows to all,
 *    department only to matching department, role_specific only to matching role)
 *
 * Returns a cleanup function that removes the channel.
 */
export function useRealtimeAnnouncements(
  currentList: Announcement[],
  onUpdate: RealtimeCallback
) {
  const user = useAuthStore((state) => state.user)
  const listRef = useRef(currentList)

  // Keep ref in sync with latest list from parent
  useEffect(() => {
    listRef.current = currentList
  }, [currentList])

  const shouldShowToUser = useCallback(
    (payload: any): boolean => {
      // Must not be soft-deleted
      if (payload.deleted_at) return false

      // Must be published
      if (payload.publish_at && new Date(payload.publish_at) > new Date()) return false

      // Target audience filtering
      const audience = payload.target_audience
      if (!audience || audience === 'global') return true

      if (!user) return false

      if (audience === 'department') {
        return user.department === payload.department
      }

      if (audience === 'role_specific') {
        return user.appRole === payload.target_role
      }

      return true
    },
    [user]
  )

  useEffect(() => {
    const channel = supabase
      .channel('announcements-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        (payload) => {
          const current = listRef.current

          if (payload.eventType === 'INSERT') {
            const newRow = payload.new
            if (!shouldShowToUser(newRow)) return
            const mapped = mapRow(newRow)
            // Prepend new announcement to the top
            onUpdate([mapped, ...current])
          }

          if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new
            const mapped = mapRow(updatedRow)

            // If it was soft-deleted, remove it from the list
            if (updatedRow.deleted_at) {
              onUpdate(current.filter((a) => a.id !== mapped.id))
              return
            }

            // If it no longer passes the filter, remove it
            if (!shouldShowToUser(updatedRow)) {
              onUpdate(current.filter((a) => a.id !== mapped.id))
              return
            }

            // Otherwise, update it in place or add it
            const exists = current.some((a) => a.id === mapped.id)
            if (exists) {
              onUpdate(current.map((a) => (a.id === mapped.id ? mapped : a)))
            } else {
              onUpdate([mapped, ...current])
            }
          }

          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id
            if (deletedId) {
              onUpdate(current.filter((a) => a.id !== deletedId))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [shouldShowToUser, onUpdate])
}
