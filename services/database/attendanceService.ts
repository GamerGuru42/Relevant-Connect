import { supabase } from '@/lib/supabase'
import type { AttendanceRecord } from '@/types'

const mapAttendanceRow = (row: any): AttendanceRecord => ({
  id: row.id,
  eventId: row.event_id,
  userId: row.user_id,
  method: row.method,
  recordedBy: row.recorded_by,
  timestamp: new Date(row.timestamp),
  updatedAt: new Date(row.updated_at),
})

export const attendanceService = {
  async recordAttendance(
    eventId: string,
    userId: string,
    method: 'qr' | 'code' | 'manual',
    recordedBy?: string
  ): Promise<string> {
    const { data, error } = await supabase.from('attendance').insert([
      {
        event_id: eventId,
        user_id: userId,
        method,
        recorded_by: recordedBy || null,
        timestamp: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]).select('id').single()

    if (error || !data) {
      throw new Error(error?.message || 'Failed to record attendance')
    }

    return data.id
  },

  async checkInByQr(
    eventId: string,
    userId: string,
    ticketId: string,
    scannedBy: string
  ): Promise<{ attendanceId: string; userName: string }> {
    // 1. Verify registration exists
    const { data: reg, error: regError } = await supabase
      .from('event_registrations')
      .select('id, checked_in, user_id')
      .eq('ticket_id', ticketId)
      .eq('event_id', eventId)
      .single()

    if (regError || !reg) {
      throw new Error('TICKET_NOT_FOUND')
    }

    if (reg.checked_in) {
      // Fetch the user name for the "already checked in" message
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', reg.user_id)
        .single()
      throw new Error(`ALREADY_CHECKED_IN:${profile?.full_name || 'Unknown'}`)
    }

    // 2. Mark registration as checked in
    const { error: updateError } = await supabase
      .from('event_registrations')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', reg.id)

    if (updateError) {
      throw new Error('Failed to update check-in status')
    }

    // 3. Insert attendance record
    const attendanceId = await attendanceService.recordAttendance(
      eventId,
      userId,
      'qr',
      scannedBy
    )

    // 4. Fetch user name for success toast
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, photo_url')
      .eq('id', userId)
      .single()

    return {
      attendanceId,
      userName: profile?.full_name || 'Attendee',
    }
  },

  async getEventAttendance(eventId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase.from('attendance').select('*').eq('event_id', eventId)

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapAttendanceRow)
  },

  async getUserAttendance(userId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase.from('attendance').select('*').eq('user_id', userId)

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapAttendanceRow)
  },

  async hasAttended(eventId: string, userId: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(error.message)
    }

    return Boolean(count && count > 0)
  },

  async getAttendanceCount(eventId: string): Promise<number> {
    const { count, error } = await supabase
      .from('attendance')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId)

    if (error) {
      throw new Error(error.message)
    }

    return count ?? 0
  },

  async generateCode(eventId: string): Promise<string> {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    const { error } = await supabase.from('attendance_codes').upsert({
      event_id: eventId,
      code,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'event_id' })

    if (error) {
      throw new Error(error.message)
    }

    return code
  },

  async validateCode(eventId: string, code: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('attendance_codes')
      .select('code')
      .eq('event_id', eventId)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    return Boolean(data?.code === code.toUpperCase())
  },

  async getCode(eventId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('attendance_codes')
      .select('code')
      .eq('event_id', eventId)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    return data?.code ?? null
  },
}
