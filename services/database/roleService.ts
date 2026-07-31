import { supabase } from '@/lib/supabase'
import type { AuthUser } from '@/types'
import { activityLogService } from './activityLogService'

const mapProfileRow = (row: any): AuthUser => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone ?? null,
  photoUrl: row.photo_url ?? null,
  role: row.role ?? 'member',
  appRole: row.app_role ?? 'member',
  membershipStatus: row.membership_status ?? 'visitor',
  isOnboarded: row.is_onboarded ?? false,
  department: row.department ?? null,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
})

export const roleService = {
  async promoteToDepartmentHead(userId: string, department: string, promotedByUserId: string, promotedByName: string): Promise<AuthUser> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ app_role: 'department_head', department })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to promote user: ${error.message}`)
    }
    if (!data) {
      throw new Error('User not found')
    }

    // Log the action
    await activityLogService.log(
      promotedByUserId,
      'promoted',
      'user',
      userId,
      `Promoted ${data.full_name} to Department Head of ${department} by ${promotedByName}`
    )

    return mapProfileRow(data)
  }
}
