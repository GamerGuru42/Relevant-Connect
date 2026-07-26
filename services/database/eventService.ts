import { supabase } from '@/lib/supabase'
import type { Event, CreateEventInput, UpdateEventInput } from '@/types'
import { getCached, setCache, addToSyncQueue } from '@/lib/offlineStore'

const mapEventRow = (row: any): Event => ({
  id: row.id,
  title: row.title,
  description: row.description,
  category: row.category,
  date: row.date,
  time: row.time,
  venueName: row.venue_name,
  venueAddress: row.venue_address,
  venueMapLink: row.venue_map_link ?? null,
  speaker: row.speaker ?? null,
  registrationLimit: row.registration_limit ?? null,
  posterUrl: row.poster_url ?? null,
  publishAt: row.publish_at ? new Date(row.publish_at) : null,
  createdBy: row.created_by,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  deletedAt: row.deleted_at ? new Date(row.deleted_at) : null,
})

export const eventService = {
  async getPublished(pageSize = 10): Promise<Event[]> {
    const cacheKey = `events_published_${pageSize}`
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .lte('publish_at', new Date().toISOString())
        .is('deleted_at', null)
        .order('date', { ascending: true })
        .limit(pageSize)

      if (error) throw new Error(error.message)
      const results = (data ?? []).map(mapEventRow)
      if (typeof window !== 'undefined') setCache(cacheKey, results)
      return results
    } catch (error) {
      if (typeof window !== 'undefined') {
        const cached = getCached<Event[]>(cacheKey)
        if (cached) return cached
      }
      throw error
    }
  },

  async getAll(): Promise<Event[]> {
    const cacheKey = 'events_all'
    try {
      const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true })
      if (error) throw new Error(error.message)
      const results = (data ?? []).map(mapEventRow)
      if (typeof window !== 'undefined') setCache(cacheKey, results)
      return results
    } catch (error) {
      if (typeof window !== 'undefined') {
        const cached = getCached<Event[]>(cacheKey)
        if (cached) return cached
      }
      throw error
    }
  },

  async getById(id: string): Promise<Event | null> {
    const { data, error } = await supabase.from('events').select('*').eq('id', id).maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    return data ? mapEventRow(data) : null
  },

  async create(userId: string, input: CreateEventInput): Promise<string> {
    const payload = {
      title: input.title,
      description: input.description,
      category: input.category,
      date: input.date,
      time: input.time,
      venue_name: input.venueName,
      venue_address: input.venueAddress,
      venue_map_link: input.venueMapLink || null,
      speaker: input.speaker || null,
      registration_limit: input.registrationLimit ?? null,
      poster_url: input.posterUrl || null,
      publish_at: input.publishAt ? input.publishAt.toISOString() : null,
      created_by: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    }
    try {
      const { data, error } = await supabase.from('events').insert([payload]).select('id').single()
      if (error || !data) throw new Error(error?.message || 'Failed to create event')
      return data.id
    } catch (error) {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        addToSyncQueue({ type: 'create', table: 'events', payload })
        return 'temp-' + Date.now()
      }
      throw error
    }
  },

  async update(id: string, input: UpdateEventInput): Promise<void> {
    const payload = {
      title: input.title,
      description: input.description,
      category: input.category,
      date: input.date,
      time: input.time,
      venue_name: input.venueName,
      venue_address: input.venueAddress,
      venue_map_link: input.venueMapLink || null,
      speaker: input.speaker || null,
      registration_limit: input.registrationLimit ?? null,
      poster_url: input.posterUrl || null,
      publish_at: input.publishAt ? input.publishAt.toISOString() : null,
      updated_at: new Date().toISOString(),
    }
    try {
      const { error } = await supabase.from('events').update(payload).eq('id', id)
      if (error) throw new Error(error.message)
    } catch (error) {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        addToSyncQueue({ type: 'update', table: 'events', payload: { ...payload, id } })
        return
      }
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('events').update({
      deleted_at: new Date().toISOString(),
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
    const cacheKey = `events_upcoming_${days}`
    try {
      const now = new Date()
      const today = now.toISOString().split('T')[0]
      const future = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .lte('publish_at', new Date().toISOString())
        .is('deleted_at', null)
        .gte('date', today)
        .lte('date', future)
        .order('date', { ascending: true })

      if (error) throw new Error(error.message)
      const results = (data ?? []).map(mapEventRow)
      if (typeof window !== 'undefined') setCache(cacheKey, results)
      return results
    } catch (error) {
      if (typeof window !== 'undefined') {
        const cached = getCached<Event[]>(cacheKey)
        if (cached) return cached
      }
      throw error
    }
  },
}
