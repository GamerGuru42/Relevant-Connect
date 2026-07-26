import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types'

const mapNotificationRow = (row: any): Notification => ({
  id: row.id,
  userId: row.user_id,
  type: row.type,
  title: row.title,
  body: row.body,
  linkTo: row.link_to ?? null,
  read: row.read,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
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
        user_id: userId,
        type,
        title,
        body,
        link_to: linkTo || null,
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
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
      user_id: userId,
      type,
      title,
      body,
      link_to: linkTo || null,
      read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
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
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapNotificationRow)
  },

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
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
        updated_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(error.message)
    }
  },

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .update({
        read: true,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
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
      .eq('user_id', userId)

    if (error) {
      throw new Error(error.message)
    }
  },
}
