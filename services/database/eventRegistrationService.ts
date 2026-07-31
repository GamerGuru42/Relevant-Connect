import { supabase } from '@/lib/supabase'
import type { EventRegistration } from '@/types'

const mapRegistrationRow = (row: any): EventRegistration => ({
  id: row.id,
  eventId: row.event_id,
  userId: row.user_id,
  registeredAt: new Date(row.registered_at),
  updatedAt: new Date(row.updated_at),
  qrCodeData: row.qr_code_data,
  ticketId: row.ticket_id,
  checkedIn: row.checked_in,
  checkedInAt: row.checked_in_at ? new Date(row.checked_in_at) : null,
})

export const eventRegistrationService = {
  async register(eventId: string, userId: string): Promise<string> {
    // 1. Check registration limit
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('registration_limit')
      .eq('id', eventId)
      .single()

    if (eventError) throw new Error('Event not found')

    if (eventData.registration_limit) {
      const currentCount = await this.getRegistrationCount(eventId)
      if (currentCount >= eventData.registration_limit) {
        throw new Error('Event registration is full')
      }
    }

    // 2. Generate a ticket ID (UUID)
    const ticketId = crypto.randomUUID()
    
    // 3. Create JSON payload for QR code
    const qrPayload = JSON.stringify({
      eventId,
      userId,
      ticketId,
      timestamp: new Date().toISOString()
    })

    // 4. Insert registration
    const { data, error } = await supabase.from('event_registrations').insert([
      {
        event_id: eventId,
        user_id: userId,
        ticket_id: ticketId,
        qr_code_data: qrPayload,
        registered_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]).select('id').single()

    if (error || !data) {
      throw new Error(error?.message || 'Failed to register for event')
    }

    return data.id
  },

  async unregister(eventId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(error.message)
    }
  },

  async getUserRegistrations(userId: string): Promise<EventRegistration[]> {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('user_id', userId)

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapRegistrationRow)
  },

  async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapRegistrationRow)
  },

  async isRegistered(eventId: string, userId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(error.message)
    }

    return Boolean(count && count > 0)
  },

  async getRegistrationCount(eventId: string): Promise<number> {
    const { count, error } = await supabase
      .from('event_registrations')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)

    if (error) {
      throw new Error(error.message)
    }

    return count ?? 0
  },
}
