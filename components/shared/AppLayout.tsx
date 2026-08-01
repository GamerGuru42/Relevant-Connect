'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { AppHeader } from './AppHeader'
import { MobileBottomNav } from './MobileBottomNav'
import { SyncIndicator } from './SyncIndicator'
import { LiveBanner } from './LiveBanner'
import { InstallPrompt } from './InstallPrompt'

export function AppLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    // If user is logged in but hasn't completed onboarding, redirect them
    if (user && !user.isOnboarded && pathname !== '/onboarding') {
      router.replace('/onboarding')
    }
  }, [user, pathname, router])

  // Prevent flash of content before redirect happens
  if (user && !user.isOnboarded && pathname !== '/onboarding') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Redirecting to onboarding...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SyncIndicator />
      <LiveBanner />
      <AppHeader />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <MobileBottomNav />
      <InstallPrompt />
    </div>
  )
}
