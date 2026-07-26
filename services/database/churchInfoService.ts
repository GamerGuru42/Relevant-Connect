import { supabase } from '@/lib/supabase'
import type { ChurchInfo } from '@/types'

const mapChurchInfoRow = (row: any): ChurchInfo => ({
  id: row.id,
  churchName: row.church_name,
  pastorName: row.pastor_name,
  address: row.address,
  contactPhone: row.contact_phone,
  contactEmail: row.contact_email,
  serviceTimes: row.service_times,
  aboutText: row.about_text,
  logoUrl: row.logo_url ?? null,
  primaryColor: row.primary_color ?? null,
  secondaryColor: row.secondary_color ?? null,
  todayScripture: row.today_scripture ?? null,
  updatedBy: row.updated_by,
  updatedAt: new Date(row.updated_at),
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
        church_name: data.churchName,
        pastor_name: data.pastorName,
        address: data.address,
        contact_phone: data.contactPhone,
        contact_email: data.contactEmail,
        service_times: data.serviceTimes,
        about_text: data.aboutText,
        logo_url: data.logoUrl,
        primary_color: data.primaryColor,
        secondary_color: data.secondaryColor,
        today_scripture: data.todayScripture,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' }
    )

    if (error) {
      throw new Error(error.message)
    }
  },

  async update(data: Partial<ChurchInfo>, userId: string): Promise<void> {
    const updateData: any = {
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }

    if (data.churchName !== undefined) updateData.church_name = data.churchName
    if (data.pastorName !== undefined) updateData.pastor_name = data.pastorName
    if (data.address !== undefined) updateData.address = data.address
    if (data.contactPhone !== undefined) updateData.contact_phone = data.contactPhone
    if (data.contactEmail !== undefined) updateData.contact_email = data.contactEmail
    if (data.serviceTimes !== undefined) updateData.service_times = data.serviceTimes
    if (data.aboutText !== undefined) updateData.about_text = data.aboutText
    if (data.todayScripture !== undefined) updateData.today_scripture = data.todayScripture

    const { error } = await supabase.from('church_info').update(updateData).eq('id', 'churchInfo')
    if (error) {
      throw new Error(error.message)
    }
  },

  async setTodayScripture(scripture: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('church_info')
      .update({
        today_scripture: scripture,
        updated_by: userId,
        updated_at: new Date().toISOString(),
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
      updated_at: new Date().toISOString(),
    }

    if (logoUrl !== undefined) updateData.logo_url = logoUrl
    if (primaryColor !== undefined) updateData.primary_color = primaryColor
    if (secondaryColor !== undefined) updateData.secondary_color = secondaryColor
    if (userId) updateData.updated_by = userId

    const { error } = await supabase.from('church_info').update(updateData).eq('id', 'churchInfo')
    if (error) {
      throw new Error(error.message)
    }
  },
}
