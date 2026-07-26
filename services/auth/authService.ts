import type { AuthUser } from '@/types'
import { supabase } from '@/lib/supabase'
import { MEMBERSHIP_STATUS } from '@/constants/enums'

const mapProfileRow = (row: any): AuthUser => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone ?? null,
  photoUrl: row.photo_url ?? null,
  role: row.role ?? 'member',
  membershipStatus: row.membership_status ?? MEMBERSHIP_STATUS.VISITOR,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
})

export const authService = {
  async signup(
    email: string,
    password: string,
    fullName: string,
    membershipStatus: string
  ): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    const user = data.user
    if (!user) {
      throw new Error('Signup failed')
    }

    const profile = {
      id: user.id,
      email,
      full_name: fullName,
      phone: null,
      photo_url: null,
      role: 'member',
      membership_status: membershipStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    const { error: profileError } = await supabase.from('profiles').insert(profile)
    if (profileError) {
      throw new Error(profileError.message)
    }

    return mapProfileRow(profile)
  },

  async login(email: string, password: string): Promise<AuthUser> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      throw new Error(error.message)
    }

    const user = data.user
    if (!user) {
      throw new Error('Login failed')
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profileData) {
      throw new Error('User profile not found')
    }

    return mapProfileRow(profileData)
  },

  async loginWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      throw new Error(error.message)
    }
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) {
      throw new Error(error.message)
    }
  },

  async resetPassword(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    if (error) {
      throw new Error(error.message)
    }
  },

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      throw new Error(error.message)
    }

    const session = data.session
    if (!session?.user) {
      return null
    }

    const userId = session.user.id
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (profileError || !profileData) {
      // Auto-create profile for Google OAuth users who don't have one yet
      const sessionUser = session.user
      const fullName = sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name || sessionUser.email?.split('@')[0] || 'User'
      const profile = {
        id: userId,
        email: sessionUser.email || '',
        full_name: fullName,
        phone: null,
        photo_url: sessionUser.user_metadata?.avatar_url || null,
        role: 'member',
        membership_status: 'visitor',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { error: insertError } = await supabase.from('profiles').insert(profile)
      if (insertError) {
        // Profile might already exist if there was a race condition — try fetching again
        const { data: retryData } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
        if (retryData) return mapProfileRow(retryData)
        return null
      }

      return mapProfileRow(profile)
    }

    return mapProfileRow(profileData)
  },

  async updateUserProfile(userId: string, updates: Partial<AuthUser>): Promise<void> {
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.fullName !== undefined) updateData.full_name = updates.fullName
    if (updates.phone !== undefined) updateData.phone = updates.phone
    if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl

    const { error } = await supabase.from('profiles').update(updateData).eq('id', userId)
    if (error) {
      throw new Error(error.message)
    }
  },
}
