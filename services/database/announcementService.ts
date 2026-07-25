import { supabase } from '@/lib/supabase'
import type { Announcement, CreateAnnouncementInput, UpdateAnnouncementInput } from '@/types'
import { getCached, setCache, addToSyncQueue } from '@/lib/offlineStore'

const mapAnnouncementRow = (row: any): Announcement => ({
  id: row.id,
  title: row.title,
  body: row.body,
  imageUrl: row.imageUrl ?? null,
  category: row.category,
  publishAt: row.publishAt ? new Date(row.publishAt) : null,
  createdBy: row.createdBy,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
  deletedAt: row.deletedAt ? new Date(row.deletedAt) : null,
})

export const announcementService = {
  async getPublished(pageSize = 10): Promise<Announcement[]> {
    const cacheKey = `announcements_published_${pageSize}`
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .lte('publishAt', new Date().toISOString())
        .is('deletedAt', null)
        .order('publishAt', { ascending: false })
        .limit(pageSize)

      if (error) throw new Error(error.message)
      const results = (data ?? []).map(mapAnnouncementRow)
      if (typeof window !== 'undefined') setCache(cacheKey, results)
      return results
    } catch (error) {
      if (typeof window !== 'undefined') {
        const cached = getCached<Announcement[]>(cacheKey)
        if (cached) return cached
      }
      throw error
    }
  },

  async getAll(): Promise<Announcement[]> {
    const cacheKey = 'announcements_all'
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('createdAt', { ascending: false })

      if (error) throw new Error(error.message)
      const results = (data ?? []).map(mapAnnouncementRow)
      if (typeof window !== 'undefined') setCache(cacheKey, results)
      return results
    } catch (error) {
      if (typeof window !== 'undefined') {
        const cached = getCached<Announcement[]>(cacheKey)
        if (cached) return cached
      }
      throw error
    }
  },

  async getById(id: string): Promise<Announcement | null> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    return data ? mapAnnouncementRow(data) : null
  },

  async create(userId: string, input: CreateAnnouncementInput): Promise<string> {
    const payload = {
      title: input.title,
      body: input.body,
      imageUrl: input.imageUrl || null,
      category: input.category,
      publishAt: input.publishAt ? input.publishAt.toISOString() : null,
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    }
    try {
      const { data, error } = await supabase.from('announcements').insert([payload]).select('id').single()
      if (error || !data) throw new Error(error?.message || 'Failed to create announcement')
      return data.id
    } catch (error) {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        addToSyncQueue({ type: 'create', table: 'announcements', payload })
        return 'temp-' + Date.now()
      }
      throw error
    }
  },

  async update(id: string, input: UpdateAnnouncementInput): Promise<void> {
    const payload = {
      title: input.title,
      body: input.body,
      imageUrl: input.imageUrl || null,
      category: input.category,
      publishAt: input.publishAt ? input.publishAt.toISOString() : null,
      updatedAt: new Date().toISOString(),
    }
    try {
      const { error } = await supabase.from('announcements').update(payload).eq('id', id)
      if (error) throw new Error(error.message)
    } catch (error) {
      if (typeof window !== 'undefined' && !navigator.onLine) {
        addToSyncQueue({ type: 'update', table: 'announcements', payload: { ...payload, id } })
        return
      }
      throw error
    }
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase.from('announcements').update({
      deletedAt: new Date().toISOString(),
    }).eq('id', id)

    if (error) {
      throw new Error(error.message)
    }
  },

  async hardDelete(id: string): Promise<void> {
    const { error } = await supabase.from('announcements').delete().eq('id', id)
    if (error) {
      throw new Error(error.message)
    }
  },
}
