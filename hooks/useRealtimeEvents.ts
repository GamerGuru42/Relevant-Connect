'use client'

import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'
import type { Event } from '@/types'

type RealtimeCallback = (events: Event[]) => void

const mapRow = (row: any): Event => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  date: row.date,
  time: row.time,
  venueName: row.venue_name,
  venueAddress: row.venue_address,
  venueMapLink: row.venue_map_link ?? null,
  speaker: row.speaker ?? null,
  registrationLimit: row.registration_limit ?? null,
  posterUrl: row.poster_url ?? null,
  publishAt: row.publish_at ? new Date(row.publish_at) : null,
  createdBy: row.created_by,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
})

/**
 * Subscribes to realtime changes on the events table.
 * Client-side filters by:
 *  - deleted_at must be null
 *  - publish_at must be in the past
 *  - Respects target_audience (global, department, role_specific)
 *
 * Returns a cleanup function that removes the channel.
 */
export function useRealtimeEvents(
  currentList: Event[],
  onUpdate: RealtimeCallback
) {
  const user = useAuthStore((state) => state.user)
  const listRef = useRef(currentList)

  useEffect(() => {
    listRef.current = currentList
  }, [currentList])

  const shouldShowToUser = useCallback(
    (payload: any): boolean => {
      if (payload.deleted_at) return false
      if (payload.publish_at && new Date(payload.publish_at) > new Date()) return false
      if (payload.status === 'draft' || payload.status === 'cancelled') return false

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
      .channel('events-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'events' },
        (payload) => {
          const current = listRef.current

          if (payload.eventType === 'INSERT') {
            const newRow = payload.new
            if (!shouldShowToUser(newRow)) return
            const mapped = mapRow(newRow)
            // Insert in date order
            const updated = [...current, mapped].sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            )
            onUpdate(updated)
          }

          if (payload.eventType === 'UPDATE') {
            const updatedRow = payload.new
            const mapped = mapRow(updatedRow)

            if (updatedRow.deleted_at || !shouldShowToUser(updatedRow)) {
              onUpdate(current.filter((e) => e.id !== mapped.id))
              return
            }

            const exists = current.some((e) => e.id === mapped.id)
            if (exists) {
              onUpdate(
                current
                  .map((e) => (e.id === mapped.id ? mapped : e))
                  .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
              )
            } else {
              onUpdate(
                [...current, mapped].sort(
                  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                )
              )
            }
          }

          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id
            if (deletedId) {
              onUpdate(current.filter((e) => e.id !== deletedId))
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
