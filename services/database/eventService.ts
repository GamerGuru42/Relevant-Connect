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

  /**
   * Get past events that a specific user registered for or attended.
   * Returns events with an `attended` boolean flag.
   */
  async getPastEventsForUser(userId: string, limit = 10): Promise<(Event & { attended: boolean })[]> {
    const cacheKey = `events_past_user_${userId}_${limit}`
    try {
      const today = new Date().toISOString().split('T')[0]

      // Get events user registered for that are in the past
      const { data, error } = await supabase
        .from('event_registrations')
        .select(`
          event_id,
          events!inner (*)
        `)
        .eq('user_id', userId)
        .lt('events.date', today)
        .is('events.deleted_at', null)
        .order('events(date)', { ascending: false })
        .limit(limit)

      if (error) throw new Error(error.message)

      // Check attendance for each event
      const eventIds = (data ?? []).map((r: any) => r.event_id)
      let attendedSet = new Set<string>()

      if (eventIds.length > 0) {
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('event_id')
          .eq('user_id', userId)
          .in('event_id', eventIds)

        attendedSet = new Set((attendanceData ?? []).map((a: any) => a.event_id))
      }

      const results = (data ?? []).map((row: any) => ({
        ...mapEventRow(row.events),
        attended: attendedSet.has(row.event_id),
      }))

      if (typeof window !== 'undefined') setCache(cacheKey, results)
      return results
    } catch (error) {
      if (typeof window !== 'undefined') {
        const cached = getCached<(Event & { attended: boolean })[]>(cacheKey)
        if (cached) return cached
      }
      throw error
    }
  },

  /**
   * Get past events for a department with registration + attendance counts.
   */
  async getPastEventsForDepartment(department: string, limit = 5): Promise<(Event & { registrationCount: number; attendanceCount: number })[]> {
    const cacheKey = `events_past_dept_${department}_${limit}`
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('department', department)
        .lt('date', today)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .limit(limit)

      if (error) throw new Error(error.message)

      // Fetch counts for each event
      const results = await Promise.all(
        (data ?? []).map(async (row: any) => {
          const [regResult, attResult] = await Promise.all([
            supabase
              .from('event_registrations')
              .select('id', { count: 'exact', head: true })
              .eq('event_id', row.id),
            supabase
              .from('attendance')
              .select('id', { count: 'exact', head: true })
              .eq('event_id', row.id),
          ])

          return {
            ...mapEventRow(row),
            registrationCount: regResult.count ?? 0,
            attendanceCount: attResult.count ?? 0,
          }
        })
      )

      if (typeof window !== 'undefined') setCache(cacheKey, results)
      return results
    } catch (error) {
      if (typeof window !== 'undefined') {
        const cached = getCached<(Event & { registrationCount: number; attendanceCount: number })[]>(cacheKey)
        if (cached) return cached
      }
      throw error
    }
  },

  /**
   * Get all past events globally with registration + attendance counts (for Super Admin).
   */
  async getGlobalEventHistory(limit = 50): Promise<(Event & { registrationCount: number; attendanceCount: number })[]> {
    const cacheKey = `events_global_history_${limit}`
    try {
      const today = new Date().toISOString().split('T')[0]

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .lt('date', today)
        .is('deleted_at', null)
        .order('date', { ascending: false })
        .limit(limit)

      if (error) throw new Error(error.message)

      const results = await Promise.all(
        (data ?? []).map(async (row: any) => {
          const [regResult, attResult] = await Promise.all([
            supabase
              .from('event_registrations')
              .select('id', { count: 'exact', head: true })
              .eq('event_id', row.id),
            supabase
              .from('attendance')
              .select('id', { count: 'exact', head: true })
              .eq('event_id', row.id),
          ])

          return {
            ...mapEventRow(row),
            registrationCount: regResult.count ?? 0,
            attendanceCount: attResult.count ?? 0,
          }
        })
      )

      if (typeof window !== 'undefined') setCache(cacheKey, results)
      return results
    } catch (error) {
      if (typeof window !== 'undefined') {
        const cached = getCached<(Event & { registrationCount: number; attendanceCount: number })[]>(cacheKey)
        if (cached) return cached
      }
      throw error
    }
  },
}
