'use client'

import { ReactNode } from 'react'
import { AppHeader } from './AppHeader'
import { MobileBottomNav } from './MobileBottomNav'
import { SyncIndicator } from './SyncIndicator'

export function AppLayout({ children }: { children: ReactNode }) {
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
