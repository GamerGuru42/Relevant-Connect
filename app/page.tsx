'use client'

import { useAuthStore } from '@/store/authStore'
import { LandingPage } from '@/components/landing/LandingPage'
import { DashboardPage } from '@/components/dashboard/DashboardPage'

export default function Home() {
  const user = useAuthStore((state) => state.user)
  const loading = useAuthStore((state) => state.loading)

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

  return user ? <DashboardPage /> : <LandingPage />
}
