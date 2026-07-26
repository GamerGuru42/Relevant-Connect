import { supabase } from '@/lib/supabase'
import type { ActivityLog } from '@/types'

const mapActivityLogRow = (row: any): ActivityLog => ({
  id: row.id,
  userId: row.user_id,
  action: row.action,
  entity: row.entity,
  entityId: row.entity_id,
  entityLabel: row.entity_label,
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
    const { error } = await supabase.from('activity_logs').insert([
      {
        user_id: userId,
        action,
        entity,
        entity_id: entityId,
        entity_label: entityLabel,
        timestamp: new Date().toISOString(),
      },
    ])

    if (error) {
      throw new Error(error.message)
    }
  },

  async getAll(limit = 50): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
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
      .from('activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapActivityLogRow)
  },

  async getByEntity(entityId: string): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .eq('entity_id', entityId)
      .order('timestamp', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapActivityLogRow)
  },

  async getRecent(count = 10): Promise<ActivityLog[]> {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(count)

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapActivityLogRow)
  },
}
