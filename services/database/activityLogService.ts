import { supabase } from '@/lib/supabase'
import type { ActivityLog } from '@/types'

const mapActivityLogRow = (row: any): ActivityLog => ({
  id: row.id,
  userId: row.userId,
  action: row.action,
  entity: row.entity,
  entityId: row.entityId,
  entityLabel: row.entityLabel,
  timestamp: new Date(row.timestamp),
})

export const activityLogService = {
  async log(
    userId: string,
    action: 'created' | 'edited' | 'deleted' | 'promoted',
    entity: 'announcement' | 'event' | 'attendance' | 'user',
    entityId: string,
    entityLabel: string
  ): Promise<void> {
    const { error } = await supabase.from('activityLogs').insert([
      {
        userId,
        action,
        entity,
        entityId,
        entityLabel,
        timestamp: new Date().toISOString(),
      },
    ])

    if (error) {
      throw new Error(error.message)
    }
  },

  async getAll(limit = 50): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activityLogs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapActivityLogRow)
  },

  async getByUser(userId: string): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activityLogs')
      .select('*')
      .eq('userId', userId)
      .order('timestamp', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapActivityLogRow)
  },

  async getByEntity(entityId: string): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activityLogs')
      .select('*')
      .eq('entityId', entityId)
      .order('timestamp', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapActivityLogRow)
  },

  async getRecent(count = 10): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activityLogs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(count)

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapActivityLogRow)
  },
}
