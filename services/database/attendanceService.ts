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
