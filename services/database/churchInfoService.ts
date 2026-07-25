import { supabase } from '@/lib/supabase'
import type { ChurchInfo } from '@/types'

const mapChurchInfoRow = (row: any): ChurchInfo => ({
  id: row.id,
  churchName: row.churchName,
  pastorName: row.pastorName,
  address: row.address,
  contactPhone: row.contactPhone,
  contactEmail: row.contactEmail,
  serviceTimes: row.serviceTimes,
  aboutText: row.aboutText,
  logoUrl: row.logoUrl ?? null,
  primaryColor: row.primaryColor ?? null,
  secondaryColor: row.secondaryColor ?? null,
  todayScripture: row.todayScripture ?? null,
  updatedBy: row.updatedBy,
  updatedAt: new Date(row.updatedAt),
})

export const churchInfoService = {
  async get(): Promise<ChurchInfo | null> {
    const { data, error } = await supabase
      .from('church_info')
      .select('*')
      .eq('id', 'churchInfo')
      .maybeSingle()

    if (error) {
      throw new Error(error.message)
    }

    return data ? mapChurchInfoRow(data) : null
  },

  async initialize(data: Omit<ChurchInfo, 'id' | 'updatedAt' | 'updatedBy'>, userId: string): Promise<void> {
    const { error } = await supabase.from('church_info').upsert(
      {
        id: 'churchInfo',
        ...data,
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    if (error) {
      throw new Error(error.message)
    }
  },

  async update(data: Partial<ChurchInfo>, userId: string): Promise<void> {
    const updateData: any = {
      ...data,
      updatedBy: userId,
      updatedAt: new Date().toISOString(),
    }

    if (updateData.updatedAt instanceof Date) {
      updateData.updatedAt = updateData.updatedAt.toISOString()
    }

    const { error } = await supabase.from('church_info').update(updateData).eq('id', 'churchInfo')
    if (error) {
      throw new Error(error.message)
    }
  },

  async setTodayScripture(scripture: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('church_info')
      .update({
        todayScripture: scripture,
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
      })
      .eq('id', 'churchInfo')

    if (error) {
      throw new Error(error.message)
    }
  },

  async updateBranding(
    logoUrl?: string | null,
    primaryColor?: string | null,
    secondaryColor?: string | null,
    userId?: string
  ): Promise<void> {
    const updateData: any = {
      updatedAt: new Date().toISOString(),
    }

    if (logoUrl !== undefined) updateData.logoUrl = logoUrl
    if (primaryColor !== undefined) updateData.primaryColor = primaryColor
    if (secondaryColor !== undefined) updateData.secondaryColor = secondaryColor
    if (userId) updateData.updatedBy = userId

    const { error } = await supabase.from('church_info').update(updateData).eq('id', 'churchInfo')
    if (error) {
      throw new Error(error.message)
    }
  },
}
