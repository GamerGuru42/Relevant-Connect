'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/auth/authService'
import { supabase } from '@/lib/supabase'

export function Providers({ children }: { children: React.ReactNode }) {
  const setUser = useAuthStore((state) => state.setUser)
  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await authService.getCurrentUser()
        setUser(user)
      } catch (error) {
        console.error('Failed to initialize auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, _session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null)
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        const user = await authService.getCurrentUser()
        setUser(user)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setUser, setLoading])

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      {children}
      <Toaster position="top-right" />
    </ThemeProvider>
  )
}
