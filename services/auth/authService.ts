import type { AuthUser } from '@/types'
import { supabase } from '@/lib/supabase'
import { MEMBERSHIP_STATUS } from '@/constants/enums'

const mapProfileRow = (row: any): AuthUser => ({
  id: row.id,
  fullName: row.fullName,
  email: row.email,
  phone: row.phone ?? null,
  photoUrl: row.photoUrl ?? null,
  role: row.role ?? 'member',
  membershipStatus: row.membershipStatus ?? MEMBERSHIP_STATUS.VISITOR,
  createdAt: new Date(row.createdAt),
  updatedAt: new Date(row.updatedAt),
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
      fullName,
      phone: null,
      photoUrl: null,
      role: 'member',
      membershipStatus,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
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
      .single()

    if (profileError || !profileData) {
      return null
    }

    return mapProfileRow(profileData)
  },

  async updateUserProfile(userId: string, updates: Partial<AuthUser>): Promise<void> {
    const updateData: any = {
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    const { error } = await supabase.from('profiles').update(updateData).eq('id', userId)
    if (error) {
      throw new Error(error.message)
    }
  },
}
