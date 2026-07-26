'use client'

import { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/store/authStore'
import { AppHeader } from './AppHeader'
import { MobileBottomNav } from './MobileBottomNav'
import { SyncIndicator } from './SyncIndicator'

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SyncIndicator />
      <AppHeader />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}
