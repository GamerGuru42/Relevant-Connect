'use client'

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { notificationService } from '@/services/database/notificationService'
import { useAuthStore } from '@/store/authStore'
import type { Notification } from '@/types'

export function useNotifications() {
  const user = useAuthStore((state) => state.user)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchNotifications = useCallback(async () => {
    if (!user) return
    try {
      const [data, count] = await Promise.all([
        notificationService.getUserNotifications(user.id),
        notificationService.getUnreadCount(user.id),
      ])
      setNotifications(data)
      setUnreadCount(count)
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Subscribe to Realtime changes on the notifications table for this user
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Re-fetch on new notification
          fetchNotifications()
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, fetchNotifications])

  const markAsRead = useCallback(
    async (notificationId: string) => {
      if (!user) return
      try {
        await notificationService.markAsRead(user.id, notificationId)
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch (error) {
        console.error('Failed to mark notification as read:', error)
      }
    },
    [user]
  )

  const markAllAsRead = useCallback(async () => {
    if (!user) return
    try {
      await notificationService.markAllAsRead(user.id)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [user])

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  }
}
