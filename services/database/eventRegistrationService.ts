import { supabase } from '@/lib/supabase'
import type { EventRegistration } from '@/types'

const mapRegistrationRow = (row: any): EventRegistration => ({
  id: row.id,
  eventId: row.eventId,
  userId: row.userId,
  registeredAt: new Date(row.registeredAt),
  updatedAt: new Date(row.updatedAt),
})

export const eventRegistrationService = {
  async register(eventId: string, userId: string): Promise<string> {
    const { data, error } = await supabase.from('eventRegistrations').insert([
      {
        eventId,
        userId,
        registeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]).select('id').single()

    if (error || !data) {
      throw new Error(error?.message || 'Failed to register for event')
    }

    return data.id
  },

  async unregister(eventId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('eventRegistrations')
      .delete()
      .eq('eventId', eventId)
      .eq('userId', userId)

    if (error) {
      throw new Error(error.message)
    }
  },

  async getUserRegistrations(userId: string): Promise<EventRegistration[]> {
    const { data, error } = await supabase
      .from('eventRegistrations')
      .select('*')
      .eq('userId', userId)

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapRegistrationRow)
  },

  async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    const { data, error } = await supabase
      .from('eventRegistrations')
      .select('*')
      .eq('eventId', eventId)

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapRegistrationRow)
  },

  async isRegistered(eventId: string, userId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('eventRegistrations')
      .select('id', { count: 'exact', head: true })
      .eq('eventId', eventId)
      .eq('userId', userId)

    if (error) {
      throw new Error(error.message)
    }

    return Boolean(count && count > 0)
  },

  async getRegistrationCount(eventId: string): Promise<number> {
    const { count, error } = await supabase
      .from('eventRegistrations')
      .select('id', { count: 'exact', head: true })
      .eq('eventId', eventId)

    if (error) {
      throw new Error(error.message)
    }

    return count ?? 0
  },
}
