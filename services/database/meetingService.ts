import { supabase } from '@/lib/supabase'
import type { Meeting, CreateMeetingInput } from '@/types'

const mapMeetingRow = (row: any): Meeting => ({
  id: row.id,
  title: row.title,
  description: row.description ?? null,
  meetingUrl: row.meeting_url,
  platform: row.platform ?? 'google_meet',
  hostName: row.host_name,
  date: row.date,
  time: row.time,
  durationMinutes: row.duration_minutes ?? 60,
  notes: row.notes ?? null,
  recordingUrl: row.recording_url ?? null,
  createdBy: row.created_by,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
})

export const meetingService = {
  async create(input: CreateMeetingInput, userId: string): Promise<Meeting> {
    const { data, error } = await supabase
      .from('meetings')
      .insert({
        title: input.title,
        description: input.description || null,
        meeting_url: input.meetingUrl,
        platform: input.platform,
        host_name: input.hostName,
        date: input.date,
        time: input.time,
        duration_minutes: input.durationMinutes || 60,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create meeting')
    }

    return mapMeetingRow(data)
  },

  async getAll(): Promise<Meeting[]> {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .order('date', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapMeetingRow)
  },

  async getUpcoming(): Promise<Meeting[]> {
    const today = new Date().toISOString().split('T')[0]
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapMeetingRow)
  },

  async getById(id: string): Promise<Meeting | null> {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    return data ? mapMeetingRow(data) : null
  },

  async update(id: string, updates: Partial<CreateMeetingInput> & { notes?: string; recordingUrl?: string }): Promise<void> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.title !== undefined) updateData.title = updates.title
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.meetingUrl !== undefined) updateData.meeting_url = updates.meetingUrl
    if (updates.platform !== undefined) updateData.platform = updates.platform
    if (updates.hostName !== undefined) updateData.host_name = updates.hostName
    if (updates.date !== undefined) updateData.date = updates.date
    if (updates.time !== undefined) updateData.time = updates.time
    if (updates.durationMinutes !== undefined) updateData.duration_minutes = updates.durationMinutes
    if (updates.notes !== undefined) updateData.notes = updates.notes
    if (updates.recordingUrl !== undefined) updateData.recording_url = updates.recordingUrl

    const { error } = await supabase.from('meetings').update(updateData).eq('id', id)
    if (error) {
      throw new Error(error.message)
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('meetings').delete().eq('id', id)
    if (error) {
      throw new Error(error.message)
    }
  },
}
