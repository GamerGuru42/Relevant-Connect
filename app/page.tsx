'use client'

import { useAuthStore } from '@/store/authStore'
import { LandingPage } from '@/components/landing/LandingPage'
import { DashboardPage } from '@/components/dashboard/DashboardPage'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)
  const router = useRouter()

  useEffect(() => {
    if (user && !user.isOnboarded) {
      router.replace('/onboarding')
    }
  }, [user, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Prevent flash of dashboard before redirect happens
  if (user && !user.isOnboarded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to onboarding...</p>
        </div>
      </div>
    )
  }

  return user ? <DashboardPage /> : <LandingPage />
}
