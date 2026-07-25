import { supabase } from '@/lib/supabase'
import type { Event, CreateEventInput, UpdateEventInput } from '@/types'

const mapEventRow = (row: any): Event => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  date: row.date,
  time: row.time,
  venueName: row.venueName,
  venueAddress: row.venueAddress,
  venueMapLink: row.venueMapLink ?? null,
  speaker: row.speaker ?? null,
  registrationLimit: row.registrationLimit ?? null,
  posterUrl: row.posterUrl ?? null,
  publishAt: row.publishAt ? new Date(row.publishAt) : null,
  createdBy: row.createdBy,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
  deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
})

export const eventService = {
  async getPublished(pageSize = 10): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .lte('publishAt', new Date().toISOString())
      .is('deletedAt', null)
      .order('date', { ascending: true })
      .limit(pageSize)

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapEventRow)
  },

  async getAll(): Promise<Event[]> {
    const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapEventRow)
  },

  async getById(id: string): Promise<Event | null> {
    const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    return data ? mapEventRow(data) : null
  },

  async create(userId: string, input: CreateEventInput): Promise<string> {
    const { data, error } = await supabase.from('events').insert([
      {
        title: input.title,
        description: input.description,
        category: input.category,
        date: input.date,
        time: input.time,
        venueName: input.venueName,
        venueAddress: input.venueAddress,
        venueMapLink: input.venueMapLink || null,
        speaker: input.speaker || null,
        registrationLimit: input.registrationLimit ?? null,
        posterUrl: input.posterUrl || null,
        publishAt: input.publishAt ? input.publishAt.toISOString() : null,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    ]).select('id').single()

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create event')
    }

    return data.id
  },

  async update(id: string, input: UpdateEventInput): Promise<void> {
    const { error } = await supabase.from('events').update({
      title: input.title,
      description: input.description,
      category: input.category,
      date: input.date,
      time: input.time,
      venueName: input.venueName,
      venueAddress: input.venueAddress,
      venueMapLink: input.venueMapLink || null,
      speaker: input.speaker || null,
      registrationLimit: input.registrationLimit ?? null,
      posterUrl: input.posterUrl || null,
      publishAt: input.publishAt ? input.publishAt.toISOString() : null,
      updatedAt: new Date().toISOString(),
    }).eq('id', id)

    if (error) {
      throw new Error(error.message)
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('events').update({
      deletedAt: new Date().toISOString(),
    }).eq('id', id)

    if (error) {
      throw new Error(error.message)
    }
  },

  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase.from('events').delete().eq('id', id)

    if (error) {
      throw new Error(error.message)
    }
  },

  async getUpcoming(days = 30): Promise<Event[]> {
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .lte('publishAt', new Date().toISOString())
      .is('deletedAt', null)
      .gte('date', today)
      .lte('date', future)
      .order('date', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapEventRow)
  },
}
