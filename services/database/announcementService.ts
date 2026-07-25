import { supabase } from '@/lib/supabase'
import type { Announcement, CreateAnnouncementInput, UpdateAnnouncementInput } from '@/types'

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
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .lte('publishAt', new Date().toISOString())
      .is('deletedAt', null)
      .order('publishAt', { ascending: false })
      .limit(pageSize)

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapAnnouncementRow)
  },

  async getAll(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('createdAt', { ascending: false })

    if (error) {
      throw new Error(error.message)
    }

    return (data ?? []).map(mapAnnouncementRow)
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
    const { data, error } = await supabase.from('announcements').insert([
      {
        title: input.title,
        body: input.body,
        imageUrl: input.imageUrl || null,
        category: input.category,
        publishAt: input.publishAt ? input.publishAt.toISOString() : null,
        createdBy: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deletedAt: null,
      },
    ]).select('id').single()

    if (error || !data) {
      throw new Error(error?.message || 'Failed to create announcement')
    }

    return data.id
  },

  async update(id: string, input: UpdateAnnouncementInput): Promise<void> {
    const { error } = await supabase.from('announcements').update({
      title: input.title,
      body: input.body,
      imageUrl: input.imageUrl || null,
      category: input.category,
      publishAt: input.publishAt ? input.publishAt.toISOString() : null,
      updatedAt: new Date().toISOString(),
    }).eq('id', id)

    if (error) {
      throw new Error(error.message)
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
