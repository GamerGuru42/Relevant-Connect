import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types'

const mapNotificationRow = (row: any): Notification => ({
  id: row.id,
  userId: row.userId,
  type: row.type,
  title: row.title,
  body: row.body,
  linkTo: row.linkTo ?? null,
  read: row.read,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
})

export const notificationService = {
  async create(
    userId: string,
    type: 'announcement' | 'event' | 'reminder',
    title: string,
    body: string,
    linkTo?: string | null
  ): Promise<void> {
    const { error } = await supabase.from('notifications').insert([
      {
        userId,
        type,
        title,
        body,
        linkTo: linkTo || null,
        read: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ])

    if (error) {
      throw new Error(error.message)
    }
  },

  async createBatch(
    userIds: string[],
    type: 'announcement' | 'event' | 'reminder',
    title: string,
    body: string,
    linkTo?: string | null
  ): Promise<void> {
    const notifications = userIds.map((userId) => ({
      userId,
      type,
      title,
      body,
      linkTo: linkTo || null,
      read: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }))

    const { error } = await supabase.from('notifications').insert(notifications)
    if (error) {
      throw new Error(error.message)
    }
  },

  async getUserNotifications(userId: string): Promise<Notification[]> {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('userId', userId)
      .order('createdAt', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapNotificationRow)
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('userId', userId)
      .eq('read', false)

    if (error) {
      throw new Error(error.message)
    }

    return count ?? 0
  },

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('userId', userId)

    if (error) {
      throw new Error(error.message)
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        updatedAt: new Date().toISOString(),
      })
      .eq('userId', userId)
      .eq('read', false)

    if (error) {
      throw new Error(error.message)
    }
  },

  async delete(userId: string, notificationId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('userId', userId)

    if (error) {
      throw new Error(error.message)
    }
  },
}
